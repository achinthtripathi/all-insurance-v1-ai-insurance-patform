-- Temporary policies for development without authentication
-- These allow operations using the temporary user ID until real auth is implemented

-- Allow inserts to documents with temp user ID
CREATE POLICY "Allow temp user document inserts"
ON public.documents
FOR INSERT
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Allow selects from documents with temp user ID
CREATE POLICY "Allow temp user document selects"
ON public.documents
FOR SELECT
USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Allow inserts to extracted_data for documents owned by temp user
CREATE POLICY "Allow temp user extracted data inserts"
ON public.extracted_data
FOR INSERT
WITH CHECK (
  document_id IN (
    SELECT id FROM documents WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
  )
);

-- Allow selects from extracted_data for documents owned by temp user
CREATE POLICY "Allow temp user extracted data selects"
ON public.extracted_data
FOR SELECT
USING (
  document_id IN (
    SELECT id FROM documents WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
  )
);