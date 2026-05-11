import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { extractAttachmentText } from "@/lib/attachments";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);
    const results = await Promise.all(files.map(async (file) => {
      const text = await extractAttachmentText(file);
      return {
        id: nanoid(10),
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        text,
        extractedTextPreview: text.slice(0, 240),
      };
    }));
    return NextResponse.json({ files: results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "附件读取失败。" }, { status: 400 });
  }
}
