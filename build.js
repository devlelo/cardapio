const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const out = path.join(root, "dist");

async function main() {
  const { build } = await import("vite");
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  for (const file of ["index.html", "style.css", "app.js", "books.js"]) {
    fs.copyFileSync(path.join(root, file), path.join(out, file));
  }

  const standaloneSource = path.join(root, "maker/standalone");
  const standaloneOut = path.join(out, "maker/standalone");
  fs.mkdirSync(standaloneOut, { recursive: true });
  fs.cpSync(standaloneSource, standaloneOut, { recursive: true });
  fs.copyFileSync(path.join(root, "maker/vendor/sdflip/sdflip.min.js"), path.join(standaloneOut, "sdflip.min.js"));
  fs.copyFileSync(path.join(root, "maker/vendor/sdflip/sdflip.min.css"), path.join(standaloneOut, "sdflip.min.css"));
  fs.copyFileSync(path.join(root, "maker/vendor/sdflip/LICENSE"), path.join(standaloneOut, "LICENSE-SdFlip"));
  const pdfjsBuild = path.join(root, "node_modules/pdfjs-dist/build");
  fs.copyFileSync(path.join(pdfjsBuild, "pdf.mjs"), path.join(standaloneOut, "pdf.mjs"));
  fs.copyFileSync(path.join(pdfjsBuild, "pdf.worker.min.mjs"), path.join(standaloneOut, "pdf.worker.min.mjs"));
  const pdfjsLicense = path.join(root, "node_modules/pdfjs-dist", "LICENSE");
  if (fs.existsSync(pdfjsLicense)) fs.copyFileSync(pdfjsLicense, path.join(standaloneOut, "LICENSE-PDFjs"));

  const dflip = path.join(root, "dflip");
  if (fs.existsSync(dflip)) fs.cpSync(dflip, path.join(out, "dflip"), { recursive: true });

  await build({ configFile: path.join(root, "maker/vite.config.js") });

  console.log("Build concluído: leitor existente + Maker em /maker/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
