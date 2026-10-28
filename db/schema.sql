-- Celebration & Event Planner: Production PostgreSQL Schema (with RLS)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('USER', 'ORGANIZER', 'ADMIN');
CREATE TYPE event_type AS ENUM ('WEDDING', 'BIRTHDAY', 'COMMUNITY', 'CUSTOM');
CREATE TYPE priority_level AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE vendor_status AS ENUM ('PENDING', 'RESEARCHING', 'CONTACTED', 'BOOKED', 'DECLINED');
CREATE TYPE timeline_phase AS ENUM (
  'SIX_PLUS_MONTHS', 
  'THREE_TO_FIVE_MONTHS', 
  'ONE_TO_TWO_MONTHS', 
  'TWO_TO_FOUR_WEEKS', 
  'ONE_WEEK_OUT', 
  'DAY_OF', 
  'POST_EVENT'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  role user_role DEFAULT 'USER',
  email_verified TIMESTAMPTZ,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  event_type event_type NOT NULL DEFAULT 'CUSTOM',
  custom_type VARCHAR(100),
  event_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(255) NOT NULL,
  guest_count INTEGER NOT NULL CHECK (guest_count > 0),
  total_budget NUMERIC(12, 2) NOT NULL CHECK (total_budget >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  theme_preferences TEXT,
  special_requests TEXT,
  plan_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  allocated_amount NUMERIC(12, 2) NOT NULL CHECK (allocated_amount >= 0),
  actual_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (actual_spent >= 0),
  percentage NUMERIC(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  is_contingency BOOLEAN NOT NULL DEFAULT FALSE,
  cost_saving_tip TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE timeline_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  phase timeline_phase NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date_description VARCHAR(100) NOT NULL,
  priority priority_level NOT NULL DEFAULT 'MEDIUM',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  category VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vendor_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  vendor_type VARCHAR(100) NOT NULL,
  company_name VARCHAR(255),
  estimated_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  status vendor_status NOT NULL DEFAULT 'PENDING',
  priority priority_level NOT NULL DEFAULT 'MEDIUM',
  questions_to_ask JSONB NOT NULL DEFAULT '[]'::jsonb,
  contract_watchouts JSONB NOT NULL DEFAULT '[]'::jsonb,
  deposit_paid NUMERIC(12, 2),
  final_payment_due TIMESTAMPTZ,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bespoke_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  estimated_cost_impact VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE copilot_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('user', 'assistant', 'system')),
  message TEXT NOT NULL,
  changes_delta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_budget_event_id ON budget_items(event_id);
CREATE INDEX idx_timeline_event_phase ON timeline_tasks(event_id, phase);
CREATE INDEX idx_vendor_event_id ON vendor_checklists(event_id);
CREATE INDEX idx_copilot_event_id ON copilot_chats(event_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE bespoke_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_chats ENABLE ROW LEVEL SECURITY;

