(() => {
  "use strict";

  const show = (id) => document.getElementById(id).classList.remove("hidden");
  const hide = (id) => document.getElementById(id).classList.add("hidden");
  const slug = decodeURIComponent(location.pathname).replace(/^\/+|\/+$/g, "");

  function driveDirectUrl(value) {
    const url = String(value || "").trim();
    const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*?id=)([a-zA-Z0-9_-]+)/);
    if (match) return "https://drive.google.com/uc?export=download&id=" + match[1];
    return url;
  }

  function error(message) {
    hide("loading");
    hide("book-shell");
    document.getElementById("error-message").textContent = message;
    show("error");
  }

  function start() {
    if (!slug) {
      hide("loading");
      show("empty");
      return;
    }

    const book = window.CARDAPIO_BOOKS && window.CARDAPIO_BOOKS[slug];
    if (!book || !book.url || book.url.includes("COLOCA_AQUI")) {
      error("Este link não está configurado. Verifica o ficheiro books.js.");
      return;
    }

    const source = driveDirectUrl(book.url);
    const flipbook = document.getElementById("book_pdf");

    document.title = (book.title || "Ebook") + " — Cardápio";
    window.option_book_pdf = {
      source,
      webgl: true,
      height: "100%",
      showDownloadControl: false,
      showPrintControl: false,
      showSearchControl: false,
      autoEnableThumbnail: false,
      autoEnableOutline: false,
      backgroundColor: "#101010",
      forceFit: true
    };

    flipbook.setAttribute("source", source);

    // DearFlip/jQuery initialize after these scripts are loaded.
    window.addEventListener("load", () => {
      window.setTimeout(() => {
        hide("loading");
        show("book-shell");
        if (!window.DFLIP || !window.jQuery) {
          error("Faltam os ficheiros do DearFlip. Adiciona a pasta oficial dflip/ ao repositório.");
          return;
        }
      }, 900);
    }, { once: true });
  }

  start();
})();
