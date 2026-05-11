import { writeFile } from "node:fs/promises";
import type { SlidePlan } from "./schemas";
import { buildSlideImagePrompt, type DeckStyleBible } from "./prompts";

export async function generateSlideImage(params: {
  slide: SlidePlan;
  styleBible: DeckStyleBible;
  outputPath: string;
  seed?: number;
}) {
  const prompt = buildSlideImagePrompt(params.slide, params.styleBible);
  const imageBuffer = await callImage2({ prompt, seed: params.seed });
  await writeFile(params.outputPath, imageBuffer);
  return params.outputPath;
}

async function callImage2(params: { prompt: string; seed?: number }) {
  const apiKey = process.env.IMAGE2_API_KEY;
  const baseUrl = process.env.IMAGE2_API_BASE_URL;
  const model = process.env.IMAGE2_MODEL ?? "gpt-image-1";

  if (!apiKey || !baseUrl) {
    throw new Error("image2 未配置：需要 IMAGE2_API_KEY 和 IMAGE2_API_BASE_URL。");
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/v1/images/generations`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt: params.prompt,
      n: 1,
      size: "1792x1024",
      response_format: "b64_json",
      seed: params.seed,
    }),
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok) {
    const detail = contentType.includes("application/json") ? JSON.stringify(await response.json()) : await response.text();
    throw new Error(`image2 调用失败：${response.status} ${detail.slice(0, 300)}`);
  }

  const rawBody = await response.text();
  if (contentType.includes("image/")) {
    return Buffer.from(rawBody, "binary");
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawBody);
  } catch {
    throw new Error(`image2 响应不是合法 JSON（content-type: ${contentType}，body 前200字: ${rawBody.slice(0, 200)}）`);
  }

  const first = (data?.data as unknown[])?.[0] as Record<string, unknown> | undefined;
  const base64 = first?.b64_json ?? first?.image_base64 ?? data?.b64_json ?? data?.image_base64;
  if (typeof base64 === "string" && base64.length > 100) return Buffer.from(base64, "base64");

  const imageUrl = first?.url ?? first?.image_url ?? data?.url;
  if (typeof imageUrl === "string" && imageUrl.startsWith("http")) {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`image2 图片下载失败：${imageResponse.status}`);
    return Buffer.from(await imageResponse.arrayBuffer());
  }

  throw new Error(`image2 响应里没有图片数据。keys: ${JSON.stringify(Object.keys(data))}, first keys: ${first ? JSON.stringify(Object.keys(first)) : "null"}`);
}
