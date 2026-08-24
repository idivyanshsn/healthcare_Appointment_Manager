# CarePulse AI — Healthcare Appointment & Follow-up Manager

An end-to-end clinical workflow platform built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**. Features AI-driven pre-visit triage summaries, post-visit clinical translations, a 10-minute temporary slot hold locking engine to prevent double-booking, physician leave conflict management with priority patient notifications, and 1-click Google Calendar integration.

---

## 🚀 Live Demo & Deployment
- **GitHub Repository**: [https://github.com/idivyanshsn/healthcare_Appointment_Manager](https://github.com/idivyanshsn/healthcare_Appointment_Manager)
- **Deploy on Vercel**: [1-Click Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/idivyanshsn/healthcare_Appointment_Manager)

---

## 🛠️ Technology Stack
- **Framework**: Next.js 14.2.15 (App Router, Server Actions & API Route Handlers)
- **Language**: TypeScript 5.6
- **Styling**: Tailwind CSS 3.4 & Vanilla CSS variables (Light & Dark theme support)
- **Icons**: Lucide React
- **AI / LLM Layer**: Google Gemini 1.5 Flash API + OpenAI API + Deterministic Clinical Fallback Parser
- **Scheduling / Cron**: Vercel Cron (`vercel.json`)
- **Calendar**: Google Calendar Web URLs, OAuth 2.0 API & RFC 5545 `.ics` Export

---

## 🏃 Local Setup Instructions

```bash
# 1. Clone the repository
git clone https://github.com/idivyanshsn/healthcare_Appointment_Manager.git
cd healthcare_Appointment_Manager

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional)
cp .env.example .env.local

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Google Gemini or OpenAI API Key (App will automatically fall back to deterministic NLP if omitted)
GEMINI_API_KEY=
OPENAI_API_KEY=

# Optional: Google Calendar API (OAuth 2.0)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback

# Optional: Resend Email Notifications
RESEND_API_KEY=
EMAIL_FROM=notifications@healthmanager.clinic
CRON_SECRET=healthcare_cron_secret_123
```
