(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const slug = decodeURIComponent(location.pathname).replace(/^\/+|\/+$/g, "");

  function state(id) {
    ["loading","error","empty","flipbook-area","drive-fallback"].forEach((key) => $(key).classList.add("hidden"));
    if (id) $(id).classList.remove("hidden");
  }

  function driveInfo(value) {
    const url = String(value || "").trim();
    const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*?id=)([a-zA-Z0-9_-]+)/);
    if (!match) return { pdfUrl: url, isDrive: false };
    const id = match[1];
    return {
      pdfUrl: "https://drive.google.com/uc?export=download&id=" + id,
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
      script.onerror = () => reject(new Error("Não foi possível carregar uma biblioteca do flipbook."));
      document.head.appendChild(script);
    });
  }

  function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
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
        throw new Error("As bibliotecas PDF.js ou PageFlip não ficaram disponíveis.");
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
      host.innerHTML = "";
      const pages = [];
      const pageWidth = 900;
      const pageHeight = 1200;

      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
        const pdfPage = await pdf.getPage(pageNo);
        const original = pdfPage.getViewport({ scale: 1 });
        const scale = Math.min(pageWidth / original.width, pageHeight / original.height);
        const viewport = pdfPage.getViewport({ scale });
        const page = document.createElement("div");
        page.className = "page";
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        page.appendChild(canvas);
        await pdfPage.render({ canvasContext: context, viewport }).promise;
        host.appendChild(page);
        pages.push(page);
      }

      // O PageFlip tem de medir um contentor visível. Inicializá-lo escondido
      // fazia o motor calcular dimensões zero e impedia o efeito de virar páginas.
      state("flipbook-area");
      await nextFrame();

      const pageFlip = new window.St.PageFlip(host, {
        width: pageWidth,
        height: pageHeight,
        size: "stretch",
        minWidth: 280,
        maxWidth: 1400,
        minHeight: 380,
        maxHeight: 1800,
        maxShadowOpacity: 0.45,
        showCover: true,
        mobileScrollSupport: false,
        usePortrait: true,
        autoSize: true,
        flippingTime: 850,
        useMouseEvents: true
      });

      pageFlip.loadFromHTML(pages);
      $("page-indicator").textContent = "1 / " + pdf.numPages;

      pageFlip.on("flip", (event) => {
        $("page-indicator").textContent = (event.data + 1) + " / " + pdf.numPages;
      });

      $("prev").onclick = () => pageFlip.flipPrev();
      $("next").onclick = () => pageFlip.flipNext();
      $("fullscreen").onclick = async () => {
        const area = $("flipbook-area");
        try {
          if (!document.fullscreenElement) await area.requestFullscreen();
          else await document.exitFullscreen();
          pageFlip.update();
        } catch (error) {
          console.warn("Fullscreen não disponível:", error);
        }
      };

      document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") pageFlip.flipPrev();
        if (event.key === "ArrowRight") pageFlip.flipNext();
      });

      window.addEventListener("resize", () => pageFlip.update());
    } catch (err) {
      console.error("Cardápio flipbook:", err);
      const reason = info.isDrive
        ? "O Google Drive não está a permitir que o leitor aceda ao PDF diretamente (CORS, permissões ou limite de transferência). O efeito flipbook só pode funcionar quando o PDF é entregue ao leitor como ficheiro PDF, não através da pré-visualização do Drive. O endereço do PDF precisa de um alojamento com acesso externo e suporte a CORS."
        : "Não foi possível carregar o PDF. Confirma se o link é público e permite acesso direto ao ficheiro.";
      showError(reason);
    }
  }

  start();
})();
