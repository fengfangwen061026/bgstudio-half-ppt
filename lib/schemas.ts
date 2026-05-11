import { z } from "zod";

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
  style: z.enum(["competition", "cute", "luxury", "minimalist", "tech", "academic"]).optional().default("competition"),
});

export const jobCreateSchema = z.object({
  deckTitle: z.string().min(1),
  visualDirection: z.string().min(1),
  globalDesign: z.object({
    primaryColor: z.string(),
    fontStyle: z.string(),
    overallTone: z.string(),
  }).optional(),
  style: z.enum(["competition", "cute", "luxury", "minimalist", "tech", "academic"]).optional().default("competition"),
  slides: z.array(slidePlanSchema).min(1).max(20),
});

export type SlidePlan = z.infer<typeof slidePlanSchema>;
export type DeckOutline = z.infer<typeof outlineSchema>;
export type OutlineInput = z.infer<typeof outlineInputSchema>;
export type JobCreateInput = z.infer<typeof jobCreateSchema>;

export type SlideJobStatus = "pending" | "generating" | "done" | "failed";
export type JobStatus = "queued" | "generating-images" | "building-ppt" | "done" | "failed";

export type PptJob = {
  id: string;
  status: JobStatus;
  deckTitle: string;
  totalSlides: number;
  completedSlides: number;
  createdAt: number;
  error?: string;
  downloadUrl?: string;
  slides: Array<{
    slideId: string;
    index: number;
    title: string;
    status: SlideJobStatus;
    imagePath?: string;
    imageUrl?: string;
    error?: string;
  }>;
};
