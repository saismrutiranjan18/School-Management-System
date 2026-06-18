# School Management System

A full-stack web application for comprehensive school administration. Manages students, staff, academics, finance, communication, library, and transport — built for four user roles across a single integrated platform.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#database-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [User Roles](#user-roles)
- [Modules](#modules)
- [Deployment](#deployment)
- [Development Phases](#development-phases)
- [Team](#team)

---

## Overview

The School Management System (SMS) is a production-ready web application that consolidates all core school operations into a single platform. It replaces fragmented spreadsheets and manual registers with a unified system accessible to administrators, teachers, students, and parents.

**Live Application:** `https://school-management-system-lovat-eta.vercel.app/login`  
**API Base URL:** `https://school-management-system-lovat-eta.vercel.app/api`

---

## Features

**Authentication and Security**
- JWT-based stateless authentication with 7-day token expiry
- BCrypt password hashing (strength factor 10)
- Role-based access control across four user roles
- Protected routes with per-role middleware enforcement

**Academic Management**
- Drag-and-drop timetable builder with teacher double-booking prevention
- Subject-wise attendance tracking with automatic email alerts to parents
- Exam scheduling with bulk marks entry and absent flag support
- Automated PDF report card generation (percentage, letter grade, GPA, class rank)

**Finance Management**
- Fee structure definition per class with multiple frequency types
- Payment recording with auto-generated receipt numbers
- Partial payment support with real-time balance tracking
- PDF receipt (A5) and full invoice (A4) generation
- Expense tracking with monthly revenue vs expense reports

**Communication**
- School-wide and class-specific announcements with priority levels
- Real-time push notifications via Socket.io (room-based)
- Email blast to target audience on announcement creation
- In-app parent-teacher messaging with typing indicators and read receipts
- Event calendar with seven event types and multi-day event support

**Add-on Modules**
- Library catalog with issue/return tracking and fine calculation
- Transport route, vehicle, and driver management with student allocation
- Analytics dashboard with Recharts visualisations (bar, line, radar, pie)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS |
| State Management | Redux Toolkit, React Query (TanStack) |
| Real-time | Socket.io (client + server) |
| Charts | Recharts |
| Drag and Drop | @dnd-kit/core |
| HTTP Client | Axios |
| Backend | Node.js 18, Express.js |
| Authentication | JSON Web Token, BCrypt |
| Database | PostgreSQL 15 |
| DB Client | pg (node-postgres) |
| PDF Generation | PDFKit |
| Email | Nodemailer (Gmail SMTP) |
| File Uploads | Multer + Cloudinary |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Database Hosting | Neon (managed PostgreSQL) |

---

## Project Structure

```
school-management-system/
├── client/                          # React frontend
│   ├── src/
│   │   ├── api/                     # Axios instance and API call functions
│   │   ├── app/                     # Redux store configuration
│   │   ├── components/              # Shared UI components
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context/                 # Socket.io context provider
│   │   ├── features/                # Redux slices
│   │   │   └── auth/
│   │   ├── hooks/                   # Custom hooks (useNotifications)
│   │   ├── pages/
│   │   │   ├── admin/               # Admin-only pages
│   │   │   ├── teacher/             # Teacher-only pages
│   │   │   ├── student/             # Student-only pages
│   │   │   ├── parent/              # Parent-only pages
│   │   │   └── shared/              # Shared pages (messaging, calendar)
│   │   ├── routes/                  # ProtectedRoute component
│   │   └── utils/                   # Helper functions (PDF download)
│   ├── .env.development
│   ├── .env.production
│   └── vercel.json
│
└── server/                          # Node.js backend
    ├── config/
    │   ├── db.js                    # PostgreSQL connection pool
    │   └── cloudinary.js            # Cloudinary configuration
    ├── controllers/                 # Route handler functions
    │   ├── auth.controller.js
    │   ├── student.controller.js
    │   ├── attendance.controller.js
    │   ├── marks.controller.js
    │   ├── feeCollection.controller.js
    │   ├── feeStructure.controller.js
    │   ├── announcement.controller.js
    │   ├── message.controller.js
    │   ├── event.controller.js
    │   ├── library.controller.js
    │   ├── transport.controller.js
    │   ├── analytics.controller.js
    │   └── financialReport.controller.js
    ├── middleware/
    │   ├── auth.middleware.js        # JWT protect + authorizeRoles
    │   └── upload.middleware.js      # Multer + Cloudinary storage
    ├── routes/                      # Express routers
    ├── socket/
    │   └── index.js                 # Socket.io server with JWT auth
    ├── utils/
    │   ├── mailer.js                # Nodemailer helpers
    │   ├── grading.js               # Grade/GPA calculation
    │   ├── receipt.js               # Receipt number generator
    │   ├── receiptPDF.js            # Receipt and invoice PDF
    │   └── reportCard.js            # Report card PDF
    ├── db/
    │   └── schema.sql               # Full PostgreSQL schema
    └── index.js                     # Express app entry point
```

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 15 or higher (or a Neon account for managed cloud PostgreSQL)
- A Cloudinary account (free tier)
- A Gmail account with App Password enabled

### Database Setup

**Option A — Local PostgreSQL**

```bash
psql -U postgres
CREATE DATABASE sms_db;
\q
psql -U postgres -d sms_db -f server/db/schema.sql
```

**Option B — Neon (recommended for deployment)**

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string from the dashboard
3. Open the Neon SQL Editor and paste the contents of `server/db/schema.sql`
4. Run the schema

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Fill in all values in .env (see Environment Variables section)
npm run dev
```

The server starts on `http://localhost:5000`.

Verify the setup:
```bash
curl http://localhost:5000/api/health
# Expected: {"status":"OK","message":"SMS API is running"}
```

### Frontend Setup

```bash
cd client
npm install
# Create .env.development (see Environment Variables section)
npm run dev
```

The frontend starts on `http://localhost:5173`.

**Default login credentials:**

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@school.com | password |
| Teacher | teacher@school.com | Test@1234 |
| Student | student@school.com | Test@1234 |
| Parent | parent@school.com | Test@1234 |



---

## Environment Variables

### Backend — `server/.env`

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/sms_db

# Authentication
JWT_SECRET=your_minimum_32_character_random_secret_key
JWT_EXPIRES_IN=7d

# Email (Gmail SMTP)
# Generate App Password at: Google Account > Security > 2-Step Verification > App Passwords
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_16_character_app_password
EMAIL_FROM=SMS School <yourgmail@gmail.com>

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend — `client/.env.development`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Frontend — `client/.env.production`

```env
VITE_API_URL=https://sms-server.onrender.com/api
VITE_SOCKET_URL=https://sms-server.onrender.com
```

---

## API Reference

All endpoints except `/api/auth/login` require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/login | None | Login; returns JWT and user object |
| GET | /api/auth/me | JWT | Returns current user profile |

### Students

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/students | Admin, Teacher | List all students |
| POST | /api/students | Admin | Create student and user account |
| PUT | /api/students/:id | Admin | Update student profile |
| DELETE | /api/students/:id | Admin | Delete student |
| POST | /api/students/:id/photo | Admin | Upload photo to Cloudinary |

### Attendance

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/attendance | Admin, Teacher | Bulk mark attendance for a class |
| GET | /api/attendance/:classId/:subjectId/:date | Admin, Teacher | Attendance sheet for marking |
| GET | /api/attendance/student/:studentId | All | Student attendance history |
| GET | /api/attendance/report/:classId | Admin, Teacher | Class attendance report |

### Marks and Exams

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/exams | Admin | Schedule an examination |
| PUT | /api/exams/:id | Admin | Update or publish exam results |
| POST | /api/marks | Admin, Teacher | Bulk marks entry |
| GET | /api/marks/report-card/:studentId/:examId | All | Report card data (JSON) |
| GET | /api/marks/report-card/:studentId/:examId/pdf | All | Download report card PDF |

### Fees

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/fees/structure | Admin | Create fee structure for a class |
| POST | /api/fees/pay | Admin | Record a fee payment |
| GET | /api/fees/student/:studentId | All | Student dues and payment history |
| GET | /api/fees/receipt/:receiptNo | All | Download receipt PDF |
| GET | /api/fees/invoice/:studentId | All | Download full invoice PDF |
| GET | /api/fees/outstanding | Admin | All students with pending dues |
| GET | /api/fees/report/financial | Admin | Financial summary report |
| GET | /api/fees/report/financial/pdf | Admin | Export financial report PDF |

### Communication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/announcements | All | Role-filtered announcements |
| POST | /api/announcements | Admin, Teacher | Create announcement with email blast |
| GET | /api/messages/conversations | All | Inbox conversation list |
| GET | /api/messages/conversation/:userId | All | Full message thread |
| POST | /api/messages | All | Send a message |
| GET | /api/events | All | Calendar events |
| POST | /api/events | Admin, Teacher | Create calendar event |

### Library

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/library/books | All | Book catalog |
| POST | /api/library/books | Admin | Add a book |
| POST | /api/library/issue | Admin | Issue book to student |
| POST | /api/library/return/:issueId | Admin | Return book with fine calculation |
| GET | /api/library/overdue | Admin | Overdue books list |

### Transport

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/transport/routes | All | All transport routes |
| POST | /api/transport/routes | Admin | Create route with stops |
| POST | /api/transport/assign | Admin | Assign student to route |
| GET | /api/transport/student/:studentId | All | Student transport details |

### Analytics

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/analytics/dashboard | All | Role-specific dashboard data |

---

## User Roles

### Super Admin
Full access to all modules. Can create and manage all user accounts, configure fee structures, publish exam results, view all financial reports, and access the analytics dashboard.

### Teacher
Can mark and view attendance for assigned classes, enter marks for assigned exams, view their own timetable, post class-specific announcements, and communicate with parents via in-app messaging.

### Student
Read-only access to own attendance (with shortage warnings), published exam results with downloadable PDF report card, class timetable, fee status, school notices, and event calendar.

### Parent
View their child's attendance, marks, fee dues, and timetable. Receive automatic email alerts when their child is marked absent. Communicate with teachers via in-app messaging.

---

## Modules

| Module | Status | Key Capabilities |
|---|---|---|
| Student Management | Complete | Enrollment, profile, photo upload, guardian info, search |
| Staff Management | Complete | Teacher profiles, subject assignment, salary |
| Class and Subject Setup | Complete | Class/section CRUD, subject codes, teacher assignment |
| Timetable Builder | Complete | Drag-drop grid, 8 periods, conflict detection |
| Attendance System | Complete | Subject-wise, upsert, email alerts, Socket.io notifications |
| Exams and Marks | Complete | Scheduling, bulk entry, grading, PDF report cards |
| Fee Structure | Complete | Per-class fee types, multiple frequency options |
| Fee Collection | Complete | Payments, partial dues, receipts, invoices, reports |
| Communication | Complete | Announcements, Socket.io, email blast, messaging, calendar |
| Library | Complete | Catalog, issue/return, fine calculation, overdue tracking |
| Transport | Complete | Routes, stops, vehicles, drivers, student allocation |
| Analytics Dashboard | Complete | Role-specific data, four chart types, toppers list |

---

## Deployment

The application is deployed on free-tier infrastructure.

### Frontend — Vercel

1. Connect the `client` repository to Vercel
2. Set Framework Preset to **Vite**, Output Directory to **dist**
3. Add environment variables:
   - `VITE_API_URL` = `https://sms-server.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://sms-server.onrender.com`
4. Deploy

### Backend — Render

1. Create a new Web Service on Render, connected to the `server` repository
2. Set Build Command: `npm install`, Start Command: `npm start`
3. Set Runtime to **Node**, Region to **Singapore**
4. Add all environment variables from `server/.env` (production values)
5. Enable WebSocket support in Service Settings
6. Deploy

### Database — Neon

1. Create a project at neon.tech
2. Copy the connection string (includes `?sslmode=require`)
3. Set as `DATABASE_URL` in Render environment variables
4. Run schema SQL in Neon SQL Editor

### Auto-deploy

Both Vercel and Render watch the connected GitHub repositories. Every push to `main` triggers an automatic redeploy.

**Note:** Render free tier spins down after 15 minutes of inactivity. The first request after a sleep period takes approximately 30 seconds to respond. This is acceptable for development and demonstration purposes.

---

## Development Phases

| Phase | Timeline | Scope |
|---|---|---|
| Phase 1 — Foundation | Month 1–2 | Project setup, JWT authentication, student and staff CRUD, database schema |
| Phase 2 — Academics | Month 3–4 | Classes, subjects, timetable builder, attendance, exams, marks, PDF report cards |
| Phase 3 — Finance | Month 5–6 | Fee structure, fee collection, PDF receipts and invoices, expense tracking, financial reports |
| Phase 4 — Communication | Month 7–8 | Announcements, Socket.io notifications, in-app messaging, event calendar |
| Phase 5 — Add-ons and Launch | Month 9–10 | Library, transport, analytics dashboard, deployment |

---

## Grading Scale

| Percentage | Letter Grade | GPA | Remark |
|---|---|---|---|
| 90 – 100 | A+ | 4.0 | Outstanding |
| 80 – 89 | A | 3.7 | Excellent |
| 70 – 79 | B+ | 3.3 | Very Good |
| 60 – 69 | B | 3.0 | Good |
| 50 – 59 | C | 2.0 | Average |
| 40 – 49 | D | 1.0 | Below Average |
| Below 40 | F | 0.0 | Fail |

A student is marked **FAIL** if any subject falls below 40% or if any subject is absent.

---

## Socket.io Event Reference

| Event | Direction | Description |
|---|---|---|
| `notification` | Server → Client | General notification payload (announcement, absence, fee payment) |
| `new_message` | Server → Client | New message delivered to recipient's personal room |
| `user_typing` | Server → Client | Typing indicator sent to conversation partner |
| `user_stop_typing` | Server → Client | Typing stopped indicator |
| `join_conversation` | Client → Server | Join a conversation room for typing indicators |
| `connected` | Server → Client | Confirmation of successful WebSocket connection |

Room naming convention:
- `user:<id>` — Personal notifications
- `role:<role>` — Role-based broadcasts (e.g., `role:teacher`)
- `role:all` — School-wide broadcasts

---

## License

