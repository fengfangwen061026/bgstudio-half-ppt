import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import pLimit from "p-limit";
import { nanoid } from "nanoid";
import { createStyleBible } from "./prompts";
import { generateSlideImage, generateTemplate } from "./image2";
import { buildPptxFromImages } from "./pptx";
import type { DeckOutline, JobCreateInput, PptJob } from "./schemas";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const storageRoot = path.join(process.cwd(), ".storage", "jobs");

function jobPath(id: string) {
  return path.join(storageRoot, id, "job.json");
}

async function persistJob(job: PptJob) {
  await writeFile(jobPath(job.id), JSON.stringify(job), "utf8");
}

export async function getJob(id: string): Promise<PptJob | undefined> {
  try {
    const raw = await readFile(jobPath(id), "utf8");
    return JSON.parse(raw) as PptJob;
  } catch {
    return undefined;
  }
}

export async function createPptJob(input: JobCreateInput) {
  const id = nanoid(12);
  const jobDir = path.join(storageRoot, id);
  await mkdir(jobDir, { recursive: true });

  const job: PptJob = {
    id,
    status: "queued",
    deckTitle: input.deckTitle,
    totalSlides: input.slides.length,
    completedSlides: 0,
    createdAt: Date.now(),
    slides: input.slides.map((slide) => ({
      slideId: slide.id,
      index: slide.index,
      title: slide.title,
      status: "pending",
    })),
  };
  await persistJob(job);

  void runJob(job, input, jobDir);
  return job;
}

async function runJob(job: PptJob, input: JobCreateInput, jobDir: string) {
  try {
    job.status = "generating-images";
    await persistJob(job);

    const bible = createStyleBible({ ...input, pageCount: input.slides.length } as DeckOutline, input.style);

    // Step 1: Generate blank template to establish visual identity
    const templatePath = path.join(jobDir, "template.png");
    await generateTemplate({ styleBible: bible, outputPath: templatePath });

    // Step 2: Generate ALL slides in parallel, each referencing the template image
    const concurrency = Math.max(1, Math.min(Number(process.env.MAX_IMAGE_CONCURRENCY ?? 10), input.slides.length));
    const limit = pLimit(concurrency);
    const allImages = await Promise.all(input.slides.map((slide) => limit(async () => {
      const outputPath = path.join(jobDir, `slide-${String(slide.index).padStart(2, "0")}.png`);
      markSlide(job, slide.id, "generating");
      await persistJob(job);
      await generateSlideImage({ slide, styleBible: bible, outputPath, templatePath });
      markSlide(job, slide.id, "done", outputPath);
      await persistJob(job);
      return { slideId: slide.id, path: outputPath };
    })));

    job.status = "building-ppt";
    await persistJob(job);

    const sortedImages = allImages.sort((a, b) => {
      const ai = input.slides.find((slide) => slide.id === a.slideId)?.index ?? 0;
      const bi = input.slides.find((slide) => slide.id === b.slideId)?.index ?? 0;
      return ai - bi;
    });
    const outputPath = path.join(jobDir, "result.pptx");
    await buildPptxFromImages({ deckTitle: input.deckTitle, images: sortedImages, outputPath });
    job.status = "done";
    job.downloadUrl = `${basePath}/api/ppt/jobs/${job.id}/download`;
    await persistJob(job);
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "生成失败";
    await persistJob(job);
  }
}

function markSlide(job: PptJob, slideId: string, status: "generating" | "done" | "failed", imagePath?: string) {
  const slide = job.slides.find((item) => item.slideId === slideId);
  if (!slide) return;
  slide.status = status;
  if (imagePath) {
    slide.imagePath = imagePath;
    slide.imageUrl = `${basePath}/api/ppt/jobs/${job.id}/images/${slideId}`;
  }
  job.completedSlides = job.slides.filter((item) => item.status === "done").length;
}
