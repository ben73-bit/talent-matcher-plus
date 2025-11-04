-- Create enum for share roles
CREATE TYPE public.share_role AS ENUM ('viewer');

-- Create enum for invitation status
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create table for candidate shares
CREATE TABLE public.candidate_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role share_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(owner_id, shared_with_user_id)
);

-- Create table for share invitations
CREATE TABLE public.share_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  status invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE(owner_id, invited_email)
);

-- Enable RLS on candidate_shares
ALTER TABLE public.candidate_shares ENABLE ROW LEVEL SECURITY;

-- Enable RLS on share_invitations
ALTER TABLE public.share_invitations ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has access to owner's candidates
CREATE OR REPLACE FUNCTION public.has_candidate_access(_user_id uuid, _owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.candidate_shares
    WHERE owner_id = _owner_id
      AND shared_with_user_id = _user_id
  ) OR _user_id = _owner_id;
$$;

-- Update candidates RLS policies to include shared access
DROP POLICY IF EXISTS "Users can view their own candidates" ON public.candidates;
CREATE POLICY "Users can view own or shared candidates" 
ON public.candidates 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.candidate_shares 
    WHERE owner_id = candidates.user_id 
    AND shared_with_user_id = auth.uid()
  )
);

-- Policies for candidate_shares
CREATE POLICY "Users can view their shares" 
ON public.candidate_shares 
FOR SELECT 
USING (auth.uid() = owner_id OR auth.uid() = shared_with_user_id);

CREATE POLICY "Owners can create shares" 
ON public.candidate_shares 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their shares" 
ON public.candidate_shares 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Policies for share_invitations
CREATE POLICY "Users can view their invitations" 
ON public.share_invitations 
FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create invitations" 
ON public.share_invitations 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their invitations" 
ON public.share_invitations 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their invitations" 
ON public.share_invitations 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Trigger to update updated_at on candidate_shares
CREATE TRIGGER update_candidate_shares_updated_at
BEFORE UPDATE ON public.candidate_shares
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically accept invitations when user signs up
CREATE OR REPLACE FUNCTION public.handle_invitation_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check for pending invitations for this email
  INSERT INTO public.candidate_shares (owner_id, shared_with_user_id, role)
  SELECT owner_id, NEW.id, 'viewer'
  FROM public.share_invitations
  WHERE invited_email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
  ON CONFLICT (owner_id, shared_with_user_id) DO NOTHING;
  
  -- Mark invitations as accepted
  UPDATE public.share_invitations
  SET status = 'accepted'
  WHERE invited_email = NEW.email
    AND status = 'pending'
    AND expires_at > now();
  
  RETURN NEW;
END;
$$;

-- Trigger to accept invitations on user creation
CREATE TRIGGER on_user_created_accept_invitations
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_invitation_acceptance();