import { nanoid } from "nanoid";
import { densityPlanSchema, outlineInputSchema, type DeckOutline, type OutlineInput, type SlidePlan } from "./schemas";

export async function generateOutline(input: OutlineInput): Promise<DeckOutline> {
  const parsed = outlineInputSchema.parse(input);
  const generated = await generateWithTextModel(parsed);
  if (generated) return generated;
  return generateFallbackOutline(parsed);
}

async function generateWithTextModel(input: OutlineInput): Promise<DeckOutline | null> {
  const baseUrl = process.env.TEXT_MODEL_BASE_URL ?? process.env.IMAGE2_API_BASE_URL;
  const apiKey = process.env.TEXT_MODEL_API_KEY ?? process.env.IMAGE2_API_KEY;
  const model = process.env.TEXT_MODEL_NAME ?? "gpt-5.4";
  if (!baseUrl || !apiKey) throw new Error("GPT 大纲未配置：需要 TEXT_MODEL/IMAGE2 的 API_KEY 和 BASE_URL。");

  const { buildOutlineSystemPrompt, buildOutlineUserPrompt } = await import("./prompts");
  const endpoint = `${baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildOutlineSystemPrompt() },
        { role: "user", content: buildOutlineUserPrompt(input) },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GPT 大纲调用失败：${response.status} ${detail.slice(0, 300)}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("GPT 大纲响应为空。");
  const raw = JSON.parse(content);
  const outline = normalizeOutline(raw, input);
  if (outline.slides.length !== input.pageCount) throw new Error(`GPT 大纲页数不对：期望 ${input.pageCount}，实际 ${outline.slides.length}。`);
  return outline;
}

const validRoles: SlidePlan["role"][] = ["cover", "agenda", "content", "case", "summary", "ending"];

function normalizeOutline(raw: unknown, input: OutlineInput): DeckOutline {
  let slides: unknown[];
  let deckTitle = input.title;
  let visualDirection = "professional academic presentation style";
  let globalDesign: DeckOutline["globalDesign"] | undefined;

  if (Array.isArray(raw)) {
    slides = raw;
  } else if (raw && typeof raw === "object" && "slides" in raw && Array.isArray((raw as Record<string, unknown>).slides)) {
    const obj = raw as Record<string, unknown>;
    slides = obj.slides as unknown[];
    if (typeof obj.deckTitle === "string") deckTitle = obj.deckTitle;
    if (typeof obj.visualDirection === "string") visualDirection = obj.visualDirection;
    if (obj.globalDesign && typeof obj.globalDesign === "object") {
      const gd = obj.globalDesign as Record<string, unknown>;
      globalDesign = {
        primaryColor: String(gd.primaryColor ?? "blue"),
        fontStyle: String(gd.fontStyle ?? "sans-serif"),
        overallTone: String(gd.overallTone ?? "professional"),
      };
    }
  } else {
    throw new Error("GPT 返回的 JSON 格式无法识别。");
  }

  return {
    deckTitle,
    pageCount: slides.length,
    visualDirection,
    globalDesign,
    slides: slides.map((item, i) => normalizeSlide(item, i, input)),
  };
}

function normalizeSlide(item: unknown, i: number, input: OutlineInput): SlidePlan {
  const s = item as Record<string, unknown>;
  const index = typeof s.index === "number" ? s.index : i + 1;
  let role: SlidePlan["role"] = "content";
  if (typeof s.role === "string") {
    const lower = s.role.toLowerCase();
    const found = validRoles.find((r) => r === lower);
    if (found) role = found;
    else if (i === 0) role = "cover";
  }

  const cp = (s.contentPlan ?? s.content_plan ?? {}) as Record<string, unknown>;
  const lp = (s.layoutPlan ?? s.layout_plan ?? {}) as Record<string, unknown>;
  const dp = (s.designPlan ?? s.design_plan ?? {}) as Record<string, unknown>;
  const densityPlan = normalizeDensityPlan(s.densityPlan ?? s.density_plan);

  const rawMainPoints = cp.mainPoints ?? cp.main_points;
  const mainPoints = Array.isArray(rawMainPoints)
    ? rawMainPoints.map(String)
    : Array.isArray(s.bullets) ? (s.bullets as unknown[]).map(String) : ["（无具体内容）"];

  const slide: SlidePlan = {
    id: typeof s.id === "string" ? s.id : nanoid(10),
    index,
    title: typeof s.title === "string" ? s.title : `第 ${index} 页`,
    subtitle: typeof s.subtitle === "string" ? s.subtitle : undefined,
    role,
    keyMessage: typeof s.keyMessage === "string" ? s.keyMessage : (typeof s.key_message === "string" ? s.key_message : ""),
    contentPlan: {
      mainPoints,
      dataOrEvidence: typeof (cp.dataOrEvidence ?? cp.data_or_evidence) === "string" ? String(cp.dataOrEvidence ?? cp.data_or_evidence) : undefined,
      conceptsToExplain: (() => { const raw = cp.conceptsToExplain ?? cp.concepts_to_explain; return Array.isArray(raw) ? raw.map(String) : undefined; })(),
    },
    layoutPlan: {
      structure: String(lp.structure ?? "标题区 + 内容区"),
      visualElement: String(lp.visualElement ?? lp.visual_element ?? "编号列表"),
      textPlacement: String(lp.textPlacement ?? lp.text_placement ?? "左对齐"),
    },
    designPlan: {
      colorScheme: String(dp.colorScheme ?? dp.color_scheme ?? "白底深色文字"),
      backgroundStyle: String(dp.backgroundStyle ?? dp.background_style ?? "纯白"),
      accentDetails: String(dp.accentDetails ?? dp.accent_details ?? "主色调强调"),
    },
    imagePromptHint: typeof s.imagePromptHint === "string" ? s.imagePromptHint : (typeof s.image_prompt_hint === "string" ? s.image_prompt_hint : `A professional PPT slide about ${s.title ?? "topic"}`),
    densityPlan,
    speakerNote: typeof (s.speakerNote ?? s.speaker_note) === "string" ? String(s.speakerNote ?? s.speaker_note) : undefined,
  };
  slide.densityPlan = slide.densityPlan ? enforceDensityBudget(slide.densityPlan) : fallbackDensityPlan(slide, input.densityPreference);
  return slide;
}

function normalizeDensityPlan(value: unknown): SlidePlan["densityPlan"] {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const normalized = {
    textDensity: raw.textDensity ?? raw.text_density,
    visibleLabelCount: raw.visibleLabelCount ?? raw.visible_label_count,
    labelMaxChars: raw.labelMaxChars ?? raw.label_max_chars,
    structure: raw.structure,
    rationale: raw.rationale,
  };
  const result = densityPlanSchema.safeParse(normalized);
  return result.success ? enforceDensityBudget(result.data) : undefined;
}

function enforceDensityBudget(plan: NonNullable<SlidePlan["densityPlan"]>): NonNullable<SlidePlan["densityPlan"]> {
  const budget = plan.textDensity === "low"
    ? { visibleLabelCount: 2, labelMaxChars: 8 }
    : plan.textDensity === "medium" ? { visibleLabelCount: 6, labelMaxChars: 16 } : { visibleLabelCount: 10, labelMaxChars: 22 };
  return { ...plan, ...budget };
}

function fallbackDensityPlan(slide: SlidePlan, preference: OutlineInput["densityPreference"]): NonNullable<SlidePlan["densityPlan"]> {
  const complexity = [
    slide.contentPlan.mainPoints.length >= 4,
    Boolean(slide.contentPlan.dataOrEvidence),
    (slide.contentPlan.conceptsToExplain?.length ?? 0) >= 3,
    /matrix|矩阵|timeline|时间线|comparison|对比|framework|框架|process|流程|dashboard|数据|table|表格|case|案例/.test(`${slide.layoutPlan.structure} ${slide.layoutPlan.visualElement}`.toLowerCase()),
  ].filter(Boolean).length;

  let textDensity: NonNullable<SlidePlan["densityPlan"]>["textDensity"] = slide.role === "cover" ? "low" : slide.role === "ending" ? "medium" : "high";
  if (preference === "light") {
    textDensity = slide.role === "cover" || slide.role === "ending" ? "low" : slide.role === "case" || slide.contentPlan.dataOrEvidence || complexity >= 2 ? "high" : "medium";
  } else if (preference === "balanced") {
    textDensity = slide.role === "cover" ? "low" : slide.role === "agenda" || (slide.role === "content" && complexity === 0) ? "medium" : "high";
  } else if (preference === "auto") {
    textDensity = slide.role === "cover" ? "low" : slide.role === "agenda" && complexity === 0 ? "medium" : "high";
  }

  const budget = textDensity === "low"
    ? { visibleLabelCount: 2, labelMaxChars: 8 }
    : textDensity === "medium" ? { visibleLabelCount: 6, labelMaxChars: 16 } : { visibleLabelCount: 10, labelMaxChars: 22 };

  return {
    textDensity,
    ...budget,
    structure: fallbackDensityStructure(slide, textDensity),
    rationale: `${slide.role} 页面按内容复杂度自动判定为${textDensity === "low" ? "低" : textDensity === "medium" ? "中" : "高"}密度。`,
  };
}

function fallbackDensityStructure(slide: SlidePlan, textDensity: NonNullable<SlidePlan["densityPlan"]>["textDensity"]): NonNullable<SlidePlan["densityPlan"]>["structure"] {
  const text = `${slide.layoutPlan.structure} ${slide.layoutPlan.visualElement}`.toLowerCase();
  if (slide.role === "cover" || slide.role === "ending") return "hero";
  if (/timeline|时间线/.test(text)) return "timeline";
  if (/matrix|矩阵|framework|框架|table|表格/.test(text)) return "matrix";
  if (/comparison|对比/.test(text)) return "comparison";
  if (/process|流程|flow/.test(text)) return "flow";
  if (slide.role === "case") return "case-path";
  if (slide.role === "summary") return "summary-grid";
  return textDensity === "high" ? "matrix" : "cards";
}

function generateFallbackOutline(input: OutlineInput): DeckOutline {
  const pageCount = input.pageCount;
  const roles: SlidePlan["role"][] = ["cover", "agenda", "content", "content", "case", "summary", "ending"];

  const slides = Array.from({ length: pageCount }, (_, i): SlidePlan => {
    const index = i + 1;
    const isLast = index === pageCount;
    const role = index === 1 ? "cover" : index === 2 ? "agenda" : isLast ? "ending" : roles[Math.min(i, roles.length - 1)];
    const title = index === 1 ? input.title : `第 ${index} 页`;
    const slide: SlidePlan = {
      id: nanoid(10),
      index,
      title,
      role,
      keyMessage: "这一页的核心论点",
      contentPlan: {
        mainPoints: ["具体要点1", "具体要点2", "具体要点3"],
      },
      layoutPlan: {
        structure: "标题区(20%) + 内容区(80%)",
        visualElement: "编号列表",
        textPlacement: "左对齐标题 + 列表排布",
      },
      designPlan: {
        colorScheme: "白底蓝色标题灰色正文",
        backgroundStyle: "纯白",
        accentDetails: "蓝色强调线",
      },
      imagePromptHint: `A professional 16:9 PPT slide with Chinese title "${title}"`,
      speakerNote: "按要点展开。",
    };
    slide.densityPlan = fallbackDensityPlan(slide, input.densityPreference);
    return slide;
  });

  return {
    deckTitle: input.title,
    pageCount,
    visualDirection: "professional academic presentation",
    slides,
  };
}
