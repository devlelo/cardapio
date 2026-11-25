const path = require("node:path");
module.exports = {
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "../dist/maker"),
    emptyOutDir: false,
    lib: { entry: path.resolve(__dirname, "src/runtime.js"), name: "FlipbookRuntime", formats: ["iife"], fileName: () => "runtime.js" },
    rollupOptions: { output: { inlineDynamicImports: true } }
  }
};
