-- Add super admin flag and protection
-- Only super admins can modify admin/super_admin flags on profiles

-- Add the new column with default
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Add index for performance (only super admins, so small set)
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin
  ON public.profiles(is_super_admin)
  WHERE is_super_admin = true;

-- Update the "Admins can update any profile" policy to include super admins
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND (is_admin = true OR is_super_admin = true)
    )
  );

-- Trigger function: only super admins can change admin flags
CREATE OR REPLACE FUNCTION public.protect_admin_flags()
RETURNS TRIGGER AS $$
DECLARE
  acting_is_super_admin BOOLEAN;
BEGIN
  -- Allow service role / migrations (no auth context)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT is_super_admin INTO acting_is_super_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT acting_is_super_admin AND (
    NEW.is_admin IS DISTINCT FROM OLD.is_admin OR
    NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin
  ) THEN
    RAISE EXCEPTION 'Only super admins can modify admin flags';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger
DROP TRIGGER IF EXISTS protect_admin_flags ON public.profiles;

CREATE TRIGGER protect_admin_flags
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_admin_flags();
