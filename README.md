# Bus Fee Manager

Bus fee tracking and reminders platform with a complete authentication flow.

## Tech Stack

- Frontend: React (Next.js App Router) + Tailwind CSS
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose

## Authentication Features

- User registration with name, email, and password
- Email format validation on backend
- Password hashing with bcrypt before save
- Duplicate user prevention with unique email
- Login with email/password and JWT issuance
- JWT auth via HttpOnly cookie and Bearer token support
- Protected API routes using auth middleware
- Protected frontend pages via Next middleware
- Logout endpoint that clears auth cookie
- Forgot password flow with reset token + email link
- Reset password endpoint with token validation
- Password strength validation rules

## Project Structure

The project uses this structure:

```text
Backend/
  models/
  routes/
  controllers/
  middleware/

Frontend/
  components/
  app/          (Next.js App Router pages)
```

Note: Your request mentioned a pages folder. In this repository, frontend pages are implemented under Frontend/app, which is the Next.js App Router equivalent.

## Setup Guide

1. Install backend dependencies.

```bash
cd Backend
npm install
```

2. Create Backend/.env using Backend/.env.example as reference.

Required variables for auth:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/chacha
FRONTEND_URL=http://localhost:3000
JWT_SECRET=replace-with-a-strong-random-secret
NODE_ENV=development
```

Optional variables for forgot-password emails:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@example.com
```

3. Start backend server.

```bash
cd Backend
npm start
```

4. Install frontend dependencies.

```bash
cd Frontend
npm install
```

5. Create Frontend/.env.local.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

6. Start frontend server.

```bash
cd Frontend
npm run dev
```

7. Open app at http://localhost:3000.

## Security Notes

- Passwords are hashed using bcrypt in the user model pre-save hook.
- JWT is signed with JWT_SECRET and sent in an HttpOnly cookie.
- Auth middleware protects backend business routes.
- Frontend middleware blocks unauthenticated users from protected pages.
- Never commit real secrets to version control.

## Authentication API Endpoints

Base URL: /api/auth

- POST /signup
  - Body: { name, email, password }
  - Success: 201 Created, sets auth cookie, returns user + token

- POST /login
  - Body: { email, password }
  - Success: 200 OK, sets auth cookie, returns user + token

- POST /logout
  - Body: none
  - Success: 200 OK, clears auth cookie

- GET /me
  - Auth: required
  - Success: 200 OK, returns current user profile

- POST /change-password
  - Auth: required
  - Body: { currentPassword, newPassword }
  - Success: 200 OK

- POST /forgot-password
  - Body: { email }
  - Success: 200 OK (generic response to avoid account enumeration)

- POST /reset-password
  - Body: { token, newPassword }
  - Success: 200 OK

## Protected Backend Routes

These routes require authentication via JWT middleware:

- /api/students
- /api/dashboard
- /api/reports
- /api/settings
- /api/payments

## Frontend Auth Pages

- /signup
- /login
- /dashboard (protected)
- /forgot-password
- /reset-password

## Legacy Ownership Migration

If you had data before per-user isolation was added, use this one-time script to assign ownerless records to a specific user.

Dry-run (safe preview):

```bash
cd Backend
npm run migrate:ownership -- --email owner@example.com
```

Apply student migration:

```bash
cd Backend
npm run migrate:ownership -- --email owner@example.com --apply
```

Claim ownerless global settings/stats docs for a user (optional):

```bash
cd Backend
npm run migrate:ownership -- --email owner@example.com --claim-settings --claim-stats --apply
```

Limit student migration to selected IDs:

```bash
cd Backend
npm run migrate:ownership -- --email owner@example.com --student-ids 65f...,65e... --apply
```
