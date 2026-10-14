-- ==============================================================================
-- PM ZAIKA RESTAURANT — COMPLETE SUPABASE DATABASE SETUP & SEED SCRIPT
-- Location: Shershah Road, Gur ki Mandi, Infront of Bank of India, Gulzarbagh, Patna - 800007
-- Contact Numbers: 7488260572 (Main Customer Number), 06123112128, 9525748843
-- Run this in the Supabase SQL Editor of your new Supabase Project.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- 2. TABLE DEFINITIONS
-- =============================================================

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'restaurant' CHECK (category IN ('restaurant')),
  location TEXT,
  phone TEXT,
  secondary_phone TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#d97706',
  welcome_message JSONB,
  google_review_url TEXT,
  default_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Ensure phone columns exist if table was already created
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS secondary_phone TEXT;

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  google_review_url_override TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  position INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rating', 'single_choice', 'multi_choice', 'text')),
  text JSONB NOT NULL,
  config JSONB DEFAULT '{}',
  required BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, key)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'landed' CHECK (status IN ('landed', 'in_progress', 'completed')),
  language TEXT DEFAULT 'en',
  device_type TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  ip_hash TEXT,
  ua_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id)
);

CREATE TABLE IF NOT EXISTS review_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  original_text TEXT,
  final_text TEXT,
  method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS private_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  contact_name TEXT,
  contact_value TEXT,
  contact_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  campaign_id UUID,
  business_id UUID,
  event_type TEXT NOT NULL,
  client_event_id UUID,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, client_event_id)
);

CREATE TABLE IF NOT EXISTS session_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  business_id UUID,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- 3. INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_business ON campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_menu_items_business ON menu_items(business_id);
CREATE INDEX IF NOT EXISTS idx_questions_business ON questions(business_id);
CREATE INDEX IF NOT EXISTS idx_sessions_campaign ON sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sessions_business ON sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_sessions_business_created ON sessions(business_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_answers_session ON answers(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_key ON answers(question_key);
CREATE INDEX IF NOT EXISTS idx_review_drafts_session ON review_drafts(session_id);
CREATE INDEX IF NOT EXISTS idx_private_feedback_business ON private_feedback(business_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_business ON events(business_id);

-- =============================================================
-- 4. ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_flags ENABLE ROW LEVEL SECURITY;

-- Owner Policies
DROP POLICY IF EXISTS "businesses_owner_select" ON businesses;
CREATE POLICY "businesses_owner_select" ON businesses FOR SELECT TO authenticated
  USING (owner_id = (SELECT auth.uid()) OR owner_id IS NULL);

DROP POLICY IF EXISTS "businesses_owner_insert" ON businesses;
CREATE POLICY "businesses_owner_insert" ON businesses FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()) OR owner_id IS NULL);

DROP POLICY IF EXISTS "businesses_owner_update" ON businesses;
CREATE POLICY "businesses_owner_update" ON businesses FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()) OR owner_id IS NULL)
  WITH CHECK (owner_id = (SELECT auth.uid()) OR owner_id IS NULL);

DROP POLICY IF EXISTS "campaigns_owner_all" ON campaigns;
CREATE POLICY "campaigns_owner_all" ON campaigns FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid()) OR owner_id IS NULL))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid()) OR owner_id IS NULL));

DROP POLICY IF EXISTS "menu_items_owner_all" ON menu_items;
CREATE POLICY "menu_items_owner_all" ON menu_items FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid()) OR owner_id IS NULL))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid()) OR owner_id IS NULL));

DROP POLICY IF EXISTS "questions_owner_all" ON questions;
CREATE POLICY "questions_owner_all" ON questions FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid()) OR owner_id IS NULL))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid()) OR owner_id IS NULL));

DROP POLICY IF EXISTS "sessions_owner_select" ON sessions;
CREATE POLICY "sessions_owner_select" ON sessions FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid()) OR owner_id IS NULL));

DROP POLICY IF EXISTS "answers_owner_select" ON answers;
CREATE POLICY "answers_owner_select" ON answers FOR SELECT TO authenticated
  USING (session_id IN (
    SELECT id FROM sessions WHERE business_id IN (
      SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid()) OR owner_id IS NULL
    )
  ));

DROP POLICY IF EXISTS "review_drafts_owner_select" ON review_drafts;
CREATE POLICY "review_drafts_owner_select" ON review_drafts FOR SELECT TO authenticated
  USING (session_id IN (
    SELECT id FROM sessions WHERE business_id IN (
      SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid()) OR owner_id IS NULL
    )
  ));

DROP POLICY IF EXISTS "private_feedback_owner_select" ON private_feedback;
CREATE POLICY "private_feedback_owner_select" ON private_feedback FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid()) OR owner_id IS NULL));

DROP POLICY IF EXISTS "events_owner_select" ON events;
CREATE POLICY "events_owner_select" ON events FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid()) OR owner_id IS NULL));

-- =============================================================
-- 5. HELPER FUNCTION: seed questions
-- =============================================================
CREATE OR REPLACE FUNCTION seed_default_questions(p_business_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO questions (business_id, key, type, text, required, position, active) VALUES
    (p_business_id, 'overall_rating', 'rating',
     '{"en": "How was your overall dining experience?"}'::jsonb, true, 1, true),
    (p_business_id, 'food_rating', 'rating',
     '{"en": "How did you find the food & flavors?"}'::jsonb, true, 2, true),
    (p_business_id, 'service_rating', 'rating',
     '{"en": "How was the service & hospitality?"}'::jsonb, true, 3, true),
    (p_business_id, 'liked', 'multi_choice',
     '{"en": "What did you enjoy most today?"}'::jsonb, false, 4, true),
    (p_business_id, 'ordered', 'multi_choice',
     '{"en": "Which dishes did you order today?"}'::jsonb, false, 5, true),
    (p_business_id, 'comment', 'text',
     '{"en": "Any special message for our chefs?"}'::jsonb, false, 6, false),
    (p_business_id, 'return_intent', 'single_choice',
     '{"en": "Would you visit PM Zaika Restaurant again?"}'::jsonb, false, 7, false)
  ON CONFLICT (business_id, key) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- 6. SEED PM ZAIKA RESTAURANT RECORD & CAMPAIGNS
-- =============================================================
DO $$
DECLARE
  v_owner_id UUID;
  v_business_id UUID;
BEGIN
  -- Look for existing auth user, or set to null until first sign-up
  SELECT id INTO v_owner_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  -- 1. Check if PM Zaika Restaurant already exists
  SELECT id INTO v_business_id FROM businesses WHERE name ILIKE '%PM Zaika%' LIMIT 1;

  IF v_business_id IS NULL THEN
    INSERT INTO businesses (
      owner_id,
      name,
      category,
      location,
      phone,
      secondary_phone,
      timezone,
      primary_color,
      welcome_message,
      google_review_url
    ) VALUES (
      v_owner_id,
      'Residence Inn',
      'restaurant',
      'behind P&M Mall and Ion Digital Zone, near Vishwakarma Mandir, Patliputra Industrial Area, Patliputra Colony, Patna, Bihar 800013',
      '6201699943',
      '6201699943',
      'Asia/Kolkata',
      '#d97706',
      '{"en": "Welcome to Residence Inn! Share your honest dining experience with us in 30 seconds. For helpline & orders call 6201699943."}'::jsonb,
      'https://search.google.com/local/writereview?placeid=ChIJ52esmZNf7TkRoznWIQnz7uo'
    )
    RETURNING id INTO v_business_id;
  ELSE
    -- Update existing record with official Residence Inn info
    UPDATE businesses SET
      name = 'Residence Inn',
      location = 'behind P&M Mall and Ion Digital Zone, near Vishwakarma Mandir, Patliputra Industrial Area, Patliputra Colony, Patna, Bihar 800013',
      phone = '6201699943',
      secondary_phone = '6201699943',
      welcome_message = '{"en": "Welcome to Residence Inn! Share your honest dining experience with us in 30 seconds. For helpline & orders call 6201699943."}'::jsonb,
      google_review_url = 'https://search.google.com/local/writereview?placeid=ChIJ52esmZNf7TkRoznWIQnz7uo',
      updated_at = now()
    WHERE id = v_business_id;
  END IF;

  -- 2. Seed default questions
  PERFORM seed_default_questions(v_business_id);

  -- 3. Seed primary campaign: residence-inn and pm-zaika
  INSERT INTO campaigns (business_id, name, slug, active)
  VALUES (v_business_id, 'Table Stands - Dine-In QR', 'residence-inn', true)
  ON CONFLICT (slug) DO UPDATE SET active = true, business_id = v_business_id;

  INSERT INTO campaigns (business_id, name, slug, active)
  VALUES (v_business_id, 'Residence Inn - Table Stand QR', 'pm-zaika', true)
  ON CONFLICT (slug) DO UPDATE SET active = true, business_id = v_business_id;

  -- Also seed alias campaign 'patna-dining' so any existing bookmarks work
  INSERT INTO campaigns (business_id, name, slug, active)
  VALUES (v_business_id, 'Main Dining Hall Stand', 'patna-dining', true)
  ON CONFLICT (slug) DO UPDATE SET active = true, business_id = v_business_id;

  -- 4. Seed PM Zaika Menu Items
  INSERT INTO menu_items (business_id, name, position, active) VALUES
    (v_business_id, '{"en": "PM Zaika Special Biryani"}'::jsonb, 1, true),
    (v_business_id, '{"en": "Chicken Dum Biryani"}'::jsonb, 2, true),
    (v_business_id, '{"en": "Mutton Korma Special"}'::jsonb, 3, true),
    (v_business_id, '{"en": "Chicken Handi Zaika"}'::jsonb, 4, true),
    (v_business_id, '{"en": "Chicken Tikka Butter Masala"}'::jsonb, 5, true),
    (v_business_id, '{"en": "Paneer Butter Masala"}'::jsonb, 6, true),
    (v_business_id, '{"en": "Zaika Special Fried Rice"}'::jsonb, 7, true),
    (v_business_id, '{"en": "Butter Naan & Rumali Roti"}'::jsonb, 8, true),
    (v_business_id, '{"en": "Gulab Jamun"}'::jsonb, 9, true)
  ON CONFLICT DO NOTHING;

END $$;

-- Verify setup output
SELECT id, name, location, phone, secondary_phone FROM businesses;
