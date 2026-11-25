import { PDFDocument, PDFName, PDFString } from "pdf-lib";

export async function createPdfWithLinks(sourceBytes, links = []) {
  const pdfDoc = await PDFDocument.load(sourceBytes, { updateMetadata: false });
  for (const item of links.filter((link) => link.source === "custom")) {
    const page = pdfDoc.getPage(item.page - 1);
    const { width, height } = page.getSize();
    const rect = [
      item.x * width,
      height - (item.y + item.h) * height,
      (item.x + item.w) * width,
      height - item.y * height
    ];
    const annotation = pdfDoc.context.obj({
      Type: PDFName.of("Annot"),
      Subtype: PDFName.of("Link"),
      Rect: rect,
      Border: [0, 0, 0],
      A: {
        Type: PDFName.of("Action"),
        S: PDFName.of("URI"),
        URI: PDFString.of(item.url)
      }
    });
    page.node.addAnnot(pdfDoc.context.register(annotation));
  }
  return new Uint8Array(await pdfDoc.save({ useObjectStreams: false }));
}
