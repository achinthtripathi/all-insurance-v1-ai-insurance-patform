-- Temporarily remove foreign key constraint on requirement_sets.user_id for development
-- This will be re-added when authentication is implemented
ALTER TABLE public.requirement_sets 
DROP CONSTRAINT IF EXISTS requirement_sets_user_id_fkey;

-- Make user_id nullable temporarily for development
ALTER TABLE public.requirement_sets 
ALTER COLUMN user_id DROP NOT NULL;