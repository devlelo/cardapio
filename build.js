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

  // Vendor the complete pdflip runtime, including PDF.js workers, CMaps and WASM.
  const pdflipDist = path.join(root, "node_modules/@wapplersystems/pdflip/dist");
  if (!fs.existsSync(pdflipDist)) throw new Error("Runtime pdflip não encontrado. Executa npm install.");
  const pdflipOut = path.join(standaloneOut, "pdflip");
  fs.cpSync(pdflipDist, pdflipOut, { recursive: true });
  const pdflipLicense = path.join(root, "node_modules/@wapplersystems/pdflip/LICENSE");
  if (fs.existsSync(pdflipLicense)) fs.copyFileSync(pdflipLicense, path.join(standaloneOut, "LICENSE-pdflip"));

  const runtimeAssets = [];
  function collectRuntimeAssets(directory, prefix = "") {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const relative = prefix ? prefix + "/" + entry.name : entry.name;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) collectRuntimeAssets(absolute, relative);
      else if (!/\.(map|d\.ts)$/.test(entry.name)) runtimeAssets.push(relative);
    }
  }
  collectRuntimeAssets(pdflipOut);
  fs.writeFileSync(path.join(standaloneOut, "pdflip-assets.json"), JSON.stringify(runtimeAssets, null, 2));

  const dflip = path.join(root, "dflip");
  if (fs.existsSync(dflip)) fs.cpSync(dflip, path.join(out, "dflip"), { recursive: true });

  await build({ configFile: path.join(root, "maker/vite.config.js") });

  console.log("Build concluído: leitor pdflip + Maker em /maker/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
