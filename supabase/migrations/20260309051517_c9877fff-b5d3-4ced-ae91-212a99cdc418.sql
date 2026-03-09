
-- Add is_connected column to whatsapp_accounts
ALTER TABLE public.whatsapp_accounts ADD COLUMN IF NOT EXISTS is_connected boolean NOT NULL DEFAULT true;

-- Add last_message and contact_id columns to whatsapp_conversations
ALTER TABLE public.whatsapp_conversations ADD COLUMN IF NOT EXISTS last_message text DEFAULT '';
ALTER TABLE public.whatsapp_conversations ADD COLUMN IF NOT EXISTS contact_id uuid DEFAULT NULL;

-- Enable realtime for whatsapp tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
