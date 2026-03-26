import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../index";

export const createSavingGoal = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, targetAmount, deadline, priority, category } = req.body;
    const memberId = req.user!.id;

    if (!title || !targetAmount || !deadline) {
      return res.status(400).json({ error: "Title, targetAmount, and deadline are required" });
    }

    if (targetAmount <= 0) {
      return res.status(400).json({ error: "Target amount must be greater than 0" });
    }

    const savingGoal = await prisma.savingGoal.create({
      data: {
        memberId,
        title,
        description,
        targetAmount,
        deadline: new Date(deadline),
        priority: priority || "MEDIUM",
        category,
      },
    });

    res.status(201).json({
      message: "Saving goal created successfully",
      goal: savingGoal,
    });
  } catch (error) {
    console.error("Create saving goal error:", error);
    res.status(500).json({ error: "Failed to create saving goal" });
  }
};

export const getMemberSavingGoals = async (req: AuthRequest, res: Response) => {
  try {
    const memberId = req.user!.id;
    const { status } = req.query;

    let where: any = { memberId };
    if (status) {
      where.status = status;
    }

    const goals = await prisma.savingGoal.findMany({
      where,
      orderBy: [{ status: "asc" }, { deadline: "asc" }],
    });

    const goalsWithProgress = goals.map((goal: any) => ({
      ...goal,
      progressPercentage: Math.round((goal.currentAmount / goal.targetAmount) * 100),
      remainingAmount: goal.targetAmount - goal.currentAmount,
      daysRemaining: Math.ceil(
        (goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
      isCompleted: goal.currentAmount >= goal.targetAmount,
    }));

    res.json({
      total: goalsWithProgress.length,
      goals: goalsWithProgress,
    });
  } catch (error) {
    console.error("Get saving goals error:", error);
    res.status(500).json({ error: "Failed to fetch saving goals" });
  }
};

export const getSavingGoalDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { goalId } = req.params;
    const memberId = req.user!.id;

    const goal = await prisma.savingGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      return res.status(404).json({ error: "Saving goal not found" });
    }

    if (goal.memberId !== memberId && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const detail = {
      ...goal,
      progressPercentage: Math.round((goal.currentAmount / goal.targetAmount) * 100),
      remainingAmount: goal.targetAmount - goal.currentAmount,
      daysRemaining: Math.ceil(
        (goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
      isCompleted: goal.currentAmount >= goal.targetAmount,
      monthlyTargetAmount: goal.targetAmount / Math.ceil(
        (goal.deadline.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
      ),
    };

    res.json(detail);
  } catch (error) {
    console.error("Get saving goal detail error:", error);
    res.status(500).json({ error: "Failed to fetch saving goal" });
  }
};

export const updateSavingGoal = async (req: AuthRequest, res: Response) => {
  try {
    const { goalId } = req.params;
    const { title, description, targetAmount, deadline, priority, category, status } = req.body;
    const memberId = req.user!.id;

    const goal = await prisma.savingGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      return res.status(404).json({ error: "Saving goal not found" });
    }

    if (goal.memberId !== memberId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (targetAmount && targetAmount > 0) updateData.targetAmount = targetAmount;
    if (deadline) updateData.deadline = new Date(deadline);
    if (priority) updateData.priority = priority;
    if (category) updateData.category = category;
    if (status) updateData.status = status;

    const updatedGoal = await prisma.savingGoal.update({
      where: { id: goalId },
      data: updateData,
    });

    res.json({
      message: "Saving goal updated successfully",
      goal: updatedGoal,
    });
  } catch (error) {
    console.error("Update saving goal error:", error);
    res.status(500).json({ error: "Failed to update saving goal" });
  }
};

export const addContributionToGoal = async (req: AuthRequest, res: Response) => {
  try {
    const { goalId } = req.params;
    const { amount } = req.body;
    const memberId = req.user!.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const goal = await prisma.savingGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      return res.status(404).json({ error: "Saving goal not found" });
    }

    if (goal.memberId !== memberId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (goal.status !== "ACTIVE") {
      return res.status(400).json({ error: "Can only add contributions to active goals" });
    }

    const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
    const isCompleted = newAmount >= goal.targetAmount;

    const updatedGoal = await prisma.savingGoal.update({
      where: { id: goalId },
      data: {
        currentAmount: newAmount,
        status: isCompleted ? "COMPLETED" : "ACTIVE",
      },
    });

    res.json({
      message: isCompleted ? "Saving goal completed! 🎉" : "Contribution added successfully",
      goal: {
        ...updatedGoal,
        progressPercentage: Math.round((updatedGoal.currentAmount / updatedGoal.targetAmount) * 100),
        remainingAmount: updatedGoal.targetAmount - updatedGoal.currentAmount,
      },
    });
  } catch (error) {
    console.error("Add contribution to goal error:", error);
    res.status(500).json({ error: "Failed to add contribution" });
  }
};

export const deleteSavingGoal = async (req: AuthRequest, res: Response) => {
  try {
    const { goalId } = req.params;
    const memberId = req.user!.id;

    const goal = await prisma.savingGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      return res.status(404).json({ error: "Saving goal not found" });
    }

    if (goal.memberId !== memberId && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.savingGoal.delete({
      where: { id: goalId },
    });

    res.json({ message: "Saving goal deleted successfully" });
  } catch (error) {
    console.error("Delete saving goal error:", error);
    res.status(500).json({ error: "Failed to delete saving goal" });
  }
};

export const getSavingGoalsAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const memberId = req.user!.id;

    const goals = await prisma.savingGoal.findMany({
      where: { memberId },
    });

    const totalTarget = goals.reduce((sum: number, goal: any) => sum + goal.targetAmount, 0);
    const totalSaved = goals.reduce((sum: number, goal: any) => sum + goal.currentAmount, 0);
    const completedGoals = goals.filter((goal: any) => goal.status === "COMPLETED").length;
    const activeGoals = goals.filter((goal: any) => goal.status === "ACTIVE").length;
    const abandonedGoals = goals.filter((goal: any) => goal.status === "ABANDONED").length;

    const categoryBreakdown = goals.reduce(
      (acc: Record<string, any>, goal: any) => {
        const category = goal.category || "Uncategorized";
        if (!acc[category]) {
          acc[category] = { target: 0, saved: 0, count: 0 };
        }
        acc[category].target += goal.targetAmount;
        acc[category].saved += goal.currentAmount;
        acc[category].count += 1;
        return acc;
      },
      {} as Record<string, any>
    );

    const upcomingDeadlines = goals
      .filter((goal: any) => goal.status === "ACTIVE")
      .sort((a: any, b: any) => a.deadline.getTime() - b.deadline.getTime())
      .slice(0, 5)
      .map((goal: any) => ({
        ...goal,
        daysRemaining: Math.ceil(
          (goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ),
        progressPercentage: Math.round((goal.currentAmount / goal.targetAmount) * 100),
      }));

    res.json({
      summary: {
        totalGoals: goals.length,
        totalTarget,
        totalSaved,
        overallProgress: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0,
        completedGoals,
        activeGoals,
        abandonedGoals,
      },
      categoryBreakdown,
      upcomingDeadlines,
    });
  } catch (error) {
    console.error("Get saving goals analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};
