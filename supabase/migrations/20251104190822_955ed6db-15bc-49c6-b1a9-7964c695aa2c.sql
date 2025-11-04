-- Create notifications table for internal app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- Function to create notification when invitation is created
CREATE OR REPLACE FUNCTION public.notify_database_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invited_user_id UUID;
  database_name TEXT;
  inviter_name TEXT;
BEGIN
  -- Get the user_id of the invited user by username (email)
  SELECT id INTO invited_user_id
  FROM auth.users
  WHERE email = NEW.invited_username;
  
  -- Only create notification if user exists
  IF invited_user_id IS NOT NULL THEN
    -- Get database name
    SELECT name INTO database_name
    FROM public.databases
    WHERE id = NEW.database_id;
    
    -- Get inviter name
    SELECT COALESCE(first_name || ' ' || last_name, email) INTO inviter_name
    FROM public.profiles
    WHERE user_id = NEW.created_by;
    
    -- Create notification
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      invited_user_id,
      'database_invitation',
      'Nuovo invito database',
      inviter_name || ' ti ha invitato a visualizzare il database "' || database_name || '"',
      jsonb_build_object('database_id', NEW.database_id, 'invitation_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for database invitations
CREATE TRIGGER on_database_invitation_created
  AFTER INSERT ON public.database_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_database_invitation();

-- Function to accept invitation and add as collaborator
CREATE OR REPLACE FUNCTION public.accept_database_invitation(invitation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation RECORD;
BEGIN
  -- Get invitation details
  SELECT * INTO invitation
  FROM public.database_invitations
  WHERE id = invitation_id
    AND invited_username = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND accepted_at IS NULL;
  
  IF invitation IS NULL THEN
    RETURN false;
  END IF;
  
  -- Add user as collaborator
  INSERT INTO public.database_collaborators (database_id, user_id, role)
  VALUES (invitation.database_id, auth.uid(), 'viewer')
  ON CONFLICT (database_id, user_id) DO NOTHING;
  
  -- Mark invitation as accepted
  UPDATE public.database_invitations
  SET accepted_at = now()
  WHERE id = invitation_id;
  
  RETURN true;
END;
$$;