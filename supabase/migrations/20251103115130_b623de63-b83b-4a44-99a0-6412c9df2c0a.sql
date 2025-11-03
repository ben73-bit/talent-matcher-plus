-- Add export preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS export_format text DEFAULT 'csv',
ADD COLUMN IF NOT EXISTS export_include_photos boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS export_include_cvs boolean DEFAULT false;