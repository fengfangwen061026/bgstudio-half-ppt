import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = await getJob(jobId);
  if (!job) return NextResponse.json({ error: "任务不存在。" }, { status: 404 });
  return NextResponse.json(job);
}
