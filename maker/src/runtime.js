import { PageFlip } from "page-flip";

function installPageFlipStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .stf__parent{position:relative;display:block;box-sizing:border-box;transform:translateZ(0);touch-action:pan-y}
    .sft__wrapper{position:relative;width:100%;box-sizing:border-box}
    .stf__parent canvas{position:absolute;width:100%;height:100%;left:0;top:0}
    .stf__block{position:absolute;width:100%;height:100%;box-sizing:border-box;perspective:2000px}
    .stf__item{display:none;position:absolute;transform-style:preserve-3d}
    .stf__outerShadow,.stf__innerShadow,.stf__hardShadow,.stf__hardInnerShadow{position:absolute;left:0;top:0}
    .page{position:relative;width:100%;height:100%;overflow:hidden;background:#fff}
    .page>img{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;user-select:none;-webkit-user-drag:none}
    .hotspot{position:absolute;display:block;z-index:5;background:transparent;cursor:pointer}
    .hotspot:focus-visible{outline:3px solid #f5c542;outline-offset:1px}
    .hotspot:hover{background:#ffffff20}
  `;
  document.head.appendChild(style);
}

function start() {
  installPageFlipStyles();
  const data = window.FLIPBOOK_DATA;
  const host = document.getElementById("book");
  const count = document.getElementById("count");
  if (!data || !Array.isArray(data.pages) || !data.pages.length || !host) {
    host && (host.textContent = "Este flipbook não contém páginas.");
    return;
  }

  host.innerHTML = "";
  data.pages.forEach((page, index) => {
    const section = document.createElement("div");
    section.className = "page";
    section.dataset.page = String(index + 1);

    const image = document.createElement("img");
    image.src = page.image;
    image.alt = "Página " + (index + 1);
    image.draggable = false;
    section.appendChild(image);

    (page.links || []).forEach((link) => {
      const anchor = document.createElement("a");
      anchor.className = "hotspot";
      anchor.href = link.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.setAttribute("aria-label", link.label || "Abrir ligação");
      anchor.title = link.label || "Abrir ligação";
      anchor.style.left = (link.x * 100) + "%";
      anchor.style.top = (link.y * 100) + "%";
      anchor.style.width = (link.w * 100) + "%";
      anchor.style.height = (link.h * 100) + "%";
      anchor.addEventListener("pointerdown", (event) => event.stopPropagation());
      anchor.addEventListener("click", (event) => event.stopPropagation());
      section.appendChild(anchor);
    });
    host.appendChild(section);
  });

  const first = data.pages[0];
  const width = Math.max(280, Math.round(first.width));
  const height = Math.max(380, Math.round(first.height));
  const flip = new PageFlip(host, {
    width,
    height,
    size: "stretch",
    minWidth: 260,
    maxWidth: 1800,
    minHeight: 360,
    maxHeight: 2200,
    maxShadowOpacity: 0.42,
    showCover: true,
    usePortrait: true,
    autoSize: true,
    mobileScrollSupport: false,
    clickEventForward: true,
    flippingTime: 850,
    useMouseEvents: true,
    startPage: 0
  });
  flip.loadFromHTML(host.querySelectorAll(".page"));

  const updateCount = (index = 0) => {
    const page = Math.max(1, Math.min(data.pages.length, index + 1));
    count.textContent = page + " / " + data.pages.length;
  };
  updateCount();
  flip.on("flip", (event) => updateCount(event.data));

  document.getElementById("prev")?.addEventListener("click", () => flip.flipPrev());
  document.getElementById("next")?.addEventListener("click", () => flip.flipNext());
  document.getElementById("full")?.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
      flip.update();
    } catch (error) { console.warn("Ecrã inteiro indisponível", error); }
  });
  window.addEventListener("resize", () => flip.update());
}

window.FlipbookRuntime = { start };
