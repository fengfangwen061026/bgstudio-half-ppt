import mammoth from "mammoth";

export async function extractAttachmentText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  const maxChars = 20000;

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return buffer.toString("utf8").slice(0, maxChars);
  }

  if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.slice(0, maxChars);
  }

  if (name.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return String(result.text ?? "").slice(0, maxChars);
  }

  throw new Error("暂时只支持 txt、md、pdf、docx。");
}
