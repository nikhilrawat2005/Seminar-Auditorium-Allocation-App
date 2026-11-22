# College Venue Booking & Permission Management System

A production-grade, secure, multi-role venue allocation system built for universities.

## 🚀 Key Highlights
- **Unified Single Server Architecture**: Poora Frontend (React + Vite SPA) aur Backend (FastAPI API) ek hi server aur ek hi port (`8000`) par chalta hai!
- **Zero External DB Dependency**: Local persistent file storage (`backend/data/*.json`) with row locking and conflict management.
- **Dual Independent Admin Approval**: Compulsory dual-admin verification with full audit logs and timeline tracking.

---

## ⚡ One-Click Run
Aap directly root folder mein maujood `run.bat` par double click karke ya command line se run kar sakte hain:
```bash
.\run.bat
```

Open browser at: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin 1** | `admin1@college.edu` | `admin123` | Dr. Rajesh Sharma (Dean) |
| **Admin 2** | `admin2@college.edu` | `admin123` | Prof. Anita Roy (Proctor) |
| **Applicant (Club)** | `techclub@college.edu` | `club123` | Robotics & Tech Club |
| **Applicant (Cultural)** | `cultural@college.edu` | `club123` | Music & Drama Society |
| **Applicant (Sports)** | `sports@college.edu` | `club123` | Sports Council |

---

## 🔗 Available Endpoints (All on single port 8000)
- **Web UI (Public Schedule, Dashboards, Login)**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive API Documentation (Swagger UI)**: [http://127.0.0.1:8000/api/v1/docs](http://127.0.0.1:8000/api/v1/docs)
