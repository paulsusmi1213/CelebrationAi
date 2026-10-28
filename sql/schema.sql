-- ==============================================================================
-- Production PostgreSQL DDL Schema for GenAI Celebration & Event Planner
-- Includes Indexes, Constraints, and Row-Level Security (RLS) Policies
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE event_type AS ENUM ('WEDDING', 'BIRTHDAY', 'COMMUNITY', 'CUSTOM');
CREATE TYPE budget_category AS ENUM ('VENUE', 'CATERING', 'DECOR', 'ENTERTAINMENT', 'MISCELLANEOUS', 'CONTINGENCY');
CREATE TYPE priority_level AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE vendor_status AS ENUM ('TO_CONTACT', 'CONTACTED', 'QUOTED', 'BOOKED', 'DECLINED');
CREATE TYPE timeline_phase AS ENUM ('PHASE_EARLY', 'PHASE_MID', 'PHASE_FINAL_WEEKS', 'PHASE_DAY_OF', 'PHASE_POST_EVENT');

-- Users Table (with GDPR consent timestamps)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(150),
    image_url TEXT,
    data_retention_consent BOOLEAN DEFAULT TRUE NOT NULL,
    marketing_consent BOOLEAN DEFAULT FALSE NOT NULL,
    consented_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Events Table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    event_type event_type NOT NULL,
    custom_type_label VARCHAR(60),
    event_date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    guest_count INTEGER NOT NULL CHECK (guest_count > 0),
    total_budget NUMERIC(12, 2) NOT NULL CHECK (total_budget >= 0),
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    theme_style VARCHAR(255) NOT NULL,
    special_requests TEXT,
    vibe_statement TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Budget Items (with Contingency and Category Allocation)
CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    category budget_category NOT NULL,
    label VARCHAR(100) NOT NULL,
    percentage NUMERIC(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    allocated_amount NUMERIC(12, 2) NOT NULL CHECK (allocated_amount >= 0),
    spent_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (spent_amount >= 0),
    notes TEXT,
    cost_saving_tip TEXT,
    is_locked BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_event_category UNIQUE (event_id, category)
);

-- Timeline Tasks (Backwards-Planning Milestones)
CREATE TABLE timeline_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    phase timeline_phase NOT NULL,
    phase_label VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    suggested_due_days_before INTEGER DEFAULT 30 NOT NULL,
    due_date DATE,
    priority priority_level DEFAULT 'MEDIUM' NOT NULL,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    completed_at TIMESTAMPTZ,
    category VARCHAR(50) DEFAULT 'GENERAL' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Vendor Checklist (Negotiations, Questions & Contract Gotchas)
CREATE TABLE vendor_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    category budget_category NOT NULL,
    vendor_role VARCHAR(100) NOT NULL,
    vendor_name VARCHAR(150),
    status vendor_status DEFAULT 'TO_CONTACT' NOT NULL,
    priority priority_level DEFAULT 'HIGH' NOT NULL,
    target_booking_lead_weeks INTEGER DEFAULT 12 NOT NULL,
    questions_to_ask JSONB NOT NULL DEFAULT '[]'::jsonb,
    contract_review_reminders JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_cost_range VARCHAR(80),
    contact_email VARCHAR(150),
    contact_phone VARCHAR(40),
    quoted_amount NUMERIC(12, 2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Bespoke AI-Generated Ideas
CREATE TABLE personalized_ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    why_it_fits TEXT NOT NULL,
    estimated_cost_impact VARCHAR(20) NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- GDPR Compliant Guestbook & RSVP Table
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(30),
    rsvp_status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
    dietary_restrictions VARCHAR(255),
    table_number INTEGER,
    encrypted_notes TEXT, -- AES-256 encrypted confidential notes
    anonymized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Rate-limiting & Token Abuse Tracking
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    tokens INTEGER DEFAULT 0 NOT NULL,
    status_code INTEGER DEFAULT 200 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- INDEXES FOR LOW-LATENCY QUERIES
-- ==============================================================================
CREATE INDEX idx_events_user_date ON events(user_id, event_date);
CREATE INDEX idx_budget_items_event ON budget_items(event_id);
CREATE INDEX idx_timeline_tasks_event_phase ON timeline_tasks(event_id, phase, priority);
CREATE INDEX idx_timeline_tasks_completed ON timeline_tasks(completed);
CREATE INDEX idx_vendor_checklists_event ON vendor_checklists(event_id, status);
CREATE INDEX idx_api_usage_user_time ON api_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_api_usage_ip_time ON api_usage_logs(ip_address, created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only select and modify events they own
CREATE POLICY user_events_policy ON events
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Policy: Cascade security to budget items via event ownership
CREATE POLICY user_budget_policy ON budget_items
    FOR ALL
    USING (event_id IN (SELECT id FROM events WHERE user_id = current_setting('app.current_user_id', true)::uuid));

-- Policy: Cascade security to timeline tasks
CREATE POLICY user_timeline_policy ON timeline_tasks
    FOR ALL
    USING (event_id IN (SELECT id FROM events WHERE user_id = current_setting('app.current_user_id', true)::uuid));

-- Policy: Cascade security to vendor checklists
CREATE POLICY user_vendor_policy ON vendor_checklists
    FOR ALL
    USING (event_id IN (SELECT id FROM events WHERE user_id = current_setting('app.current_user_id', true)::uuid));

-- Policy: Cascade security to guests (GDPR isolation)
CREATE POLICY user_guests_policy ON guests
    FOR ALL
    USING (event_id IN (SELECT id FROM events WHERE user_id = current_setting('app.current_user_id', true)::uuid));

