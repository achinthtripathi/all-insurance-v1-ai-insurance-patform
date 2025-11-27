-- Allow public access to view documents in the documents bucket
CREATE POLICY "Public access to view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Allow temporary user to upload documents
CREATE POLICY "Temp user can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000000'
);

-- Allow temporary user to delete their documents
CREATE POLICY "Temp user can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000000'
);