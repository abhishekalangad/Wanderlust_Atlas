-- ============================================================
-- WANDERLUST ATLAS — SUPABASE SCHEMA (ORDER FIXED)
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  bio         TEXT,
  is_admin    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create profiles for existing auth users if missing
INSERT INTO public.profiles (id, username, full_name, is_admin)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  COALESCE((raw_user_meta_data->>'is_admin')::boolean, false)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Set admin access for primary user
UPDATE public.profiles SET is_admin = true WHERE username ILIKE '%abhishek%';

-- ============================================================
-- 2. DESTINATIONS (With All Place Details — Optional Fields)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.destinations (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                      TEXT,
  country                   TEXT,
  continent                 TEXT,
  category                  TEXT,
  description               TEXT,
  image_url                 TEXT,
  mood_tags                 TEXT[] DEFAULT '{}',
  difficulty                TEXT CHECK (difficulty IN ('easy', 'moderate', 'challenging')),
  best_season               TEXT,
  avg_cost_usd              NUMERIC(10,2),
  recommended_duration_days TEXT,
  nearest_airport           TEXT,
  local_currency_language   TEXT,
  visa_info                 TEXT,
  must_try_activities       TEXT,
  is_featured               BOOLEAN DEFAULT FALSE,
  approval_status           TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  submitted_by              UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by                UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved destinations are viewable by everyone"
  ON public.destinations FOR SELECT
  USING (
    approval_status = 'approved' OR
    auth.uid() = submitted_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Authenticated users can submit destinations"
  ON public.destinations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins or submitter can update destinations"
  ON public.destinations FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) OR
    (auth.uid() = submitted_by AND approval_status = 'pending')
  );

CREATE POLICY "Admins can delete destinations"
  ON public.destinations FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- 3. BUCKET LIST ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bucket_list_items (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  destination_id        UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'dreaming' CHECK (status IN ('dreaming', 'planning', 'booked', 'completed')),
  target_year           INTEGER,
  target_month          TEXT,
  estimated_budget_usd  NUMERIC(10,2),
  priority              TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  notes                 TEXT,
  travel_tips           TEXT,
  added_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, destination_id)
);

ALTER TABLE public.bucket_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bucket list"
  ON public.bucket_list_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public bucket lists viewable by everyone"
  ON public.bucket_list_items FOR SELECT
  USING (true);

-- ============================================================
-- 4. TRAVELOGUES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.travelogues (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  destination_id  UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  excerpt         TEXT,
  content         TEXT NOT NULL,
  cover_image_url TEXT,
  pdf_url         TEXT,
  is_published    BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.travelogues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published travelogues are viewable by everyone"
  ON public.travelogues FOR SELECT
  USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Users can create travelogues"
  ON public.travelogues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travelogues"
  ON public.travelogues FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own travelogues"
  ON public.travelogues FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. USER FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone"
  ON public.user_follows FOR SELECT USING (true);

CREATE POLICY "Users can follow/unfollow"
  ON public.user_follows FOR ALL
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- ============================================================
-- 6. ENABLE REALTIME FOR ALL TABLES (Placed after table creation)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.bucket_list_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.destinations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.travelogues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;

-- ============================================================
-- 7. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('destination-images', 'destination-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('travelogue-pdfs', 'travelogue-pdfs', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public storage access" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload storage objects" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their storage objects" ON storage.objects FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their storage objects" ON storage.objects FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
