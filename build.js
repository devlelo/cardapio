const fs = require("fs");
const path = require("path");

const root = process.cwd();
const out = path.join(root, "dist");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of ["index.html", "style.css", "app.js", "books.js"]) {
  fs.copyFileSync(path.join(root, file), path.join(out, file));
}

// DearFlip's official distribution folder is added by the project owner.
// Keep its original internal structure so its relative assets continue working.
const dflip = path.join(root, "dflip");
if (fs.existsSync(dflip)) {
  fs.cpSync(dflip, path.join(out, "dflip"), { recursive: true });
}

console.log("Cardápio build concluído.");
console.log("DearFlip assets:", fs.existsSync(dflip) ? "encontrados" : "em falta — adicionar pasta dflip/");
