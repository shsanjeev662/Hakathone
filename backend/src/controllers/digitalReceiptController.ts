import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../index";

// Generate unique receipt number
const generateReceiptNumber = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RCP-${new Date().getFullYear()}-${random}-${timestamp.slice(-6)}`;
};

export const createDigitalReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId, type, amount, description, referenceId, paymentMethod, remarks } = req.body;

    if (!type || !amount || !memberId) {
      return res
        .status(400)
        .json({ error: "Type, amount, and memberId are required" });
    }

    // Verify member exists
    const member = await prisma.user.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    const receiptNumber = generateReceiptNumber();

    const receipt = await prisma.digitalReceipt.create({
      data: {
        memberId,
        receiptNumber,
        type,
        amount,
        description,
        referenceId,
        transactionDate: new Date(),
        paymentMethod,
        remarks,
        issuedBy: req.user!.id,
      },
    });

    res.status(201).json({
      message: "Digital receipt created successfully",
      receipt,
    });
  } catch (error) {
    console.error("Create digital receipt error:", error);
    res.status(500).json({ error: "Failed to create digital receipt" });
  }
};

export const getMemberReceipts = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;
    const { type, startDate, endDate } = req.query;

    // Authorize access
    if (req.user!.role !== "ADMIN" && req.user!.id !== memberId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let where: any = { memberId };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.transactionDate.lte = new Date(endDate as string);
      }
    }

    const receipts = await prisma.digitalReceipt.findMany({
      where,
      orderBy: { transactionDate: "desc" },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      total: receipts.length,
      receipts,
    });
  } catch (error) {
    console.error("Get member receipts error:", error);
    res.status(500).json({ error: "Failed to fetch receipts" });
  }
};

export const getReceiptDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { receiptId } = req.params;

    const receipt = await prisma.digitalReceipt.findUnique({
      where: { id: receiptId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            memberProfile: {
              select: {
                phone: true,
                address: true,
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    // Authorize access
    if (req.user!.role !== "ADMIN" && req.user!.id !== receipt.memberId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(receipt);
  } catch (error) {
    console.error("Get receipt detail error:", error);
    res.status(500).json({ error: "Failed to fetch receipt" });
  }
};

export const getReceiptsByType = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId, type } = req.params;

    // Authorize access
    if (req.user!.role !== "ADMIN" && req.user!.id !== memberId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const receipts = await prisma.digitalReceipt.findMany({
      where: {
        memberId,
        type: type as any,
      },
      orderBy: { transactionDate: "desc" },
    });

    const totalAmount = receipts.reduce((sum: number, receipt: any) => sum + receipt.amount, 0);

    res.json({
      type,
      count: receipts.length,
      totalAmount,
      receipts,
    });
  } catch (error) {
    console.error("Get receipts by type error:", error);
    res.status(500).json({ error: "Failed to fetch receipts" });
  }
};

export const deleteReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const { receiptId } = req.params;

    const receipt = await prisma.digitalReceipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    // Only admin or member can delete their receipt
    if (req.user!.role !== "ADMIN" && req.user!.id !== receipt.memberId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.digitalReceipt.delete({
      where: { id: receiptId },
    });

    res.json({ message: "Receipt deleted successfully" });
  } catch (error) {
    console.error("Delete receipt error:", error);
    res.status(500).json({ error: "Failed to delete receipt" });
  }
};

export const generateReceiptHTML = (receipt: any): string => {
  const formattedDate = new Date(receipt.transactionDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .receipt-container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          max-width: 600px;
          margin: 0 auto;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #1f2937;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #16a34a;
          margin-bottom: 5px;
        }
        .subtitle {
          color: #666;
          font-size: 12px;
          margin-bottom: 10px;
        }
        .receipt-title {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 5px;
        }
        .receipt-number {
          font-size: 12px;
          color: #666;
          font-family: monospace;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-weight: bold;
          color: #1f2937;
          font-size: 13px;
          text-transform: uppercase;
          margin-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
          color: #374151;
        }
        .detail-label {
          color: #666;
        }
        .detail-value {
          font-weight: 500;
          color: #1f2937;
        }
        .amount-section {
          background-color: #f0fdf4;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
          border-left: 4px solid #16a34a;
        }
        .amount-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .amount-label {
          font-size: 14px;
          color: #666;
        }
        .amount-value {
          font-size: 28px;
          font-weight: bold;
          color: #16a34a;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #666;
          font-size: 12px;
          margin-top: 30px;
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          margin-top: 5px;
        }
        .badge-success {
          background-color: #d1fae5;
          color: #065f46;
        }
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .receipt-container {
            box-shadow: none;
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="logo">SamuHikKosh</div>
          <div class="subtitle">Community Savings Group</div>
          <div style="margin-top: 15px;">
            <div class="receipt-title">Digital Receipt</div>
            <div class="receipt-number">${receipt.receiptNumber}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Member Information</div>
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${receipt.member.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${receipt.member.email}</span>
          </div>
          ${receipt.member.memberProfile?.phone ? `
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${receipt.member.memberProfile.phone}</span>
          </div>
          ` : ""}
        </div>

        <div class="section">
          <div class="section-title">Transaction Details</div>
          <div class="detail-row">
            <span class="detail-label">Type:</span>
            <span class="detail-value">${receipt.type}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${formattedDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">${receipt.paymentMethod || "N/A"}</span>
          </div>
          ${receipt.description ? `
          <div class="detail-row">
            <span class="detail-label">Description:</span>
            <span class="detail-value">${receipt.description}</span>
          </div>
          ` : ""}
          ${receipt.remarks ? `
          <div class="detail-row">
            <span class="detail-label">Remarks:</span>
            <span class="detail-value">${receipt.remarks}</span>
          </div>
          ` : ""}
        </div>

        <div class="amount-section">
          <div class="amount-display">
            <span class="amount-label">Total Amount</span>
            <span class="amount-value">NPR ${receipt.amount.toLocaleString()}</span>
          </div>
          <div style="text-align: center; margin-top: 10px;">
            <span class="badge badge-success">✓ Confirmed</span>
          </div>
        </div>

        <div class="footer">
          <p>This is an electronically generated receipt. No signature is required.</p>
          <p>Generated on ${formattedDate} at ${new Date(receipt.transactionDate).toLocaleTimeString()}</p>
          <p style="margin-top: 15px; color: #999;">Receipt ID: ${receipt.id}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};

export const downloadReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const { receiptId } = req.params;

    const receipt = await prisma.digitalReceipt.findUnique({
      where: { id: receiptId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            memberProfile: {
              select: {
                phone: true,
                address: true,
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    // Authorize access
    if (req.user!.role !== "ADMIN" && req.user!.id !== receipt.memberId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const htmlContent = generateReceiptHTML(receipt);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="receipt-${receipt.receiptNumber}.html"`
    );
    res.send(htmlContent);
  } catch (error) {
    console.error("Download receipt error:", error);
    res.status(500).json({ error: "Failed to download receipt" });
  }
};

export const getReceiptSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;

    // Authorize access
    if (req.user!.role !== "ADMIN" && req.user!.id !== memberId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const receipts = await prisma.digitalReceipt.findMany({
      where: { memberId },
    });

    const summary = {
      totalReceipts: receipts.length,
      byType: {} as Record<string, any>,
      totalByType: {} as Record<string, number>,
    };

    receipts.forEach((receipt: any) => {
      if (!summary.byType[receipt.type]) {
        summary.byType[receipt.type] = [];
        summary.totalByType[receipt.type] = 0;
      }
      summary.byType[receipt.type].push(receipt);
      summary.totalByType[receipt.type] += receipt.amount;
    });

    const lastSixMonthsReceipts = receipts.filter((receipt: any) => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return receipt.transactionDate >= sixMonthsAgo;
    });

    const monthlyBreakdown: Record<string, number> = {};
    lastSixMonthsReceipts.forEach((receipt: any) => {
      const month = receipt.transactionDate.toLocaleDateString("en-US", {
        year: "2-digit",
        month: "short",
      });
      if (!monthlyBreakdown[month]) {
        monthlyBreakdown[month] = 0;
      }
      monthlyBreakdown[month] += receipt.amount;
    });

    res.json({
      summary,
      monthlyBreakdown,
      totalAmount: receipts.reduce((sum: number, r: any) => sum + r.amount, 0),
    });
  } catch (error) {
    console.error("Get receipt summary error:", error);
    res.status(500).json({ error: "Failed to fetch receipt summary" });
  }
};
