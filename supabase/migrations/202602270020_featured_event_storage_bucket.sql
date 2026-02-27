-- Dedicated storage bucket for featured event media uploads

INSERT INTO storage.buckets (id, name, public)
VALUES ('featured-events', 'featured-events', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Anyone can view featured event media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload featured event media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update featured event media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete featured event media" ON storage.objects;

CREATE POLICY "Anyone can view featured event media"
ON storage.objects FOR SELECT
USING (bucket_id = 'featured-events');

CREATE POLICY "Admins can upload featured event media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'featured-events'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
  )
);

CREATE POLICY "Admins can update featured event media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'featured-events'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
  )
)
WITH CHECK (
  bucket_id = 'featured-events'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
  )
);

CREATE POLICY "Admins can delete featured event media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'featured-events'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
  )
);
