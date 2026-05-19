import type { StyleContract } from "./schemas";

export const DEFAULT_STYLE_KEY = "course-report-warm";

export const STYLE_KEYS = [
  "course-report-warm",
  "consulting-white",
  "academic-defense",
  "editorial-magazine",
  "data-report-light",
  "minimal-swiss",
  "soft-creative",
  "tech-dark",
  "competition",
] as const;

export type DeckStyleKey = typeof STYLE_KEYS[number];

export type StylePreset = {
  label: string;
  description: string;
  prompt: string;
  negative: string;
  contract: StyleContract;
  outlineGuidance: string;
  layoutArchetypes: string[];
  densityGuidance: string;
};

export const STYLE_OPTIONS: Array<{ value: DeckStyleKey; label: string; description: string }> = [
  { value: "course-report-warm", label: "课程汇报暖白高密度", description: "暖白纸感、深灰中文标题、克制学术色，适合多数课程报告。" },
  { value: "consulting-white", label: "咨询报告白底高密度", description: "结论先行、强网格、矩阵/流程/数据 callout，适合分析型汇报。" },
  { value: "academic-defense", label: "学术答辩严谨风", description: "研究问题、方法、发现、讨论分区清楚，适合课程论文/答辩。" },
  { value: "editorial-magazine", label: "杂志社论风", description: "强标题、边栏、图文分栏，适合社会现象和观点型展示。" },
  { value: "data-report-light", label: "浅色数据报告风", description: "浅色 dashboard、指标卡、简化图表，适合调研/问卷/商业分析。" },
  { value: "minimal-swiss", label: "瑞士网格极简风", description: "少装饰、高秩序、黑白灰加单色强调，适合克制正式汇报。" },
  { value: "soft-creative", label: "柔和创意风", description: "柔和色块、圆角卡片、轻插画，适合通识课/社团展示。" },
  { value: "tech-dark", label: "深色科技风", description: "深色科技但禁止廉价霓虹和电竞大屏，适合技术主题。" },
];

export const STYLE_PRESETS: Record<DeckStyleKey, StylePreset> = {
  "course-report-warm": {
    label: "课程汇报暖白高密度",
    description: "Warm white high-density Chinese course-report deck with academic paper texture and restrained color accents.",
    prompt: "Polished Chinese university course-report slide design, warm white paper background, charcoal Chinese typography, muted academic accent colors such as terracotta, sage green and academic blue, grid-based report layout, dense but orderly content cards, thin dividers, image-rich editorial visuals, contextual objects, device mockups, student/media-consumption scenes, layered visual collages, restrained editorial/consulting aesthetic, readable and serious.",
    negative: "dark navy neon, cyberpunk, esports, holographic glow, generic blue tech background, glassmorphism dashboard, poster-only composition, childish stickers, fake logo, watermark, tiny unreadable text",
    contract: {
      palette: ["warm white", "paper gray", "charcoal", "muted terracotta", "sage green", "academic blue"],
      typography: "strong readable Chinese title, clean sans-serif body labels, clear hierarchy with title, insight line, content blocks",
      visualMotif: "paper-like report canvas, thin rules, margin notes, structured evidence cards, editorial illustrations, device mockups, contextual object scenes",
      backgroundLanguage: "warm white or light paper-gray canvas with subtle texture, never dark-blue neon by default",
      cardStyle: "flat or lightly raised rectangular cards, fine gray borders, consistent padding, dense but aligned grid",
      iconStyle: "line icons only as secondary details; primary visuals should be editorial illustrations, device/interface mockups, objects or scene fragments",
      chartStyle: "simplified charts, matrices, flows and callouts with large labels, no tiny axis text",
      footerRule: "thin gray footer rule and small native-looking page marker area, keep consistent but do not invent logos",
      forbidden: ["dark neon template", "cyber glow", "poster-only slide", "random English", "fake citations", "watermark", "tiny paragraphs"],
    },
    outlineGuidance: "Use course-report logic: background, concept, mechanism, case, risk, conclusion. Prefer problem-definition, concept-explanation, mechanism-flow, case-path, comparison-matrix and summary-grid slides.",
    layoutArchetypes: ["title + insight sentence + 2x3 card grid", "left concept definition + right examples", "horizontal causal flow with bottom takeaway", "case path: scene / mechanism / evidence / impact / reflection", "summary grid with three recommendations"],
    densityGuidance: "Most non-cover slides should be high-density report slides: 8-10 meaningful information blocks grouped around a substantial image-rich visual area. Avoid sparse promotional hero pages and avoid dry wireframe-only infographics.",
  },
  "consulting-white": {
    label: "咨询报告白底高密度",
    description: "White consulting-style analysis deck with conclusion-first titles, matrices and issue trees.",
    prompt: "Premium consulting report PowerPoint slide, white background, black and dark gray typography, one restrained accent color, conclusion-first headline, strict grid, issue tree, 2x2 matrix, 3x2 card matrix, waterfall-like reasoning, evidence callouts, executive-summary feel, dense but extremely organized.",
    negative: "neon blue, futuristic dashboard, decorative illustration, poster layout, random icons, childish colors, fake corporate logo, watermark, long paragraphs",
    contract: {
      palette: ["white", "near black", "cool gray", "consulting blue", "muted amber"],
      typography: "bold conclusion-first Chinese headline, compact report labels, small but readable section headers",
      visualMotif: "consulting grids, issue trees, matrices, evidence callouts, bottom implication bars",
      backgroundLanguage: "clean white canvas with exact margins and strong grid alignment",
      cardStyle: "sharp rectangular modules, thin gray borders, numbered headers, minimal shadows",
      iconStyle: "simple monochrome business line icons used sparingly",
      chartStyle: "2x2 matrices, bar-like comparisons, causal trees, simplified dashboards with large labels",
      footerRule: "thin footer line with page marker zone, no company logo",
      forbidden: ["decorative clutter", "neon", "cyberpunk", "cartoon", "poster-only", "fake logos", "tiny tables"],
    },
    outlineGuidance: "Use consulting logic: start with the answer, break the issue into drivers, compare options, show evidence, end with implications. Prefer matrices, issue trees, causal chains and recommendation grids.",
    layoutArchetypes: ["headline insight + 2x2 matrix", "issue tree left + evidence cards right", "3-column driver analysis", "before/after comparison", "executive summary with 5 key findings"],
    densityGuidance: "High density is expected on analysis slides: 5-6 blocks, concise headings, evidence callouts, grouped by grid. Keep it report-like, not decorative.",
  },
  "academic-defense": {
    label: "学术答辩严谨风",
    description: "Academic defense style with research sections, restrained colors and clear method/finding structure.",
    prompt: "Professional academic defense presentation slide, light gray or white background, navy and burgundy accents, research-style structure, clear sections for question, method, evidence, finding and discussion, thin rules, credible diagrams, table-like blocks, serious Chinese typography, readable high-density academic layout.",
    negative: "flashy neon, cyber dashboard, fake citations, fake university logo, decorative clutter, cartoon, poster-only hero, unreadable footnotes",
    contract: {
      palette: ["white", "light gray", "navy", "burgundy", "slate", "muted green"],
      typography: "serious Chinese academic title, clean section labels, method/finding callouts with clear hierarchy",
      visualMotif: "research question boxes, method pipeline, evidence cards, discussion notes, restrained academic dividers",
      backgroundLanguage: "quiet white/light-gray academic canvas with subtle grid or section bands",
      cardStyle: "flat research cards with navy/burgundy headers and thin dividers",
      iconStyle: "restrained academic line icons or simple diagram symbols",
      chartStyle: "research figures, process diagrams, comparison tables with large readable labels only",
      footerRule: "thin academic footer line and page marker zone",
      forbidden: ["fake citations", "fake logos", "flashy glow", "cartoon", "poster-only", "tiny citation blocks"],
    },
    outlineGuidance: "Use academic logic: research background, concept definition, analytical framework, evidence/case, discussion, conclusion. Prefer method-flow, evidence-matrix, concept-definition and finding-discussion layouts.",
    layoutArchetypes: ["research question + method + finding blocks", "definition card + examples", "framework diagram with evidence notes", "case evidence table", "discussion: limitation / implication / recommendation"],
    densityGuidance: "Most body slides should be medium-high to high density, with 4-6 research blocks. Do not fake citations or cram tiny footnotes.",
  },
  "editorial-magazine": {
    label: "杂志社论风",
    description: "Editorial magazine/data-journalism style for social issues and opinion-heavy topics.",
    prompt: "Editorial magazine style Chinese presentation slide, warm off-white background, bold typographic title, asymmetric grid, sidebars, pull quotes, numbered modules, data-journalism annotations, restrained image fragments or abstract editorial shapes, dense but elegant columns and callouts.",
    negative: "corporate blue template, neon tech, childish stickers, generic PPT icons, fake newspaper logo, messy collage, tiny body text, watermark",
    contract: {
      palette: ["ivory", "ink black", "warm gray", "brick red", "mustard", "desaturated blue"],
      typography: "bold editorial Chinese headline, compact sidebar labels, clear pull-quote hierarchy",
      visualMotif: "magazine columns, margin notes, pull quotes, numbered editorial modules, data journalism callouts",
      backgroundLanguage: "off-white editorial canvas with asymmetric but disciplined grid",
      cardStyle: "column blocks, sidebars, caption boxes, thin rules, occasional accent fills",
      iconStyle: "minimal editorial marks, arrows, dots and annotation symbols instead of generic icons",
      chartStyle: "annotation-led charts and comparison strips with readable labels",
      footerRule: "small editorial folio/page marker area, no fake publication logo",
      forbidden: ["neon", "messy collage", "fake newspaper logo", "random English", "poster-only", "tiny article text"],
    },
    outlineGuidance: "Use editorial logic: conflict, evidence, mechanism, example, reflection. Prefer sidebar explanations, pull quotes, comparison strips, annotated flow and argument maps.",
    layoutArchetypes: ["large headline + two-column analysis", "left sidebar concept + right evidence grid", "argument map with pull quote", "case narrative strip", "editorial conclusion with 3 takeaways"],
    densityGuidance: "Use high-density editorial modules for body slides, but keep each block as a short headline plus concise phrase, not article paragraphs.",
  },
  "data-report-light": {
    label: "浅色数据报告风",
    description: "Light dashboard/report style for survey, metrics and evidence-heavy decks.",
    prompt: "Light data report presentation slide, white or pale blue-gray background, clean dashboard-like grid, metric cards, simplified charts, evidence callouts, process diagrams, restrained SaaS/report aesthetic, polished but not dark-tech, readable Chinese labels, high information density.",
    negative: "dark cyber dashboard, neon glow, tiny axis labels, fake software UI, excessive 3D, esports style, cluttered data table, watermark",
    contract: {
      palette: ["white", "pale blue gray", "slate", "clear blue", "mint", "amber accent"],
      typography: "clean data-report Chinese title, compact metric labels, high-contrast chart annotations",
      visualMotif: "metric cards, mini charts, evidence chips, dashboard grid, flow indicators",
      backgroundLanguage: "light dashboard canvas with subtle panels and clear white zones",
      cardStyle: "rounded metric cards with thin borders and minimal shadows",
      iconStyle: "simple data/report line icons, consistent stroke width",
      chartStyle: "large readable bar, donut, line, matrix and comparison visuals; no tiny ticks",
      footerRule: "thin footer rule with small page marker zone",
      forbidden: ["dark tech dashboard", "tiny axis labels", "fake UI screenshot", "neon", "3D clutter", "watermark"],
    },
    outlineGuidance: "Use data-report logic: observation, evidence, driver, implication. Prefer metric cards, simplified charts, comparison matrices and evidence callouts.",
    layoutArchetypes: ["top insight + 4 metric cards", "one chart left + 3 callouts right", "dashboard grid with evidence blocks", "driver matrix", "risk and recommendation cards"],
    densityGuidance: "Data/report slides should be high density with 5-6 visible modules, but every chart label must be large and simplified.",
  },
  "minimal-swiss": {
    label: "瑞士网格极简风",
    description: "Swiss grid, restrained typography and precise spacing for formal minimal reports.",
    prompt: "Swiss minimalist Chinese presentation slide, strict grid, white background, black typography, one muted accent color, precise spacing, thin rules, no decoration, report-like information hierarchy, dense content arranged with extreme order and whitespace discipline.",
    negative: "decorative gradients, neon, illustrations, shadows, glassmorphism, clutter, random icons, fake logos, tiny paragraphs",
    contract: {
      palette: ["white", "black", "cool gray", "single muted blue", "single muted red"],
      typography: "large Swiss-style Chinese title, precise sans-serif labels, strict baseline rhythm",
      visualMotif: "grid lines, numbered modules, typographic hierarchy, purposeful whitespace",
      backgroundLanguage: "flat white background with exact alignment and no decoration",
      cardStyle: "border-only rectangles or text blocks, no heavy shadow",
      iconStyle: "minimal arrows, dots and numbers; icons optional and sparse",
      chartStyle: "very clean charts and matrices with large labels and no visual noise",
      footerRule: "tiny monochrome page marker aligned to grid",
      forbidden: ["ornament", "gradient", "neon", "busy illustration", "fake logo", "tiny body text"],
    },
    outlineGuidance: "Use strict report logic with fewer decorative metaphors. Prefer grids, numbered modules, comparison strips and concise evidence blocks.",
    layoutArchetypes: ["title + insight + strict 3-column grid", "numbered framework", "minimal comparison table", "single diagram + side notes", "summary strip"],
    densityGuidance: "High density is allowed, but it must feel typographic and ordered: 4-6 modules, exact alignment, no decoration.",
  },
  "soft-creative": {
    label: "柔和创意风",
    description: "Soft creative report style with rounded blocks and gentle illustration accents, not childish.",
    prompt: "Soft creative Chinese student presentation slide, warm pastel background, rounded content cards, gentle abstract illustration accents, friendly but polished Canva-like report layout, readable high-density blocks, soft shadows, clear hierarchy, not childish.",
    negative: "childish crayon, excessive stickers, candy clutter, dark neon, corporate coldness, fake logo, watermark, tiny text",
    contract: {
      palette: ["cream", "soft coral", "mint", "lavender gray", "warm yellow", "charcoal"],
      typography: "friendly rounded Chinese title, readable card headings, clean sans-serif labels",
      visualMotif: "soft blobs, rounded cards, small friendly diagrams, gentle annotation marks",
      backgroundLanguage: "warm pastel canvas with clean white/cream content zones",
      cardStyle: "large rounded cards, soft shadow, consistent padding, readable grouping",
      iconStyle: "rounded line icons or simple flat symbols, consistent and sparse",
      chartStyle: "friendly simplified diagrams and comparison cards with large labels",
      footerRule: "small rounded page marker area, no fake logo",
      forbidden: ["childish stickers", "messy decoration", "neon", "fake logo", "tiny labels", "poster-only"],
    },
    outlineGuidance: "Use student-friendly but complete report logic: background, concept, mechanism, case, advice. Prefer rounded cards, story path, comparison and summary grids.",
    layoutArchetypes: ["rounded 2x3 cards", "story path with soft nodes", "concept card + examples", "comparison cards", "advice grid"],
    densityGuidance: "Use medium-high or high density for body slides, but preserve friendly spacing and readable card groups.",
  },
  "tech-dark": {
    label: "深色科技风",
    description: "Controlled dark technology style for technical topics, avoiding cheap neon competition templates.",
    prompt: "Controlled dark technology report slide, charcoal and deep slate background, restrained cyan/blue accent, clean grid, professional product-report aesthetic, simplified technical diagrams, high-density structured panels, no esports, no cheap neon, no holographic clutter.",
    negative: "cheap neon, esports, cyberpunk overkill, dark-blue competition template, lens flare, 3D glass clutter, fake software logo, tiny dashboard labels, watermark",
    contract: {
      palette: ["charcoal", "deep slate", "cool cyan", "soft blue", "white", "muted green"],
      typography: "bold readable Chinese tech title, compact panel labels, high contrast but not glowing excessively",
      visualMotif: "technical grids, restrained panels, diagram nodes, product-report callouts",
      backgroundLanguage: "dark matte background with controlled contrast and readable zones",
      cardStyle: "dark panels with thin strokes, subtle glow only where needed, consistent spacing",
      iconStyle: "minimal technical line icons, no fake product logos",
      chartStyle: "simplified technical diagrams and charts with large labels",
      footerRule: "subtle dark footer strip with page marker zone",
      forbidden: ["cheap neon", "esports", "hologram clutter", "fake logo", "tiny dashboard", "poster-only"],
    },
    outlineGuidance: "Use technical report logic: system, mechanism, evidence, risk, conclusion. Prefer architecture diagrams, process flows, comparison and data panels.",
    layoutArchetypes: ["technical flow + evidence panels", "architecture diagram", "comparison matrix", "dashboard-like but simplified grid", "risk-control summary"],
    densityGuidance: "Use high-density technical panels for body slides, but keep labels large and avoid cluttered dashboards.",
  },
  competition: {
    label: "竞赛报告白底风",
    description: "Compatibility style for old competition key, remapped away from dark neon into polished white report aesthetics.",
    prompt: "Polished competition report slide for Chinese university projects, white or warm-white background, premium but restrained, strong report grid, clear awards-level hierarchy, muted blue and amber accents, structured cards, flow diagrams and evidence blocks, not dark neon.",
    negative: "dark navy neon, cyberpunk, esports, generic blue competition template, holographic glow, fake logo, watermark, tiny text, poster-only composition",
    contract: {
      palette: ["warm white", "navy text", "muted blue", "amber", "cool gray"],
      typography: "bold Chinese competition-report title, clean report labels, clear title-insight-body hierarchy",
      visualMotif: "premium report cards, process arrows, evidence callouts, restrained award accents",
      backgroundLanguage: "white or warm-white report canvas, no dark-blue neon default",
      cardStyle: "structured report cards with thin blue/gray borders and consistent padding",
      iconStyle: "simple line icons, no clip art or fake logos",
      chartStyle: "clean infographic shapes, matrices and flows with large readable labels",
      footerRule: "thin report footer with page marker zone",
      forbidden: ["dark neon", "esports", "fake logo", "messy collage", "tiny labels", "poster-only"],
    },
    outlineGuidance: "Use competition-report logic but keep it white and information-rich: background, innovation, mechanism, evidence, impact, conclusion.",
    layoutArchetypes: ["premium 2x3 report cards", "innovation mechanism flow", "evidence matrix", "impact comparison", "summary recommendation grid"],
    densityGuidance: "Most body slides should be high-density report slides with 5-6 structured blocks, not sparse posters.",
  },
};

export function getStylePreset(style?: string): StylePreset {
  if (style && style in STYLE_PRESETS) return STYLE_PRESETS[style as DeckStyleKey];
  return STYLE_PRESETS[DEFAULT_STYLE_KEY];
}

export function getStyleLabel(style?: string) {
  return getStylePreset(style).label;
}
