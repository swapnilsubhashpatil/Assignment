import app from "../src/app";

// Catch-all route for Hono
export default defineEventHandler(async (event) => {
  const req = event.node.req;
  const res = event.node.res;
  
  return app.fetch(req as unknown as Request, {} as any);
});
