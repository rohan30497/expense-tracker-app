# Automated Bank Email Expense Tracker

100% Free, Automated Expense Tracker for Axis Bank (and other bank transaction alerts) with Python backend, PII sanitization, OpenAI LLM fallback, Supabase Database, and Mobile React Dashboard.

---

## Testing Supabase From Local

**Can you test Supabase from local? YES!** You have 3 easy ways:

1. **Option 1: Free Supabase Cloud DB (Recommended)**
   - Create a free project at [supabase.com](https://supabase.com).
   - Copy `SUPABASE_URL` and `SUPABASE_KEY` into your local `.env` file.
   - Run the app locally or in Docker. It connects to Supabase Cloud directly over HTTPS.

2. **Option 2: Local Built-in Mock Mode (Zero Setup Needed)**
   - If `SUPABASE_URL` is omitted, the app automatically runs in **Local Mock Mode**.
   - Expenses are saved in local memory/state, charts render demo data, and full UI features work offline.

3. **Option 3: Local Supabase CLI**
   - Install Supabase CLI: `npx supabase init` and `npx supabase start`.
   - Set `SUPABASE_URL=http://localhost:54321` in your `.env`.

---

## Local Docker Build & Testing Guide

### 1. Build and Run Local Docker Stack

For production-like local test:
```bash
docker compose up --build
```

For live-reload dev mode:
```bash
docker compose -f docker-compose.local.yml up --build
```

- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000/api/health`

### 2. Test Email Webhook Locally (Simulate Axis Bank Alert)

Run the included test script to simulate an incoming bank alert email:
```bash
python scripts/test_local_webhook.py
```
Or send a `curl` request:
```bash
curl -X POST http://localhost:8000/api/process-email \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "INR 500.00 was debited from your A/c no. XX3065.",
    "body": "Amount Debited: INR 500.00\nTransaction Info: UPI/SWIGGY/PAY",
    "secret_token": "my-secret-webhook-token"
  }'
```

---

## System Components

1. `backend/`: FastAPI Python server (`parser.py`, `pii_sanitizer.py`, `llm_classifier.py`, `supabase_service.py`).
2. `google_apps_script/`: `Code.gs` for 24/7 background Gmail trigger.
3. `supabase/`: `schema.sql` database initialization script.
4. `frontend/`: React + Vite + Chart.js dashboard web app.
5. `scripts/`: Local webhook testing script (`test_local_webhook.py`).

---

## Deployment Checklist

1. Run `schema.sql` in Supabase SQL editor.
2. Deploy backend (`backend/`) to Vercel/Render.
3. Deploy frontend (`frontend/`) to Vercel/Netlify.
4. Set up 5-minute time trigger in Google Apps Script ([google_apps_script/Code.gs](file:///c:/Users/User/Downloads/expense_tracker_app/google_apps_script/Code.gs)).
