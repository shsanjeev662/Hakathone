import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createSavingGoal,
  getMemberSavingGoals,
  getSavingGoalDetail,
  updateSavingGoal,
  addContributionToGoal,
  deleteSavingGoal,
  getSavingGoalsAnalytics,
} from "../controllers/savingGoalController";

const router = Router();

// All saving goal routes require authentication
router.use(authMiddleware);

// Create a new saving goal
router.post("/", createSavingGoal);

// Get all saving goals for the authenticated member
router.get("/", getMemberSavingGoals);

// Get analytics for all goals
router.get("/analytics/summary", getSavingGoalsAnalytics);

// Get details of a specific saving goal
router.get("/:goalId", getSavingGoalDetail);

// Update a saving goal
router.patch("/:goalId", updateSavingGoal);

// Add contribution to a goal
router.post("/:goalId/contribute", addContributionToGoal);

// Delete a saving goal
router.delete("/:goalId", deleteSavingGoal);

export default router;
