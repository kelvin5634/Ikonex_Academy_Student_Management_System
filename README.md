# Ikonex Academy — Student Management System

Full-stack web app: **React + Vite (frontend)**, **Node.js + Express (backend)**, **MySQL (database)**.

## Features

- 🔐 Auth (hardcoded admin seeded into DB, bcryptjs hashed, JWT). Change password from dashboard.
- 🏫 Class Stream Management (Form 1–4, streams A–D, auto-seeded)
- 👨‍🎓 Student Management (CRUD, assign to stream, search/filter/paginate)
- 📚 Subject Management (CRUD, assign to streams)
- 📝 Assessment & Scoring (exam + CAT per subject per term; validation; no duplicates)
- 📊 Results Processing (totals, averages, grades, stream + form positions, ranking)
- 📑 PDF Reports — individual report card and class performance report (PDFKit)
- 📈 Dashboard analytics + charts (Recharts)
- 🔔 Toast notifications, confirmation dialogs
- 📱 Responsive UI (Tailwind CSS)

## Grading scale
| Marks | Grade | Remark |
|-------|-------|--------|
| 80–100 | A | Excellent |
| 70–79 | B | Well done |
| 60–69 | C | Good |
| 50–59 | D | Pass |
| 0–49 | E | Fail |

## Default admin
```
Email:    admin@ikonex.com
Password: admin@123
```

---

## Prerequisites
- Node.js 18+
- MySQL 8+ (XAMPP / MySQL Workbench / standalone)

## 1. Database setup
Open MySQL CLI / Workbench and run:
```sql
SOURCE backend/schema.sql;
```
This creates the database `ikonex_academy_sms` with all tables.

## 2. Backend setup
```bash
cd backend
cp .env.example .env
# edit .env with your MySQL credentials
npm install
npm run seed     # seeds admin + 16 streams + sample subjects
npm run dev      # starts API on http://localhost:5000
```

## 3. Frontend setup
```bash
cd frontend
npm install
npm run dev      # starts UI on http://localhost:3000
```

Open http://localhost:3000 → log in with `admin@ikonex.com` / `admin@123`.

---

## Project structure
```
ikonex-sms/
├── backend/        Express API
│   ├── routes/     auth, streams, students, subjects, scores, results, reports, dashboard
│   ├── middleware/ JWT auth
│   ├── utils/      grading, PDF generation
│   ├── schema.sql  full DB schema
│   └── seed.js     seed admin + streams + sample subjects
└── frontend/       React + Vite + Tailwind
    └── src/pages/  Login, Dashboard, Streams, Students, Subjects, Scores, Results, Reports, Settings
```
