(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const slug = decodeURIComponent(location.pathname).replace(/^\\/+|\\/+$/g, "");

  function state(id) {
    ["loading","error","empty","flipbook-area","drive-fallback"].forEach((key) => $(key).classList.add("hidden"));
    if (id) $(id).classList.remove("hidden");
  }

  function driveInfo(value) {
    const url = String(value || "").trim();
    const match = url.match(/drive\\.google\\.com\\/(?:file\\/d\\/|open\\?id=|uc\\?.*?id=)([a-zA-Z0-9_-]+)/);
    if (!match) return { pdfUrl: url, previewUrl: url, isDrive: false };
    const id = match[1];
    return {
      pdfUrl: "https://drive.google.com/uc?export=download&id=" + id,
      previewUrl: "https://drive.google.com/file/d/" + id + "/preview",
      isDrive: true
    };
  }

  function showError(message) {
    $("error-message").textContent = message;
    state("error");
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Não foi possível carregar uma biblioteca necessária."));
      document.head.appendChild(script);
    });
  }

  function fallback(info) {
    if (!info.isDrive) {
      showError("Não foi possível ler o PDF. Confirma se o endereço está público e aponta diretamente para um ficheiro PDF.");
      return;
    }
    $("drive-frame").src = info.previewUrl;
    $("open-drive").href = info.previewUrl;
    state("drive-fallback");
  }

  async function start() {
    if (!slug) {
      state("empty");
      return;
    }

    const book = window.CARDAPIO_BOOKS && window.CARDAPIO_BOOKS[slug];
    if (!book || !book.url || book.url.includes("COLOCA_AQUI")) {
      showError("Este ebook não está configurado no ficheiro books.js.");
      return;
    }

    document.title = (book.title || "Ebook") + " — Cardápio";
    const info = driveInfo(book.url);

    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.min.js");

      if (!window.pdfjsLib || !window.St || !window.St.PageFlip) {
        throw new Error("As bibliotecas do leitor não foram carregadas.");
      }

      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      const pdf = await window.pdfjsLib.getDocument({
        url: info.pdfUrl,
        disableAutoFetch: false,
        disableStream: false,
        rangeChunkSize: 65536
      }).promise;

      const host = $("flipbook");
      const pages = [];
      const width = 900;
      const height = 1200;

      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
        const pdfPage = await pdf.getPage(pageNo);
        const base = pdfPage.getViewport({ scale: 1 });
        const scale = Math.min(width / base.width, height / base.height);
        const viewport = pdfPage.getViewport({ scale });
        const page = document.createElement("div");
        page.className = "page";
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        page.appendChild(canvas);
        await pdfPage.render({ canvasContext: context, viewport }).promise;
        host.appendChild(page);
        pages.push(page);
      }

      const pageFlip = new window.St.PageFlip(host, {
        width,
        height,
        size: "stretch",
        minWidth: 280,
        maxWidth: 1200,
        minHeight: 380,
        maxHeight: 1600,
        maxShadowOpacity: 0.35,
        showCover: true,
        mobileScrollSupport: false,
        usePortrait: true
      });

      pageFlip.loadFromHTML(pages);
      $("page-indicator").textContent = "1 / " + pdf.numPages;
      pageFlip.on("flip", (event) => {
        $("page-indicator").textContent = (event.data + 1) + " / " + pdf.numPages;
      });
      $("prev").addEventListener("click", () => pageFlip.flipPrev());
      $("next").addEventListener("click", () => pageFlip.flipNext());
      $("fullscreen").addEventListener("click", () => {
        const area = $("flipbook-area");
        if (!document.fullscreenElement) area.requestFullscreen?.();
        else document.exitFullscreen?.();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") pageFlip.flipPrev();
        if (event.key === "ArrowRight") pageFlip.flipNext();
      });

      state("flipbook-area");
    } catch (err) {
      console.error("Cardápio reader:", err);
      fallback(info);
    }
  }

  start();
})();
