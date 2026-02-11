import app from "./src/app.js";

// Nitro handler
export default defineEventHandler(async (event) => {
  const req = event.node.req;
  const res = event.node.res;
  
  // Let Hono handle the request
  return app.fetch(req as unknown as Request, {} as any);
});
