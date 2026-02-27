-- Fix member photo storage path ownership checks to avoid false 403s on upload.
-- We normalize object names with ltrim(name, '/') before extracting owner folder.

DROP POLICY IF EXISTS "Users can upload member photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own member photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own member photos" ON storage.objects;

CREATE POLICY "Users can upload member photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'member-photos'
  AND auth.uid() IS NOT NULL
  AND split_part(ltrim(name, '/'), '/', 1) = auth.uid()::text
);

CREATE POLICY "Users can update their own member photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'member-photos'
  AND auth.uid() IS NOT NULL
  AND split_part(ltrim(name, '/'), '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'member-photos'
  AND auth.uid() IS NOT NULL
  AND split_part(ltrim(name, '/'), '/', 1) = auth.uid()::text
);

CREATE POLICY "Users can delete their own member photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'member-photos'
  AND auth.uid() IS NOT NULL
  AND split_part(ltrim(name, '/'), '/', 1) = auth.uid()::text
);
