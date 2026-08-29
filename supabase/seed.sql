-- ============================================================
-- WANDERLUST ATLAS — SEED DATA (LIVE WEB IMAGE URLS)
-- Run this in your Supabase SQL Editor
-- ============================================================

INSERT INTO public.destinations (
  name, country, continent, category, description, image_url, mood_tags, difficulty, best_season, avg_cost_usd, is_featured, approval_status
) VALUES
  ('Santorini Caldera', 'Greece', 'Europe', 'beach', 'Iconic whitewashed villages perched on volcanic cliffs above the deep blue Aegean Sea.', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80', ARRAY['romantic', 'iconic', 'sunset', 'island'], 'easy', 'May–October', 2200, true, 'approved'),
  ('Kyoto Arashiyama', 'Japan', 'Asia', 'culture', 'Ancient bamboo groves, historic zen temples, and traditional tea houses.', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80', ARRAY['serene', 'historic', 'spiritual', 'tradition'], 'easy', 'Spring/Autumn', 1800, true, 'approved'),
  ('Machu Picchu', 'Peru', 'South America', 'adventure', 'Ancient Incan citadel set high in the Andes Mountains above the Urubamba River valley.', 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80', ARRAY['ancient', 'mystical', 'mountain', 'history'], 'moderate', 'May–September', 2500, true, 'approved'),
  ('Amalfi Coast', 'Italy', 'Europe', 'road_trip', 'Dramatic cliffside towns, pastel houses, lemon groves, and sparkling Mediterranean waters.', 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80', ARRAY['romantic', 'scenic', 'food', 'coastal'], 'easy', 'May–September', 3000, true, 'approved'),
  ('Banff National Park', 'Canada', 'North America', 'nature', 'Turquoise glacial lakes, towering Rocky Mountain peaks, and abundant wildlife.', 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80', ARRAY['wilderness', 'glaciers', 'wildlife', 'mountains'], 'easy', 'June–August', 1500, true, 'approved'),
  ('Serengeti Safari', 'Tanzania', 'Africa', 'wildlife', 'Witness the Great Migration across vast golden savannahs filled with lions and elephants.', 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80', ARRAY['epic', 'desert', 'stargazing', 'remote'], 'moderate', 'June–October', 4500, true, 'approved'),
  ('Bali Island of Gods', 'Indonesia', 'Asia', 'beach', 'Tropical beaches, lush rice terraces, sacred sea temples, and holistic wellness retreats.', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80', ARRAY['spiritual', 'tropical', 'surf', 'wellness'], 'easy', 'April–October', 1400, false, 'approved'),
  ('Torres del Paine', 'Chile', 'South America', 'adventure', 'Dramatic granite horns, azure icebergs, and golden pampas at the end of the earth.', 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=1200&q=80', ARRAY['epic', 'wilderness', 'glaciers', 'remote'], 'challenging', 'November–March', 2800, false, 'approved')
ON CONFLICT DO NOTHING;
