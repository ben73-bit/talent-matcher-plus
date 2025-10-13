-- Add new columns to profiles table for user profile management
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL of user profile picture in storage';
COMMENT ON COLUMN public.profiles.company IS 'Company name where user works';
COMMENT ON COLUMN public.profiles.role IS 'User role/position in company';
COMMENT ON COLUMN public.profiles.phone IS 'User contact phone number';
COMMENT ON COLUMN public.profiles.bio IS 'User bio/description (optional)';