# Seminar & Auditorium Allocation App (College Venue Booking System)

A production-ready, lightweight, multi-role venue booking and permission management system designed for colleges and universities.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%208-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Storage](https://img.shields.io/badge/Storage-Local%20CSV-green.svg)](backend/data/)

---

## 🌟 Key Highlights

- **Single-Command Launch**: Zero configuration needed. A single Python script starts both frontend and backend and opens your default browser automatically.
- **Zero External Dependencies / No Docker**: No PostgreSQL, Redis, or Docker needed. All application data is stored in direct, readable local CSV files (`backend/data/*.csv`) with thread-safe locking and atomic temp swapping.
- **Unified Single Server (Port 8000)**: Serves both the compiled React SPA and REST API from a single FastAPI server to eliminate cross-origin CORS issues in production.
- **Dual Independent Admin Approval Workflow**: Compulsory 2-admin approval requirement for every venue booking. An application is only confirmed once both admins approve.
- **Role-Based Access Control (RBAC)**: Secure JWT authentication with distinct portals for **Admins** and **Applicants** (student clubs / societies).
- **Public Calendar & Venue Availability**: Public calendar with sanitized event schedules and venue buffer management.

---

## ⚡ Quick Start

### 1. Requirements
- **Python 3.10+**
- **Node.js 18+** *(only if modifying or rebuilding frontend)*

### 2. Run the Application
From the project root, simply run:

```bash
python start.py
```
*Or on Windows, double-click [run.bat](run.bat).*

The application will launch on **[http://127.0.0.1:8000](http://127.0.0.1:8000)** and automatically open in your default browser!

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Organization / Notes |
| :--- | :--- | :--- | :--- |
| **Admin 1** | `nikhil@abes.ac.in` | `admin123` | Administration Board |
| **Admin 2** | `priyam@abes.ac.in` | `admin123` | Proctorial & Student Affairs |
| **Applicant (Tech)** | `techclub@college.edu` | `club123` | Robotics & Tech Club |
| **Applicant (Cultural)** | `cultural@college.edu` | `club123` | Music & Drama Society |
| **Applicant (Sports)** | `sports@college.edu` | `club123` | Sports Council |

---

## 📁 Project Structure

```text
Seminar-Auditorium-Allocation-App/
├── backend/
│   ├── app/
│   │   ├── api/            # REST API endpoints (auth, venues, bookings, approvals, etc.)
│   │   ├── core/           # Config, JWT security, and CSV FileDB engine
│   │   ├── schemas/        # Pydantic request/response validation schemas
│   │   ├── services/       # Conflict check, approval engine, and audit logger
│   │   ├── main.py         # FastAPI application entry & SPA static server
│   │   └── seed.py         # Database seeder for demo accounts & venues
│   ├── data/               # Persistent CSV data tables
│   │   ├── applications.csv
│   │   ├── approvals.csv
│   │   ├── audit_logs.csv
│   │   ├── bookings.csv
│   │   ├── notifications.csv
│   │   ├── users.csv
│   │   └── venues.csv
│   ├── tests/              # Backend test suite (pytest)
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # UI components (Calendar, Modals, Navbar)
│   │   ├── context/        # Auth & session context
│   │   ├── lib/            # Axios API client
│   │   ├── pages/          # Admin Dashboard, Applicant Portal, Login, Public View
│   │   └── App.tsx         # React router & routing layout
│   ├── package.json        # Frontend dependencies (React 19, Vite, Tailwind v4)
│   └── vite.config.ts
├── run.bat                 # Windows one-click batch launcher
├── start.py                # Single-command Python launcher
└── README.md
```

---

## 🛠️ API & Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Serves the React Single Page Application (SPA) |
| `/api/v1/auth/login` | `POST` | Authenticate user & return JWT token |
| `/api/v1/venues` | `GET` | List all venues and their capacities |
| `/api/v1/calendar` | `GET` | Public sanitized event calendar |
| `/api/v1/applications` | `GET, POST` | Create and track booking requests |
| `/api/v1/approvals` | `POST` | Dual Admin approval actions |
| `/api/v1/docs` | `GET` | Swagger Interactive API Documentation |

---

## 🧪 Running Tests

To verify backend endpoints, RBAC permissions, and CSV operations:
```bash
python -m pytest backend/tests
```
