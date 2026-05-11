import { NextResponse } from "next/server";
import { generateOutline } from "@/lib/outline";
import { outlineInputSchema, outlineSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = outlineInputSchema.parse(body);
    const outline = await generateOutline(input);
    const parsed = outlineSchema.parse(outline);
    if (parsed.slides.length !== parsed.pageCount) {
      return NextResponse.json({ error: "大纲页数没有对齐。" }, { status: 500 });
    }
    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "大纲生成失败。" }, { status: 400 });
  }
}
