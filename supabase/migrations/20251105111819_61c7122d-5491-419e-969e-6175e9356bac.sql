-- Fix invitation RLS policy that accesses auth.users directly

-- Drop the problematic policy that accesses auth.users directly
DROP POLICY IF EXISTS "Users can view their received invitations" ON public.database_invitations;

-- Create a security definer function to get user email
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = _user_id
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Users can view their received invitations"
ON public.database_invitations
FOR SELECT
USING (invited_username = public.get_user_email(auth.uid()));