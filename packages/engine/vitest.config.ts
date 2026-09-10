import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    alias: {
      "@fluxide/protocol": path.resolve(__dirname, "../protocol/src/index.ts"),
      "@fluxide/model-gateway": path.resolve(__dirname, "../model-gateway/src/index.ts"),
    },
  },
});
