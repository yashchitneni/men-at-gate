-- Add onboarding and profile capture fields.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS here_for TEXT[],
  ADD COLUMN IF NOT EXISTS here_for_other TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Populate split-name fields from existing full names where possible.
UPDATE public.profiles
SET
  first_name = COALESCE(NULLIF(first_name, ''), split_part(trim(full_name), ' ', 1)),
  last_name = COALESCE(
    NULLIF(last_name, ''),
    NULLIF(regexp_replace(trim(full_name), '^[^\s]+\s*', '', 'g'), '')
  )
WHERE full_name IS NOT NULL
  AND (first_name IS NULL OR last_name IS NULL);

-- Keep full_name in sync for migrated and future records.
UPDATE public.profiles
SET full_name = trim(concat_ws(' ', NULLIF(trim(first_name), ''), NULLIF(trim(last_name), ''))
WHERE (full_name IS NULL OR trim(full_name) = '')
  AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- Mark users with completed required onboarding fields as complete.
UPDATE public.profiles
SET onboarding_completed_at = NOW()
WHERE onboarding_completed_at IS NULL
  AND trim(coalesce(first_name, '')) <> ''
  AND trim(coalesce(last_name, '')) <> ''
  AND trim(coalesce(shirt_size, '')) <> '';

-- Allow future users to capture first/last and optional profile goals.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  incoming_name TEXT;
  incoming_first_name TEXT;
  incoming_last_name TEXT;
BEGIN
  incoming_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  incoming_first_name := NULLIF(
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), split_part(trim(incoming_name), ' ', 1)),
    ''
  );
  incoming_last_name := NULLIF(
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'last_name', ''),
      NULLIF(regexp_replace(trim(incoming_name), '^[^\s]+\s*', '', 'g'), '')
    ),
    ''
  );

  INSERT INTO public.profiles (id, email, full_name, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(incoming_name, ''),
    incoming_first_name,
    incoming_last_name
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the public profile views include first/last names.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  id,
  full_name,
  first_name,
  last_name,
  instagram_handle,
  is_core_member,
  role,
  bio,
  mission
FROM public.profiles;

CREATE OR REPLACE VIEW public.core_roster
WITH (security_invoker = false) AS
SELECT
  p.id,
  p.full_name,
  p.first_name,
  p.last_name,
  p.role,
  p.bio,
  p.mission,
  p.instagram_handle,
  mp.photo_url AS primary_photo_url
FROM public.profiles p
LEFT JOIN public.member_photos mp ON mp.user_id = p.id AND mp.is_primary = true
WHERE p.is_core_member = true;

-- Recreate the member photo bucket policies with deterministic path ownership checks.
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "People can view member photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload member photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own member photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own member photos" ON storage.objects;

CREATE POLICY "People can view member photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'member-photos');

CREATE POLICY "Users can upload member photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'member-photos'
  AND (auth.uid()::text IS NOT NULL)
  AND (name LIKE (auth.uid()::text || '/%'))
);

CREATE POLICY "Users can update their own member photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'member-photos'
  AND (name LIKE (auth.uid()::text || '/%'))
)
WITH CHECK (
  bucket_id = 'member-photos'
  AND (name LIKE (auth.uid()::text || '/%'))
);

CREATE POLICY "Users can delete their own member photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'member-photos'
  AND (name LIKE (auth.uid()::text || '/%'))
);

-- Keep storage RLS aligned for signed-in users.
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
