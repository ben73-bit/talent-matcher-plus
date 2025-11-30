import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  database_id?: string;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch candidates
  const { data: candidates = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['candidates', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching candidates:', error);
        toast({
          title: "Errore",
          description: "Impossibile caricare i candidati",
          variant: "destructive",
        });
        throw error;
      }

      return data as Candidate[];
    },
    enabled: !!user,
  });

  // Create candidate mutation
  const createMutation = useMutation({
    mutationFn: async (candidateData: CreateCandidateData) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('candidates')
        .insert([
          {
            ...candidateData,
            user_id: user.id,
            status: candidateData.status || 'new',
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data as Candidate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
    onError: (error) => {
      console.error('Error creating candidate:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il candidato",
        variant: "destructive",
      });
    }
  });

  // Update candidate mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateCandidateData }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Candidate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast({
        title: "Successo",
        description: "Candidato aggiornato con successo",
      });
    },
    onError: (error) => {
      console.error('Error updating candidate:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il candidato",
        variant: "destructive",
      });
    }
  });

  // Delete candidate mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast({
        title: "Successo",
        description: "Candidato eliminato con successo",
      });
    },
    onError: (error) => {
      console.error('Error deleting candidate:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il candidato",
        variant: "destructive",
      });
    }
  });

  // Reorder candidates mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedCandidates: Candidate[]) => {
      if (!user) throw new Error("User not authenticated");

      const updates = reorderedCandidates.map((candidate, index) =>
        supabase
          .from('candidates')
          .update({ order_index: index } as any)
          .eq('id', candidate.id)
          .eq('user_id', user.id)
      );

      await Promise.all(updates);
      return reorderedCandidates;
    },
    onSuccess: (newCandidates) => {
      // Optimistically update or just invalidate
      queryClient.setQueryData(['candidates', user?.id], newCandidates);
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
    onError: (error) => {
      console.error('Error reordering candidates:', error);
      toast({
        title: "Errore",
        description: "Impossibile riordinare i candidati",
        variant: "destructive",
      });
    }
  });

  // Wrapper functions to maintain interface compatibility
  const createCandidate = async (data: CreateCandidateData) => {
    return await createMutation.mutateAsync(data);
  };

  const updateCandidate = async (id: string, updates: UpdateCandidateData) => {
    return await updateMutation.mutateAsync({ id, updates });
  };

  const deleteCandidate = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  const updateCandidateOrder = async (candidateId: string, newOrderIndex: number) => {
    // This was a specific update, but we can just invalidate or implement a specific mutation if needed.
    // For now, let's just do the direct update and invalidate.
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ order_index: newOrderIndex } as any)
        .eq('id', candidateId)
        .eq('user_id', user?.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      return true;
    } catch (error) {
      console.error('Error updating candidate order:', error);
      return false;
    }
  };

  const reorderCandidates = async (candidates: Candidate[]) => {
    try {
      await reorderMutation.mutateAsync(candidates);
      return true;
    } catch {
      return false;
    }
  };

  const getCandidateById = (id: string) => {
    return candidates.find(candidate => candidate.id === id);
  };

  const getCandidatesByStatus = (status: Candidate['status']) => {
    return candidates.filter(candidate => candidate.status === status);
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
    refetch,
    fetchByDatabase: refetch, // Alias for compatibility
  };
}