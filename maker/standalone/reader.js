const status = document.getElementById("readerStatus");
const fileInput = document.getElementById("pdfFile");
const uploadPanel = document.getElementById("uploadPanel");
const uploadMessage = document.getElementById("uploadMessage");
const bookElement = document.getElementById("book");
const titleElement = document.getElementById("readerTitle");
const params = new URLSearchParams(location.search);
const title = params.get("title") || "Catálogo digital";
const source = params.get("pdf") || "./book.pdf";

document.title = title + " — Catálogo digital";
titleElement.textContent = title;

let book = null;
let enginePromise;

function loadEngine() {
  if (window.Pdflip) return Promise.resolve(window.Pdflip);
  if (enginePromise) return enginePromise;
  enginePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "./pdflip/pdflip.global.js";
    script.onload = () => window.Pdflip ? resolve(window.Pdflip) : reject(new Error("O motor pdflip não foi carregado."));
    script.onerror = () => reject(new Error("Não foi possível carregar o motor pdflip."));
    document.head.appendChild(script);
  });
  return enginePromise;
}

async function openBook(pdfSource) {
  status.hidden = false;
  status.textContent = "A preparar as páginas do catálogo…";
  uploadPanel.hidden = true;
  try {
    const engine = await loadEngine();
    const response = await fetch(pdfSource);
    if (!response.ok) throw new Error("PDF não encontrado (" + response.status + ").");
    const bytes = new Uint8Array(await response.arrayBuffer());

    if (book) book.destroy();
    book = new engine.Flipbook(bookElement, {
      source: bytes,
      pageMode: "auto",
      flipStyle: "soft",
      duration: 760,
      controls: ["first", "prev", "pageNumber", "next", "last", "thumbnails", "outline", "search", "zoomIn", "zoomOut", "pageMode", "fullscreen"],
      controlsPosition: "bottom",
      links: true,
      linkTarget: "_blank",
      textLayer: true,
      lazy: false,
      prefetch: false,
      sound: false,
      download: false,
      background: "transparent"
    });

    await book.ready;
    status.hidden = true;
  } catch (error) {
    console.error(error);
    status.hidden = true;
    uploadMessage.textContent = error.message || "O documento não pôde ser aberto.";
    uploadPanel.hidden = false;
  }
}

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (file) await openBook(URL.createObjectURL(file));
});

async function boot() {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    try {
      await navigator.serviceWorker.register("./sw.js");
      await navigator.serviceWorker.ready;
    } catch (error) {
      console.warn("Cache offline indisponível:", error);
    }
  }
  await openBook(source);
}

boot();