# Database Migration Guide - Saving Goals & Digital Receipts

## Overview
This migration adds two new tables to support saving goal tracking and digital receipt management for members.

## Tables Added

### 1. SavingGoal Table
**Purpose:** Track member savings goals and progress

```sql
CREATE TABLE "SavingGoal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "memberId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "targetAmount" DOUBLE PRECISION NOT NULL,
  "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "deadline" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "category" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavingGoal_memberId_fkey" 
    FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "SavingGoal_memberId_idx" ON "SavingGoal"("memberId");
CREATE INDEX "SavingGoal_status_idx" ON "SavingGoal"("status");
```

### 2. DigitalReceipt Table
**Purpose:** Store digital receipts for all member transactions

```sql
CREATE TABLE "DigitalReceipt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "memberId" TEXT NOT NULL,
  "receiptNumber" TEXT NOT NULL UNIQUE,
  "type" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "description" TEXT,
  "referenceId" TEXT,
  "transactionDate" TIMESTAMP(3) NOT NULL,
  "paymentMethod" TEXT,
  "remarks" TEXT,
  "issuedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DigitalReceipt_memberId_fkey" 
    FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "DigitalReceipt_memberId_idx" ON "DigitalReceipt"("memberId");
CREATE INDEX "DigitalReceipt_receiptNumber_idx" ON "DigitalReceipt"("receiptNumber");
CREATE INDEX "DigitalReceipt_type_idx" ON "DigitalReceipt"("type");
```

## Enums Added

### GoalStatus
```sql
-- Enum values: ACTIVE, COMPLETED, ABANDONED
```
Status of a saving goal

### ReceiptType
```sql
-- Enum values: CONTRIBUTION, REPAYMENT, WITHDRAWAL, INTEREST
```
Type of transaction in digital receipt

## Migration Steps

### Using Prisma (Recommended)

1. **Create migration file:**
   ```bash
   cd backend
   prisma migrate dev --name add_saving_goals_and_receipts
   ```

2. **Generate Prisma Client:**
   ```bash
   prisma generate
   ```

3. **Apply migration:**
   Migration will automatically apply to database

### Manual SQL Migration

1. **Connect to PostgreSQL:**
   ```bash
   psql -U postgres -d hakathone
   ```

2. **Created tables (see SQL above)**

3. **Verify tables:**
   ```sql
   \dt SavingGoal
   \dt DigitalReceipt
   ```

## Seed Data (Optional)

### Sample Saving Goal
```sql
INSERT INTO "SavingGoal" 
("id", "memberId", "title", "description", "targetAmount", "currentAmount", "deadline", "status", "priority", "category", "createdAt", "updatedAt")
VALUES (
  'goal_1',
  'user_123',
  'Buy a Motorcycle',
  'Want to buy a motorcycle for commute',
  150000,
  45000,
  '2026-12-31',
  'ACTIVE',
  'HIGH',
  'Vehicle',
  NOW(),
  NOW()
);
```

### Sample Digital Receipt
```sql
INSERT INTO "DigitalReceipt"
("id", "memberId", "receiptNumber", "type", "amount", "description", "transactionDate", "paymentMethod", "createdAt")
VALUES (
  'receipt_1',
  'user_123',
  'RCP-2026-ABC123-456789',
  'CONTRIBUTION',
  5000,
  'March 2025 monthly contribution',
  NOW(),
  'CASH',
  NOW()
);
```

## Verification Queries

### Count Goals by Status
```sql
SELECT status, COUNT(*) as count 
FROM "SavingGoal" 
GROUP BY status;
```

### Total Receipts by Type
```sql
SELECT type, COUNT(*) as count, SUM(amount) as total 
FROM "DigitalReceipt" 
GROUP BY type;
```

### Member Savings Progress
```sql
SELECT 
  u.name,
  COUNT(sg.id) as goal_count,
  SUM(sg.targetAmount) as total_target,
  SUM(sg.currentAmount) as total_saved,
  ROUND(SUM(sg.currentAmount)::numeric / SUM(sg.targetAmount)::numeric * 100, 2) as progress_percent
FROM "User" u
LEFT JOIN "SavingGoal" sg ON u.id = sg."memberId"
WHERE u.role = 'MEMBER' AND sg.status = 'ACTIVE'
GROUP BY u.id, u.name;
```

### Member Receipt Summary
```sql
SELECT 
  u.name,
  dr.type,
  COUNT(dr.id) as receipt_count,
  SUM(dr.amount) as total_amount
FROM "User" u
LEFT JOIN "DigitalReceipt" dr ON u.id = dr."memberId"
WHERE u.role = 'MEMBER'
GROUP BY u.id, u.name, dr.type
ORDER BY u.name, dr.type;
```

## Rollback (If Needed)

### Using Prisma
```bash
prisma migrate resolve --rolled-back add_saving_goals_and_receipts
```

### Manual SQL
```sql
DROP TABLE IF EXISTS "DigitalReceipt" CASCADE;
DROP TABLE IF EXISTS "SavingGoal" CASCADE;
-- Remove enum types if not used elsewhere
```

## Indexes Created

### SavingGoal Indexes
- `memberId` - Quick lookup of member's goals
- `status` - Fast filtering by goal status

### DigitalReceipt Indexes
- `memberId` - Quick lookup of member's receipts
- `receiptNumber` - Unique receipt lookup
- `type` - Fast filtering by receipt type

These indexes optimize common queries used in the application.

## Performance Considerations

1. **Queries will be fast:**
   - Lookup member's goals: O(1) via index
   - Filter by status: Efficient with status index
   - List receipts by member: O(1) via memberId index

2. **Storage:**
   - SavingGoal: ~500 bytes per record
   - DigitalReceipt: ~400 bytes per record

3. **Scalability:**
   - Supports millions of records
   - Good for 10+ years of transaction history

## Testing the Migration

### 1. Check tables exist
```bash
prisma studio
```

### 2. Test creating goal
- Use admin to create goal via API
- Verify in database

### 3. Test creating receipt
- Record contribution
- Verify receipt auto-generated
- Check receipt number format

### 4. Test relationships
- Delete user
- Verify cascading delete of goals and receipts

## Troubleshooting

### Issue: Foreign key constraint violation
**Solution:** Ensure memberId exists in User table

### Issue: Migration fails
**Solution:** Check database connectivity and permissions

### Issue: Enum type error
**Solution:** Ensure enums are defined before tables

## Next Steps After Migration

1. ✅ Run migrations
2. ✅ Verify tables created
3. ⏳ Update models in Prisma
4. ⏳ Regenerate Prisma Client
5. ⏳ Test API endpoints
6. ⏳ Deploy to production
