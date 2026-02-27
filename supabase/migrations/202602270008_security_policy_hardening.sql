
-- Fix 1: Replace overly permissive profiles SELECT policy
-- Remove the "Profiles are viewable by everyone" policy that exposes email, phone, admin flags
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.profiles;

-- Only allow users to view their own profile, or admins to view all
CREATE POLICY "Users can view own profile and admins can view all"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_admin = true OR p.is_super_admin = true)
    )
  );

-- Fix 2: Remove the permissive workout_interest INSERT policy
-- Keep only "Authenticated users can express interest" which properly checks auth.uid() = user_id
DROP POLICY IF EXISTS "Users can submit workout interest" ON public.workout_interest;
