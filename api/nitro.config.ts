import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
    modules: ["workflow/nitro"],
    rollupConfig: {
        onwarn(warning, warn) {
            if (warning.message?.includes("@opentelemetry")) return;
            if (warning.message?.includes("this' keyword is equivalent")) return;
            if (warning.message?.includes("Circular dependency")) return;
            warn(warning);
        },
    },
});
