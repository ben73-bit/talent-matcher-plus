import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface Candidate {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  company?: string;
  experience_years?: number;
  skills?: string[];
  notes?: string;
  status: 'new' | 'contacted' | 'interviewed' | 'hired' | 'rejected';
  photo_url?: string;
  cv_url?: string;
  order_index?: number;
  database_id?: string; // Mantenuto per compatibilità con la tabella DB, ma non usato nell'UI
  created_at: string;
  updated_at: string;
}

export interface CreateCandidateData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  company?: string;
  experience_years?: number;
  skills?: string[];
  notes?: string;
  status?: 'new' | 'contacted' | 'interviewed' | 'hired' | 'rejected';
  photo_url?: string;
  cv_url?: string;
  // database_id?: string; Rimosso
}

export interface UpdateCandidateData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  company?: string;
  experience_years?: number;
  skills?: string[];
  notes?: string;
  status?: 'new' | 'contacted' | 'interviewed' | 'hired' | 'rejected';
  photo_url?: string;
  cv_url?: string;
  // database_id?: string; Rimosso
}

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch candidates
  const fetchCandidates = async () => {
    if (!user) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Ora recupera solo i candidati dell'utente corrente (RLS gestirà questo)
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCandidates((data || []) as Candidate[]);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i candidati",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create candidate
  const createCandidate = async (candidateData: CreateCandidateData) => {
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per aggiungere candidati",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('candidates')
        .insert([
          {
            ...candidateData,
            user_id: user.id,
            status: candidateData.status || 'new',
            // Rimosso database_id: null per risolvere l'errore PGRST204
          }
        ])
        .select()
        .single();

      if (error) {
        // Log the detailed error for debugging
        console.error('Supabase insertion error details:', error);
        throw error;
      }

      setCandidates(prev => [data as Candidate, ...prev]);
      // NOTE: We skip the success toast here because ImportCandidatesDialog handles the batch success toast.
      // If this function is called outside of batch import, the caller should handle the toast.
      
      return data;
    } catch (error) {
      console.error('Error creating candidate:', error);
      // Display a more informative error if possible, but keep it generic for batch import context
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il candidato. Controlla la console per i dettagli.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update candidate
  const updateCandidate = async (id: string, updates: UpdateCandidateData) => {
    if (!user) {
      toast({
        title: "Errore",
        description: "Utente non autenticato",
        variant: "destructive",
      });
      return null;
    }
    
    try {
      // Rimuovo l'assegnazione esplicita di database_id: null per evitare potenziali conflitti
      // e mi affido al fatto che database_id non è in UpdateCandidateData.
      
      const { data, error } = await supabase
        .from('candidates')
        .update(updates) // Uso direttamente 'updates'
        .eq('id', id)
        .eq('user_id', user.id) // Assicuro che user.id sia usato
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === id ? data as Candidate : candidate
        )
      );

      toast({
        title: "Successo",
        description: "Candidato aggiornato con successo",
      });

      return data;
    } catch (error) {
      console.error('Error updating candidate:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il candidato",
        variant: "destructive",
      });
      return null;
    }
  };

  // Delete candidate
  const deleteCandidate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      setCandidates(prev => prev.filter(candidate => candidate.id !== id));
      toast({
        title: "Successo",
        description: "Candidato eliminato con successo",
      });

      return true;
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il candidato",
        variant: "destructive",
      });
      return false;
    }
  };

  // Get candidate by ID
  const getCandidateById = (id: string) => {
    return candidates.find(candidate => candidate.id === id);
  };

  // Get candidates by status
  const getCandidatesByStatus = (status: Candidate['status']) => {
    return candidates.filter(candidate => candidate.status === status);
  };

  const updateCandidateOrder = async (candidateId: string, newOrderIndex: number) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ order_index: newOrderIndex } as any)
        .eq('id', candidateId)
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating candidate order:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'ordine del candidato",
        variant: "destructive",
      });
      return false;
    }
  };

  const reorderCandidates = async (reorderedCandidates: Candidate[]) => {
    try {
      const updates = reorderedCandidates.map((candidate, index) =>
        supabase
          .from('candidates')
          .update({ order_index: index } as any)
          .eq('id', candidate.id)
          .eq('user_id', user?.id)
      );

      await Promise.all(updates);
      setCandidates(reorderedCandidates);

      return true;
    } catch (error) {
      console.error('Error reordering candidates:', error);
      toast({
        title: "Errore",
        description: "Impossibile riordinare i candidati",
        variant: "destructive",
      });
      return false;
    }
  };

  const getStats = () => {
    return {
      total: candidates.length,
      new: candidates.filter(c => c.status === 'new').length,
      contacted: candidates.filter(c => c.status === 'contacted').length,
      interviewed: candidates.filter(c => c.status === 'interviewed').length,
      hired: candidates.filter(c => c.status === 'hired').length,
      rejected: candidates.filter(c => c.status === 'rejected').length,
    };
  };

  useEffect(() => {
    fetchCandidates();
  }, [user]);

  return {
    candidates,
    loading,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    getCandidateById,
    getCandidatesByStatus,
    getStats,
    updateCandidateOrder,
    reorderCandidates,
    refetch: fetchCandidates,
    fetchByDatabase: fetchCandidates, // Mantenuto per non rompere l'interfaccia, ma ora ignora l'argomento
  };
}