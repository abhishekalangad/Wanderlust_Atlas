-- ============================================================
-- WANDERLUST ATLAS — SEED DATA
-- Populate initial destinations with local asset paths
-- ============================================================

INSERT INTO public.destinations (
  name, country, continent, category, description, image_url, mood_tags, difficulty, best_season, avg_cost_usd, is_featured, approval_status
) VALUES
  ('Santorini Caldera', 'Greece', 'Europe', 'beach', 'Iconic whitewashed villages perched on volcanic cliffs above the deep blue Aegean Sea.', 'assets/images/destinations/santorini.png', ARRAY['romantic', 'iconic', 'sunset'], 'easy', 'May–October', 2200, true, 'approved'),
  ('Kyoto Arashiyama', 'Japan', 'Asia', 'culture', 'Ancient bamboo groves, historic zen temples, and traditional tea houses.', 'assets/images/destinations/kyoto.png', ARRAY['serene', 'historic', 'nature'], 'easy', 'Spring/Autumn', 1800, true, 'approved'),
  ('Machu Picchu', 'Peru', 'South America', 'adventure', 'Ancient Incan citadel set high in the Andes Mountains above the Urubamba River valley.', 'assets/images/destinations/machu-picchu.png', ARRAY['ancient', 'hiking', 'bucketlist'], 'challenging', 'May–September', 2500, true, 'approved'),
  ('Amalfi Coast', 'Italy', 'Europe', 'road_trip', 'Dramatic cliffside towns, pastel houses, lemon groves, and sparkling Mediterranean waters.', 'assets/images/destinations/amalfi.png', ARRAY['scenic', 'coastal', 'luxury'], 'moderate', 'May–September', 3000, true, 'approved'),
  ('Banff National Park', 'Canada', 'North America', 'nature', 'Turquoise glacial lakes, towering Rocky Mountain peaks, and abundant wildlife.', 'assets/images/destinations/banff.png', ARRAY['mountains', 'wilderness', 'lakes'], 'moderate', 'June–August', 1500, true, 'approved'),
  ('Serengeti Safari', 'Tanzania', 'Africa', 'wildlife', 'Witness the Great Migration across vast golden savannahs filled with lions and elephants.', 'assets/images/destinations/sahara.png', ARRAY['safari', 'wildlife', 'epic'], 'moderate', 'June–October', 4500, true, 'approved')
ON CONFLICT DO NOTHING;
