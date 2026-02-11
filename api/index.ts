import { defineEventHandler } from "h3";

export default defineEventHandler(() => {
    return {
        status: "ok",
        service: "customer-support-ai-api",
        version: "1.0.0",
    };
});
