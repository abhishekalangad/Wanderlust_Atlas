-- ==========================================
-- WANDERLUST ATLAS — TRIP PLANNER DATABASE SCHEMA
-- ==========================================

-- 1. TRIPS TABLE
CREATE TABLE IF NOT EXISTS public.trips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  start_date      DATE,
  end_date        DATE,
  notes           TEXT,
  cover_image_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TRIP TRANSPORTATION TABLE
-- mode includes: 'plane', 'train', 'bus', 'car', 'ship', 'bike', 'irctc_dormitory'
-- For irctc_dormitory: carrier_or_name = room type, ticket_no = PNR, origin = station,
-- departure_time = check-in, arrival_time = check-out, destination_name = amount paid
CREATE TABLE IF NOT EXISTS public.trip_transportation (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  mode            TEXT NOT NULL DEFAULT 'plane', -- 'plane', 'train', 'bus', 'car', 'ship', 'bike', 'irctc_dormitory'
  carrier_or_name TEXT, -- e.g. "Emirates EK202" or "Vande Bharat Express" or "AC Dormitory 4-Bed"
  ticket_no       TEXT, -- e.g. "PNR #849204"
  departure_time  TIMESTAMPTZ,
  arrival_time    TIMESTAMPTZ,
  origin          TEXT,
  destination_name TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRIP DESTINATIONS & STAYS TABLE
CREATE TABLE IF NOT EXISTS public.trip_destinations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  destination_id  UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
  place_name      TEXT NOT NULL,
  arrival_date    DATE,
  departure_date  DATE,
  stay_name       TEXT, -- e.g. "Grand Hyatt Bali"
  stay_address    TEXT,
  stay_booking_ref TEXT, -- e.g. "Booking.com #938201"
  checklist_items JSONB DEFAULT '[]'::jsonb, -- Array of { id: string, title: string, is_completed: boolean }
  order_index     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- MIGRATION: Add expanded Stay, Ticket, & Transport fields
-- Run this in your Supabase SQL Editor if you want native Postgres columns
-- ==========================================
ALTER TABLE public.trip_destinations
  ADD COLUMN IF NOT EXISTS stay_booking_platform        TEXT,
  ADD COLUMN IF NOT EXISTS stay_booking_platform_other  TEXT,
  ADD COLUMN IF NOT EXISTS stay_check_in                TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stay_check_out               TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stay_rate                    TEXT,
  ADD COLUMN IF NOT EXISTS stay_status                  TEXT,           -- 'confirmed' | 'cancelled'
  ADD COLUMN IF NOT EXISTS stay_refund_status           TEXT,           -- 'complete' | 'pending'
  ADD COLUMN IF NOT EXISTS stay_contact                 TEXT,
  ADD COLUMN IF NOT EXISTS stay_room_type               TEXT,
  ADD COLUMN IF NOT EXISTS stay_notes                   TEXT,
  ADD COLUMN IF NOT EXISTS ticket_required              BOOLEAN,
  ADD COLUMN IF NOT EXISTS ticket_booking_url           TEXT,
  ADD COLUMN IF NOT EXISTS ticket_booking_ref           TEXT,
  ADD COLUMN IF NOT EXISTS ticket_price                 TEXT,
  ADD COLUMN IF NOT EXISTS ticket_timing_notes          TEXT,
  ADD COLUMN IF NOT EXISTS is_completed                 BOOLEAN DEFAULT FALSE;

ALTER TABLE public.trip_transportation
  ADD COLUMN IF NOT EXISTS bus_no                       TEXT,
  ADD COLUMN IF NOT EXISTS pnr_no                       TEXT,
  ADD COLUMN IF NOT EXISTS amount                       TEXT,
  ADD COLUMN IF NOT EXISTS booking_platform             TEXT,
  ADD COLUMN IF NOT EXISTS booking_platform_other       TEXT;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_transportation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_destinations ENABLE ROW LEVEL SECURITY;

-- TRIPS POLICIES
DROP POLICY IF EXISTS "Users can manage their own trips" ON public.trips;
CREATE POLICY "Users can manage their own trips"
  ON public.trips FOR ALL USING (auth.uid() = user_id);

-- TRANSPORTATION POLICIES
DROP POLICY IF EXISTS "Users can manage trip transportation" ON public.trip_transportation;
CREATE POLICY "Users can manage trip transportation"
  ON public.trip_transportation FOR ALL USING (
    EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND user_id = auth.uid())
  );

-- DESTINATIONS POLICIES
DROP POLICY IF EXISTS "Users can manage trip destinations" ON public.trip_destinations;
CREATE POLICY "Users can manage trip destinations"
  ON public.trip_destinations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND user_id = auth.uid())
  );
