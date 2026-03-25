import cors from "cors";
import { securityConfig } from "../config/security";

const trustedOrigins = new Set(securityConfig.cors.allowedOrigins);

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (trustedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: securityConfig.cors.allowedMethods,
  allowedHeaders: securityConfig.cors.allowedHeaders,
  credentials: securityConfig.cors.allowCredentials,
  optionsSuccessStatus: 204,
  maxAge: 86_400,
});
