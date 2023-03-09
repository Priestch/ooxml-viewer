import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";

const alias = {
  "@tauri-apps/api/dialog": "@tauri-apps/api/dialog",
  "@tauri-apps/api/fs": "@tauri-apps/api/fs",
  "@tauri-apps/api/path": "@tauri-apps/api/path",
};

if (!process.env.TAURI_PLATFORM) {
  alias["@tauri-apps/api/dialog"] = resolve(__dirname, "./src/fake-tauri-apps.js");
  alias["@tauri-apps/api/fs"] = resolve(__dirname, "./src/fake-tauri-apps.js");
  alias["@tauri-apps/api/path"] = resolve(__dirname, "./src/fake-tauri-apps.js");
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  // prevent vite from obscuring rust errors
  clearScreen: false,
  // tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
  },
  resolve: {
    alias,
  },
  // to make use of `TAURI_DEBUG` and other env variables
  // https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    // Tauri supports es2021
    target: process.env.TAURI_PLATFORM == "windows" ? "chrome105" : "safari13",
    // don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
