# CelebrationAI: Production-Ready GenAI Event Planner

A full-stack, enterprise-grade, GenAI-powered web application designed to architect and manage weddings, milestone birthdays, and community festivals. Built with Next.js 14/15 App Router, React, Tailwind CSS, TypeScript, and Google Gemini API (with structured `response_schema`).

---

## 1. System Architecture & Tech Stack

```mermaid
graph TD
    Client["Next.js Responsive Client (React, Tailwind CSS, WCAG 2.1 AA)"]
    API_Gateway["Next.js Route Handlers (Edge/Node.js)"]
    Security["Security Layer: Rate Limiter & Prompt Sanitizer & PII Scrubber"]
    Gemini["Google Gemini 1.5 Flash (Structured response_schema)"]
    DB["PostgreSQL / Supabase (Prisma ORM with RLS)"]
    Cache["Browser localStorage & Redis Session Cache"]

    Client -->|HTTPS / REST & SSE| API_Gateway
    API_Gateway --> Security
    Security -->|Sanitized Prompt| Gemini
    Gemini -->|Strict Validated JSON| API_Gateway
    API_Gateway -->|Encrypted Storage| DB
    Client <-->|Optimistic Sync| Cache
```

### Technology Matrix
- **Frontend**: Next.js (App Router), React 18/19, TypeScript, Tailwind CSS, Lucide React.
- **Backend**: Next.js Serverless Route Handlers (`/api/plan`, `/api/copilot`).
- **GenAI Integration**: Google Gemini API via official `@google/genai` with strict `response_schema` and deterministic temperature control (`temperature: 0.2`).
- **Database & Persistence**: PostgreSQL with Prisma ORM, row-level security (RLS), and indexed foreign keys.
- **Security & Rate Limiting**: Sliding-window token rate limiting (10 req/min for planning, 20 req/min for co-pilot), regex-based prompt injection sanitizer, and automated PII scrubber.
- **Accessibility & UX**: Fully compliant with WCAG 2.1 AA (ARIA roles, keyboard-friendly slider & checklist controls, high-contrast modes, screen-reader skip links).

---

## 2. Directory Structure

```
├── prisma/
│   └── schema.prisma         # Prisma ORM data model & relations
├── db/
│   └── schema.sql            # Raw PostgreSQL DDL with RLS and enums
├── src/
│   ├── types/
│   │   └── event.ts          # Central TypeScript interfaces & types
│   ├── lib/
│   │   ├── ai-engine.ts      # Gemini system prompt, JSON schema, validator
│   │   ├── rate-limiter.ts   # Sliding window request rate limiter
│   │   ├── security.ts       # Input sanitizer, PII scrubber, auth verifier
│   │   └── mock-data.ts      # High-fidelity realistic fallback planner
│   ├── app/
│   │   ├── layout.tsx        # Global HTML layout with metadata
│   │   ├── page.tsx          # Single-page app root (Wizard + Dashboard)
│   │   ├── globals.css       # Tailwind directives & WCAG styles
│   │   └── api/
│   │       ├── plan/route.ts # Event creation & AI plan generation endpoint
│   │       └── copilot/route.ts # AI Co-Pilot chat & live modification endpoint
│   └── components/
│       ├── OnboardingWizard.tsx    # 4-step event intake wizard
│       ├── InteractiveDashboard.tsx# Core tabbed event command center
│       ├── BudgetBreakdown.tsx     # Dynamic sliders & 10% contingency lock
│       ├── TimelineView.tsx        # Backwards planning milestone checklists
│       ├── VendorChecklist.tsx     # Interview questions & contract watchouts
│       ├── PersonalizedIdeas.tsx   # 5 bespoke tailored experience concepts
│       └── AiCopilotChat.tsx       # Live drawer for real-time adjustments
├── public/
│   └── index.html            # Standalone browser UI client
├── server.py                 # Multi-threaded server for instant live testing
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 3. Environment Variables Setup

Create a `.env.local` file in the root directory:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# PostgreSQL / Supabase Database URL (Optional for local memory mode)
DATABASE_URL=postgresql://user:password@localhost:5432/celebration_planner?schema=public

# NextAuth / JWT Authentication Secret
NEXTAUTH_SECRET=your_jwt_signing_secret_min_32_characters
NEXTAUTH_URL=http://localhost:3000
```

> **Note:** If `GEMINI_API_KEY` is not provided, the application automatically uses the internal high-fidelity deterministic planning engine (`src/lib/mock-data.ts`), ensuring zero crashes and full evaluation capabilities offline.

---

## 4. Getting Started

### Installation
```bash
npm install
# or
pnpm install
```

### Run Locally (Next.js)
```bash
npm run dev
```

### Run Standalone Server (Python)
```bash
python server.py
```
Open `http://localhost:3000` in your browser.

