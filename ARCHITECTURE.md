# 🏗️ Dhukuti Architecture & System Design

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                        │
│               Next.js 14 (App Router + TypeScript)         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Login Page          Admin Pages            Member Pages   │
│  ┌──────────────┐    ┌──────────────┐      ┌──────────────┐│
│  │  • Login     │    │• Dashboard   │      │• Dashboard   ││
│  │              │    │• Members     │      │• Savings     ││
│  │              │    │• Contributions│      │• Loans       ││
│  │              │    │• Loans       │      │              ││
│  │              │    │• Repayments  │      │              ││
│  └──────────────┘    └──────────────┘      └──────────────┘│
│                                                              │
│  ┌────────────────────────────────────────────────────────┐│
│  │          Navbar (Role-based Navigation)                ││
│  └────────────────────────────────────────────────────────┘│
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────────┐│
│  │    API Service Layer (Axios Instance + Interceptors)   ││
│  │    • Token Management                                  ││
│  │    • Request/Response Interceptors                     ││
│  │    • Auto-redirect on 401                              ││
│  └────────────────────────────────────────────────────────┘│
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP/REST
                         │ (Port 3000 → 5000)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND LAYER                          │
│              Express.js + TypeScript + Prisma              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │         Request Processing Layer                      │ │
│  │  ┌────────────────────────────────────────┐          │ │
│  │  │  Middleware Stack                      │          │ │
│  │  │  • CORS Handler                        │          │ │
│  │  │  • JSON Parser                         │          │ │
│  │  │  • Authentication (JWT)                │          │ │
│  │  │  • Authorization (Role-based)          │          │ │
│  │  └────────────────────────────────────────┘          │ │
│  └──────────────────────────────────────────────────────┘ │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           Route Handler & Controller Layer            │ │
│  │                                                       │ │
│  │  ┌─────────────────────────────────────────────────┐│ │
│  │  │  Auth Routes                     (6 endpoints) ││ │
│  │  │  • POST   /login                               ││ │
│  │  │  • POST   /register                            ││ │
│  │  └─────────────────────────────────────────────────┘│ │
│  │                                                       │ │
│  │  ┌─────────────────────────────────────────────────┐│ │
│  │  │  Members Routes (Admin Only)     (5 endpoints) ││ │
│  │  │  • GET    /members                             ││ │
│  │  │  • POST   /members                             ││ │
│  │  │  • PUT    /members/:id                         ││ │
│  │  │  • DELETE /members/:id                         ││ │
│  │  │  • GET    /members/:id/stats                   ││ │
│  │  └─────────────────────────────────────────────────┘│ │
│  │                                                       │ │
│  │  ┌─────────────────────────────────────────────────┐│ │
│  │  │  Contributions Routes              (4 endpoints)││ │
│  │  │  • POST   /contributions                        ││ │
│  │  │  • GET    /contributions                        ││ │
│  │  │  • GET    /contributions/member/:id             ││ │
│  │  │  • PUT    /contributions/:id/status             ││ │
│  │  └─────────────────────────────────────────────────┘│ │
│  │                                                       │ │
│  │  ┌─────────────────────────────────────────────────┐│ │
│  │  │  Loans Routes (Admin Only)        (5 endpoints) ││ │
│  │  │  • POST   /loans                                ││ │
│  │  │  • GET    /loans                                ││ │
│  │  │  • GET    /loans/member/:id                     ││ │
│  │  │  • GET    /loans/:id                            ││ │
│  │  │  • PATCH  /loans/:id/close                      ││ │
│  │  └─────────────────────────────────────────────────┘│ │
│  │                                                       │ │
│  │  ┌─────────────────────────────────────────────────┐│ │
│  │  │  Repayments Routes (Admin Only)    (4 endpoints)││ │
│  │  │  • POST   /repayments                           ││ │
│  │  │  • GET    /repayments                           ││ │
│  │  │  • GET    /repayments/:loanId                   ││ │
│  │  │  • POST   /repayments/check-overdue             ││ │
│  │  └─────────────────────────────────────────────────┘│ │
│  │                                                       │ │
│  │  ┌─────────────────────────────────────────────────┐│ │
│  │  │  Dashboard Routes                  (2 endpoints)││ │
│  │  │  • GET    /dashboard/stats (Admin)              ││ │
│  │  │  • GET    /dashboard/member                     ││ │
│  │  └─────────────────────────────────────────────────┘│ │
│  └──────────────────────────────────────────────────────┘ │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │       Business Logic Layer (Controllers)             │ │
│  │                                                       │ │
│  │  • authController          (Auth logic)             │ │
│  │  • memberController        (Member CRUD)            │ │
│  │  • contributionController  (Contribution tracking)  │ │
│  │  • loanController          (Loan management)        │ │
│  │  • repaymentController     (Repayment recording)    │ │
│  │  • dashboardController     (Analytics)              │ │
│  └──────────────────────────────────────────────────────┘ │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │       Utilities Layer (Helper Functions)             │ │
│  │                                                       │ │
│  │  • calculateEMI()           (EMI formula)            │ │
│  │  • calculateRiskLevel()     (Risk detection)         │ │
│  │  • generateRepaymentSchedule()  (Schedule gen)       │ │
│  │  • hashPassword()           (Password security)      │ │
│  │  • generateToken()          (JWT creation)           │ │
│  │  • comparePassword()        (Auth verification)      │ │
│  └──────────────────────────────────────────────────────┘ │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │         ORM Layer (Prisma Client)                    │ │
│  │  • Generates SQL queries                            │ │
│  │  • Manages connections                              │ │
│  │  • Handles transactions                             │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────────────┘
                         │ SQL
                         │ (Port 5432)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                           │
│                   PostgreSQL Database                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  users       │  │ member_      │  │ contributions│    │
│  │  ────────    │  │ profiles     │  │  ────────    │    │
│  │  • id (PK)   │  │  ────────    │  │  • id (PK)   │    │
│  │  • name      │  │  • id (PK)   │  │  • memberId  │    │
│  │  • email     │  │  • userId(FK)│  │  • amount    │    │
│  │  • password  │  │  • phone     │  │  • month     │    │
│  │  • role      │  │  • address   │  │  • year      │    │
│  │  • createdAt │  └──────────────┘  │  • status    │    │
│  └──────────────┘                      └──────────────┘    │
│         │                                                    │
│         │                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  loans       │  │ repayments   │  │notifications│    │
│  │  ────────    │  │  ────────    │  │  ────────    │    │
│  │  • id (PK)   │  │  • id (PK)   │  │  • id (PK)   │    │
│  │  • memberId  │  │  • loanId(FK)│  │  • userId(FK)│    │
│  │  • amount    │  │  • amount    │  │  • message   │    │
│  │  • emiAmount │  │  • dueDate   │  │  • type      │    │
│  │  • status    │  │  • paidDate  │  │  • isRead    │    │
│  │  • startDate │  │  • status    │  │  • createdAt │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

### Authentication Flow
```
┌─────────────┐
│ User Login  │
│  (Email)    │
└──────┬──────┘
       │
       ↓
┌──────────────────────────┐
│ Frontend: Login Page     │
│ Collects credentials     │
└──────┬───────────────────┘
       │
       ↓ POST /auth/login
┌──────────────────────────┐
│ Backend: authController  │
│ • Find user              │
│ • Verify password        │
│ • Generate JWT token     │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Response: User + Token   │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Frontend: Store token    │
│ localStorage.setItem()   │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Redirect to Dashboard    │
│ (Based on role)          │
└──────────────────────────┘
```

### Loan Creation Flow
```
┌──────────────────┐
│ Admin Issues     │
│ New Loan         │
└────────┬─────────┘
         │
         ↓ POST /loans
┌────────────────────────────┐
│ Backend: loanController    │
│ • Receive loan details     │
└────────┬───────────────────┘
         │
         ↓
┌────────────────────────────┐
│ Business Logic:            │
│ • Calculate EMI            │  EMI = (Principal × Rate × (1+Rate)^n)
│ • Validate amount          │      / ((1+Rate)^n - 1)
│ • Check duration           │
└────────┬───────────────────┘
         │
         ↓
┌────────────────────────────┐
│ Database Operations:       │
│ • Create Loan record       │
│ • Generate Repayment       │
│   Schedule (n months)      │
│ • Create Notification      │
└────────┬───────────────────┘
         │
         ↓
┌────────────────────────────┐
│ Response: Loan Created     │
│ • Loan Details             │
│ • EMI Amount               │
│ • Total Repayments         │
└────────┬───────────────────┘
         │
         ↓
┌────────────────────────────┐
│ Frontend: Update UI        │
│ • Show loan details        │
│ • Display EMI info         │
└────────────────────────────┘
```

---

## 🔄 Component Interactions

### Request Flow with Authentication
```
1. Client makes request with JWT token in Authorization header
2. Express.json() parser reads request body
3. authMiddleware extracts token from header
4. JWT.verify() validates token signature
5. If valid: req.user is populated with user data
6. If invalid: 401 Unauthorized is returned
7. adminMiddleware checks if role === 'ADMIN'
8. If not admin: 403 Forbidden is returned
9. If valid: Controller function executes
10. Controller executes database queries via Prisma
11. Response is sent back to client
12. Frontend receives response and updates state
```

---

## 📈 Scalability Architecture

```
                    ┌──────────────────┐
                    │  Load Balancer   │
                    │  (Nginx/HAProxy) │
                    └────┬────┬────┬───┘
                         │    │    │
         ┌───────────────┘    │    └──────────────┐
         │                    │                   │
         ↓                    ↓                    ↓
    ┌────────────┐    ┌────────────┐    ┌────────────┐
    │ Backend    │    │ Backend    │    │ Backend    │
    │ Instance 1 │    │ Instance 2 │    │ Instance 3 │
    └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                    ┌───────▼───────┐
                    │ PostgreSQL    │
                    │ Connection    │
                    │ Pool          │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │ Primary DB    │
                    │ Replication   │
                    │ (Standby)     │
                    └───────────────┘
```

---

## 🔐 Security Layers

```
                    Request
                      │
                      ↓
        ┌─────────────────────────────┐
        │ Layer 1: CORS Validation    │
        │ • Check origin              │
        │ • Prevent cross-site reqs   │
        └──────────┬──────────────────┘
                   │
                   ↓
        ┌─────────────────────────────┐
        │ Layer 2: Input Validation   │
        │ • Validate request body     │
        │ • Sanitize inputs           │
        │ • Type checking             │
        └──────────┬──────────────────┘
                   │
                   ↓
        ┌─────────────────────────────┐
        │ Layer 3: Authentication     │
        │ • Check JWT token           │
        │ • Verify signature          │
        │ • Check expiry              │
        └──────────┬──────────────────┘
                   │
                   ↓
        ┌─────────────────────────────┐
        │ Layer 4: Authorization      │
        │ • Check user role           │
        │ • Verify permissions        │
        │ • Check resource ownership  │
        └──────────┬──────────────────┘
                   │
                   ↓
        ┌─────────────────────────────┐
        │ Layer 5: Business Logic     │
        │ • Execute operations        │
        │ • Validate business rules   │
        └──────────┬──────────────────┘
                   │
                   ↓
        ┌─────────────────────────────┐
        │ Layer 6: Data Persistence   │
        │ • Database transaction      │
        │ • Data validation           │
        └─────────────────────────────┘
```

---

## 🎯 Microservices Ready

The architecture is designed to scale to microservices:

```
Monolithic (Current)          Microservices (Future)
┌────────────────────┐       ┌──────────────┐
│  Single Express    │       │ Auth Service │
│  Application       │  ───→ │              │
│                    │       └──────────────┘
│  • Auth            │       ┌──────────────┐
│  • Members         │       │ Member       │
│  • Contributions   │  ───→ │ Service      │
│  • Loans           │       │              │
│  • Repayments      │       └──────────────┘
│  • Dashboard       │       ┌──────────────┐
└────────────────────┘  ───→ │ Loan Service │
                              │              │
                              └──────────────┘
                              ┌──────────────┐
                         ───→ │ Notification │
                              │ Service      │
                              └──────────────┘
```

---

## 📱 Multi-Device Support

```
Desktop Browser
    │
    ├─→ ┌──────────────────┐
    │   │ Next.js Frontend │
    │   │ (Responsive)     │
    │   └──────────────────┘
    │
Tablet Browser
    │
Mobile Browser
    │
    └─→ Adapts to any screen size
        via Tailwind responsive classes
```

---

**Architecture designed for scalability, security, and maintainability! 🚀**
