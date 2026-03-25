# Overdue Amount Calculation from Monthly Deposits - Implementation Summary

## Overview
Implemented comprehensive overdue amount calculation system that calculates overdue amounts from monthly deposits (contributions) and repayments, with updated alerts and dashboard metrics.

## Changes Made

### 1. **Helper Functions** - `src/utils/helpers.ts`
Added two new utility functions:

#### `calculateOverdueContributions(contributions)`
- **Purpose**: Calculates the total overdue contribution amount based on monthly deposits
- **Logic**: 
  - Identifies contributions where `month/year < current month/year`
  - Includes contributions with status `PENDING` or `MISSED` (not `PAID`)
  - Returns the sum of overdue contribution amounts
- **Usage**: System-wide overdue tracking

#### `getOverdueMonthsCount(contributions)`
- **Purpose**: Counts the number of overdue monthly deposit entries
- **Logic**: Same as above but returns count instead of sum
- **Usage**: Metrics and alert generation

### 2. **Analytics Enhancement** - `src/utils/analytics.ts`
Updated `MemberAnalytics` interface and `computeMemberAnalytics()` function:

**New Fields in MemberAnalytics:**
- `overdueContributionAmount`: Total rupees of overdue monthly deposits
- `overdueContributionCount`: Number of overdue monthly deposits

**Enhanced Logic:**
- Calculates individual member's overdue contributions
- Includes overdue contribution count in risk score calculation (+8 points per overdue month)
- Includes overdue contribution count in trust score deduction (-5 points per overdue month)
- Adds dedicated alert for overdue monthly deposits:
  ```
  "{count} monthly deposit(s) totaling NPR {amount} are overdue"
  ```

### 3. **Dashboard Statistics** - `src/controllers/dashboardController.ts`
Updated `getDashboardStats()` endpoint with complete overdue tracking:

**New Response Fields:**
- `totalRepaymentOverdueAmount`: Overdue loan repayments (NPR)
- `totalContributionOverdueAmount`: Overdue monthly deposits (NPR)
- `overdueRepayments`: Count of overdue repayments
- `overdueContributions`: Count of overdue monthly deposits
- `totalOverdueAmount`: Total of both (repayments + contributions)

**Enhanced Smart Alerts:**
```javascript
// New alert for overdue monthly deposits
{
  type: "ALERT",
  title: "Overdue Monthly Deposits",
  message: `${count} member(s) have overdue monthly deposits totaling NPR ${amount}`
}

// New alert for overdue repayments
{
  type: "ALERT",
  title: "Overdue Repayments",
  message: `${count} repayment(s) are overdue totaling NPR ${amount}`
}
```

## Calculation Method

### Overdue Contribution Detection
A monthly deposit is considered **overdue** if:
1. The contribution's `month/year` is in the past (< current month/year)
2. The contribution status is NOT `PAID` (includes `PENDING` and `MISSED`)

**Example:**
- Current date: March 2025
- Contribution for Jan 2025 with status `PENDING` → **OVERDUE**
- Contribution for Feb 2025 with status `MISSED` → **OVERDUE**
- Contribution for Mar 2025 with status `PENDING` → **NOT OVERDUE** (current month)
- Contribution for Apr 2025 with status `PENDING` → **NOT OVERDUE** (future)

## API Endpoint Response Example

```json
{
  "totalOverdueAmount": 12500,
  "totalRepaymentOverdueAmount": 8000,
  "totalContributionOverdueAmount": 4500,
  "overduePayments": 5,
  "overdueRepayments": 2,
  "overdueContributions": 3,
  "smartAlerts": [
    {
      "type": "ALERT",
      "title": "Overdue Monthly Deposits",
      "message": "3 member(s) have overdue monthly deposits totaling NPR 4500"
    },
    {
      "type": "ALERT",
      "title": "Overdue Repayments",
      "message": "2 repayment(s) are overdue totaling NPR 8000"
    }
  ]
}
```

## Risk & Trust Score Impact

### Trust Score Changes
- **Base**: 55 points
- **Overdue Contributions**: -5 points per overdue month
- **Overdue Repayments**: -12 points each
- **Total Range**: 0-100

### Risk Score Changes  
- **Overdue Contributions**: +8 points per overdue month
- **Overdue Repayments**: +22 points each
- **Risk Levels**:
  - LOW: 0-34
  - MEDIUM: 35-69
  - HIGH: 70-100

## Member Risk Calculation Update
Each member's `missedPayments` metric now includes:
- Overdue repayments count
- Overdue monthly deposits count
- Properly reflects total missed obligations

## Testing the Implementation

### Check Dashboard Stats
```bash
curl http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer <admin_token>"
```

Expected response includes:
- `totalOverdueAmount` (number)
- `totalRepaymentOverdueAmount` (number)
- `totalContributionOverdueAmount` (number)  
- `overdueRepayments` (number)
- `overdueContributions` (number)
- Smart alerts for overdue deposits and repayments

## Files Modified
1. `backend/src/utils/helpers.ts` - Added overdue calculation functions
2. `backend/src/utils/analytics.ts` - Enhanced analytics with overdue contributions
3. `backend/src/controllers/dashboardController.ts` - Updated dashboard stats endpoint

## Backward Compatibility
✅ All changes are backward compatible. Existing `totalOverdueAmount` field remains but is now more accurate, combining both sources.

## Build Status
✅ **TypeScript Compilation**: Successful (no errors)
✅ **Type Safety**: All types properly defined
✅ **Ready for Testing**: Implementation complete
