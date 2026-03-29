# DentalFlow Social Booker — AppointYours

> Convert social media inquiries from **Instagram**, **Facebook**, and **WhatsApp** into confirmed dental appointments using an AI-powered booking agent.

## Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4 | Vercel — **$0** |
| **Backend** | FastAPI, SQLAlchemy 2.0, Pydantic v2 | Render — **$0** |
| **Database** | PostgreSQL 16 | Supabase — **$0** |
| **AI** | Google Gemini 2.0 Flash (free tier) | **$0** |
| **Social** | Meta Graph API + WhatsApp Cloud API | **$0** |

## Features

- 🤖 **AI Booking Agent** — Powered by Google Gemini (free) with OpenAI fallback
- 📬 **Unified Inbox** — View and reply to conversations from all social channels
- 📸 **Instagram DM** — Receive & reply to patient messages automatically
- 💬 **Facebook Messenger** — Full conversation automation
- 📱 **WhatsApp Business** — Text message support with Cloud API
- 📅 **Appointment Management** — Full CRUD with enriched patient/service details
- 🦷 **Service Management** — Add, edit, and delete dental services
- ⏰ **Availability Rules** — Configure weekly working hours and block dates
- 🚨 **Urgent Case Detection** — Automatic flagging of emergency keywords
- 📊 **Analytics Dashboard** — Completion rates, cancellation rates, booking stats
- 🧪 **Social Simulator** — Test the AI agent without real social media accounts
- 📧 **Email Notifications** — Automated reminders and urgent alerts
- 🔒 **JWT Authentication** — Secure admin dashboard access

## Quick Start (Local)

```bash
# 1. Clone & configure
cp backend/.env.example backend/.env    # Edit with your keys

# 2. Start database (PostgreSQL must be running)
createdb dentalflow

# 3. Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scripts/seed.py
uvicorn app.main:app --reload --port 8000

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs
- **Login**: admin@dentalflow.com / password123

## Deploy ($0/month)

### 1. Supabase (Database)
1. Create account at [supabase.com](https://supabase.com)
2. New Project → copy **Connection String** from Settings → Database
3. Use port **6543** (connection pooler) in the URL

### 2. Render (Backend)
1. Create account at [render.com](https://render.com)
2. New Web Service → Connect GitHub repo
3. Root Directory: `backend`, Runtime: Docker, Plan: Free
4. Add environment variables (see `backend/.env.example`)
5. Key vars: `DATABASE_URL`, `SECRET_KEY`, `GEMINI_API_KEY`, `META_*`
6. After deploy, run in Render Shell: `python scripts/seed.py`

### 3. Vercel (Frontend)
1. Import repo at [vercel.com](https://vercel.com)
2. Root Directory: `frontend`
3. Add env var: `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com/api/v1`
4. Deploy!

### 4. Meta Developer Console (Social Media)
1. [developers.facebook.com](https://developers.facebook.com) → Create App
2. Add Messenger → Link Facebook Page → Generate Page Access Token
3. Add Instagram → Connect Professional account
4. Webhook URL: `https://your-backend.onrender.com/api/v1/webhooks/meta`
5. (Optional) Add WhatsApp → Get Phone Number ID + Access Token

## How It Works

```
Patient sends Instagram DM
  → Meta sends webhook to your server
    → Server stores message in PostgreSQL
      → Gemini AI generates booking reply
        → Reply sent back via Meta API
          → Patient receives DM with appointment options
```

## API Endpoints

| Module | Prefix | Key Endpoints |
|--------|--------|--------------|
| Auth | `/auth` | POST /login, GET /me |
| Appointments | `/appointments` | CRUD + /summary, /upcoming |
| Conversations | `/conversations` | CRUD + /summary, /recent, /urgent |
| Services | `/services` | Full CRUD |
| Availability | `/availability` | /rules, /blocked CRUD |
| Clinic | `/clinic` | GET/PUT settings |
| Simulator | `/simulator` | POST /inbound (dev only) |
| Webhooks | `/webhooks/meta` | GET verify, POST receive (IG/FB/WA) |

## Environment Variables

See `backend/.env.example` for all configuration options. Key free-tier API keys:

| Key | Where to get it |
|-----|----------------|
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `META_PAGE_ACCESS_TOKEN` | Meta Developer Console → Messenger → Page Token |
| `META_APP_SECRET` | Meta Developer Console → App Settings → Basic |
| `WHATSAPP_ACCESS_TOKEN` | Meta Developer Console → WhatsApp → API Setup |

## License

MIT