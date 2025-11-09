-- Drop existing policies for database_collaborators to avoid conflicts
DROP POLICY IF EXISTS "Owners can view all collaborators for their databases" ON public.database_collaborators;
DROP POLICY IF EXISTS "Collaborators can view their own entry" ON public.database_collaborators;

-- Enable RLS for database_collaborators if not already enabled
ALTER TABLE public.database_collaborators ENABLE ROW LEVEL SECURITY;

-- Create a single, comprehensive policy for SELECT on database_collaborators
-- This policy allows:
-- 1. A collaborator to see their own entry (e.g., to list shared databases they are part of).
-- 2. The owner of a database to see all collaborators associated with that database.
CREATE POLICY "Enable read access for database owners and self"
ON public.database_collaborators
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR -- Allow a collaborator to see their own entry
  EXISTS (
    SELECT 1
    FROM public.databases
    WHERE databases.id = database_collaborators.database_id
      AND databases.user_id = auth.uid() -- Allow the owner of the database to see all collaborators for that database
  )
);

-- Drop existing policy for profiles to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON public.profiles;

-- Enable RLS for profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to view their own profile
CREATE POLICY "Allow users to view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Allow users to view profiles of collaborators in shared databases
-- This policy ensures that:
-- - A user can see the profile of the owner of a database they collaborate in.
-- - A user can see the profiles of other collaborators in a database they also collaborate in.
-- - An owner can see the profiles of all collaborators in their databases.
CREATE POLICY "Allow viewing profiles of collaborators in shared databases"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.database_collaborators dc1
    WHERE dc1.user_id = auth.uid() -- Current user is a collaborator in dc1.database_id
      AND EXISTS (
        SELECT 1
        FROM public.database_collaborators dc2
        WHERE dc2.database_id = dc1.database_id -- dc2 is in the same database
          AND dc2.user_id = profiles.user_id -- The profile belongs to dc2's user
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.databases db
    WHERE db.user_id = auth.uid() -- Current user owns db.id
      AND EXISTS (
        SELECT 1
        FROM public.database_collaborators dc
        WHERE dc.database_id = db.id -- dc is in the owner's database
          AND dc.user_id = profiles.user_id -- The profile belongs to dc's user
      )
  )
);