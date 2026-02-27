-- Fix recursive RLS checks on profiles that cause 500 (42P17).
-- The previous policy queried public.profiles inside a policy on public.profiles,
-- which can recurse indefinitely in PostgREST requests.

CREATE OR REPLACE FUNCTION public.current_user_is_admin_or_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND (is_admin = true OR is_super_admin = true)
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_is_admin_or_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin_or_super_admin() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.profiles;
CREATE POLICY "Users can view own profile and admins can view all"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR public.current_user_is_admin_or_super_admin()
  );

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  USING (public.current_user_is_admin_or_super_admin());
