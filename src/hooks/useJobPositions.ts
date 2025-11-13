import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Tables } from '@/integrations/supabase/types';

export type JobPosition = Tables<'job_positions'>;
export type CreateJobPositionData = Omit<JobPosition, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateJobPositionData = Partial<CreateJobPositionData>;

export function useJobPositions() {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPositions = async () => {
    if (!user) {
      setPositions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_positions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPositions((data || []) as JobPosition[]);
    } catch (error) {
      console.error('Error fetching job positions:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le posizioni lavorative",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPosition = async (positionData: CreateJobPositionData) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('job_positions')
        .insert([{ ...positionData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setPositions(prev => [data as JobPosition, ...prev]);
      toast({
        title: "Successo",
        description: `Posizione '${data.title}' creata con successo.`,
      });
      return data as JobPosition;
    } catch (error) {
      console.error('Error creating job position:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare la posizione lavorativa",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePosition = async (id: string, updates: UpdateJobPositionData) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('job_positions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setPositions(prev => 
        prev.map(p => p.id === id ? data as JobPosition : p)
      );
      toast({
        title: "Successo",
        description: `Posizione '${data.title}' aggiornata con successo.`,
      });
      return data as JobPosition;
    } catch (error) {
      console.error('Error updating job position:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la posizione lavorativa",
        variant: "destructive",
      });
      return null;
    }
  };

  const deletePosition = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('job_positions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPositions(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Successo",
        description: "Posizione eliminata con successo.",
      });
      return true;
    } catch (error) {
      console.error('Error deleting job position:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la posizione lavorativa",
        variant: "destructive",
      });
      return false;
    }
  };

  const getPositionById = (id: string) => {
    return positions.find(p => p.id === id);
  };

  useEffect(() => {
    fetchPositions();
  }, [user]);

  return {
    positions,
    loading,
    createPosition,
    updatePosition,
    deletePosition,
    getPositionById,
    refetch: fetchPositions,
  };
}