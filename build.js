const fs = require("node:fs");
const path = require("node:path");
const { build } = require("vite");

const root = process.cwd();
const out = path.join(root, "dist");

async function main() {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  for (const file of ["index.html", "style.css", "app.js", "books.js"]) {
    fs.copyFileSync(path.join(root, file), path.join(out, file));
  }

  const dflip = path.join(root, "dflip");
  if (fs.existsSync(dflip)) fs.cpSync(dflip, path.join(out, "dflip"), { recursive: true });

  await build({ configFile: path.join(root, "maker/vite.config.js") });
  await build({ configFile: path.join(root, "maker/runtime.config.js") });

  console.log("Build concluído: leitor existente + Maker em /maker/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
