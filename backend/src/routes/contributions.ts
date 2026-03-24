import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import {
  addContribution,
  getMemberContributions,
  getAllContributions,
  updateContributionStatus,
} from "../controllers/contributionController";

const router = Router();

router.post("/", authMiddleware, adminMiddleware, addContribution);
router.get("/", authMiddleware, getAllContributions);
router.get("/member/:memberId", authMiddleware, getMemberContributions);
router.put("/:id/status", authMiddleware, adminMiddleware, updateContributionStatus);

export default router;
