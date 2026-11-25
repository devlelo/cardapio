import * as pdfjsLib from "./pdf.mjs";

const status = document.getElementById("readerStatus");
const fileInput = document.getElementById("pdfFile");

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("./pdf.worker.min.mjs", import.meta.url).href;
pdfjsLib.GlobalWorkerOptions.isEvalSupported = false;
window.pdfjsLib = pdfjsLib;
window.SdFlipConfig = {
  pdfjs: "",
  pdfjsWorker: new URL("./pdf.worker.min.mjs", import.meta.url).href
};

function loadEngine() {
  return new Promise((resolve, reject) => {
    if (window.SdFlip) return resolve(window.SdFlip);
    const script = document.createElement("script");
    script.src = new URL("./sdflip.min.js", import.meta.url).href;
    script.onload = () => window.SdFlip ? resolve(window.SdFlip) : reject(new Error("Motor de viragem não carregou."));
    script.onerror = () => reject(new Error("Não foi possível carregar o motor de viragem."));
    document.head.appendChild(script);
  });
}

async function openBook(source, title) {
  status.textContent = "A preparar o livro…";
  try {
    const engine = await loadEngine();
    engine.open({
      source,
      title: title || "Catálogo",
      layout: "auto",
      links: true,
      fullscreen: true,
      print: true,
      download: true,
      thumbs: true,
      outline: true,
      search: true,
      sound: true,
      duration: 850,
      lang: "pt",
      onReady: () => { status.textContent = ""; },
      onError: (error) => {
        status.textContent = "Não foi possível abrir o PDF: " + (error?.message || "erro desconhecido");
      }
    });
  } catch (error) {
    status.textContent = error.message || "Erro ao abrir o livro.";
    console.error(error);
  }
}

async function start() {
  const params = new URLSearchParams(location.search);
  const pdfPath = params.get("pdf") || "./book.pdf";
  const title = params.get("title") || document.title;
  try {
    status.textContent = "A carregar o catálogo…";
    const response = await fetch(pdfPath);
    if (!response.ok) throw new Error("PDF não encontrado (" + response.status + ").");
    const bytes = new Uint8Array(await response.arrayBuffer());
    await openBook(bytes, title);
  } catch (error) {
    status.textContent = "Escolhe o PDF para abrir o flipbook. " + error.message;
    document.getElementById("uploadPanel").hidden = false;
  }
}

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (file) await openBook(file, file.name.replace(/\\.pdf$/i, ""));
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(console.warn));
}
start();
