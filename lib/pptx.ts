import pptxgen from "pptxgenjs";

export async function buildPptxFromImages(params: {
  deckTitle: string;
  images: Array<{ slideId: string; path: string }>;
  outputPath: string;
}) {
  const pptx = new pptxgen();
  pptx.author = "Half Studio";
  pptx.company = "Half Studio";
  pptx.subject = params.deckTitle;
  pptx.title = params.deckTitle;
  pptx.layout = "LAYOUT_WIDE";
  pptx.defineLayout({ name: "HALF_WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "HALF_WIDE";

  for (const image of params.images) {
    const slide = pptx.addSlide();
    slide.background = { color: "F7F1E8" };
    slide.addImage({ path: image.path, x: 0, y: 0, w: 13.333, h: 7.5 });
  }

  await pptx.writeFile({ fileName: params.outputPath });
  return params.outputPath;
}
