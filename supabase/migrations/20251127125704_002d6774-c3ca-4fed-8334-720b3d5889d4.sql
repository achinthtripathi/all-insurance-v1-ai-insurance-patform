-- Grant temp demo user full CRUD on documents and extracted_data

-- Allow temp user to update their documents
CREATE POLICY "Allow temp user document updates"
ON public.documents
FOR UPDATE
USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Allow temp user to delete their documents
CREATE POLICY "Allow temp user document deletes"
ON public.documents
FOR DELETE
USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Allow temp user to update extracted data for their documents
CREATE POLICY "Allow temp user extracted data updates"
ON public.extracted_data
FOR UPDATE
USING (
  document_id IN (
    SELECT id FROM public.documents
    WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
  )
);

-- Allow temp user to delete extracted data for their documents
CREATE POLICY "Allow temp user extracted data deletes"
ON public.extracted_data
FOR DELETE
USING (
  document_id IN (
    SELECT id FROM public.documents
    WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
  )
);