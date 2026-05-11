import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import pLimit from "p-limit";
import { nanoid } from "nanoid";
import { createStyleBible } from "./prompts";
import { generateSlideImage } from "./image2";
import { buildPptxFromImages } from "./pptx";
import type { DeckOutline, JobCreateInput, PptJob } from "./schemas";

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
    const seed = Math.floor(Math.random() * 1_000_000);

    // Step 1: Generate cover slide first to establish style reference
    const coverSlide = input.slides[0];
    const coverPath = path.join(jobDir, `slide-${String(coverSlide.index).padStart(2, "0")}.png`);
    markSlide(job, coverSlide.id, "generating");
    await persistJob(job);
    const coverResult = await generateSlideImage({ slide: coverSlide, styleBible: bible, outputPath: coverPath, seed });
    markSlide(job, coverSlide.id, "done", coverPath);
    await persistJob(job);

    // Step 2: Generate remaining slides in parallel with style reference
    const remainingSlides = input.slides.slice(1);
    const concurrency = Math.max(1, Math.min(Number(process.env.MAX_IMAGE_CONCURRENCY ?? 10), remainingSlides.length));
    const limit = pLimit(concurrency);
    const remainingImages = await Promise.all(remainingSlides.map((slide) => limit(async () => {
      const outputPath = path.join(jobDir, `slide-${String(slide.index).padStart(2, "0")}.png`);
      markSlide(job, slide.id, "generating");
      await persistJob(job);
      await generateSlideImage({ slide, styleBible: bible, outputPath, seed, styleReference: coverResult.revisedPrompt });
      markSlide(job, slide.id, "done", outputPath);
      await persistJob(job);
      return { slideId: slide.id, path: outputPath };
    })));

    const allImages = [{ slideId: coverSlide.id, path: coverPath }, ...remainingImages];

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
    job.downloadUrl = `/api/ppt/jobs/${job.id}/download`;
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
    slide.imageUrl = `/api/ppt/jobs/${job.id}/images/${slideId}`;
  }
  job.completedSlides = job.slides.filter((item) => item.status === "done").length;
}
