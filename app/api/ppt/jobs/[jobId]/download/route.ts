import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const filePath = path.join(process.cwd(), ".storage", "jobs", jobId, "result.pptx");

  try {
    await access(filePath);
  } catch {
    return NextResponse.json({ error: "PPT 还没生成好。" }, { status: 404 });
  }

  const file = await readFile(filePath);
  return new NextResponse(file, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent("半个PPT.pptx")}`,
    },
  });
}
