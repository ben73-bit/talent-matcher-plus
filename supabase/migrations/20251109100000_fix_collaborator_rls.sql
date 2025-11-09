-- Drop all existing policies on profiles to ensure a clean slate
DROP POLICY IF EXISTS "Allow self view profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow owner to view collaborator profiles in owned databases" ON public.profiles;
DROP POLICY IF EXISTS "Allow collaborators to view shared database collaborators' profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow viewing profiles of collaborators in shared databases" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile and relevant collaborators" ON public.profiles;


-- Enable RLS for profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Comprehensive policy for SELECT on profiles
-- This policy allows:
-- 1. A user to view their own profile.
-- 2. A database owner to view profiles of all collaborators in their owned databases.
-- 3. A collaborator to view profiles of other collaborators in databases they share.
CREATE POLICY "Enable read access for own profile and relevant collaborators"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() -- User can always see their own profile
  OR EXISTS (
    -- Case 1: Current user is an owner of a database, and the profile belongs to a collaborator in that database
    SELECT 1
    FROM public.databases db
    WHERE db.user_id = auth.uid()
      AND profiles.user_id IN (
        SELECT dc.user_id
        FROM public.database_collaborators dc
        WHERE dc.database_id = db.id
      )
  )
  OR EXISTS (
    -- Case 2: Current user is a collaborator in a database, and the profile belongs to another collaborator in the same database
    SELECT 1
    FROM public.database_collaborators dc_current
    WHERE dc_current.user_id = auth.uid()
      AND profiles.user_id IN (
        SELECT dc_other.user_id
        FROM public.database_collaborators dc_other
        WHERE dc_other.database_id = dc_current.database_id
      )
  )
);