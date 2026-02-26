-- Add admin feedback loop for workout submissions
-- Allows admins to request changes and leaders to resubmit

-- Add feedback fields to workout_submissions
ALTER TABLE workout_submissions
ADD COLUMN IF NOT EXISTS admin_feedback TEXT,
ADD COLUMN IF NOT EXISTS feedback_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS feedback_requested_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS last_submitted_at TIMESTAMPTZ;

-- Update existing submissions to have last_submitted_at equal to submitted_at
UPDATE workout_submissions
SET last_submitted_at = submitted_at
WHERE submitted_at IS NOT NULL AND last_submitted_at IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN workout_submissions.admin_feedback IS 'Feedback from admin when requesting changes';
COMMENT ON COLUMN workout_submissions.feedback_requested_at IS 'Timestamp when admin requested changes';
COMMENT ON COLUMN workout_submissions.feedback_requested_by IS 'Admin who requested changes';
COMMENT ON COLUMN workout_submissions.last_submitted_at IS 'Last time submission was submitted (for tracking resubmissions)';

-- Update status constraint if it exists (drop and recreate with new value)
-- Note: You may need to adjust the constraint name based on your actual schema
DO $$
BEGIN
  -- Try to drop the constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'workout_submissions_status_check'
    AND table_name = 'workout_submissions'
  ) THEN
    ALTER TABLE workout_submissions DROP CONSTRAINT workout_submissions_status_check;
  END IF;

  -- Add the constraint with the new status value
  ALTER TABLE workout_submissions
  ADD CONSTRAINT workout_submissions_status_check
  CHECK (status IN ('draft', 'submitted', 'changes_requested', 'approved'));
END $$;

-- Add RLS policy: admins can update any submission
CREATE POLICY "Admins can update workout submissions"
ON workout_submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Add RLS policy: leaders can update their own non-approved submissions
CREATE POLICY "Leaders can update their own non-approved submissions"
ON workout_submissions
FOR UPDATE
TO authenticated
USING (
  leader_id = auth.uid()
  AND status != 'approved'
)
WITH CHECK (
  leader_id = auth.uid()
  AND status != 'approved'
);
