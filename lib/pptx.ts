import pptxgen from "pptxgenjs";

type PptxImageInput = {
  slideId: string;
  title?: string;
  path?: string;
  failed?: boolean;
};

const slideW = 13.333;
const slideH = 7.5;

export async function buildPptxFromImages(params: {
  deckTitle: string;
  images: PptxImageInput[];
  outputPath: string;
}) {
  const pptx = new pptxgen();
  pptx.author = "Half Studio";
  pptx.company = "Half Studio";
  pptx.subject = params.deckTitle;
  pptx.title = params.deckTitle;
  pptx.layout = "LAYOUT_WIDE";
  pptx.defineLayout({ name: "HALF_WIDE", width: slideW, height: slideH });
  pptx.layout = "HALF_WIDE";

  for (const [index, image] of params.images.entries()) {
    const slide = pptx.addSlide();
    slide.background = { color: "071A33" };
    if (image.path && !image.failed) {
      slide.addImage({ path: image.path, x: 0, y: 0, w: slideW, h: slideH, sizing: { type: "cover", x: 0, y: 0, w: slideW, h: slideH } });
    } else {
      addFailedPlaceholder(slide, image.title ?? `第 ${index + 1} 页`, index + 1);
    }
  }

  await pptx.writeFile({ fileName: params.outputPath });
  return params.outputPath;
}

function addFailedPlaceholder(slide: pptxgen.Slide, title: string, pageNumber: number) {
  slide.addShape("rect", { x: 0.45, y: 0.45, w: slideW - 0.9, h: slideH - 0.9, line: { color: "1F6FEB", transparency: 20 }, fill: { color: "0B1F3A", transparency: 0 } });
  slide.addText("此页图片生成失败", { x: 0.9, y: 2.55, w: slideW - 1.8, h: 0.45, fontFace: "Microsoft YaHei", fontSize: 28, bold: true, color: "FFFFFF", align: "center" });
  slide.addText(title, { x: 1.3, y: 3.2, w: slideW - 2.6, h: 0.4, fontFace: "Microsoft YaHei", fontSize: 16, color: "9CCBFF", align: "center" });
  slide.addText(String(pageNumber).padStart(2, "0"), { x: slideW - 1.05, y: slideH - 0.55, w: 0.5, h: 0.25, fontFace: "Aptos", fontSize: 10, color: "8FBFFF", align: "right" });
}
