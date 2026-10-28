# CelebrationAI: Production-Ready GenAI Celebration & Event Planner

CelebrationAI is a production-grade, full-stack, GenAI-powered celebration and event planning web application. It orchestrates weddings, milestone birthdays, and community galas with mathematical budget discipline (strict 10% emergency buffer), adaptive backwards timelines, structured vendor audits, and a real-time AI Event Co-Pilot.

---

## 🌟 Architecture Highlights

1. **Deterministic Financial Invariants:**
   - Strict 10.0% emergency contingency buffer permanently protected.
   - Zero-sum budget allocation: 6 categories (`VENUE`, `CATERING`, `DECOR`, `ENTERTAINMENT`, `MISCELLANEOUS`, `CONTINGENCY`) guaranteed to sum up to exactly 100%.
   - Interactive rebalancing sliders with category locking.

2. **Adaptive Backwards-Planning Engine:**
   - Computes delta lead time between current timestamp and event date.
   - Organizes milestones into phases (`phase_early`, `phase_mid`, `phase_final_weeks`, `phase_day_of`, `phase_post_event`).

3. **Vendor Consultation & Contract Vetting Checklist:**
   - 3-4 incisive consultation questions per vendor role to ask during interviews.
   - Contract review alerts highlighting hidden service charges, breakdown fees, and overtime liabilities.

4. **Embedded AI Event Co-Pilot:**
   - Chat assistant capable of dynamic in-place plan adjustments (e.g., *"Make catering vegetarian-only and cut decor budget by 15%"*).
   - Server-Sent Events (SSE) streaming support for low-latency progress reporting.

5. **Security & Privacy Hardening:**
   - Prompt injection defense layer stripping adversarial delimiters and directives.
   - Sliding-window rate limiter (Upstash Redis + in-memory fallback) preventing token exhaustion.
   - GDPR-compliant guest handling with encrypted notes and minimal PII retention.
   - WCAG 2.1 AA accessibility compliance (ARIA labels, keyboard tab navigation, high contrast ratios, screen-reader friendly checklists).

---

## 🏗️ Recommended Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React 18/19, TypeScript | Server Components, fast hydration, streaming SSR |
| **Styling & UI** | Tailwind CSS, Lucide React | High-contrast WCAG 2.1 AA styling, responsive mobile-first UI |
| **Backend API** | Next.js Edge & Node.js Route Handlers | Serverless scalability, low latency, SSE streaming |
| **Database & ORM** | PostgreSQL + Prisma ORM / Supabase | Relational integrity, Row-Level Security (RLS) policies |
| **AI Integration** | Google Gemini 1.5 Pro / Flash (`@google/generative-ai`) | Structured JSON outputs via `responseSchema`, low latency |
| **Security & Limits** | Upstash Redis (`@upstash/ratelimit`) + Zod | Token abuse prevention, strict payload validation |
| **Authentication** | NextAuth.js v5 (Auth.js) | OAuth 2.0 (Google, GitHub) + secure JWT sessions |

---

## 🚀 Quickstart & Setup

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your `GEMINI_API_KEY` and PostgreSQL connection string.

### 3. Database Migration
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

