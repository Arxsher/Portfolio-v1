import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { copyFileSync, existsSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: "/Portfolio-v1/",
  plugins: [
    react(),
    // GitHub Pages: serve SPA for all routes (404.html loads the app)
    {
      name: "copy-404",
      closeBundle() {
        const src = resolve(__dirname, "dist", "index.html")
        const dest = resolve(__dirname, "dist", "404.html")
        if (existsSync(src)) copyFileSync(src, dest)
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
  },
})
