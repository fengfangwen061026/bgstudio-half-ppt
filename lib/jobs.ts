import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import pLimit from "p-limit";
import { nanoid } from "nanoid";
import { createStyleBible } from "./prompts";
import { getStyleLabel } from "./styles";
import { generateSlideImage, generateTemplate } from "./image2";
import { buildPptxFromImages } from "./pptx";
import type { DeckOutline, JobCreateInput, PptJob, SlideImageCandidate, SlideJobStatus } from "./schemas";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const storageRoot = path.join(process.cwd(), ".storage", "jobs");
const maxRetries = 2;

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
    densityPreference: input.densityPreference,
    style: input.style,
    styleLabel: getStyleLabel(input.style),
    slides: input.slides.map((slide) => ({
      slideId: slide.id,
      index: slide.index,
      title: slide.title,
      status: "pending",
      textDensity: slide.densityPlan?.textDensity,
      densityRationale: slide.densityPlan?.rationale,
      retryCount: 0,
      candidates: [],
    })),
  };
  await persistJob(job);

  void runJob(job, input, jobDir);
  return job;
}

async function runJob(job: PptJob, input: JobCreateInput, jobDir: string) {
  try {
    const bible = createStyleBible({ ...input, pageCount: input.slides.length } as DeckOutline, input.style, input.densityPreference);

    job.status = "creating-style-anchor";
    await persistJob(job);

    const templatePath = path.join(jobDir, "template.png");
    const templateResult = await generateTemplate({ styleBible: bible, outputPath: templatePath });
    job.styleAnchor = {
      imagePath: templatePath,
      imageUrl: `${basePath}/api/ppt/jobs/${job.id}/images/style-anchor`,
      prompt: templateResult.prompt,
      revisedPrompt: templateResult.revisedPrompt,
      styleContract: bible.styleContract,
    };
    await persistJob(job);

    job.status = "generating-images";
    await persistJob(job);

    const concurrency = Math.max(1, Math.min(Number(process.env.MAX_IMAGE_CONCURRENCY ?? 4), input.slides.length));
    const limit = pLimit(concurrency);
    const results = await Promise.allSettled(input.slides.map((slide) => limit(() => generateSlideWithRetry({
      job,
      slide,
      bible,
      jobDir,
      templateReference: templateResult.revisedPrompt,
    }))));

    const images = results.flatMap((result) => result.status === "fulfilled" && result.value ? [result.value] : []);
    job.status = "building-ppt";
    await persistJob(job);

    const sortedImages = images.sort((a, b) => {
      const ai = input.slides.find((slide) => slide.id === a.slideId)?.index ?? 0;
      const bi = input.slides.find((slide) => slide.id === b.slideId)?.index ?? 0;
      return ai - bi;
    });
    const outputPath = path.join(jobDir, "result.pptx");
    await buildPptxFromImages({
      deckTitle: input.deckTitle,
      images: input.slides.map((slide) => {
        const image = sortedImages.find((item) => item.slideId === slide.id);
        return image ? { ...image, title: slide.title } : { slideId: slide.id, title: slide.title, failed: true };
      }),
      outputPath,
    });

    job.downloadUrl = `${basePath}/api/ppt/jobs/${job.id}/download`;
    job.status = job.slides.every((slide) => slide.status === "done") ? "done" : "partial";
    if (job.status === "partial") job.error = "部分页面生成失败，已用占位页打包。";
    await persistJob(job);
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "生成失败";
    await persistJob(job);
  }
}

async function generateSlideWithRetry(params: {
  job: PptJob;
  slide: JobCreateInput["slides"][number];
  bible: ReturnType<typeof createStyleBible>;
  jobDir: string;
  templateReference?: string;
}) {
  const slideJob = params.job.slides.find((item) => item.slideId === params.slide.id);
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      markSlide(params.job, params.slide.id, attempt === 0 ? "generating" : "retrying");
      if (slideJob) slideJob.retryCount = attempt;
      await persistJob(params.job);

      const suffix = attempt === 0 ? "" : `-retry-${attempt}`;
      const outputPath = path.join(params.jobDir, `slide-${String(params.slide.index).padStart(2, "0")}${suffix}.png`);
      const result = await generateSlideImage({
        slide: params.slide,
        styleBible: params.bible,
        outputPath,
        templateReference: params.templateReference,
      });
      const candidate: SlideImageCandidate = {
        index: slideJob?.candidates?.length ?? 0,
        imagePath: outputPath,
        imageUrl: `${basePath}/api/ppt/jobs/${params.job.id}/images/${params.slide.id}`,
        prompt: result.prompt,
        revisedPrompt: result.revisedPrompt,
        selected: true,
      };
      if (slideJob) {
        slideJob.candidates = [...(slideJob.candidates ?? []).map((item) => ({ ...item, selected: false })), candidate];
        slideJob.prompt = result.prompt;
        slideJob.revisedPrompt = result.revisedPrompt;
        slideJob.selectedCandidateIndex = candidate.index;
      }
      markSlide(params.job, params.slide.id, "done", outputPath);
      await persistJob(params.job);
      return { slideId: params.slide.id, path: outputPath };
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) await wait(1000 * (attempt + 1));
    }
  }

  markSlide(params.job, params.slide.id, "failed");
  if (slideJob) {
    slideJob.error = lastError instanceof Error ? lastError.message : "生成失败";
    slideJob.candidates = [...(slideJob.candidates ?? []), {
      index: slideJob.candidates?.length ?? 0,
      imagePath: "",
      prompt: slideJob.prompt ?? "",
      selected: false,
      error: slideJob.error,
    }];
  }
  await persistJob(params.job);
  return undefined;
}

function markSlide(job: PptJob, slideId: string, status: SlideJobStatus, imagePath?: string) {
  const slide = job.slides.find((item) => item.slideId === slideId);
  if (!slide) return;
  slide.status = status;
  if (imagePath) {
    slide.imagePath = imagePath;
    slide.imageUrl = `${basePath}/api/ppt/jobs/${job.id}/images/${slideId}`;
    slide.error = undefined;
  }
  job.completedSlides = job.slides.filter((item) => item.status === "done").length;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
