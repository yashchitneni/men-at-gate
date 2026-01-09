-- Fix missing SELECT policies for workout_submissions
-- Users can't read submissions without these policies

-- Allow leaders to view their own submissions
CREATE POLICY "Leaders can view their own submissions"
ON workout_submissions
FOR SELECT
TO authenticated
USING (leader_id = auth.uid());

-- Allow admins to view all submissions
CREATE POLICY "Admins can view all submissions"
ON workout_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (is_admin = true OR is_super_admin = true)
  )
);

-- Allow leaders to insert their own submissions
CREATE POLICY "Leaders can create submissions"
ON workout_submissions
FOR INSERT
TO authenticated
WITH CHECK (leader_id = auth.uid());
