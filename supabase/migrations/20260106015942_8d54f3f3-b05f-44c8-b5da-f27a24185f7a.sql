-- Fix core_roster view to be publicly accessible
-- The view only exposes non-sensitive public data (name, role, bio, mission, instagram, photo)
-- Setting security_invoker = false allows public access to this curated data
CREATE OR REPLACE VIEW public.core_roster
WITH (security_invoker = false) AS
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.bio,
  p.mission,
  p.instagram_handle,
  mp.photo_url AS primary_photo_url
FROM public.profiles p
LEFT JOIN public.member_photos mp ON mp.user_id = p.id AND mp.is_primary = true
WHERE p.is_core_member = true;

-- Grant SELECT access to both anonymous and authenticated users
GRANT SELECT ON public.core_roster TO anon, authenticated;

-- Fix public_profiles view to be publicly accessible
-- This view only exposes non-sensitive fields (no email, phone, shirt_size, is_admin)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT 
  id,
  full_name,
  instagram_handle,
  is_core_member,
  role,
  bio,
  mission
FROM public.profiles;

-- Grant SELECT access to both anonymous and authenticated users
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Fix upcoming_workout view to be publicly accessible
-- This view only exposes workout schedule and leader's public info
CREATE OR REPLACE VIEW public.upcoming_workout
WITH (security_invoker = false) AS
SELECT 
  ws.id,
  ws.workout_date,
  ws.theme,
  ws.description,
  ws.status,
  p.id AS leader_id,
  p.full_name AS leader_name,
  mp.photo_url AS leader_photo_url
FROM public.workout_slots ws
LEFT JOIN public.profiles p ON p.id = ws.leader_id
LEFT JOIN public.member_photos mp ON mp.user_id = p.id AND mp.is_primary = true
WHERE ws.workout_date >= CURRENT_DATE
ORDER BY ws.workout_date
LIMIT 1;

-- Grant SELECT access to both anonymous and authenticated users
GRANT SELECT ON public.upcoming_workout TO anon, authenticated;