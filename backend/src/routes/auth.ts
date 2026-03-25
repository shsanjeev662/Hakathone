import { Router } from "express";
import { register, login, forgotPassword } from "../controllers/authController";
import { createRateLimiter, getRateLimitIp } from "../middleware/rateLimit";
import { securityConfig } from "../config/security";

const router = Router();

const authIpLimiter = createRateLimiter({
  windowMs: securityConfig.rateLimit.authWindowMs,
  maxRequests: securityConfig.rateLimit.authMaxRequests,
  keyPrefix: "auth-ip",
  keyGenerator: (req) => getRateLimitIp(req),
  message: "Too many authentication attempts from this IP. Please try again later.",
});

const authIdentityLimiter = createRateLimiter({
  windowMs: securityConfig.rateLimit.authWindowMs,
  maxRequests: securityConfig.rateLimit.authMaxRequests,
  keyPrefix: "auth-identity",
  keyGenerator: (req) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    return email || getRateLimitIp(req);
  },
  message: "Too many authentication attempts for this account. Please try again later.",
});

router.post("/register", authIpLimiter, authIdentityLimiter, register);
router.post("/login", authIpLimiter, authIdentityLimiter, login);
router.post("/forgot-password", authIpLimiter, authIdentityLimiter, forgotPassword);

export default router;
