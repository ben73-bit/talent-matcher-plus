-- Abilita RLS per la tabella database_collaborators se non già abilitato
ALTER TABLE public.database_collaborators ENABLE ROW LEVEL SECURITY;

-- Rimuovi eventuali politiche esistenti che potrebbero entrare in conflitto (opzionale, ma utile per pulizia)
DROP POLICY IF EXISTS "Owners can view all collaborators for their databases" ON public.database_collaborators;
DROP POLICY IF EXISTS "Collaborators can view their own entry" ON public.database_collaborators;

-- Policy per consentire ai proprietari del database di visualizzare tutti i collaboratori per i loro database
CREATE POLICY "Owners can view all collaborators for their databases"
ON public.database_collaborators
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.databases
    WHERE databases.id = database_collaborators.database_id
      AND databases.user_id = auth.uid()
  )
);

-- Policy per consentire ai collaboratori di visualizzare la propria voce (per la lista dei database condivisi)
CREATE POLICY "Collaborators can view their own entry"
ON public.database_collaborators
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Abilita RLS per la tabella profiles se non già abilitato
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Rimuovi eventuali politiche esistenti che potrebbero entrare in conflitto (opzionale, ma utile per pulizia)
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON public.profiles;

-- Policy per consentire agli utenti autenticati di visualizzare i profili (necessario per mostrare i nomi dei collaboratori)
CREATE POLICY "Allow authenticated users to view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);