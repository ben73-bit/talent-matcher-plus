-- Add order_index column to candidates table
ALTER TABLE public.candidates 
ADD COLUMN order_index INTEGER;

-- Create index for better performance on ordering
CREATE INDEX idx_candidates_order_index ON public.candidates(order_index);