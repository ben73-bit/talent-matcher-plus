-- Funzione per ottenere l'user_id da un'email
create or replace function get_user_id_by_email(user_email text)
returns uuid
language plpgsql
security definer
as $$
declare
  user_uuid uuid;
begin
  select id into user_uuid
  from auth.users
  where email = user_email
  limit 1;
  
  return user_uuid;
end;
$$;

-- Funzione per creare notifiche quando viene creato un invito
create or replace function notify_database_invitation()
returns trigger
language plpgsql
security definer
as $$
declare
  invited_user_id uuid;
  db_name text;
  inviter_email text;
begin
  -- Ottieni l'user_id dell'utente invitato
  invited_user_id := get_user_id_by_email(NEW.invited_username);
  
  -- Se l'utente non esiste, non fare nulla
  if invited_user_id is null then
    return NEW;
  end if;
  
  -- Ottieni il nome del database
  select name into db_name
  from databases
  where id = NEW.database_id;
  
  -- Ottieni l'email di chi ha invitato
  select email into inviter_email
  from auth.users
  where id = NEW.created_by;
  
  -- Crea la notifica
  insert into notifications (
    user_id,
    type,
    title,
    message,
    data,
    read
  ) values (
    invited_user_id,
    'database_invitation',
    'Nuovo invito a database',
    format('Sei stato invitato a collaborare sul database "%s" da %s', db_name, inviter_email),
    jsonb_build_object(
      'invitation_id', NEW.id,
      'database_id', NEW.database_id,
      'database_name', db_name,
      'inviter_id', NEW.created_by
    ),
    false
  );
  
  return NEW;
end;
$$;

-- Crea il trigger
drop trigger if exists on_database_invitation_created on database_invitations;
create trigger on_database_invitation_created
  after insert on database_invitations
  for each row
  execute function notify_database_invitation();