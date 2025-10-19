-- Create profiles table for additional user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  avatar_url TEXT,
  company TEXT,
  role TEXT,
  phone TEXT,
  bio TEXT,
  email_notifications boolean DEFAULT true,
  theme text DEFAULT 'light',
  openai_api_key text,
  google_ai_api_key text,
  language text DEFAULT 'it',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name', 
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create candidates table for managing candidate data per user
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT,
  company TEXT,
  experience_years INTEGER,
  skills TEXT[],
  notes TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interviewed', 'hired', 'rejected')),
  photo_url TEXT,
  cv_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for candidates
CREATE POLICY "Users can view their own candidates" 
ON public.candidates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own candidates" 
ON public.candidates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own candidates" 
ON public.candidates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own candidates" 
ON public.candidates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON public.candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_order ON public.candidates(user_id, order_index);

-- Create storage bucket for candidate photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-photos',
  'candidate-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for candidate CVs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-cvs',
  'candidate-cvs',
  false,
  10485760,
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