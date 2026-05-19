import { writeFile } from "node:fs/promises";
import type { SlidePlan } from "./schemas";
import { buildSlideImagePrompt, buildTemplatePrompt, type DeckStyleBible } from "./prompts";

export type Image2Candidate = {
  imageBuffer: Buffer;
  revisedPrompt?: string;
  imageUrl?: string;
  rawMetadata?: unknown;
};

export type Image2Result = {
  candidates: Image2Candidate[];
  rawResponseShape: string;
  prompt: string;
};

export async function generateTemplate(params: {
  styleBible: DeckStyleBible;
  outputPath: string;
}): Promise<{ path: string; prompt: string; revisedPrompt?: string }> {
  const prompt = buildTemplatePrompt(params.styleBible);
  const result = await callImage2({ prompt });
  const candidate = firstCandidate(result);
  await writeFile(params.outputPath, candidate.imageBuffer);
  return { path: params.outputPath, prompt, revisedPrompt: candidate.revisedPrompt };
}

export async function generateSlideImage(params: {
  slide: SlidePlan;
  styleBible: DeckStyleBible;
  outputPath: string;
  templateReference?: string;
  candidateIndex?: number;
}): Promise<{ path: string; prompt: string; revisedPrompt?: string }> {
  const prompt = buildSlideImagePrompt(params.slide, params.styleBible, params.templateReference);
  const result = await callImage2({ prompt });
  const candidate = firstCandidate(result);
  await writeFile(params.outputPath, candidate.imageBuffer);
  return { path: params.outputPath, prompt, revisedPrompt: candidate.revisedPrompt };
}

function firstCandidate(result: Image2Result) {
  const candidate = result.candidates[0];
  if (!candidate) throw new Error("image2 响应里没有可用候选图。");
  return candidate;
}

async function callImage2(params: { prompt: string }): Promise<Image2Result> {
  const { apiKey, baseUrl, model } = getConfig();
  const endpoint = `${baseUrl}/v1/images/generations`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      prompt: params.prompt,
      n: 1,
      size: process.env.IMAGE2_SIZE ?? "1792x1024",
      response_format: process.env.IMAGE2_RESPONSE_FORMAT ?? "b64_json",
    }),
  });

  const parsed = await parseResponse(response);
  return { ...parsed, prompt: params.prompt };
}

function getConfig() {
  const apiKey = process.env.IMAGE2_API_KEY;
  const baseUrl = process.env.IMAGE2_API_BASE_URL?.replace(/\/$/, "");
  const model = process.env.IMAGE2_MODEL ?? "gpt-image-2";
  if (!apiKey || !baseUrl) throw new Error("image2 未配置：需要 IMAGE2_API_KEY 和 IMAGE2_API_BASE_URL。");
  return { apiKey, baseUrl, model };
}

async function parseResponse(response: Response): Promise<Omit<Image2Result, "prompt">> {
  const contentType = response.headers.get("content-type") ?? "";
  const body = Buffer.from(await response.arrayBuffer());

  if (!response.ok) {
    const detail = parseErrorDetail(body, contentType);
    throw new Error(`image2 调用失败：${response.status} ${detail.slice(0, 300)}`);
  }

  if (contentType.includes("image/")) {
    return { candidates: [{ imageBuffer: body }], rawResponseShape: "direct-image" };
  }

  const rawText = body.toString("utf8");
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`image2 响应不是合法 JSON（content-type: ${contentType}，body 前200字: ${rawText.slice(0, 200)}）`);
  }

  const candidates = await collectCandidates(data);
  if (candidates.length > 0) return { candidates, rawResponseShape: describeShape(data) };

  throw new Error(`image2 响应里没有图片数据。keys: ${JSON.stringify(Object.keys(data))}, first keys: ${firstKeys(data)}`);
}

function parseErrorDetail(body: Buffer, contentType: string) {
  const text = body.toString("utf8");
  if (!contentType.includes("application/json")) return text;
  try {
    return JSON.stringify(JSON.parse(text));
  } catch {
    return text;
  }
}

async function collectCandidates(data: Record<string, unknown>): Promise<Image2Candidate[]> {
  const items = Array.isArray(data.data) ? data.data : [data];
  const candidates: Image2Candidate[] = [];

  for (const item of items) {
    if (!isRecord(item)) continue;
    const revisedPrompt = typeof item.revised_prompt === "string" ? item.revised_prompt : undefined;
    const base64 = firstString(item.b64_json, item.image_base64, item.image, item.base64);
    if (base64 && base64.length > 100) {
      candidates.push({ imageBuffer: Buffer.from(stripDataUrl(base64), "base64"), revisedPrompt, rawMetadata: item });
      continue;
    }

    const imageUrl = firstString(item.url, item.image_url);
    if (imageUrl?.startsWith("http")) {
      candidates.push({ imageBuffer: await downloadImage(imageUrl), revisedPrompt, imageUrl, rawMetadata: item });
    }
  }

  const topLevelUrl = firstString(data.url, data.image_url);
  if (candidates.length === 0 && topLevelUrl?.startsWith("http")) {
    candidates.push({ imageBuffer: await downloadImage(topLevelUrl), imageUrl: topLevelUrl, rawMetadata: data });
  }

  return candidates;
}

async function downloadImage(imageUrl: string) {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) throw new Error(`image2 图片下载失败：${imageResponse.status}`);
  return Buffer.from(await imageResponse.arrayBuffer());
}

function stripDataUrl(value: string) {
  const comma = value.indexOf(",");
  return value.startsWith("data:") && comma >= 0 ? value.slice(comma + 1) : value;
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && value.length > 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function describeShape(data: Record<string, unknown>) {
  if (Array.isArray(data.data)) return `data[${data.data.length}]`;
  return `top-level:${Object.keys(data).join(",")}`;
}

function firstKeys(data: Record<string, unknown>) {
  const first = Array.isArray(data.data) ? data.data[0] : undefined;
  return isRecord(first) ? JSON.stringify(Object.keys(first)) : "null";
}
