import { readFile, writeFile } from "node:fs/promises";
import type { SlidePlan } from "./schemas";
import { buildSlideImagePrompt, buildTemplatePrompt, type DeckStyleBible } from "./prompts";

export async function generateTemplate(params: {
  styleBible: DeckStyleBible;
  outputPath: string;
}): Promise<string> {
  const prompt = buildTemplatePrompt(params.styleBible);
  const result = await callImage2Generate({ prompt });
  await writeFile(params.outputPath, result.imageBuffer);
  return params.outputPath;
}

export async function generateSlideImage(params: {
  slide: SlidePlan;
  styleBible: DeckStyleBible;
  outputPath: string;
  templatePath: string;
}): Promise<{ path: string }> {
  const prompt = buildSlideImagePrompt(params.slide, params.styleBible);
  const result = await callImage2Edit({ prompt, referenceImagePath: params.templatePath });
  await writeFile(params.outputPath, result.imageBuffer);
  return { path: params.outputPath };
}

type Image2Result = { imageBuffer: Buffer; revisedPrompt?: string };

async function callImage2Generate(params: { prompt: string }): Promise<Image2Result> {
  const { apiKey, baseUrl, model } = getConfig();
  const endpoint = `${baseUrl}/v1/images/generations`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      prompt: params.prompt,
      n: 1,
      size: "1792x1024",
      response_format: "b64_json",
    }),
  });

  return parseResponse(response);
}

async function callImage2Edit(params: { prompt: string; referenceImagePath: string }): Promise<Image2Result> {
  const { apiKey, baseUrl, model } = getConfig();
  const endpoint = `${baseUrl}/v1/images/edits`;
  const imageData = await readFile(params.referenceImagePath);

  const formData = new FormData();
  formData.append("model", model);
  formData.append("prompt", params.prompt);
  formData.append("size", "1792x1024");
  formData.append("image", new Blob([imageData], { type: "image/png" }), "template.png");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  return parseResponse(response);
}

function getConfig() {
  const apiKey = process.env.IMAGE2_API_KEY;
  const baseUrl = process.env.IMAGE2_API_BASE_URL?.replace(/\/$/, "");
  const model = process.env.IMAGE2_MODEL ?? "gpt-image-2";
  if (!apiKey || !baseUrl) throw new Error("image2 未配置：需要 IMAGE2_API_KEY 和 IMAGE2_API_BASE_URL。");
  return { apiKey, baseUrl, model };
}

async function parseResponse(response: Response): Promise<Image2Result> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok) {
    const detail = contentType.includes("application/json") ? JSON.stringify(await response.json()) : await response.text();
    throw new Error(`image2 调用失败：${response.status} ${detail.slice(0, 300)}`);
  }

  const rawBody = await response.text();
  if (contentType.includes("image/")) {
    return { imageBuffer: Buffer.from(rawBody, "binary") };
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawBody);
  } catch {
    throw new Error(`image2 响应不是合法 JSON（content-type: ${contentType}，body 前200字: ${rawBody.slice(0, 200)}）`);
  }

  const first = (data?.data as unknown[])?.[0] as Record<string, unknown> | undefined;
  const revisedPrompt = typeof first?.revised_prompt === "string" ? first.revised_prompt : undefined;
  const base64 = first?.b64_json ?? first?.image_base64 ?? data?.b64_json ?? data?.image_base64;

  if (typeof base64 === "string" && base64.length > 100) {
    return { imageBuffer: Buffer.from(base64, "base64"), revisedPrompt };
  }

  const imageUrl = first?.url ?? first?.image_url ?? data?.url;
  if (typeof imageUrl === "string" && imageUrl.startsWith("http")) {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`image2 图片下载失败：${imageResponse.status}`);
    return { imageBuffer: Buffer.from(await imageResponse.arrayBuffer()), revisedPrompt };
  }

  throw new Error(`image2 响应里没有图片数据。keys: ${JSON.stringify(Object.keys(data))}, first keys: ${first ? JSON.stringify(Object.keys(first)) : "null"}`);
}
