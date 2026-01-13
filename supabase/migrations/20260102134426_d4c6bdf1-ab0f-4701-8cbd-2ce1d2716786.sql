-- Create history table for CMS version tracking
CREATE TABLE public.site_content_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.site_content(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  value_he TEXT,
  value_en TEXT,
  metadata JSONB DEFAULT '{}',
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT now(),
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'restore'))
);

-- Enable RLS
ALTER TABLE public.site_content_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read history
CREATE POLICY "Authenticated users can view history" ON public.site_content_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert history
CREATE POLICY "Authenticated users can insert history" ON public.site_content_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Index for faster queries
CREATE INDEX idx_site_content_history_content_id ON public.site_content_history(content_id);
CREATE INDEX idx_site_content_history_changed_at ON public.site_content_history(changed_at DESC);

-- Add trails to site_content
INSERT INTO public.site_content (section, content_key, value_he, value_en, content_type, sort_order, is_active, metadata) VALUES
('trails', 'trail.ardon', 'מסלול הר ארדון', 'Mount Ardon Trail', 'trail', 1, true, 
  '{"descriptionHe": "מסלול קל ונוח המתאים למתחילים, עובר דרך נופים מרהיבים של המכתש", "descriptionEn": "An easy and comfortable trail suitable for beginners, passing through stunning crater views", "difficulty": "easy", "duration": "2-3", "distance": "12", "googleMapsUrl": "https://www.google.com/maps/dir/?api=1&destination=30.5983,34.8017&travelmode=bicycling", "komootUrl": "https://www.komoot.com/tour/ramon-crater", "image": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"}'),
('trails', 'trail.colorful', 'לולאת הגבעות הצבעוניות', 'Colorful Hills Loop', 'trail', 2, true, 
  '{"descriptionHe": "מסלול בינוני עם נופים צבעוניים מרהיבים של סלעים בגוונים שונים", "descriptionEn": "Moderate trail with stunning colorful views of rocks in various shades", "difficulty": "moderate", "duration": "3-4", "distance": "18", "googleMapsUrl": "https://www.google.com/maps/dir/?api=1&destination=30.6123,34.8234&travelmode=bicycling", "image": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800"}'),
('trails', 'trail.canyon', 'מסלול הקניון הגדול', 'Grand Canyon Trail', 'trail', 3, true, 
  '{"descriptionHe": "מסלול מאתגר לרוכבים מנוסים, כולל ירידות ועליות תלולות", "descriptionEn": "Challenging trail for experienced riders, includes steep descents and climbs", "difficulty": "hard", "duration": "4-5", "distance": "25", "googleMapsUrl": "https://www.google.com/maps/dir/?api=1&destination=30.5856,34.7891&travelmode=bicycling", "komootUrl": "https://www.komoot.com/tour/grand-canyon-ramon", "image": "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800"}'),
('trails', 'trail.sunrise', 'מסלול הזריחה', 'Sunrise Trail', 'trail', 4, true, 
  '{"descriptionHe": "מסלול קצר וקל, מושלם לצפייה בזריחה מעל המכתש", "descriptionEn": "Short and easy trail, perfect for watching the sunrise over the crater", "difficulty": "easy", "duration": "1-2", "distance": "8", "googleMapsUrl": "https://www.google.com/maps/dir/?api=1&destination=30.6045,34.8156&travelmode=bicycling", "image": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"}');