import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart({ customViteReactPlugin: true }),
    nitro({
      compressPublicAssets: true,
      publicAssets: [
        {
          baseURL: "/",
          dir: "public",
          maxAge: 60 * 60 * 24 * 365, // 1 year
        },
      ],
    }),
    viteReact(),
    svgr({
      svgrOptions: {
        // viewbox scaling
        icon: true,
      },
    }),
  ],
});
