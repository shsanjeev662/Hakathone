# Saving Goal Tracking & Digital Receipt System - API Quick Reference

## 📊 SAVING GOAL TRACKING

### Create a Saving Goal
```
POST /api/saving-goals
{
  "title": "Buy a Motorcycle",
  "description": "For daily commute",
  "targetAmount": 150000,
  "deadline": "2026-12-31",
  "priority": "HIGH",
  "category": "Vehicle"
}
```

### Get All Goals
```
GET /api/saving-goals?status=ACTIVE
```

### Get Goal Details
```
GET /api/saving-goals/:goalId
```
Response includes: progressPercentage, remainingAmount, daysRemaining, monthlyTargetAmount

### Contribute to Goal
```
POST /api/saving-goals/:goalId/contribute
{ "amount": 10000 }
```
Auto-completes goal when target is reached

### Update Goal
```
PATCH /api/saving-goals/:goalId
{
  "title": "Updated Title",
  "status": "ABANDONED",
  "priority": "LOW"
}
```

### Get Analytics
```
GET /api/saving-goals/analytics/summary
```
Returns: totalTarget, totalSaved, overallProgress, completedGoals, categoryBreakdown, upcomingDeadlines

### Delete Goal
```
DELETE /api/saving-goals/:goalId
```

---

## 📄 DIGITAL RECEIPT SYSTEM

### Create Receipt
```
POST /api/digital-receipts
{
  "memberId": "user_123",
  "type": "CONTRIBUTION",
  "amount": 5000,
  "description": "Monthly savings",
  "referenceId": "contrib_123",
  "paymentMethod": "CASH",
  "remarks": "Paid in full"
}
```
Auto-generates: receiptNumber (RCP-YYYY-XXXXXX)

### Get Member Receipts
```
GET /api/digital-receipts/member/:memberId
GET /api/digital-receipts/member/:memberId?type=CONTRIBUTION&startDate=2026-01-01&endDate=2026-31
```

### Get Receipt Summary
```
GET /api/digital-receipts/member/:memberId/summary
```
Returns: totalReceipts, byType, monthlyBreakdown, totalAmount

### Get Receipts by Type
```
GET /api/digital-receipts/member/:memberId/type/CONTRIBUTION
```

### Get Receipt Details
```
GET /api/digital-receipts/:receiptId
```

### Download Receipt (HTML)
```
GET /api/digital-receipts/:receiptId/download
```
Returns: Beautiful formatted HTML receipt (can be printed as PDF)

### Delete Receipt
```
DELETE /api/digital-receipts/:receiptId
```

---

## 🔄 Receipt Types & Payment Methods

**Receipt Types:**
- CONTRIBUTION: Monthly savings contribution
- REPAYMENT: Loan instalment payment
- WITHDRAWAL: Savings withdrawal
- INTEREST: Interest earned

**Payment Methods:**
- CASH: Physical cash
- BANK_TRANSFER: Digital transfer
- CHEQUE: Cheque payment

---

## 📊 Saving Goal Categories & Priorities

**Categories:**
- Education, Emergency, Vehicle, Home, Business, Wedding, Travel, Custom

**Priorities:**
- HIGH, MEDIUM, LOW

---

## ✨ Key Features

### Saving Goals
✓ Real-time progress tracking
✓ Auto-calculate days remaining
✓ Monthly target calculation
✓ Category breakdown
✓ Auto-complete on target reached
✓ Multi-goal support
✓ Goal abandonment tracking

### Digital Receipts
✓ Unique auto-generated receipt numbers
✓ HTML receipt formatting
✓ Download as HTML (print to PDF)
✓ Date range filtering
✓ Type-based filtering
✓ Monthly trends
✓ Complete audit trail
✓ Email notifications

---

## 🔐 Authorization
- Members can only view/edit their own goals and receipts
- Admins can view/manage all
- Role-based access control enforced

---

## 📱 Frontend Integration Points

Member Dashboard:
- Display active saving goals with progress
- Show upcoming deadlines
- Quick contribution button
- Recent receipts widget

Savings Page:
- Create/edit/delete goals
- View goal analytics
- Add contributions
- Download receipts

Receipt History:
- Filter by type, date range
- Download individual receipts
- View summary
- Export monthly report
