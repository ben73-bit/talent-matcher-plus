-- Fix infinite recursion in RLS policies

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view shared databases" ON public.databases;
DROP POLICY IF EXISTS "Users can view collaborators of their databases" ON public.database_collaborators;
DROP POLICY IF EXISTS "Candidates viewable by owner or collaborators" ON public.candidates;

-- Recreate database_collaborators policies without recursion
CREATE POLICY "Users can view their own collaborations"
ON public.database_collaborators
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Database owners can view collaborators"
ON public.database_collaborators
FOR SELECT
USING (
  database_id IN (
    SELECT id FROM public.databases WHERE user_id = auth.uid()
  )
);

-- Recreate databases policy without recursion
CREATE POLICY "Users can view shared databases"
ON public.databases
FOR SELECT
USING (
  id IN (
    SELECT database_id 
    FROM public.database_collaborators 
    WHERE user_id = auth.uid()
  )
);

-- Recreate candidates policy without recursion
CREATE POLICY "Candidates viewable by owner or collaborators"
ON public.candidates
FOR SELECT
USING (
  user_id = auth.uid() 
  OR 
  database_id IN (
    SELECT database_id 
    FROM public.database_collaborators 
    WHERE user_id = auth.uid()
  )
);