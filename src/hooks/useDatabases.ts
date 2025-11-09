import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface Database {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  role?: string; // Role of current user (owner/viewer)
}

export interface DatabaseCollaborator {
  id: string;
  database_id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export interface DatabaseInvitation {
  id: string;
  database_id: string;
  created_by: string;
  invited_username: string;
  created_at: string;
  accepted_at?: string;
}

export function useDatabases() {
  const [ownDatabases, setOwnDatabases] = useState<Database[]>([]);
  const [sharedDatabases, setSharedDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDatabases = async () => {
    if (!user) {
      setOwnDatabases([]);
      setSharedDatabases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch own databases
      const { data: ownData, error: ownError } = await supabase
        .from('databases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ownError) throw ownError;

      // Fetch shared databases
      const { data: sharedData, error: sharedError } = await supabase
        .from('database_collaborators')
        .select(`
          database_id,
          role,
          databases (*)
        `)
        .eq('user_id', user.id);

      if (sharedError) throw sharedError;

      setOwnDatabases((ownData || []) as Database[]);
      
      const shared = (sharedData || []).map((item: any) => ({
        ...item.databases,
        role: item.role
      })) as Database[];
      setSharedDatabases(shared);

    } catch (error) {
      console.error('Error fetching databases:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDatabase = async (name: string, description?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('databases')
        .insert([{ name, description, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setOwnDatabases(prev => [data as Database, ...prev]);
      toast({
        title: "Successo",
        description: "Database creato con successo",
      });

      return data;
    } catch (error) {
      console.error('Error creating database:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare il database",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateDatabase = async (id: string, updates: { name?: string; description?: string }) => {
    try {
      const { data, error } = await supabase
        .from('databases')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      setOwnDatabases(prev =>
        prev.map(db => db.id === id ? data as Database : db)
      );

      toast({
        title: "Successo",
        description: "Database aggiornato con successo",
      });

      return data;
    } catch (error) {
      console.error('Error updating database:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il database",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteDatabase = async (id: string) => {
    try {
      const { error } = await supabase
        .from('databases')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setOwnDatabases(prev => prev.filter(db => db.id !== id));
      toast({
        title: "Successo",
        description: "Database eliminato con successo",
      });

      return true;
    } catch (error) {
      console.error('Error deleting database:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il database",
        variant: "destructive",
      });
      return false;
    }
  };

  const inviteCollaborator = async (databaseId: string, username: string) => {
    try {
      const { data, error } = await supabase
        .from('database_invitations')
        .insert([{
          database_id: databaseId,
          created_by: user?.id,
          invited_username: username
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Invito inviato con successo",
      });

      return data;
    } catch (error: any) {
      console.error('Error inviting collaborator:', error);
      toast({
        title: "Errore",
        description: error.message?.includes('not found') 
          ? "Utente non trovato" 
          : "Impossibile inviare l'invito",
        variant: "destructive",
      });
      return null;
    }
  };

  const getCollaborators = async (databaseId: string): Promise<DatabaseCollaborator[]> => {
    console.log(`[useDatabases] Fetching collaborators for databaseId: ${databaseId}`);
    try {
      const { data, error } = await supabase
        .from('database_collaborators')
        .select(`
          *,
          profiles!database_collaborators_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('database_id', databaseId);

      if (error) {
        console.error('[useDatabases] Supabase error fetching collaborators:', error);
        throw error;
      }
      console.log('[useDatabases] Raw collaborators data for databaseId', databaseId, ':', data);

      const collaboratorsWithProfiles = (data || []).map((item: any) => ({
        ...item,
        profile: item.profiles
      })) as DatabaseCollaborator[];
      console.log('[useDatabases] Mapped collaborators:', collaboratorsWithProfiles);
      return collaboratorsWithProfiles;
    } catch (error) {
      console.error('[useDatabases] Error fetching collaborators:', error);
      return [];
    }
  };

  const removeCollaborator = async (collaboratorId: string) => {
    try {
      const { error } = await supabase
        .from('database_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Collaboratore rimosso con successo",
      });

      return true;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast({
        title: "Errore",
        description: "Impossibile rimuovere il collaboratore",
        variant: "destructive",
      });
      return false;
    }
  };

  const getPendingInvitations = async (databaseId: string): Promise<DatabaseInvitation[]> => {
    console.log(`[useDatabases] Fetching pending invitations for databaseId: ${databaseId}`);
    try {
      const { data, error } = await supabase
        .from('database_invitations')
        .select('*')
        .eq('database_id', databaseId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useDatabases] Supabase error fetching pending invitations:', error);
        throw error;
      }
      console.log('[useDatabases] Raw pending invitations data for databaseId', databaseId, ':', data);

      return (data || []) as DatabaseInvitation[];
    } catch (error) {
      console.error('[useDatabases] Error fetching invitations:', error);
      return [];
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    if (!user) return false;

    try {
      // Use the database RPC function to accept invitation
      const { data, error } = await supabase.rpc('accept_database_invitation', {
        invitation_id: invitationId
      });

      if (error) throw error;

      if (data) {
        // Refresh databases list to show the newly shared database
        await fetchDatabases();

        toast({
          title: "Successo",
          description: "Invito accettato con successo",
        });

        // Trigger a broadcast to notify the database owner
        // This broadcast is now redundant if the owner also has a real-time subscription
        // but it doesn't hurt to keep it for other potential listeners.
        await supabase
          .channel('database_updates')
          .send({
            type: 'broadcast',
            event: 'collaborator_added',
            payload: { invitation_id: invitationId }
          });

        return true;
      } else {
        toast({
          title: "Errore",
          description: "Invito non valido o già accettato",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile accettare l'invito",
        variant: "destructive",
      });
      return false;
    }
  };

  const getCandidateCount = async (databaseId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('database_id', databaseId);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error counting candidates:', error);
      return 0;
    }
  };

  useEffect(() => {
    fetchDatabases();

    // Real-time subscription for database collaborators
    // This ensures the owner's view is updated when a collaborator accepts an invitation
    const channel = supabase
      .channel('database_collaborators_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Listen for new collaborators being added
          schema: 'public',
          table: 'database_collaborators',
        },
        (payload) => {
          console.log('Realtime update: new collaborator added', payload);
          // Refetch all databases to update the owner's view
          fetchDatabases();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE', // Listen for collaborators being removed
          schema: 'public',
          table: 'database_collaborators',
        },
        (payload) => {
          console.log('Realtime update: collaborator removed', payload);
          fetchDatabases();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]); // Re-subscribe if user changes

  return {
    ownDatabases,
    sharedDatabases,
    loading,
    createDatabase,
    updateDatabase,
    deleteDatabase,
    inviteCollaborator,
    getCollaborators,
    removeCollaborator,
    getPendingInvitations,
    acceptInvitation,
    getCandidateCount,
    refetch: fetchDatabases,
  };
}