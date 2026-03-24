# 🏢 Dhukuti - Smart Cooperative Manager

A comprehensive full-stack web application for digitizing community savings groups in Nepal. The system manages members, contributions, loans, and repayments with smart alerts and risk detection.

**Demo Website**: [https://dhukuti.example.com](https://dhukuti.example.com)

---

## 🏗️ TECH STACK

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT
- **Architecture**: REST API

### Database
- **Database**: PostgreSQL
- **ORM**: Prisma

---

## 📋 FEATURES

### Authentication System
- JWT-based authentication with 7-day expiry
- Two roles: Admin and Member
- Secure password hashing with bcryptjs
- Admin creates members, Members login

### Member Management
- Add/Edit/Delete members
- Member profiles with phone and address
- Member statistics and contribution tracking
- Risk level calculation based on missed payments

### Contributions
- Record monthly contributions
- Track paid, missed, and pending contributions
- Month/year unique constraint
- Notifications on successful contributions

### Loans
- Issue loans with EMI calculation
- Automatic EMI formula calculation
- Track loan status (Active/Completed/Closed)
- Monthly repayment schedule generation
- Interest rate support (up to 100%)

### Repayments
- Record loan repayments
- Automatic overdue detection
- Repayment schedule tracking
- Pending, Overdue, and Paid statuses

### Dashboard & Analytics
- **Admin Dashboard**: Total members, savings, active loans, overdue payments
- **Risk Analysis**: Member risk levels (LOW/MEDIUM/HIGH) based on missed payments
- **Member Dashboard**: Personal savings, loan status, upcoming and overdue dues
- **Charts**: Pie charts for risk distribution, progress bars for collection rates

### Notifications
- Real-time alerts for overdue payments
- Contribution confirmation notifications
- Loan approval and closure notifications
- Member notifications with read/unread status

---

## 📁 PROJECT STRUCTURE

```
Hakathone/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server entry point
│   │   ├── controllers/          # Business logic
│   │   │   ├── authController.ts
│   │   │   ├── memberController.ts
│   │   │   ├── contributionController.ts
│   │   │   ├── loanController.ts
│   │   │   ├── repaymentController.ts
│   │   │   └── dashboardController.ts
│   │   ├── routes/               # API endpoints
│   │   │   ├── auth.ts
│   │   │   ├── members.ts
│   │   │   ├── contributions.ts
│   │   │   ├── loans.ts
│   │   │   ├── repayments.ts
│   │   │   └── dashboard.ts
│   │   ├── middleware/
│   │   │   └── auth.ts           # JWT & role-based middleware
│   │   ├── utils/
│   │   │   └── helpers.ts        # EMI calculation, risk detection
│   │   └── services/             # Business logic services
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── seed.ts               # Seed data script
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home (redirects to login)
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   ├── admin/
│   │   │   ├── dashboard/        # Admin dashboard
│   │   │   ├── members/          # Member management
│   │   │   ├── contributions/    # Contributions list
│   │   │   ├── loans/            # Loan management
│   │   │   └── repayments/       # Repayment tracking
│   │   └── member/
│   │       ├── dashboard/        # Member dashboard
│   │       ├── savings/          # Savings/contributions
│   │       └── loans/            # Member's loans
│   ├── components/
│   │   └── Navbar.tsx            # Navigation component
│   ├── services/
│   │   ├── api.ts                # Axios instance with interceptors
│   │   └── index.ts              # API service functions
│   ├── hooks/
│   │   └── index.ts              # Custom hooks (useAuth, useAsync)
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   ├── globals.css               # Global styles
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
└── README.md                     # This file
```

---

## 🔐 API ENDPOINTS

### Authentication
```
POST   /api/auth/login              # Login user
POST   /api/auth/register           # Register new user
```

### Members (Admin only)
```
GET    /api/members                 # Get all members
POST   /api/members                 # Add new member
PUT    /api/members/:id             # Update member
DELETE /api/members/:id             # Delete member
GET    /api/members/:id/stats       # Get member statistics
```

### Contributions
```
POST   /api/contributions           # Add contribution (Admin)
GET    /api/contributions           # Get all contributions (Admin)
GET    /api/contributions/member/:memberId  # Get member contributions
PUT    /api/contributions/:id/status       # Update status (Admin)
```

### Loans
```
POST   /api/loans                   # Issue loan (Admin)
GET    /api/loans                   # Get all loans (Admin)
GET    /api/loans/member/:memberId  # Get member's loans
GET    /api/loans/:id               # Get loan details
PATCH  /api/loans/:id/close         # Close loan (Admin)
```

### Repayments
```
POST   /api/repayments              # Record repayment (Admin)
GET    /api/repayments              # Get all repayments (Admin)
GET    /api/repayments/:loanId      # Get loan's repayments
POST   /api/repayments/check-overdue # Check and mark overdue
```

### Dashboard
```
GET    /api/dashboard/stats         # Admin dashboard stats
GET    /api/dashboard/member        # Member dashboard
```

---

## 💾 DATABASE MODELS

### User
- `id` (UUID)
- `name` (String)
- `email` (String, unique)
- `password` (String, hashed)
- `role` (ADMIN | MEMBER)
- `createdAt`, `updatedAt`
- Relations: memberProfile, contributions, loans, repayments, notifications

### MemberProfile
- `id` (UUID)
- `userId` (FK)
- `phone` (String)
- `address` (String)

### Contribution
- `id` (UUID)
- `memberId` (FK)
- `amount` (Float)
- `month`, `year` (Int)
- `status` (PAID | MISSED | PENDING)
- Unique constraint: memberId + month + year

### Loan
- `id` (UUID)
- `memberId` (FK)
- `amount` (Float)
- `interestRate` (Float)
- `durationMonths` (Int)
- `emiAmount` (Float, calculated)
- `startDate` (DateTime)
- `status` (ACTIVE | COMPLETED | CLOSED)

### Repayment
- `id` (UUID)
- `loanId` (FK)
- `amount` (Float)
- `dueDate` (DateTime)
- `paidDate` (DateTime, nullable)
- `status` (PAID | OVERDUE | PENDING)

### Notification
- `id` (UUID)
- `userId` (FK)
- `message` (String)
- `type` (INFO | WARNING | ALERT)
- `isRead` (Boolean)

---

## 🚀 SETUP & INSTALLATION

### Prerequisites
- Node.js >= 18
- npm or yarn
- PostgreSQL 12+
- Git

### Step 1: Clone & Setup Repository

```bash
cd Hakathone

# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your PostgreSQL credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/dhukuti_db"
# JWT_SECRET="your_secret_key_here"
# PORT=5000

# Generate Prisma client
npm run prisma:generate

# Create database and run migrations
npm run db:push

# Seed database with example data
npm run prisma:seed

# Start backend server
npm run dev
```

Backend will be running at `http://localhost:5000`

### Step 3: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local file (optional)
# NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

Frontend will be running at `http://localhost:3000`

---

## 📊 DEMO CREDENTIALS

After seeding the database:

### Admin Account
```
Email: admin@dhukuti.com
Password: admin123
```

### Member Accounts
```
Email: ram@dhukuti.com / Password: member123
Email: sita@dhukuti.com / Password: member123
Email: hari@dhukuti.com / Password: member123
Email: priya@dhukuti.com / Password: member123
Email: rajesh@dhukuti.com / Password: member123
```

---

## 🧮 BUSINESS LOGIC

### EMI Calculation
```
Monthly Rate = Annual Rate / 100 / 12
EMI = (Principal × Monthly Rate × (1 + Monthly Rate)^n) / ((1 + Monthly Rate)^n - 1)

Example: ₹50,000 at 12% p.a. for 12 months
EMI = ₹4,393.30
```

### Risk Levels
- **LOW**: 0 missed payments
- **MEDIUM**: 1-2 missed payments
- **HIGH**: 3+ missed payments

### Overdue Detection
- Automatically marks repayments as OVERDUE when current date > dueDate
- Triggered on every repayment check operation

### Collection Rate
```
Collection Rate = (Total Members - Missed Contributions) / Total Members × 100%
```

---

## 🎨 UI COMPONENTS

### Color Scheme
- **Green** (#10B981): Paid, Success, Active
- **Yellow** (#F59E0B): Pending, Warning
- **Red** (#EF4444): Overdue, Danger, Alert
- **Blue** (#3B82F6): Primary, Info

### Typography
- Headings: Bold, Blue-600
- Body: Gray-700, Readable sans-serif
- Badges: Colored with status information

---

## 📱 RESPONSIVE DESIGN

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Grid layouts adapt from 1 column mobile to 4 columns desktop
- Tables use horizontal scroll on mobile

---

## 🔒 SECURITY FEATURES

- JWT token validation on all protected routes
- Password hashing with bcryptjs (10 salt rounds)
- Role-based access control (RBAC)
- Request middleware validation
- HTTP-only localStorage for tokens (frontend best practice)
- CORS enabled for frontend origin

---

## 📈 SCALABILITY

- Modular controller architecture
- Separation of concerns (controllers, services, middleware)
- Prisma for efficient database queries
- Indexed unique constraints on frequently queried fields
- Pagination-ready endpoints

---

## 🛠️ DEVELOPMENT

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

### Database Migrations

```bash
cd backend

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (CAUTION: deletes all data)
npm run db:reset

# Seed again
npm run prisma:seed
```

---

## 📝 IMPORTANT NOTES

1. **Database**: Ensure PostgreSQL is running before starting backend
2. **Environment Variables**: Copy `.env.example` to `.env` and update credentials
3. **CORS**: Frontend URL must be added to CORS whitelist in production
4. **JWT Secret**: Change `JWT_SECRET` in production
5. **API URL**: Update `NEXT_PUBLIC_API_URL` in frontend if backend URL changes

---

## 🐛 TROUBLESHOOTING

### Backend won't start
- Check PostgreSQL is running: `psql --version`
- Verify DATABASE_URL in .env
- Run: `npm run db:push`

### Frontend can't connect to API
- Check backend is running: `curl http://localhost:5000/api/health`
- Verify API URL in `next.config.js`
- Check CORS headers in backend

### Database errors
- Run: `npm run db:reset` to reset database
- Run: `npm run prisma:seed` to reseed

### Port already in use
- Backend: `lsof -i :5000` to find process
- Frontend: `lsof -i :3000` to find process
- Change PORT in .env or environment

---

## 📦 PRODUCTION DEPLOYMENT

### Backend (Heroku/Railway example)
```bash
cd backend
# Set buildpack: heroku buildpacks:set heroku/nodejs
# Set environment variables in Heroku dashboard
# DATABASE_URL, JWT_SECRET, NODE_ENV=production
git push heroku main
```

### Frontend (Vercel)
```bash
cd frontend
# Connect to Vercel
# Add environment variable: NEXT_PUBLIC_API_URL=<backend_url>
# Deploy automatically on git push
```

---

## 📄 LICENSE

This project is built for educational purposes as Hakathone project.

---

## 👨‍💻 SUPPORT

For issues, questions, or suggestions:
1. Check existing issues in documentation
2. Verify all steps in setup guide
3. Check TROUBLESHOOTING section
4. Review test credentials and demo data

---

## 📋 TASK CHECKLIST

- [x] Backend project setup
- [x] Prisma schema with all models
- [x] Express server with middleware
- [x] Auth (login/register) with JWT
- [x] Member management endpoints
- [x] Contribution tracking
- [x] Loan issuance with EMI calculation
- [x] Repayment tracking with overdue detection
- [x] Risk detection system
- [x] Admin dashboard with analytics
- [x] Member personal dashboard
- [x] Frontend with Next.js App Router
- [x] Login page
- [x] Admin pages (Dashboard, Members, Contributions, Loans, Repayments)
- [x] Member pages (Dashboard, Savings, Loans)
- [x] Navbar with role-based navigation
- [x] API integration with Axios
- [x] Charts and visualizations (Recharts)
- [x] Notifications system
- [x] Seed script with demo data
- [x] Comprehensive documentation

---

**Built with ❤️ for Nepal's community savings groups**
