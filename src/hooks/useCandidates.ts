import { useState, useEffect, useCallback } from 'react';
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
}

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch candidates - ora con useCallback per stabilizzare la funzione
  const fetchCandidates = useCallback(async () => {
    if (!user) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', user.id)
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
  }, [user, toast]); // Dipendenze corrette

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
            status: candidateData.status || 'new'
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCandidates(prev => [data as Candidate, ...prev]);
      toast({
        title: "Successo",
        description: "Candidato aggiunto con successo",
      });

      return data;
    } catch (error) {
      console.error('Error creating candidate:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il candidato",
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
        description: "Devi essere autenticato",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
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
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

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
  const getCandidateById = useCallback((id: string) => {
    return candidates.find(candidate => candidate.id === id);
  }, [candidates]);

  // Get candidates by status
  const getCandidatesByStatus = useCallback((status: Candidate['status']) => {
    return candidates.filter(candidate => candidate.status === status);
  }, [candidates]);

  const updateCandidateOrder = async (candidateId: string, newOrderIndex: number) => {
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('candidates')
        .update({ order_index: newOrderIndex })
        .eq('id', candidateId)
        .eq('user_id', user.id);

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
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato",
        variant: "destructive",
      });
      return false;
    }

    try {
      const updates = reorderedCandidates.map((candidate, index) =>
        supabase
          .from('candidates')
          .update({ order_index: index })
          .eq('id', candidate.id)
          .eq('user_id', user.id)
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

  const getStats = useCallback(() => {
    return {
      total: candidates.length,
      new: candidates.filter(c => c.status === 'new').length,
      contacted: candidates.filter(c => c.status === 'contacted').length,
      interviewed: candidates.filter(c => c.status === 'interviewed').length,
      hired: candidates.filter(c => c.status === 'hired').length,
      rejected: candidates.filter(c => c.status === 'rejected').length,
    };
  }, [candidates]);

  // useEffect con dipendenze corrette
  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

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
  };
}