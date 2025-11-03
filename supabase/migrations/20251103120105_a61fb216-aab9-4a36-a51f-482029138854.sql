-- Add dashboard and report customization preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dashboard_widgets jsonb DEFAULT '{"stats": true, "recent": true, "charts": true}'::jsonb,
ADD COLUMN IF NOT EXISTS report_metrics jsonb DEFAULT '["total", "new", "contacted", "interviewed"]'::jsonb,
ADD COLUMN IF NOT EXISTS report_layout text DEFAULT 'grid';