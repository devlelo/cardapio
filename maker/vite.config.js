const path = require("node:path");
module.exports = {
  root: path.resolve(__dirname),
  base: "./",
  build: {
    outDir: path.resolve(__dirname, "../dist/maker"),
    emptyOutDir: false,
    assetsDir: "assets",
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
      output: { entryFileNames: "assets/editor-[hash].js", chunkFileNames: "assets/chunk-[hash].js", assetFileNames: "assets/[name]-[hash][extname]" }
    }
  }
};
