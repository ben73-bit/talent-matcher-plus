import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Tables } from '@/integrations/supabase/types';

export type JobPosition = Tables<'job_positions'>;
export type CreateJobPositionData = Omit<JobPosition, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateJobPositionData = Partial<CreateJobPositionData>;

const JOB_POSITIONS_QUERY_KEY = ['job_positions'];

export function useJobPositions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  // 1. Fetch Positions (useQuery)
  const { data: positions = [], isLoading: loading, refetch } = useQuery<JobPosition[]>({
    queryKey: JOB_POSITIONS_QUERY_KEY,
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('job_positions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as JobPosition[];
    },
    enabled: !!user,
  });

  // 2. Create Position (useMutation)
  const createMutation = useMutation({
    mutationFn: async (positionData: CreateJobPositionData) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('job_positions')
        .insert([{ ...positionData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as JobPosition;
    },
    onSuccess: (newPosition) => {
      queryClient.invalidateQueries({ queryKey: JOB_POSITIONS_QUERY_KEY });
      toast({
        title: "Successo",
        description: `Posizione '${newPosition.title}' creata con successo.`,
      });
    },
    onError: (error) => {
      console.error('Error creating job position:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare la posizione lavorativa",
        variant: "destructive",
      });
    }
  });

  // 3. Update Position (useMutation)
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: UpdateJobPositionData }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('job_positions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as JobPosition;
    },
    onSuccess: (updatedPosition) => {
      queryClient.invalidateQueries({ queryKey: JOB_POSITIONS_QUERY_KEY });
      toast({
        title: "Successo",
        description: `Posizione '${updatedPosition.title}' aggiornata con successo.`,
      });
    },
    onError: (error) => {
      console.error('Error updating job position:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la posizione lavorativa",
        variant: "destructive",
      });
    }
  });

  // 4. Delete Position (useMutation)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('job_positions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOB_POSITIONS_QUERY_KEY });
      toast({
        title: "Successo",
        description: "Posizione eliminata con successo.",
      });
    },
    onError: (error) => {
      console.error('Error deleting job position:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la posizione lavorativa",
        variant: "destructive",
      });
    }
  });

  const getPositionById = (id: string) => {
    return positions.find(p => p.id === id);
  };

  return {
    positions,
    loading,
    createPosition: createMutation.mutateAsync,
    updatePosition: updateMutation.mutateAsync,
    deletePosition: deleteMutation.mutateAsync,
    getPositionById,
    refetch,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}