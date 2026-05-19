import { z } from "zod";
import { DEFAULT_STYLE_KEY, STYLE_KEYS } from "./styles";

export const styleSchema = z.enum(STYLE_KEYS);
export const densityPreferenceSchema = z.enum(["auto", "light", "balanced", "rich"]);
export const slideDensitySchema = z.enum(["low", "medium", "high"]);
export const densityStructureSchema = z.enum(["hero", "cards", "flow", "matrix", "timeline", "comparison", "case-path", "summary-grid"]);

export const densityPlanSchema = z.object({
  textDensity: slideDensitySchema,
  visibleLabelCount: z.number().int().min(1).max(12),
  labelMaxChars: z.number().int().min(6).max(24),
  structure: densityStructureSchema,
  rationale: z.string(),
});

export const slidePlanSchema = z.object({
  id: z.string(),
  index: z.number().int().positive(),
  title: z.string(),
  subtitle: z.string().optional(),
  role: z.enum(["cover", "agenda", "content", "case", "summary", "ending"]),
  keyMessage: z.string(),
  contentPlan: z.object({
    mainPoints: z.array(z.string()),
    dataOrEvidence: z.string().optional(),
    conceptsToExplain: z.array(z.string()).optional(),
  }),
  layoutPlan: z.object({
    structure: z.string(),
    visualElement: z.string(),
    textPlacement: z.string(),
  }),
  designPlan: z.object({
    colorScheme: z.string(),
    backgroundStyle: z.string(),
    accentDetails: z.string(),
  }),
  imagePromptHint: z.string(),
  densityPlan: densityPlanSchema.optional(),
  speakerNote: z.string().optional(),
});

export const outlineSchema = z.object({
  deckTitle: z.string(),
  pageCount: z.number().int().min(3).max(20),
  visualDirection: z.string(),
  globalDesign: z.object({
    primaryColor: z.string(),
    fontStyle: z.string(),
    overallTone: z.string(),
  }).optional(),
  slides: z.array(slidePlanSchema),
});

export const outlineInputSchema = z.object({
  title: z.string().min(1).max(120),
  rawContent: z.string().min(1).max(30000),
  pageCount: z.number().int().min(3).max(20),
  attachmentTexts: z.array(z.string()).optional().default([]),
  tone: z.enum(["safe", "plain", "lazy"]).optional().default("safe"),
  style: styleSchema.optional().default(DEFAULT_STYLE_KEY),
  densityPreference: densityPreferenceSchema.optional().default("rich"),
});

export const jobCreateSchema = z.object({
  deckTitle: z.string().min(1),
  visualDirection: z.string().min(1),
  globalDesign: z.object({
    primaryColor: z.string(),
    fontStyle: z.string(),
    overallTone: z.string(),
  }).optional(),
  style: styleSchema.optional().default(DEFAULT_STYLE_KEY),
  densityPreference: densityPreferenceSchema.optional().default("rich"),
  slides: z.array(slidePlanSchema).min(1).max(20),
});

export type SlidePlan = z.infer<typeof slidePlanSchema>;
export type DeckOutline = z.infer<typeof outlineSchema>;
export type OutlineInput = z.infer<typeof outlineInputSchema>;
export type JobCreateInput = z.infer<typeof jobCreateSchema>;

export type SlideJobStatus = "pending" | "generating" | "retrying" | "done" | "failed";
export type JobStatus = "queued" | "creating-style-anchor" | "generating-images" | "building-ppt" | "done" | "partial" | "failed";

export type StyleContract = {
  palette: string[];
  typography: string;
  visualMotif: string;
  backgroundLanguage: string;
  cardStyle: string;
  iconStyle: string;
  chartStyle: string;
  footerRule: string;
  forbidden: string[];
};

export type StyleAnchor = {
  imagePath: string;
  imageUrl?: string;
  prompt: string;
  revisedPrompt?: string;
  styleContract: StyleContract;
};

export type SlideImageCandidate = {
  index: number;
  imagePath: string;
  imageUrl?: string;
  prompt: string;
  revisedPrompt?: string;
  selected: boolean;
  error?: string;
};

export type PptJob = {
  id: string;
  status: JobStatus;
  deckTitle: string;
  totalSlides: number;
  completedSlides: number;
  createdAt: number;
  error?: string;
  downloadUrl?: string;
  densityPreference?: z.infer<typeof densityPreferenceSchema>;
  style?: z.infer<typeof styleSchema>;
  styleLabel?: string;
  styleAnchor?: StyleAnchor;
  slides: Array<{
    slideId: string;
    index: number;
    title: string;
    status: SlideJobStatus;
    imagePath?: string;
    imageUrl?: string;
    error?: string;
    textDensity?: z.infer<typeof slideDensitySchema>;
    densityRationale?: string;
    prompt?: string;
    revisedPrompt?: string;
    retryCount?: number;
    selectedCandidateIndex?: number;
    candidates?: SlideImageCandidate[];
  }>;
};
