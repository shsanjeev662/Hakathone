# API Testing Guide

Quick reference for testing Dhukuti APIs with curl or Postman.

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a Bearer token:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Auth Endpoints

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dhukuti.com",
    "password": "admin123"
  }'
```

Response:
```json
{
  "id": "uuid",
  "name": "Admin User",
  "email": "admin@dhukuti.com",
  "role": "ADMIN",
  "token": "eyJhbGc..."
}
```

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New User",
    "email": "newuser@dhukuti.com",
    "password": "password123"
  }'
```

---

## Members Endpoints (Admin Only)

### Get All Members
```bash
curl http://localhost:5000/api/members \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Add Member
```bash
curl -X POST http://localhost:5000/api/members \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@dhukuti.com",
    "password": "secure123",
    "phone": "9841234567",
    "address": "Kathmandu"
  }'
```

### Delete Member
```bash
curl -X DELETE http://localhost:5000/api/members/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Member Stats
```bash
curl http://localhost:5000/api/members/USER_ID/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Contributions Endpoints

### Add Contribution
```bash
curl -X POST http://localhost:5000/api/contributions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "MEMBER_ID",
    "amount": 5000,
    "month": 3,
    "year": 2024,
    "status": "PAID"
  }'
```

### Get All Contributions
```bash
curl http://localhost:5000/api/contributions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Member Contributions
```bash
curl http://localhost:5000/api/contributions/member/MEMBER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Loans Endpoints

### Issue Loan
```bash
curl -X POST http://localhost:5000/api/loans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "MEMBER_ID",
    "amount": 50000,
    "interestRate": 12,
    "durationMonths": 12
  }'
```

### Get All Loans
```bash
curl http://localhost:5000/api/loans \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Member Loans
```bash
curl http://localhost:5000/api/loans/member/MEMBER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Loan Details
```bash
curl http://localhost:5000/api/loans/LOAN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Repayments Endpoints

### Record Repayment
```bash
curl -X POST http://localhost:5000/api/repayments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "loanId": "LOAN_ID",
    "amount": 4393.30
  }'
```

### Get All Repayments
```bash
curl http://localhost:5000/api/repayments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Loan Repayments
```bash
curl http://localhost:5000/api/repayments/LOAN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Overdue
```bash
curl -X POST http://localhost:5000/api/repayments/check-overdue \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Dashboard Endpoints

### Admin Dashboard Stats
```bash
curl http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Member Dashboard
```bash
curl http://localhost:5000/api/dashboard/member \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Sample Workflow

### 1. Login as Admin
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dhukuti.com","password":"admin123"}' | jq -r '.token')

echo $TOKEN
```

### 2. Get Member ID
```bash
curl http://localhost:5000/api/members \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | .id' | head -1
```

### 3. Issue a Loan
```bash
MEMBER_ID="<member_id_from_step_2>"

curl -X POST http://localhost:5000/api/loans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"memberId\": \"$MEMBER_ID\",
    \"amount\": 100000,
    \"interestRate\": 15,
    \"durationMonths\": 24
  }"
```

### 4. Record a Repayment
```bash
LOAN_ID="<loan_id_from_step_3>"

curl -X POST http://localhost:5000/api/repayments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"loanId\": \"$LOAN_ID\",
    \"amount\": 5000
  }"
```

---

## Error Responses

### Unauthorized
```json
{
  "error": "No token provided"
}
```

### Forbidden
```json
{
  "error": "Admin access required"
}
```

### Validation Error
```json
{
  "error": "memberId, amount, month, and year are required"
}
```

---

## Tips

- Use `jq` to parse JSON responses
- Store token in variable for multiple requests
- Check status codes: 200/201 (success), 400 (validation), 401 (auth), 403 (forbidden), 500 (server error)
- All amounts are in Rupees (₹)

---

**Happy Testing! 🚀**
