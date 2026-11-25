import "./style.css";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import JSZip from "jszip";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";

GlobalWorkerOptions.workerSrc = workerUrl;

const $ = (id) => document.getElementById(id);
const state = { pdf: null, pages: [], links: [], page: 1, zoom: 1, drawing: false, draft: null, addMode: false, fileName: "", file: null };
const els = {
  pdf: $("pdfInput"), drop: $("dropZone"), stage: $("pageStage"), canvas: $("pageCanvas"),
  overlay: $("linkOverlay"), draw: $("drawLayer"), viewport: $("pageViewport"),
  welcome: $("welcome"), busy: $("busy"), dialog: $("linkDialog"), form: $("linkForm"),
  label: $("linkLabel"), url: $("linkUrl"), list: $("linkList")
};

function status(message) { $("statusText").textContent = message; }
function setBusy(on) { els.busy.classList.toggle("hidden", !on); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
function safeUrl(value) {
  try {
    const u = new URL(value);
    return ["https:", "http:", "mailto:", "tel:"].includes(u.protocol) ? u.href : null;
  } catch { return null; }
}
function setControls(enabled) {
  ["exportBtn","previewBtn","addLinkBtn","prevBtn","nextBtn","zoomIn","zoomOut"].forEach((id) => $(id).disabled = !enabled);
}
function updateCounts() {
  $("pageCount").textContent = state.pages.length + (state.pages.length === 1 ? " página" : " páginas");
  $("linkCount").textContent = String(state.links.length);
}
function pageLinks(pageNo) { return state.links.filter((item) => item.page === pageNo); }

function renderLinks() {
  els.overlay.innerHTML = "";
  const current = pageLinks(state.page);
  for (const item of current) {
    const a = document.createElement("a");
    a.className = "link-hotspot";
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.title = item.label;
    a.style.left = item.x * 100 + "%";
    a.style.top = item.y * 100 + "%";
    a.style.width = item.w * 100 + "%";
    a.style.height = item.h * 100 + "%";
    a.innerHTML = '<span>' + escapeHtml(item.label) + '</span>';
    a.addEventListener("click", () => status("A abrir: " + item.label));
    els.overlay.appendChild(a);
  }
  renderLinkList();
}
function renderLinkList() {
  if (!state.links.length) {
    els.list.innerHTML = '<p class="empty-note">Os links adicionados aparecerão aqui.</p>';
    return;
  }
  els.list.innerHTML = "";
  state.links.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "link-row" + (item.page === state.page ? " active" : "");
    const info = document.createElement("button");
    info.className = "link-row-info";
    info.type = "button";
    info.innerHTML = '<b>' + escapeHtml(item.label) + '</b><small>Página ' + item.page + (item.source === "pdf" ? " · PDF" : "") + '</small>';
    info.addEventListener("click", () => showPage(item.page));
    const remove = document.createElement("button");
    remove.className = "link-remove";
    remove.type = "button";
    remove.textContent = "×";
    remove.title = "Remover link";
    remove.addEventListener("click", () => {
      state.links.splice(index, 1);
      updateCounts(); renderLinks();
      status("Link removido.");
    });
    row.append(info, remove);
    els.list.appendChild(row);
  });
}
function showPage(pageNo) {
  if (!state.pages.length) return;
  state.page = Math.max(1, Math.min(state.pages.length, pageNo));
  const page = state.pages[state.page - 1];
  const ctx = els.canvas.getContext("2d");
  els.canvas.width = page.canvas.width;
  els.canvas.height = page.canvas.height;
  ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
  ctx.drawImage(page.canvas, 0, 0);
  els.stage.style.aspectRatio = page.width + " / " + page.height;
  const availableByWidth = Math.max(240, els.viewport.clientWidth - 24);
  const availableByHeight = Math.max(240, els.viewport.clientHeight - 24) * (page.width / page.height);
  els.stage.style.width = Math.min(760 * state.zoom, availableByWidth, availableByHeight) + "px";
  els.stage.style.maxWidth = "100%";
  $("pageIndicator").textContent = state.page + " / " + state.pages.length;
  $("prevBtn").disabled = state.page <= 1;
  $("nextBtn").disabled = state.page >= state.pages.length;
  renderLinks();
}
function addPdfLink(pageNo, rect, url, label) {
  const [x1,y1,x2,y2] = rect;
  const left = Math.min(x1,x2), top = Math.min(y1,y2);
  const width = Math.abs(x2-x1), height = Math.abs(y2-y1);
  if (!url || width <= 0 || height <= 0) return;
  const normalized = safeUrl(url);
  if (!normalized) return;
  state.links.push({ id: crypto.randomUUID(), page: pageNo, x: left, y: top, w: width, h: height, url: normalized, label: label || "Link do PDF", source: "pdf" });
}
async function importPdf(file) {
  if (!file || (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf"))) {
    status("Selecciona um ficheiro PDF válido."); return;
  }
  setBusy(true); setControls(false);
  els.welcome.classList.add("hidden"); els.viewport.classList.add("hidden");
  state.pages = []; state.links = []; state.page = 1; state.fileName = file.name; state.file = file;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocument({ data: bytes, isEvalSupported: false }).promise;
    state.pdf = pdf;
    for (let number = 1; number <= pdf.numPages; number++) {
      const pdfPage = await pdf.getPage(number);
      const baseViewport = pdfPage.getViewport({ scale: 1 });
      const scale = Math.min(1.5, 1500 / Math.max(baseViewport.width, baseViewport.height));
      const viewport = pdfPage.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d", { alpha: false });
      await pdfPage.render({ canvasContext: context, viewport }).promise;
      state.pages.push({ canvas, width: viewport.width, height: viewport.height });
      const annotations = await pdfPage.getAnnotations({ intent: "display" });
      for (const annotation of annotations) {
        if (annotation.subtype !== "Link" || !annotation.url) continue;
        const rect = viewport.convertToViewportRectangle(annotation.rect);
        addPdfLink(number, [rect[0] / viewport.width, rect[1] / viewport.height, rect[2] / viewport.width, rect[3] / viewport.height], annotation.url, "Link do PDF");
      }
    }
    $("documentName").textContent = file.name;
    els.viewport.classList.remove("hidden");
    setControls(true); updateCounts(); showPage(1);
    status("PDF carregado localmente. " + pdf.numPages + " páginas detectadas.");
  } catch (error) {
    console.error(error);
    status("Não foi possível ler este PDF. Confirma se o ficheiro não está protegido por palavra-passe.");
    els.welcome.classList.remove("hidden");
  } finally { setBusy(false); }
}

function startDrawing(event) {
  if (!state.addMode || !state.pages.length) return;
  if (event.target.closest(".link-hotspot")) return;
  event.preventDefault();
  const bounds = els.stage.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
  state.drawing = true;
  state.draft = { x, y, w: 0, h: 0 };
  els.draw.setPointerCapture?.(event.pointerId);
  els.draw.innerHTML = '<div class="draw-rect"></div>';
  updateDraft(event, bounds);
}
function updateDraft(event, bounds) {
  if (!state.drawing || !state.draft) return;
  const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
  const left = Math.min(state.draft.x, x), top = Math.min(state.draft.y, y);
  state.draft.w = Math.abs(x - state.draft.x); state.draft.h = Math.abs(y - state.draft.y);
  const rect = els.draw.firstElementChild;
  if (rect) Object.assign(rect.style, { left:left*100+"%", top:top*100+"%", width:state.draft.w*100+"%", height:state.draft.h*100+"%" });
  state.draft.x = state.draft.x;
  state.draft.left = left; state.draft.top = top;
}
function finishDrawing() {
  if (!state.drawing) return;
  state.drawing = false;
  if (!state.draft || state.draft.w < .008 || state.draft.h < .008) {
    state.draft = null; els.draw.innerHTML = ""; status("Área demasiado pequena. Tenta novamente."); return;
  }
  els.draw.innerHTML = "";
  els.label.value = "Encomendar pelo WhatsApp";
  els.url.value = "https://wa.me/244";
  els.dialog.showModal();
  els.label.focus();
}
function commitLink() {
  if (!state.draft) return false;
  const url = safeUrl(els.url.value.trim());
  if (!url) { status("Introduz um endereço válido, começado por https://, http://, mailto: ou tel:."); return false; }
  state.links.push({
    id: crypto.randomUUID(), page: state.page,
    x: state.draft.left, y: state.draft.top, w: state.draft.w, h: state.draft.h,
    url, label: els.label.value.trim() || "Abrir link", source: "custom"
  });
  state.draft = null; state.addMode = false;
  els.stage.classList.remove("drawing-mode");
  $("addLinkBtn").classList.remove("selected");
  updateCounts(); renderLinks(); status("Link adicionado à página " + state.page + ".");
  return true;
}
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
async function createLinkedPdf() {
  if (!state.file) throw new Error("Importa novamente o PDF antes de exportar.");
  const pdfDoc = await PDFDocument.load(await state.file.arrayBuffer(), { updateMetadata: false });
  for (const item of state.links.filter((link) => link.source === "custom")) {
    const page = pdfDoc.getPage(item.page - 1);
    const { width, height } = page.getSize();
    const rect = [item.x * width, height - (item.y + item.h) * height, (item.x + item.w) * width, height - item.y * height];
    const annotation = pdfDoc.context.obj({
      Type: PDFName.of("Annot"),
      Subtype: PDFName.of("Link"),
      Rect: rect,
      Border: [0, 0, 0],
      A: { Type: PDFName.of("Action"), S: PDFName.of("URI"), URI: PDFString.of(item.url) }
    });
    page.node.addAnnot(pdfDoc.context.register(annotation));
  }
  return new Uint8Array(await pdfDoc.save({ useObjectStreams: false }));
}

async function openPreview() {
  if (!state.file) return;
  const button = $("previewBtn");
  button.disabled = true;
  button.textContent = "A preparar…";
  try {
    const bytes = await createLinkedPdf();
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const title = $("bookTitle").value.trim() || state.fileName.replace(/\.pdf$/i, "");
    const target = "./standalone/index.html?pdf=" + encodeURIComponent(url) + "&title=" + encodeURIComponent(title);
    const opened = window.open(target, "_blank");
    if (!opened) {
      URL.revokeObjectURL(url);
      status("O navegador bloqueou a pré-visualização. Permite abrir separadores para este site.");
    } else {
      status("Pré-visualização aberta.");
      setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
    }
  } catch (error) {
    console.error(error);
    status("Não foi possível preparar a pré-visualização: " + error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Pré-visualizar";
  }
}

async function exportBook() {
  if (!state.file) return;
  const button = $("exportBtn");
  button.disabled = true;
  button.textContent = "A preparar…";
  try {
    const zip = new JSZip();
    const title = $("bookTitle").value.trim() || "Catálogo digital";
    zip.file("book.pdf", await createLinkedPdf());
    const files = ["index.html","reader.js","manifest.webmanifest","sw.js","ATTRIBUTION.md","pdf.mjs","pdf.worker.min.mjs","sdflip.min.js","sdflip.min.css","LICENSE-SdFlip","LICENSE-PDFjs"];
    for (const file of files) {
      const response = await fetch("./standalone/" + file);
      if (!response.ok) throw new Error("Ficheiro de exportação em falta: " + file);
      const content = file === "index.html" ? (await response.text()).replaceAll("Catálogo digital", escapeHtml(title)) : await response.blob();
      zip.file(file, content);
    }
    zip.file("LE-ME.txt", "CATÁLOGO FLIPBOOK\n\n1. Extrai todos os ficheiros para a mesma pasta.\n2. Publica a pasta num alojamento estático HTTPS (por exemplo Vercel).\n3. Abre o endereço no Android e usa Adicionar ao ecrã inicial para instalar como PWA.\n4. Depois da primeira abertura com internet, o leitor e o PDF ficam disponíveis offline, conforme o espaço de armazenamento do navegador.\n\nOs links externos, como WhatsApp, precisam de internet quando forem abertos.\nAbrir index.html por file:// não é suportado para módulos e workers; usa HTTPS/localhost e instala como PWA.\n");
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    const safeName = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "flipbook";
    downloadBlob(blob, safeName + ".zip");
    status("ZIP exportado com leitor SdFlip, PDF e links incorporados.");
  } catch (error) {
    console.error(error);
    status("Falha na exportação: " + error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Exportar ZIP";
  }
}

function createExportHtml(data) {
  const serialized = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="${data.bg}"><title>${escapeHtml(data.title)}</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:${data.bg};font-family:system-ui,sans-serif}.reader{height:100dvh;display:flex;flex-direction:column}.bar{height:52px;flex:none;display:flex;align-items:center;justify-content:center;gap:16px;color:#fff;background:#0003}.bar button{border:0;border-radius:6px;background:#ffffff20;color:#fff;padding:8px 14px;font-size:18px}.count{font-size:13px;min-width:65px;text-align:center}.book-area{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:12px}.flipbook{margin:auto}.page{position:relative;background:white;overflow:hidden}.page img{display:block;width:100%;height:100%;object-fit:fill}.hotspot{position:absolute;display:block;z-index:4;cursor:pointer;background:transparent}.hotspot:focus-visible{outline:3px solid #f5c542;outline-offset:1px}.hotspot:hover{background:#ffffff22}.hint{color:#ffffff80;text-align:center;font-size:11px;padding:4px}@media(max-width:600px){.bar{height:46px}.book-area{padding:6px}}
</style></head><body><main class="reader"><nav class="bar"><button id="prev" aria-label="Página anterior">‹</button><span class="count" id="count"></span><button id="next" aria-label="Página seguinte">›</button><button id="full">⛶</button></nav><section class="book-area"><div id="book" class="flipbook"></div></section><div class="hint">${escapeHtml(data.title)}</div></main>
<script>window.FLIPBOOK_DATA=${serialized};</script><script src="./runtime.js"></script><script>window.FlipbookRuntime.start();</script></body></html>`;
}

$("welcomeUpload").addEventListener("click", () => els.pdf.click());
els.pdf.addEventListener("change", (e) => importPdf(e.target.files?.[0]));
$("resetBtn").addEventListener("click", () => { state.pdf = null; state.file = null; state.pages = []; state.links = []; state.page = 1; els.pdf.value = ""; els.viewport.classList.add("hidden"); els.welcome.classList.remove("hidden"); $("documentName").textContent = "Nenhum PDF importado"; setControls(false); updateCounts(); renderLinkList(); status("Novo projecto pronto."); });
$("addLinkBtn").addEventListener("click", () => { state.addMode = !state.addMode; $("addLinkBtn").classList.toggle("selected", state.addMode); els.stage.classList.toggle("drawing-mode", state.addMode); status(state.addMode ? "Arrasta sobre a página para desenhar a área clicável." : "Modo de seleção desactivado."); });
$("prevBtn").addEventListener("click", () => showPage(state.page - 1));
$("nextBtn").addEventListener("click", () => showPage(state.page + 1));
$("zoomIn").addEventListener("click", () => { state.zoom = Math.min(1.5, state.zoom + .1); $("zoomLabel").textContent = Math.round(state.zoom*100)+"%"; showPage(state.page); });
$("zoomOut").addEventListener("click", () => { state.zoom = Math.max(.6, state.zoom - .1); $("zoomLabel").textContent = Math.round(state.zoom*100)+"%"; showPage(state.page); });
$("exportBtn").addEventListener("click", exportBook);
$("previewBtn").addEventListener("click", openPreview);
$("bookBg").addEventListener("input", (e) => { $("colorValue").textContent = e.target.value.toUpperCase(); });
els.form.addEventListener("submit", (e) => { if (e.submitter?.value === "save") { e.preventDefault(); if (commitLink()) els.dialog.close(); } });
els.dialog.addEventListener("close", () => { state.draft = null; });
els.draw.addEventListener("pointerdown", startDrawing);
els.draw.addEventListener("pointermove", (e) => updateDraft(e, els.stage.getBoundingClientRect()));
els.draw.addEventListener("pointerup", finishDrawing);
els.draw.addEventListener("pointercancel", finishDrawing);
window.addEventListener("resize", () => { if (state.pages.length) showPage(state.page); });
["dragenter","dragover"].forEach((type) => els.drop.addEventListener(type, (e) => { e.preventDefault(); els.drop.classList.add("drag-over"); }));
["dragleave","drop"].forEach((type) => els.drop.addEventListener(type, (e) => { e.preventDefault(); els.drop.classList.remove("drag-over"); }));
els.drop.addEventListener("drop", (e) => importPdf(e.dataTransfer.files?.[0]));
