import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createDigitalReceipt,
  getMemberReceipts,
  getReceiptDetail,
  getReceiptsByType,
  deleteReceipt,
  downloadReceipt,
  getReceiptSummary,
} from "../controllers/digitalReceiptController";

const router = Router();

// All digital receipt routes require authentication
router.use(authMiddleware);

// Create a new digital receipt (admin only)
router.post("/", createDigitalReceipt);

// Get receipt summary for a member
router.get("/member/:memberId/summary", getReceiptSummary);

// Get all receipts for a member with filters
router.get("/member/:memberId", getMemberReceipts);

// Get receipts by type for a member
router.get("/member/:memberId/type/:type", getReceiptsByType);

// Get detail of a specific receipt
router.get("/:receiptId", getReceiptDetail);

// Download receipt as HTML
router.get("/:receiptId/download", downloadReceipt);

// Delete a receipt
router.delete("/:receiptId", deleteReceipt);

export default router;
