import "dotenv/config";
import express from "express";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth";
import memberRoutes from "./routes/members";
import contributionRoutes from "./routes/contributions";
import loanRoutes from "./routes/loans";
import repaymentRoutes from "./routes/repayments";
import dashboardRoutes from "./routes/dashboard";
import reportRoutes from "./routes/reports";
import savingGoalsRoutes from "./routes/savingGoals";
import digitalReceiptsRoutes from "./routes/digitalReceipts";
import { corsMiddleware } from "./middleware/cors";
import { createRateLimiter } from "./middleware/rateLimit";
import { authMiddleware, AuthRequest } from "./middleware/auth";
import { securityConfig } from "./config/security";

const app = express();
const prisma = new PrismaClient();

if (securityConfig.rateLimit.trustProxy) {
  app.set("trust proxy", 1);
}

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(
  "/api",
  createRateLimiter({
    windowMs: securityConfig.rateLimit.windowMs,
    maxRequests: securityConfig.rateLimit.maxRequests,
    keyPrefix: "ip",
  })
);
app.use(
  ["/api/members", "/api/contributions", "/api/loans", "/api/repayments", "/api/dashboard", "/api/reports", "/api/saving-goals", "/api/digital-receipts"],
  authMiddleware,
  createRateLimiter({
    windowMs: securityConfig.rateLimit.userWindowMs,
    maxRequests: securityConfig.rateLimit.userMaxRequests,
    keyPrefix: "user",
    keyGenerator: (req) => (req as AuthRequest).user?.id ?? null,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/repayments", repaymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/saving-goals", savingGoalsRoutes);
app.use("/api/digital-receipts", digitalReceiptsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Dhukuti API is running" });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err);
    if (err.message.startsWith("CORS blocked")) {
      return res.status(403).json({ error: "Origin is not allowed by CORS policy" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Dhukuti Backend running on http://localhost:${PORT}`);
});

export default app;
export { prisma };
