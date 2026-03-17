# DentalFlow Social Booker MVP

DentalFlow Social Booker is a social-media-first dental appointment booking system designed to convert patient inquiries from Instagram, Facebook, and WhatsApp into confirmed appointments.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI, SQLAlchemy, Alembic, Pydantic
- **Database**: PostgreSQL
- **AI**: Custom rule-based routing for social media conversation automation

## Project Structure

```
.
├── backend/            # FastAPI Backend
│   ├── app/            # Application Logic
│   ├── alembic/        # Database Migrations
│   └── scripts/        # Utility & Seed Scripts
└── frontend/           # Next.js Admin Dashboard
    ├── src/app/        # App Router Pages
    ├── src/components/ # UI Components
    └── src/lib/        # API Client & Utils
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL

### Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate` or `venv\Scripts\activate` on Windows
4. `pip install -r requirements.txt`
5. `cp .env.example .env` (update with your DB credentials)
6. `python scripts/seed.py` (this will create tables and demo data)
7. `uvicorn app.main:app --reload`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `cp .env.example .env.local`
4. `npm run dev`

### Testing the AI Flow
1. Login to the dashboard at `http://localhost:3000/login`
2. Credentials: `admin@dentalflow.com` / `password123`
3. Navigate to **Social Simulator** in the sidebar.
4. Send a message like: "Hi, I want to book a teeth whitening."
5. The AI agent will respond and guide you through the booking process.

## Features implemented
- [x] Unified Social Inbox
- [x] AI Booking Agent (Mock logic)
- [x] Social Media Message Simulator
- [x] Appointment Management
- [x] Dental Services CRUD
- [x] Clinic Availability Management
- [x] Urgent Case Flagging & Alerting
- [x] Background Notifications (Mocked logs)