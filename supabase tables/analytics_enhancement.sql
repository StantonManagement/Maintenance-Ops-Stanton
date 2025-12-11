-- Analytics Enhancement Schema
-- PRP: Analytics Dashboard Enhancement
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. EVENT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- 'created', 'assigned', 'started', 'completed', 'cancelled'
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id UUID REFERENCES auth.users(id),
  actor_type TEXT,  -- 'system', 'coordinator', 'technician', 'tenant'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries by work order
CREATE INDEX IF NOT EXISTS idx_event_logs_work_order ON event_logs(work_order_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_type_time ON event_logs(event_type, event_timestamp);

-- Enable RLS
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read all events
DROP POLICY IF EXISTS "Authenticated users can read events" ON event_logs;
CREATE POLICY "Authenticated users can read events"
  ON event_logs FOR SELECT
  TO authenticated
  USING (true);

-- Policy: system/coordinators can insert events
DROP POLICY IF EXISTS "System can insert events" ON event_logs;
CREATE POLICY "System can insert events"
  ON event_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 2. REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id TEXT NOT NULL UNIQUE,
  tenant_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  review_type TEXT DEFAULT 'post_completion',  -- 'post_completion', 'follow_up'
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_reviews_submitted ON reviews(submitted_at);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read reviews" ON reviews;
CREATE POLICY "Authenticated users can read reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Tenants can submit reviews" ON reviews;
CREATE POLICY "Tenants can submit reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);
