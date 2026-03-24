# 🚀 Quick Start Guide

Get Dhukuti running in 10 minutes!

## Prerequisites
- Node.js 18+ and npm
- PostgreSQL running
- Port 5000 and 3000 available

## 1. Backend Setup (5 minutes)

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Edit .env with your database credentials
# Example PostgreSQL connection:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/dhukuti_db"
# JWT_SECRET="your-secret-key-12345"
```

### Create Database
```bash
# Using psql
createdb dhukuti_db

# Or through PostgreSQL GUI
```

### Setup Database & Seed Data
```bash
# Generate Prisma client
npm run prisma:generate

# Create tables
npm run db:push

# Insert demo data
npm run prisma:seed
```

### Start Backend
```bash
npm run dev
# Backend running at http://localhost:5000
```

## 2. Frontend Setup (3 minutes)

**In a new terminal:**
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend running at http://localhost:3000
```

## 3. Access Application

Open in browser: `http://localhost:3000`

### Login with Demo Credentials

**Admin:**
- Email: `admin@dhukuti.com`
- Password: `admin123`

**Member:**
- Email: `ram@dhukuti.com`
- Password: `member123`

---

## What You Can Do

### As Admin
- ✅ View dashboard with analytics
- ✅ Manage members (add, edit, delete)
- ✅ Record monthly contributions
- ✅ Issue loans to members
- ✅ Record repayments
- ✅ Monitor overdue payments
- ✅ Identify high-risk members

### As Member
- ✅ View personal savings
- ✅ Check active loans
- ✅ View upcoming due payments
- ✅ Check overdue alerts
- ✅ Review notifications

---

## API Health Check

```bash
curl http://localhost:5000/api/health
# Should return: {"status":"OK","message":"Dhukuti API is running"}
```

---

## Common Issues

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
psql --version

# Create database manually
createdb dhukuti_db

# Retry setup
```

### "Port 5000 already in use"
```bash
# Find and kill process
lsof -i :5000
kill -9 <PID>

# Or change port in .env
PORT=5001
```

### Frontend can't find backend
```bash
# Check backend is running
curl http://localhost:5000/api/health

# Verify API URL in next.config.js
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Project Structure

```
backend/
  └─ src/
      ├─ index.ts (Express server)
      ├─ controllers/ (Business logic)
      ├─ routes/ (API endpoints)
      ├─ middleware/ (Auth & RBAC)
      └─ prisma/ (Database)

frontend/
  └─ app/
      ├─ login/ (Auth page)
      ├─ admin/ (Admin pages)
      ├─ member/ (Member pages)
      ├─ components/ (UI components)
      └─ services/ (API calls)
```

---

## Next Steps

1. **Explore as Admin**: Check dashboard, add members, create sample loans
2. **Explore as Member**: View savings and loan details
3. **Test Features**: Try contribution tracking, loan creation
4. **Customize**: Modify colors, add new features, adapt for production

---

## Database Reset

If you need a fresh start:

```bash
cd backend
npm run db:reset
npm run prisma:seed
```

**WARNING**: This deletes all data!

---

## Production Build

### Build Backend
```bash
cd backend
npm run build
npm start
```

### Build Frontend
```bash
cd frontend
npm run build
npm start
```

---

**Need help? Check README.md for detailed documentation!**
