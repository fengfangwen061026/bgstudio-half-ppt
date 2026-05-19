import { NextResponse } from "next/server";
import { generateOutline } from "@/lib/outline";
import { outlineInputSchema, outlineSchema, type DeckOutline, type SlidePlan } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = outlineInputSchema.parse(body);
    const outline = await generateOutline(input);
    const parsed = normalizeDensityBudgets(outlineSchema.parse(outline));
    if (parsed.slides.length !== parsed.pageCount) {
      return NextResponse.json({ error: "大纲页数没有对齐。" }, { status: 500 });
    }
    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "大纲生成失败。" }, { status: 400 });
  }
}

function normalizeDensityBudgets(outline: DeckOutline): DeckOutline {
  return {
    ...outline,
    slides: outline.slides.map((slide) => slide.densityPlan ? { ...slide, densityPlan: densityBudget(slide.densityPlan) } : slide),
  };
}

function densityBudget(plan: NonNullable<SlidePlan["densityPlan"]>): NonNullable<SlidePlan["densityPlan"]> {
  if (plan.textDensity === "low") return { ...plan, visibleLabelCount: 2, labelMaxChars: 8 };
  if (plan.textDensity === "medium") return { ...plan, visibleLabelCount: 6, labelMaxChars: 16 };
  return { ...plan, visibleLabelCount: 10, labelMaxChars: 22 };
}
