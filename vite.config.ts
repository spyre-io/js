import dts from "vite-plugin-dts";
import path from "path";
import react from "@vitejs/plugin-react";
import {defineConfig, UserConfig} from "vite";

export default defineConfig({
  base: "./",
  logLevel: "error",
  plugins: [dts({rollupTypes: true}), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "becky",
      formats: ["es", "cjs", "umd", "iife"],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "thirdweb"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          thirdweb: "Thirdweb",
        },
      },
    },
  },
} satisfies UserConfig);
