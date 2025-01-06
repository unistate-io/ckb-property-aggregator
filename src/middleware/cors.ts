// middleware/cors.ts
import { CONFIG } from "../config";

export class CorsMiddleware {
  static check(req: Request) {
    const origin = req.headers.get("origin");
    if (!origin) return true;

    // 使用严格相等性检查
    if (
      !CONFIG.ALLOWED_ORIGINS.some((allowedOrigin) => allowedOrigin === origin)
    ) {
      throw new Error("CORS policy violation");
    }

    return true;
  }
}
