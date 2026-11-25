import assert from "node:assert/strict";
import { PDFDocument, PDFName } from "pdf-lib";
import { createPdfWithLinks } from "../maker/src/pdf-links.mjs";

const original = await PDFDocument.create();
original.addPage([600, 800]);
const originalBytes = await original.save();

const outputBytes = await createPdfWithLinks(originalBytes, [{
  source: "custom",
  page: 1,
  x: 0.1,
  y: 0.2,
  w: 0.4,
  h: 0.1,
  url: "https://wa.me/244923000000"
}]);

const output = await PDFDocument.load(outputBytes);
const annotations = output.getPage(0).node.Annots();
assert.ok(annotations, "PDF page should contain link annotations");
assert.equal(annotations.size(), 1, "one custom link annotation should be written");

const annotation = output.context.lookup(annotations.get(0));
const action = annotation.lookup(PDFName.of("A"));
const uri = action.lookup(PDFName.of("URI"));
assert.equal(uri.decodeText(), "https://wa.me/244923000000");
console.log("PDF link annotation test passed.");
