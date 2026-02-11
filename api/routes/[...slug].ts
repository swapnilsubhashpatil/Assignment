import { defineEventHandler, getRequestURL, getRequestHeaders, readBody, appendResponseHeader } from "h3";
import { app } from "../src/app";

export default defineEventHandler(async (event) => {
    const url = getRequestURL(event);
    const method = event.node.req.method || "GET";
    const headers = getRequestHeaders(event);

    let body: string | undefined;
    if (method !== "GET" && method !== "HEAD") {
        try {
            const rawBody = await readBody(event);
            body = rawBody ? JSON.stringify(rawBody) : undefined;
        } catch {}
    }

    const request = new Request(url.toString(), {
        method,
        headers: headers as Record<string, string>,
        body,
    });

    const response = await app.fetch(request);

    appendResponseHeader(event, "Access-Control-Allow-Origin", "*");
    appendResponseHeader(event, "Access-Control-Expose-Headers", "X-Agent-Type, X-Reasoning");

    return response;
});
