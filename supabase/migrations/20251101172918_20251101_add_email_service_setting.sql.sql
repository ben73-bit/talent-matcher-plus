/*
  # Add email service setting to profiles table

  1. New Columns
    - `email_service` (text) - Email service preference (outlook, browser, gmail)
  
  2. Changes
    - Add email_service column to profiles table with default value 'outlook'
    - Maintain data integrity with no destructive operations

  3. Notes
    - Users can select their preferred email service for sending emails to candidates
    - Supports: outlook (mailto), browser (compose form), gmail (Gmail API)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email_service'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_service text DEFAULT 'outlook';
  END IF;
END $$;
