const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseTrustedOrigins = (value: string | undefined, nodeEnv: string) => {
  const configuredOrigins = value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins && configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  if (nodeEnv !== "production") {
    return ["http://localhost:3000", "http://127.0.0.1:3000"];
  }

  throw new Error(
    "CORS_ALLOWED_ORIGINS must be set in production and contain a comma-separated list of trusted origins."
  );
};

const nodeEnv = process.env.NODE_ENV || "development";
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.trim().length < 32) {
  throw new Error("JWT_SECRET must be configured and at least 32 characters long.");
}

export const securityConfig = {
  nodeEnv,
  jwtSecret,
  cors: {
    allowedOrigins: parseTrustedOrigins(process.env.CORS_ALLOWED_ORIGINS, nodeEnv),
    allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    allowCredentials: true,
  },
  rateLimit: {
    trustProxy: process.env.TRUST_PROXY === "true",
    windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    maxRequests: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
    authWindowMs: parseNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60_000),
    authMaxRequests: parseNumber(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10),
    userWindowMs: parseNumber(process.env.USER_RATE_LIMIT_WINDOW_MS, 60_000),
    userMaxRequests: parseNumber(process.env.USER_RATE_LIMIT_MAX_REQUESTS, 120),
  },
  auth: {
    memberMaxFailedLoginAttempts: parseNumber(
      process.env.MEMBER_MAX_FAILED_LOGIN_ATTEMPTS,
      4
    ),
  },
  email: {
    provider: process.env.EMAIL_PROVIDER || "gmail",
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  },
};
