-- Fix infinite recursion using security definer functions

-- Drop all problematic policies
DROP POLICY IF EXISTS "Users can view shared databases" ON public.databases;
DROP POLICY IF EXISTS "Database owners can view collaborators" ON public.database_collaborators;
DROP POLICY IF EXISTS "Users can view their own collaborations" ON public.database_collaborators;
DROP POLICY IF EXISTS "Candidates viewable by owner or collaborators" ON public.candidates;

-- Create security definer function to check if user is database owner
CREATE OR REPLACE FUNCTION public.is_database_owner(_user_id uuid, _database_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.databases
    WHERE id = _database_id
      AND user_id = _user_id
  )
$$;

-- Create security definer function to check if user is database collaborator
CREATE OR REPLACE FUNCTION public.is_database_collaborator(_user_id uuid, _database_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.database_collaborators
    WHERE database_id = _database_id
      AND user_id = _user_id
  )
$$;

-- Create security definer function to get user's collaborator database IDs
CREATE OR REPLACE FUNCTION public.get_user_collaborator_databases(_user_id uuid)
RETURNS TABLE(database_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT database_id
  FROM public.database_collaborators
  WHERE user_id = _user_id
$$;

-- Recreate database_collaborators policies using security definer functions
CREATE POLICY "Users can view their own collaborations"
ON public.database_collaborators
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Database owners can view collaborators"
ON public.database_collaborators
FOR SELECT
USING (public.is_database_owner(auth.uid(), database_id));

-- Recreate databases policy using security definer function
CREATE POLICY "Users can view shared databases"
ON public.databases
FOR SELECT
USING (public.is_database_collaborator(auth.uid(), id));

-- Recreate candidates policy using security definer function
CREATE POLICY "Candidates viewable by owner or collaborators"
ON public.candidates
FOR SELECT
USING (
  user_id = auth.uid() 
  OR 
  (database_id IS NOT NULL AND public.is_database_collaborator(auth.uid(), database_id))
);