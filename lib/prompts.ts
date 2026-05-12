import type { DeckOutline, OutlineInput, SlidePlan } from "./schemas";

export type DeckStyleBible = {
  subject: string;
  style: string;
  stylePrompt: string;
  negativePrompt: string;
  globalDesign?: {
    primaryColor: string;
    fontStyle: string;
    overallTone: string;
  };
};

const STYLE_PRESETS: Record<string, { label: string; prompt: string; negative: string }> = {
  competition: {
    label: "国赛级",
    prompt: "Ultra high-quality presentation slide design, competition-grade visual standard. Inspired by award-winning presentation designs from international competitions. Premium layout with golden ratio composition, sophisticated color harmony, professional data visualization with polished charts and infographics, elegant typography hierarchy. Rich visual layers with subtle gradients, refined shadows, and professional iconography. The slide should look like it was designed by a top-tier design agency — polished, impressive, and visually striking while maintaining clarity.",
    negative: "no cheap clip art, no default PowerPoint template, no basic shapes, no flat SVG look, no amateur design, no blurry text",
  },
  cute: {
    label: "可爱风",
    prompt: "Adorable and charming presentation slide with a warm, playful aesthetic. Soft pastel color palette (pink, mint, lavender, cream). Rounded shapes, cute illustrated icons, hand-drawn style decorative elements, gentle patterns (dots, hearts, clouds, stars). Bubbly but readable typography with rounded fonts. Warm lighting feel. The design should feel like a premium Canva cute template — professionally designed but with a warm, approachable, youthful personality. High production value, not childish.",
    negative: "no dark colors, no harsh contrast, no corporate style, no aggressive design, no childish crayon look",
  },
  luxury: {
    label: "华丽高端",
    prompt: "Luxurious, high-end presentation slide with premium visual impact. Dark background (deep navy, charcoal, or black) with gold, copper, or champagne accent elements. Rich gradients, subtle metallic textures, elegant serif typography, sophisticated layout with generous whitespace. Dramatic lighting effects, subtle glow, refined ornamental details. Think luxury brand keynote — Chanel, Apple, or Tesla product launch quality. Every element exudes refinement and exclusivity.",
    negative: "no bright primary colors, no playful elements, no casual fonts, no cluttered layout, no cheap gradients",
  },
  minimalist: {
    label: "极简风",
    prompt: "Ultra-clean minimalist presentation slide with Swiss design principles. Maximum whitespace, strict grid alignment, limited color palette (2 colors maximum plus black and white). Thin precise lines, Helvetica-style typography, mathematical precision in spacing. Content expressed through powerful typography hierarchy and intentional emptiness rather than decoration. Think Dieter Rams — less but better. Every element has a clear purpose, nothing is decorative.",
    negative: "no decorations, no gradients, no shadows, no icons, no illustrations, no busy layout, no more than 2 accent colors",
  },
  tech: {
    label: "科技风",
    prompt: "Cutting-edge technology-themed presentation slide with a futuristic aesthetic. Dark or deep blue background with electric blue, cyan, or neon green accent lighting. Geometric grid patterns, circuit-board-inspired line art, glowing data visualization, holographic-style UI elements. Modern sans-serif typography with tech-forward feel. Think Bloomberg Terminal meets Apple WWDC keynote — data-rich but visually sophisticated. Subtle particle effects, clean code-inspired layouts.",
    negative: "no warm colors, no organic shapes, no hand-drawn elements, no vintage style, no paper texture",
  },
  academic: {
    label: "学术严谨",
    prompt: "Professional academic presentation slide with scholarly credibility. Clean white or light gray background, navy or dark green accent color. Well-structured content hierarchy with clear section headers, properly formatted citations, professional charts with labeled axes. Serif fonts for titles, clean sans-serif for body. Think Nature journal or TED talk slides — authoritative, clear, data-driven. Structured grid layout, professional figure captions, subtle institutional feel.",
    negative: "no flashy effects, no bright neon colors, no playful fonts, no decorative illustrations, no casual style",
  },
};

export function createStyleBible(outline: DeckOutline, style?: string): DeckStyleBible {
  const preset = STYLE_PRESETS[style ?? "competition"] ?? STYLE_PRESETS.competition;
  return {
    subject: outline.deckTitle,
    style: preset.label,
    stylePrompt: preset.prompt,
    negativePrompt: preset.negative,
    globalDesign: outline.globalDesign,
  };
}

export function getStyleLabel(style: string): string {
  return STYLE_PRESETS[style]?.label ?? style;
}

export function buildOutlineSystemPrompt() {
  return `你是一个专业的大学课程汇报 PPT 策划师。你不只是列大纲，而是给出每一页完整的制作方案——包括内容方案、排版方案、设计方案，详细到可以直接交给设计师执行。

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
      "subtitle": "副标题或引导语（可选）",
      "role": "cover",
      "keyMessage": "这一页的核心论点（一句有观点的话）",
      "contentPlan": {
        "mainPoints": ["要点1：具体完整句子", "要点2", "要点3", "要点4"],
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
      "imagePromptHint": "英文，详细描述这一页PPT的视觉画面",
      "speakerNote": "演讲备注"
    }
  ]
}

## role 限定
cover, agenda, content, case, summary, ending

## 内容方案要求
- mainPoints 必须 3-5 条，每条是有信息量的完整句子
- 不允许 "分析xxx" "总结xxx" 这种空话
- 如果用户给了材料，必须引用整合

## 排版方案要求
- structure 必须含各区域面积比例
- visualElement 指定具体可视化类型（流程图/柱状图/矩阵/时间线等）
- textPlacement 说明对齐方式和字号层级

## 设计方案要求
- 全套保持视觉语言统一
- 封面可以更大胆，内容页要克制

## imagePromptHint 要求
描述一张高质量的 PPT 页面设计稿，包含：
- 中文标题文字（写明具体内容）
- 具体的图表/信息图/可视化内容
- 配色和氛围描述
- 布局和层次描述
长度 80-150 英文词。不要描述"投影""课堂""教室"等场景。`;
}

export function buildOutlineUserPrompt(input: OutlineInput) {
  const attachments = input.attachmentTexts.filter(Boolean).join("\n\n--- 附件分隔 ---\n\n").slice(0, 20000);
  const styleLabel = STYLE_PRESETS[input.style]?.label ?? "国赛级";

  const toneGuide = {
    safe: "正式但不死板，内容充实、结构清晰",
    plain: "简洁直接，每页只说最重要的点，但论据要有",
    lazy: "看起来完整规范，结构清晰，内容够用",
  }[input.tone];

  return `题目：${input.title}
页数：严格 ${input.pageCount} 页
语气：${toneGuide}
设计风格：${styleLabel}

用户提供的基础内容：
${input.rawContent}

${attachments ? `附件内容：\n${attachments}` : "没有附件。"}

请生成 ${input.pageCount} 页的完整 PPT 方案，设计方案要匹配「${styleLabel}」风格。`;
}

export function buildTemplatePrompt(bible: DeckStyleBible) {
  const globalDesignSection = bible.globalDesign
    ? `\nDESIGN SYSTEM:
- Primary color: ${bible.globalDesign.primaryColor}
- Typography: ${bible.globalDesign.fontStyle}
- Tone: ${bible.globalDesign.overallTone}`
    : "";

  return `Design a stunning, high-quality 16:9 presentation TEMPLATE slide for a deck titled "${bible.subject}". This template will be used as the visual foundation for all slides in the deck — every subsequent slide will be generated based on this template.

STYLE DIRECTION (${bible.style}):
${bible.stylePrompt}
${globalDesignSection}

THIS IS A BLANK TEMPLATE — DO NOT include any specific content, data, or body text. Include ONLY:
- The deck title "${bible.subject}" as a large centered title
- Background design, color scheme, and decorative elements that define the visual identity
- Header/footer areas with placeholder layout zones
- Any recurring design motifs (lines, shapes, patterns, gradients) that should appear on every slide
- A subtle page number area

The template should establish: color palette, background treatment, typography style, decorative elements, and overall visual atmosphere. All subsequent slides will inherit this look.

DO NOT: ${bible.negativePrompt}. Do NOT show a projector screen, classroom, desk, laptop, or any physical environment.`;
}

export function buildSlideImagePrompt(slide: SlidePlan, bible: DeckStyleBible, templateReference?: string) {
  const layout = slide.layoutPlan;
  const design = slide.designPlan;
  const content = slide.contentPlan;
  const points = content.mainPoints.map((p, i) => `${i + 1}. ${p}`).join("; ");

  const globalDesignSection = bible.globalDesign
    ? `\nGLOBAL DESIGN SYSTEM (all slides MUST use these consistently):
- Primary color: ${bible.globalDesign.primaryColor}
- Typography: ${bible.globalDesign.fontStyle}
- Overall tone: ${bible.globalDesign.overallTone}`
    : "";

  const templateSection = templateReference
    ? `\nTEMPLATE STYLE REFERENCE (you MUST match this visual direction exactly):
"${templateReference}"
Match the background, colors, fonts, decorative elements, and overall atmosphere described above. This slide must look like it belongs to the same deck.`
    : "";

  return `Design a stunning, high-quality 16:9 presentation slide. This is a digital design mockup — NOT a photo, NOT a screenshot, NOT a classroom scene.

STYLE DIRECTION (${bible.style}):
${bible.stylePrompt}
${globalDesignSection}
${templateSection}

SLIDE CONTENT:
- Deck: "${bible.subject}"
- Slide #${slide.index}: "${slide.title}"${slide.subtitle ? ` — "${slide.subtitle}"` : ""}
- Key message: ${slide.keyMessage}
- Content: ${points}
${content.dataOrEvidence ? `- Data/evidence: ${content.dataOrEvidence}` : ""}

LAYOUT:
- Structure: ${layout.structure}
- Visual element: ${layout.visualElement}
- Text placement: ${layout.textPlacement}

PAGE-SPECIFIC DESIGN:
- Colors: ${design.colorScheme}
- Background: ${design.backgroundStyle}
- Accents: ${design.accentDetails}

VISUAL DIRECTION:
${slide.imagePromptHint}

REQUIREMENTS:
- Chinese text for title, labels, and annotations
- Structured content (charts, diagrams, infographics, organized text)
- Ultra high production quality
- CONSISTENCY: must match the same visual language as all other slides in this deck

DO NOT: ${bible.negativePrompt}. No projector, classroom, desk, or physical environment.`;
}
