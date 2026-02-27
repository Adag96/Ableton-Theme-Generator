-- ABL-64: Feedback table for bug reports and feature requests
-- Run this migration against your Supabase project

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature')),
  title TEXT NOT NULL CHECK (char_length(title) <= 80),
  description TEXT NOT NULL CHECK (char_length(description) <= 2000),
  priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 5),
  os_info JSONB,  -- { platform, osVersion, arch, appVersion } for bugs only
  app_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'wontfix')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT
);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own feedback
CREATE POLICY "Users can read own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);
