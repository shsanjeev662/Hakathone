import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import {
  recordRepayment,
  getLoanRepayments,
  checkAndUpdateOverdue,
  getAllRepayments,
} from "../controllers/repaymentController";

const router = Router();

router.post("/", authMiddleware, adminMiddleware, recordRepayment);
router.get("/", authMiddleware, adminMiddleware, getAllRepayments);
router.get("/:loanId", authMiddleware, getLoanRepayments);
router.post("/check-overdue", authMiddleware, adminMiddleware, checkAndUpdateOverdue);

export default router;
