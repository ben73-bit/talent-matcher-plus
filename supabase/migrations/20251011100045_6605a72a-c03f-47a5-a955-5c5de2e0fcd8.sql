-- Add photo_url and cv_url columns to candidates table
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- Create storage bucket for candidate photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-photos',
  'candidate-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for candidate CVs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-cvs',
  'candidate-cvs',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for candidate photos
CREATE POLICY "Users can view candidate photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'candidate-photos');

CREATE POLICY "Users can upload candidate photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'candidate-photos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update candidate photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'candidate-photos'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete candidate photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'candidate-photos'
  AND auth.uid() IS NOT NULL
);

-- RLS policies for candidate CVs
CREATE POLICY "Users can view their candidate CVs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'candidate-cvs'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can upload candidate CVs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'candidate-cvs'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update candidate CVs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'candidate-cvs'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete candidate CVs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'candidate-cvs'
  AND auth.uid() IS NOT NULL
);