-- Add API key columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN openai_api_key text,
ADD COLUMN google_ai_api_key text,
ADD COLUMN language text DEFAULT 'it';