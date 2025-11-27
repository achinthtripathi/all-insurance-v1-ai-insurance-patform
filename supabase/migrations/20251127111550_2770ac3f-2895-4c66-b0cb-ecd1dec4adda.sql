-- Remove foreign key constraint from documents table to allow deferred authentication
-- This enables document uploads with temporary user_id before auth is implemented

ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_user_id_fkey;

-- Remove foreign key constraint from extracted_data for consistency
-- Note: extracted_data links to documents, not directly to users, so this may not exist
-- but we're being thorough

-- Add comment explaining this is temporary until authentication is implemented
COMMENT ON TABLE public.documents IS 'Foreign key to profiles removed temporarily to support deferred authentication during development';
