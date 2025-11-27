-- Allow public uploads to documents bucket
CREATE POLICY "Allow public uploads to documents bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'documents');

-- Allow public reads from documents bucket
CREATE POLICY "Allow public reads from documents bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Allow public updates to documents bucket
CREATE POLICY "Allow public updates to documents bucket"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'documents');

-- Allow public deletes from documents bucket
CREATE POLICY "Allow public deletes from documents bucket"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'documents');