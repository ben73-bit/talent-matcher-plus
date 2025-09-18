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
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', user.id)
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
    try {
      const { data, error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
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

  // Get candidates statistics
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
    refetch: fetchCandidates,
  };
}