import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import {
  issueLoan,
  getAllLoans,
  getMemberLoans,
  getLoanDetails,
  closeLoan,
} from "../controllers/loanController";

const router = Router();

router.post("/", authMiddleware, adminMiddleware, issueLoan);
router.get("/", authMiddleware, adminMiddleware, getAllLoans);
router.get("/member/:memberId", authMiddleware, getMemberLoans);
router.get("/:id", authMiddleware, getLoanDetails);
router.patch("/:id/close", authMiddleware, adminMiddleware, closeLoan);

export default router;
