import { getStyleLabel, getStylePreset } from "./styles";
import type { DeckOutline, OutlineInput, SlidePlan, StyleContract } from "./schemas";

type DensityPreference = OutlineInput["densityPreference"];
type SlideDensityPlan = NonNullable<SlidePlan["densityPlan"]>;
type SlideDensity = SlideDensityPlan["textDensity"];

export type DeckStyleBible = {
  subject: string;
  style: string;
  description: string;
  stylePrompt: string;
  negativePrompt: string;
  outlineGuidance: string;
  layoutArchetypes: string[];
  densityGuidance: string;
  densityPreference: DensityPreference;
  styleContract: StyleContract;
  globalDesign?: {
    primaryColor: string;
    fontStyle: string;
    overallTone: string;
  };
};

export function createStyleBible(outline: DeckOutline, style?: string, densityPreference: DensityPreference = "rich"): DeckStyleBible {
  const preset = getStylePreset(style);
  return {
    subject: outline.deckTitle,
    style: preset.label,
    description: preset.description,
    stylePrompt: preset.prompt,
    negativePrompt: preset.negative,
    outlineGuidance: preset.outlineGuidance,
    layoutArchetypes: preset.layoutArchetypes,
    densityGuidance: preset.densityGuidance,
    densityPreference,
    styleContract: preset.contract,
    globalDesign: outline.globalDesign,
  };
}

export function buildOutlineSystemPrompt() {
  return `你是一个专业的大学课程汇报 PPT 策划师。你要为 image2 整页生图生成稳定、精美、信息密度动态变化的 PPT 方案。

## 输出格式（JSON 对象，不是数组）

{
  "deckTitle": "PPT标题",
  "pageCount": 页数,
  "visualDirection": "整套PPT的视觉风格描述（50-80字）",
  "globalDesign": {
    "primaryColor": "主色调，如 蓝色系#2B5CE6",
    "fontStyle": "字体风格描述",
    "overallTone": "整体调性描述"
  },
  "slides": [
    {
      "id": "slide_1",
      "index": 1,
      "title": "页面主标题（中文，8-15字）",
      "subtitle": "副标题或引导语（可选，12字以内）",
      "role": "cover",
      "keyMessage": "这一页的核心论点（一句有观点的话）",
      "contentPlan": {
        "mainPoints": ["要点1：具体完整句子", "要点2", "要点3"],
        "dataOrEvidence": "数据/案例/引用来源",
        "conceptsToExplain": ["需解释的概念"]
      },
      "layoutPlan": {
        "structure": "排版结构（含面积比例）",
        "visualElement": "主视觉元素类型",
        "textPlacement": "文字排布方式"
      },
      "designPlan": {
        "colorScheme": "这一页的配色",
        "backgroundStyle": "背景处理方式",
        "accentDetails": "强调细节"
      },
      "imagePromptHint": "英文，描述这一页的视觉隐喻、构图和短标签，不要塞长段落",
      "densityPlan": {
        "textDensity": "medium",
        "visibleLabelCount": 4,
        "labelMaxChars": 12,
        "structure": "cards",
        "rationale": "机制解释页，需要用 4 个信息卡片承载核心逻辑"
      },
      "speakerNote": "演讲备注"
    }
  ]
}

## role 限定
cover, agenda, content, case, summary, ending

## 内容方案要求
- mainPoints 必须是有意义的内容单元，不是目录词；每条都要包含一个具体判断、机制解释、例子/证据/影响中的至少两项
- 高密度页必须提供 8-10 条可直接上屏的内容单元，每条建议用「短标题：具体判断/机制/例子」格式，例如「算法推荐：降低比较成本，却削弱主动搜索」
- medium 页提供 5-6 条内容单元；low 页只保留 1-2 个核心识别词或一句观点
- 不允许 "背景分析" "机制解释" "案例说明" "风险总结" "对策建议" 这种空话，也不允许只有 "算法推荐/消费风险/平台治理" 这类名词标签
- 如果用户给了材料，必须把材料转写成具体观点、机制或例子，不要只复述材料标题

## 动态信息密度要求
- 每页必须给出 densityPlan
- cover 通常 low：大标题、副标题、1-2 个关键词，强调识别度
- agenda 可 medium 或 high，必须像研究路径/章节地图，每个章节点要有研究动作或问题，不要像宣传海报
- content/case/summary 默认 high，除非用户明确选择偏简洁
- data/evidence/concept/process/comparison/case 页面强制 high：8-10 个有意义的信息单元，用 3x3 矩阵、流程、对比、时间线或案例路径承载
- 高密度不是更多图标或空格子，而是更多可读的判断、因果、例子、证据和启示；必须通过分组、网格、编号、色块来组织，不允许小字堆叠、表格截图、论文式正文
- visibleLabelCount 必须匹配 textDensity：low 1-2，medium 5-6，high 8-10
- labelMaxChars：low 6-8，medium 12-16，high 16-22

## 生图可见文字要求
- title 8-15 个中文字符，尽量短、有观点
- subtitle 可选，12 个中文字符以内
- 根据 densityPlan 决定短标签数量
- 不要把正文堆进 imagePromptHint

## 排版方案要求
- structure 必须含各区域面积比例
- visualElement 指定具体可视化类型（流程图/矩阵/时间线/手机界面隐喻等）
- textPlacement 说明大标题、短标签、页码的位置

## 设计方案要求
- 全套保持视觉语言统一
- 封面可以更大胆，内容页要克制

## imagePromptHint 要求
描述一张高质量 PPT 页面视觉稿，包含：
- 视觉隐喻和主视觉
- 与 densityPlan 匹配的信息结构
- 配色和氛围
- 布局和层次
长度 80-150 英文词。不要描述"投影""课堂""教室"等场景，不要要求大量小字。`;
}

export function buildOutlineUserPrompt(input: OutlineInput) {
  const attachments = input.attachmentTexts.filter(Boolean).join("\n\n--- 附件分隔 ---\n\n").slice(0, 20000);
  const style = getStylePreset(input.style);
  const styleLabel = getStyleLabel(input.style);

  const toneGuide = {
    safe: "正式但不死板，内容充实、结构清晰",
    plain: "简洁直接，每页只说最重要的点，但论据要有",
    lazy: "看起来完整规范，结构清晰，内容够用",
  }[input.tone];

  const densityGuide = {
    auto: "自动动态：高密度优先，封面/结束页保留呼吸感。",
    light: "偏简洁：整体更克制，但案例/数据页仍保留必要信息。",
    balanced: "均衡报告：普通页中密度，分析/证据/总结页高密度。",
    rich: "多数内容页高密度：正文页优先 8-10 个结构化信息块。",
  }[input.densityPreference];

  return `题目：${input.title}
页数：严格 ${input.pageCount} 页
语气：${toneGuide}
设计风格：${styleLabel}
风格说明：${style.description}
风格拆页原则：${style.outlineGuidance}
常用版式：${style.layoutArchetypes.join("；")}
风格密度原则：${style.densityGuidance}
信息密度：${densityGuide}

用户提供的基础内容：
${input.rawContent}

${attachments ? `附件内容：\n${attachments}` : "没有附件。"}

请生成 ${input.pageCount} 页的完整 PPT 方案，设计方案要匹配「${styleLabel}」风格。注意：这套 PPT 会由 image2 生成整页图片，所以每页可见文字必须可读、结构化；不要统一压成宣传海报，也不要把正文堆成小字。`;
}

export function buildTemplatePrompt(bible: DeckStyleBible) {
  const contract = formatStyleContract(bible.styleContract);
  const globalDesignSection = bible.globalDesign
    ? `\nDESIGN SYSTEM:\n- Primary color: ${bible.globalDesign.primaryColor}\n- Typography: ${bible.globalDesign.fontStyle}\n- Tone: ${bible.globalDesign.overallTone}`
    : "";

  return `Create ONE premium 16:9 PowerPoint style anchor image for a deck titled "${bible.subject}".

This is the visual anchor for the whole deck. It should look like a polished title/template page, not a generic background.

STYLE DIRECTION (${bible.style}):
${bible.stylePrompt}

STYLE DESCRIPTION:
${bible.description}

LAYOUT ARCHETYPES TO ESTABLISH:
${bible.layoutArchetypes.map((item) => `- ${item}`).join("\n")}

DENSITY GUIDANCE:
${bible.densityGuidance}
${globalDesignSection}

STYLE CONTRACT TO ESTABLISH:
${contract}

VISIBLE TEXT:
- Render only the deck title "${bible.subject}" as a large readable Chinese title.
- Optional: one tiny page-number style mark only.
- Do not add any other Chinese or English text.

DESIGN REQUIREMENTS:
- Establish the exact palette, typography, grid, card style, divider style, chart language, footer/page-marker zone, and spacing rhythm for the entire deck.
- Include reusable content zones for high-density report slides, not only a decorative cover background.
- Premium, coherent, high-production-value presentation slide image.
- Establish a reusable image-rich language: editorial illustrations, contextual objects, layered photo-like/3D/flat scenes, device mockups, human silhouettes, product/media-consumption scenes, not only line icons.
- This anchor should make later slides look like a real report deck, not isolated posters.

DO NOT: ${bible.negativePrompt}. No projector, classroom, desk, laptop, physical environment, watermark, fake logo, dark-blue neon default, or dense unreadable text.`;
}

export function buildSlideImagePrompt(slide: SlidePlan, bible: DeckStyleBible, templateReference?: string) {
  const densityPlan = resolveDensityPlan(slide, bible.densityPreference);
  const brief = createSlideVisualBrief(slide, densityPlan);
  const contract = formatStyleContract(bible.styleContract);
  const visibleText = formatVisibleText(brief);
  const densityInstruction = formatDensityInstruction(densityPlan);
  const structureInstruction = formatStructureInstruction(densityPlan.structure);
  const visualSceneInstruction = formatVisualSceneInstruction(slide, densityPlan);
  const templateSection = templateReference
    ? `\nSTYLE ANCHOR REVISED PROMPT:\n"${templateReference}"\nUse it as the same-deck visual reference. Keep the same palette, card style, background language, footer/page-number treatment, and spacing rhythm.`
    : "";

  return `Create ONE polished 16:9 PowerPoint slide image. This is a finished digital slide visual, not a photo, not a screenshot, not a classroom scene.

DECK:
"${bible.subject}"

SLIDE TYPE:
${brief.slideType}

STYLE DIRECTION (${bible.style}):
${bible.stylePrompt}

STYLE DESCRIPTION:
${bible.description}

LAYOUT ARCHETYPES:
${bible.layoutArchetypes.map((item) => `- ${item}`).join("\n")}

DENSITY GUIDANCE:
${bible.densityGuidance}

STYLE CONTRACT — MUST STAY CONSISTENT ACROSS ALL SLIDES:
${contract}${templateSection}

VISIBLE TEXT — render only these Chinese texts, exactly once, large and readable:
${visibleText}

INFORMATION DENSITY:
${densityInstruction}

CONTENT MEANING:
- Key message: ${slide.keyMessage}
- Main points for visual interpretation: ${slide.contentPlan.mainPoints.slice(0, densityPlan.textDensity === "high" ? 10 : 6).join(" / ")}
${slide.contentPlan.conceptsToExplain?.length ? `- Concepts: ${slide.contentPlan.conceptsToExplain.slice(0, densityPlan.textDensity === "high" ? 6 : 4).join(" / ")}` : ""}
${slide.contentPlan.dataOrEvidence ? `- Evidence: ${slide.contentPlan.dataOrEvidence}` : ""}

LAYOUT BRIEF:
- Composition: ${brief.composition}
- Density structure: ${densityPlan.structure}
- Structure instruction: ${structureInstruction}
- Visual scene layer: ${visualSceneInstruction}
- Visual metaphor: ${brief.visualMetaphor}
- Original structure hint: ${slide.layoutPlan.structure}
- Main visual element: ${slide.layoutPlan.visualElement}
- Text placement: ${slide.layoutPlan.textPlacement}

PAGE-SPECIFIC DESIGN:
- Colors: ${slide.designPlan.colorScheme}
- Background: ${slide.designPlan.backgroundStyle}
- Accents: ${slide.designPlan.accentDetails}

EXTRA VISUAL HINT:
${slide.imagePromptHint}

QUALITY RULES:
- Full-slide image, premium PPT design, high visual polish.
- This must look like an image-rich report slide, not a dry wireframe infographic and not a promotional poster.
- Every non-minimal body slide should include one substantial visual image area: editorial illustration, contextual scene, device/mockup, object collage, semi-realistic 3D element, or photo-like visual metaphor, integrated with the report grid.
- Use information cards as overlays or side panels around the image area; do not let thin line icons become the main visual.
- Large Chinese title and readable structured content snippets only; no paragraph blocks.
- Each visible block should communicate a concrete claim, mechanism, example, or implication, not an empty noun label.
- Use richer illustrations, scene fragments, cards, diagrams, flow arrows, charts, or visual metaphors to organize meaningful short content instead of writing long text.
- Keep safe margins, grid alignment, and strong hierarchy.
- Footer/page number position must match the style contract.

DO NOT:
${[...bible.styleContract.forbidden, bible.negativePrompt, ...brief.forbidden].join("; ")}; no watermark; no fake logo; no extra text; no tiny unreadable annotations; no projector, classroom, desk, laptop, or physical environment.`;
}

function createSlideVisualBrief(slide: SlidePlan, densityPlan: SlideDensityPlan) {
  const labels = compactLabels(slide, densityPlan);
  const roleComposition: Record<SlidePlan["role"], string> = {
    cover: "hero title composition with one strong central/right visual, generous negative space, cinematic depth",
    agenda: "clean agenda map with a contextual visual scene or large thematic object plus numbered modules and consistent footer",
    content: "structured report slide with one dominant image-rich visual area and readable content cards or callouts",
    case: "case-study slide with a concrete scenario visual, evidence callouts, and a clear case-path structure",
    summary: "conclusion slide with strong visual metaphor, takeaway grid and closing emphasis",
    ending: "minimal closing slide with memorable statement and premium visual atmosphere",
  };

  return {
    slideType: slide.role,
    visibleTitle: shorten(slide.title, 18),
    visibleSubtitle: slide.subtitle ? shorten(slide.subtitle, 14) : undefined,
    visibleLabels: labels,
    visualMetaphor: slide.layoutPlan.visualElement,
    composition: roleComposition[slide.role],
    textDensity: densityPlan.textDensity,
    forbidden: ["paragraph text", "tiny captions", "document screenshot", "crowded tables", "random English words", "duplicate titles"],
  };
}

function compactLabels(slide: SlidePlan, densityPlan: SlideDensityPlan) {
  const source = densityPlan.textDensity === "high"
    ? slide.contentPlan.mainPoints
    : slide.contentPlan.conceptsToExplain?.length ? slide.contentPlan.conceptsToExplain : slide.contentPlan.mainPoints;
  return selectMeaningfulLabels(source, densityPlan.visibleLabelCount).map((item) => shorten(cleanLabel(item), densityPlan.labelMaxChars)).filter(Boolean);
}

export function resolveDensityPlan(slide: SlidePlan, preference: DensityPreference = "auto"): SlideDensityPlan {
  if (slide.densityPlan) return slide.densityPlan;

  const complexity = getSlideComplexity(slide);
  let density: SlideDensity = slide.role === "cover" ? "low" : slide.role === "ending" ? "medium" : "high";
  if (preference === "light") {
    density = slide.role === "cover" || slide.role === "ending" ? "low" : slide.role === "case" || slide.contentPlan.dataOrEvidence || complexity >= 2 ? "high" : "medium";
  } else if (preference === "balanced") {
    density = slide.role === "cover" ? "low" : slide.role === "agenda" || (slide.role === "content" && complexity === 0) ? "medium" : "high";
  } else if (preference === "auto") {
    density = slide.role === "cover" ? "low" : slide.role === "agenda" && complexity === 0 ? "medium" : "high";
  }

  const structure = resolveDensityStructure(slide, density);
  const budget = densityBudgets[density];
  return {
    textDensity: density,
    visibleLabelCount: budget.labelCount,
    labelMaxChars: budget.labelMaxChars,
    structure,
    rationale: `${slide.role} 页面结合内容复杂度 ${complexity}，采用${densityLabel[density]}。`,
  };
}

const densityBudgets: Record<SlideDensity, { labelCount: number; labelMaxChars: number }> = {
  low: { labelCount: 2, labelMaxChars: 8 },
  medium: { labelCount: 6, labelMaxChars: 16 },
  high: { labelCount: 10, labelMaxChars: 22 },
};

const densityLabel: Record<SlideDensity, string> = {
  low: "低密度",
  medium: "中密度",
  high: "高密度",
};

function getSlideComplexity(slide: SlidePlan) {
  const structureText = `${slide.layoutPlan.structure} ${slide.layoutPlan.visualElement}`.toLowerCase();
  return [
    slide.contentPlan.mainPoints.length >= 4,
    Boolean(slide.contentPlan.dataOrEvidence),
    (slide.contentPlan.conceptsToExplain?.length ?? 0) >= 3,
    /matrix|矩阵|timeline|时间线|comparison|对比|framework|框架|process|流程|dashboard|数据|table|表格|case path|案例/.test(structureText),
  ].filter(Boolean).length;
}

function resolveDensityStructure(slide: SlidePlan, density: SlideDensity): SlideDensityPlan["structure"] {
  const text = `${slide.layoutPlan.structure} ${slide.layoutPlan.visualElement}`.toLowerCase();
  if (slide.role === "cover" || slide.role === "ending") return "hero";
  if (/timeline|时间线/.test(text)) return "timeline";
  if (/matrix|矩阵|framework|框架|table|表格/.test(text)) return "matrix";
  if (/comparison|对比/.test(text)) return "comparison";
  if (/process|流程|flow/.test(text)) return "flow";
  if (slide.role === "case") return "case-path";
  if (slide.role === "summary") return "summary-grid";
  return density === "high" ? "matrix" : "cards";
}

function formatVisualSceneInstruction(slide: SlidePlan, densityPlan: SlideDensityPlan) {
  const topic = `${slide.title} ${slide.keyMessage} ${slide.layoutPlan.visualElement}`;
  const base = densityPlan.textDensity === "low"
    ? "Use a large atmospheric hero image or editorial illustration as the primary visual."
    : "Use a substantial central/side visual image area taking roughly 30-45% of the slide, with content cards layered around it.";
  if (slide.role === "cover") return `${base} Build a memorable theme image related to ${topic}, not abstract line art.`;
  if (slide.role === "agenda") return `${base} Use a roadmap-style scene with concrete objects or media/device elements that preview the deck sections.`;
  if (slide.role === "case") return `${base} Show a concrete case scenario with people, phone/live-stream interface, shopping objects, or contextual environment fragments.`;
  if (slide.role === "summary" || slide.role === "ending") return `${base} Use a strong closing metaphor image plus compact takeaway cards.`;
  if (/算法|推荐|平台|短视频|直播|消费|购买|用户|手机|媒介|社交/.test(topic)) {
    return `${base} Prefer phone screens, short-video feed cards, live-stream commerce scenes, student consumer objects, recommendation paths, and layered media panels instead of abstract line icons.`;
  }
  return `${base} Prefer concrete objects, contextual mini-scenes, editorial collage, photo-like/3D/flat illustration elements, and only use line icons as secondary details.`;
}

function formatStructureInstruction(structure: SlideDensityPlan["structure"]) {
  const instructions: Record<SlideDensityPlan["structure"], string> = {
    hero: "Use a restrained hero composition with title, subtitle and one strong visual metaphor; keep it clean.",
    cards: "Use a 2x3 or 3x3 card group depending on density; high-density pages need grouped subcards, each with a short heading and concise phrase.",
    flow: "Use a horizontal or vertical process flow with 6-8 numbered nodes, side callouts, and one bottom takeaway bar.",
    matrix: "Use a 3x3 or 2x5 matrix of readable modules with clear grouping and consistent spacing.",
    timeline: "Use a timeline with readable nodes plus one insight area; avoid tiny dates or footnotes.",
    comparison: "Use left-right or three-column comparison with matched rows and clear contrast labels.",
    "case-path": "Use a case path: scene, mechanism, evidence, impact, reflection or recommendation.",
    "summary-grid": "Use a conclusion grid with 3-5 takeaways and one bottom final statement.",
  };
  return instructions[structure];
}

function formatDensityInstruction(densityPlan: SlideDensityPlan) {
  if (densityPlan.textDensity === "low") {
    return `Low-density hero/title slide. Use large title, optional subtitle, and 1-2 keywords. Prioritize atmosphere and visual identity. Structure: ${densityPlan.structure}. Rationale: ${densityPlan.rationale}`;
  }
  if (densityPlan.textDensity === "medium") {
    return `Medium-density report slide. Use 5-6 readable content cards/callouts. Each block must contain a short Chinese heading plus a meaningful concise phrase with a claim, mechanism, example, or implication. Balanced visual and information. Structure: ${densityPlan.structure}. Rationale: ${densityPlan.rationale}`;
  }
  return `High-density but readable report slide. Use 8-10 meaningful content blocks in a 3x3 matrix, process flow, comparison, timeline, or case-path layout. Group blocks into 2-3 larger zones so the slide feels like a dense report page, not scattered icons. Each block must contain a short Chinese heading plus a concise phrase that says something specific: a judgment, cause-effect mechanism, example, evidence, risk, or implication. Do not use empty noun labels, paragraphs, tiny footnotes, or dense table text. This must still look like a polished PPT slide, not a poster and not a document screenshot. Structure: ${densityPlan.structure}. Rationale: ${densityPlan.rationale}`;
}

function selectMeaningfulLabels(source: string[], count: number) {
  const unique = Array.from(new Set(source.map(cleanLabel).filter(Boolean)));
  return unique.slice(0, count);
}

function cleanLabel(value: string) {
  return value
    .replace(/^要点\d*[:：]?/, "")
    .replace(/^[-—•\s]+/, "")
    .replace(/[。；;]+$/, "")
    .trim();
}

function shorten(value: string, max: number) {
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function formatVisibleText(brief: ReturnType<typeof createSlideVisualBrief>) {
  const lines = [`- Title: "${brief.visibleTitle}"`];
  if (brief.visibleSubtitle) lines.push(`- Subtitle: "${brief.visibleSubtitle}"`);
  brief.visibleLabels.forEach((label, index) => lines.push(`- Label ${index + 1}: "${label}"`));
  return lines.join("\n");
}

function formatStyleContract(contract: StyleContract) {
  return `- Palette: ${contract.palette.join(", ")}
- Typography: ${contract.typography}
- Visual motif: ${contract.visualMotif}
- Background: ${contract.backgroundLanguage}
- Card style: ${contract.cardStyle}
- Icon style: ${contract.iconStyle}
- Chart/infographic style: ${contract.chartStyle}
- Footer/page number: ${contract.footerRule}
- Forbidden: ${contract.forbidden.join(", ")}`;
}
