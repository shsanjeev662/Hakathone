import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import {
  getDashboardStats,
  getMemberDashboard,
} from "../controllers/dashboardController";

const router = Router();

router.get("/stats", authMiddleware, adminMiddleware, getDashboardStats);
router.get("/member", authMiddleware, getMemberDashboard);

export default router;
