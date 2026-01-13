-- Add email column to waiting_list_leads and make phone nullable
ALTER TABLE public.waiting_list_leads 
ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE public.waiting_list_leads 
ADD COLUMN email TEXT;

-- Add constraint to ensure at least phone or email is provided
ALTER TABLE public.waiting_list_leads 
ADD CONSTRAINT phone_or_email_required 
CHECK (phone IS NOT NULL OR email IS NOT NULL);