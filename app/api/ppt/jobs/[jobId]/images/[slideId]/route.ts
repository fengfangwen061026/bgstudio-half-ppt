import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string; slideId: string }> },
) {
  const { jobId, slideId } = await params;
  const job = await getJob(jobId);
  const slide = job?.slides.find((item) => item.slideId === slideId);
  if (!slide?.imagePath) return NextResponse.json({ error: "图片还没生成好。" }, { status: 404 });

  const file = await readFile(slide.imagePath);
  return new NextResponse(file, {
    headers: {
      "content-type": "image/png",
      "cache-control": "no-store",
    },
  });
}
