import { NextResponse } from "next/server";
import { createPptJob } from "@/lib/jobs";
import { jobCreateSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = jobCreateSchema.parse(body);
    const job = await createPptJob(input);
    return NextResponse.json({ jobId: job.id, job });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "任务创建失败。" }, { status: 400 });
  }
}
