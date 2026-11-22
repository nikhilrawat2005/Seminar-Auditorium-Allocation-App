import uuid
from datetime import datetime, timedelta
from app.core.file_db import db
from app.core.security import get_password_hash

def seed_database():
    print("🌱 Seeding local database...")

    # Clear existing data files for clean slate
    for table in ["users", "venues", "applications", "approvals", "bookings", "audit_logs", "notifications"]:
        path = db._get_path(table)
        if db._read_table(table):
            pass

    # 1. Seed 2 Admins
    admin1_id = "admin-1-uuid"
    admin2_id = "admin-2-uuid"

    admin1 = {
        "id": admin1_id,
        "name": "Nikhil Rawat (Admin)",
        "email": "nikhil@abes.ac.in",
        "password_hash": get_password_hash("admin123"),
        "role": "admin",
        "organization_name": "Administration Board",
        "status": "active",
        "created_at": datetime.utcnow().isoformat()
    }
    admin2 = {
        "id": admin2_id,
        "name": "Priyam Dev Bhartiya (Admin)",
        "email": "priyam@abes.ac.in",
        "password_hash": get_password_hash("admin123"),
        "role": "admin",
        "organization_name": "Proctorial & Student Affairs",
        "status": "active",
        "created_at": datetime.utcnow().isoformat()
    }

    # 2. Seed 3 Applicants
    applicant1_id = "applicant-1-uuid"
    applicant2_id = "applicant-2-uuid"
    applicant3_id = "applicant-3-uuid"

    applicants = [
        {
            "id": applicant1_id,
            "name": "Rohan Mehra",
            "email": "techclub@college.edu",
            "password_hash": get_password_hash("club123"),
            "role": "applicant",
            "organization_name": "Robotics & Tech Club",
            "status": "active",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": applicant2_id,
            "name": "Priya Sen",
            "email": "cultural@college.edu",
            "password_hash": get_password_hash("club123"),
            "role": "applicant",
            "organization_name": "Music & Drama Society",
            "status": "active",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": applicant3_id,
            "name": "Vikram Singh",
            "email": "sports@college.edu",
            "password_hash": get_password_hash("club123"),
            "role": "applicant",
            "organization_name": "Sports Council",
            "status": "active",
            "created_at": datetime.utcnow().isoformat()
        }
    ]

    # 3. Seed 4 Venues
    venue1_id = "venue-audi-1"
    venue2_id = "venue-seminar-2"
    venue3_id = "venue-ground-3"
    venue4_id = "venue-conf-4"

    venues = [
        {
            "id": venue1_id,
            "name": "Main Auditorium",
            "location": "Academic Block A, Ground Floor",
            "capacity": 800,
            "description": "State-of-the-art auditorium with line-array sound system, dual 4K laser projectors, and stage lighting.",
            "equipment_notes": "Podium, 4 Cordless Mics, Stage lighting console",
            "setup_buffer_minutes": 30,
            "status": "active"
        },
        {
            "id": venue2_id,
            "name": "Dr. APJ Abdul Kalam Seminar Hall",
            "location": "Science Block, 2nd Floor",
            "capacity": 200,
            "description": "Tiered seating lecture hall equipped with smart board, video conferencing, and surround acoustic panelling.",
            "equipment_notes": "Projector, Collar mic, Handheld mic, HDMI switcher",
            "setup_buffer_minutes": 20,
            "status": "active"
        },
        {
            "id": venue3_id,
            "name": "University Main Sports Ground",
            "location": "East Campus",
            "capacity": 2500,
            "description": "Open lush green athletic field with 400m synthetic running track, flood lights, and spectator pavilion.",
            "equipment_notes": "Field PA system, Goal posts, Match referee tent",
            "setup_buffer_minutes": 45,
            "status": "active"
        },
        {
            "id": venue4_id,
            "name": "Executive Conference Hall",
            "location": "Administrative Block, 1st Floor",
            "capacity": 50,
            "description": "Round-table conference room for high-level meetings, academic councils, and guest panels.",
            "equipment_notes": "Conference mic units, motorized projection screen, video bar",
            "setup_buffer_minutes": 15,
            "status": "active"
        }
    ]

    # Save to db
    db._write_table("users", [admin1, admin2] + applicants)
    db._write_table("venues", venues)

    # 4. Seed sample applications in various statuses
    # App 1: Fully Approved & Booked
    app1_id = "app-seed-001"
    app1 = {
        "id": app1_id,
        "public_ref": "VB-2026-0001",
        "applicant_id": applicant1_id,
        "venue_id": venue1_id,
        "event_name": "Annual Hackathon 'HackIndia 2026'",
        "event_description": "36-hour national inter-college hackathon with 400 participants from across the country.",
        "event_category": "Technical",
        "event_date": (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%d"),
        "start_time": "09:00",
        "end_time": "18:00",
        "expected_participants": 450,
        "additional_requirements": "High-speed 1Gbps WiFi switchboards and power strips on each row.",
        "status": "APPROVED",
        "parent_application_id": None,
        "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    approvals1 = [
        {
            "id": "appr-001-a1",
            "application_id": app1_id,
            "admin_id": admin1_id,
            "decision": "approved",
            "remarks": "Great initiative. Ensure fire safety guidelines are observed.",
            "decided_at": (datetime.utcnow() - timedelta(days=1, hours=4)).isoformat()
        },
        {
            "id": "appr-001-a2",
            "application_id": app1_id,
            "admin_id": admin2_id,
            "decision": "approved",
            "remarks": "Approved. Campus security has been alerted.",
            "decided_at": (datetime.utcnow() - timedelta(days=1)).isoformat()
        }
    ]
    booking1 = {
        "id": "book-seed-001",
        "application_id": app1_id,
        "venue_id": venue1_id,
        "start_datetime": f"{app1['event_date']}T09:00:00",
        "end_datetime": f"{app1['event_date']}T18:00:00",
        "status": "confirmed",
        "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat()
    }

    # App 2: Partially Approved (Admin 1 approved, Admin 2 pending)
    app2_id = "app-seed-002"
    app2 = {
        "id": app2_id,
        "public_ref": "VB-2026-0002",
        "applicant_id": applicant2_id,
        "venue_id": venue2_id,
        "event_name": "Symphony: Classical Music Night",
        "event_description": "Acoustic musical presentation by the university cultural orchestra.",
        "event_category": "Cultural",
        "event_date": (datetime.utcnow() + timedelta(days=8)).strftime("%Y-%m-%d"),
        "start_time": "16:00",
        "end_time": "20:00",
        "expected_participants": 180,
        "additional_requirements": "Grand piano tuning and 5 instrument condenser mics.",
        "status": "PARTIALLY_APPROVED",
        "parent_application_id": None,
        "created_at": (datetime.utcnow() - timedelta(hours=10)).isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    approvals2 = [
        {
            "id": "appr-002-a1",
            "application_id": app2_id,
            "admin_id": admin1_id,
            "decision": "approved",
            "remarks": "Sound acoustic limits must be strictly adhered to.",
            "decided_at": (datetime.utcnow() - timedelta(hours=2)).isoformat()
        }
    ]

    # App 3: Submitted (Pending both admins)
    app3_id = "app-seed-003"
    app3 = {
        "id": app3_id,
        "public_ref": "VB-2026-0003",
        "applicant_id": applicant3_id,
        "venue_id": venue3_id,
        "event_name": "Inter-Department Cricket Tournament",
        "event_description": "Annual 3-day knockout cricket tournament between 12 engineering departments.",
        "event_category": "Sports",
        "event_date": (datetime.utcnow() + timedelta(days=12)).strftime("%Y-%m-%d"),
        "start_time": "08:00",
        "end_time": "17:00",
        "expected_participants": 350,
        "additional_requirements": "Medical first-aid kit and university ambulance stationed nearby.",
        "status": "SUBMITTED",
        "parent_application_id": None,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    db._write_table("applications", [app1, app2, app3])
    db._write_table("approvals", approvals1 + approvals2)
    db._write_table("bookings", [booking1])
    db._write_table("audit_logs", [])
    db._write_table("notifications", [])

    print(" Database seeded successfully!")
    print("Demo Admin 1: admin1@college.edu / admin123")
    print("Demo Admin 2: admin2@college.edu / admin123")
    print("Demo Applicant: techclub@college.edu / club123")

if __name__ == "__main__":
    seed_database()
