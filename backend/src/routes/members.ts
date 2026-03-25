import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import {
  getAllMembers,
  addMember,
  updateMember,
  deleteMember,
  getMemberStats,
} from "../controllers/memberController";

const router = Router();

router.get("/", authMiddleware, adminMiddleware, getAllMembers);
router.post("/", authMiddleware, adminMiddleware, addMember);
router.put("/:id", authMiddleware, adminMiddleware, updateMember);
router.delete("/:id", authMiddleware, adminMiddleware, deleteMember);
router.get("/:id/stats", authMiddleware, getMemberStats);

export default router;
