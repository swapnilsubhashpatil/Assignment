import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  srcDir: ".",
  experimental: {
    wasm: true,
  },
  routeRules: {
    "/api/**": { cors: true },
  },
});
