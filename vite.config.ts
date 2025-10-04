import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "inline-css",
      enforce: "post",
      generateBundle(_options, bundle) {
        for (const [file, chunk] of Object.entries(bundle)) {
          if (file.endsWith(".html") && chunk.type === "asset") {
            let html = String(chunk.source);
            for (const [cssFile, cssChunk] of Object.entries(bundle)) {
              if (cssFile.endsWith(".css") && cssChunk.type === "asset") {
                html = html.replace(
                  new RegExp(`<link[^>]*href="[./]*${cssFile}"[^>]*>`),
                  `<style>${cssChunk.source}</style>`,
                );
                delete bundle[cssFile];
              }
            }
            chunk.source = html;
          }
        }
      },
    },
    {
      name: "fetch-artifacts",
      async buildStart() {
        const artifactsDir = "public/artifacts";
        const bytecodeUrl =
          "https://raw.githubusercontent.com/MiragePrivacy/escrow/refs/heads/master/artifacts/bytecode.hex";
        const abiUrl =
          "https://raw.githubusercontent.com/MiragePrivacy/escrow/refs/heads/master/out/Escrow.sol/Escrow.json";

        console.log("Fetching artifacts from GitHub...");

        try {
          await mkdir(artifactsDir, { recursive: true });

          // Fetch bytecode
          const bytecodeResponse = await fetch(bytecodeUrl);
          if (!bytecodeResponse.ok) {
            throw new Error(
              `Failed to fetch bytecode: ${bytecodeResponse.statusText}`,
            );
          }
          const bytecode = await bytecodeResponse.text();
          await writeFile(`${artifactsDir}/bytecode.hex`, bytecode);
          console.log("✓ Bytecode downloaded");

          // Fetch ABI
          const abiResponse = await fetch(abiUrl);
          if (!abiResponse.ok) {
            throw new Error(`Failed to fetch ABI: ${abiResponse.statusText}`);
          }
          const abiJson = await abiResponse.json();

          // Extract just the ABI and write as Escrow.json
          const escrowJson = { abi: abiJson.abi };
          await writeFile(
            `${artifactsDir}/Escrow.json`,
            JSON.stringify(escrowJson, null, 2),
          );
          console.log("✓ ABI downloaded");
        } catch (error) {
          console.error("Error fetching artifacts:", error);
          throw error;
        }
      },
    },
    svelte({
      compilerOptions: {
        customElement: false,
      },
    }),
  ],
  build: {
    outDir: "build",
    minify: "esbuild",
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        preset: "smallest",
      },
    },
    chunkSizeWarningLimit: 1024,
  },
  server: {
    fs: {
      allow: [
        // Allow serving files from the project root
        path.resolve(__dirname),
        // Allow serving artifacts from parent directory
        path.resolve(__dirname, "artifacts"),
      ],
    },
  },
  resolve: {
    alias: {
      $lib: path.resolve("./src/lib"),
      crypto: "crypto-browserify",
      stream: "stream-browserify",
      process: "process/browser",
    },
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
});
