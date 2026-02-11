import { hc } from "hono/client";
import type { AppType } from "../../../api/src/app";

const API_URL = import.meta.env.VITE_API_URL || "/";

export const client = hc<AppType>(API_URL);
