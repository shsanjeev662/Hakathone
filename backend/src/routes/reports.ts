import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import {
  getLoanSummaryReport,
  getMemberStatement,
  getMonthlyReport,
} from "../controllers/reportController";

const router = Router();

router.get("/member/:memberId", authMiddleware, getMemberStatement);
router.get("/monthly", authMiddleware, adminMiddleware, getMonthlyReport);
router.get("/loans", authMiddleware, adminMiddleware, getLoanSummaryReport);

export default router;
