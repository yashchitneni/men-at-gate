-- Workout leadership pipeline aligned to SweatPals schedule events.
-- Adds request/approval workflow and assignment-based workout submissions.

-- Make SweatPals schedule cache publicly readable for authenticated and anon clients.
DROP POLICY IF EXISTS "Admins can view sweatpals schedule events" ON public.sweatpals_schedule_events;
DROP POLICY IF EXISTS "Public can view sweatpals schedule events" ON public.sweatpals_schedule_events;
CREATE POLICY "Public can view sweatpals schedule events"
  ON public.sweatpals_schedule_events FOR SELECT
  USING (true);

GRANT SELECT ON public.sweatpals_schedule_events TO anon, authenticated;

-- Request table: members request specific SweatPals workout dates.
CREATE TABLE IF NOT EXISTS public.workout_lead_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_event_id UUID NOT NULL REFERENCES public.sweatpals_schedule_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (schedule_event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workout_lead_requests_event ON public.workout_lead_requests(schedule_event_id);
CREATE INDEX IF NOT EXISTS idx_workout_lead_requests_user ON public.workout_lead_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_lead_requests_status ON public.workout_lead_requests(status);

ALTER TABLE public.workout_lead_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own workout lead requests" ON public.workout_lead_requests;
DROP POLICY IF EXISTS "Admins can view all workout lead requests" ON public.workout_lead_requests;
DROP POLICY IF EXISTS "Users can create workout lead requests" ON public.workout_lead_requests;
DROP POLICY IF EXISTS "Users can delete own pending workout lead requests" ON public.workout_lead_requests;
DROP POLICY IF EXISTS "Admins can update workout lead requests" ON public.workout_lead_requests;
DROP POLICY IF EXISTS "Admins can delete workout lead requests" ON public.workout_lead_requests;

CREATE POLICY "Users can view own workout lead requests"
  ON public.workout_lead_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all workout lead requests"
  ON public.workout_lead_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE POLICY "Users can create workout lead requests"
  ON public.workout_lead_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending workout lead requests"
  ON public.workout_lead_requests FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update workout lead requests"
  ON public.workout_lead_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE POLICY "Admins can delete workout lead requests"
  ON public.workout_lead_requests FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

-- Assignment table: one assigned leader per schedule event.
CREATE TABLE IF NOT EXISTS public.workout_lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_event_id UUID NOT NULL UNIQUE REFERENCES public.sweatpals_schedule_events(id) ON DELETE CASCADE,
  leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_lead_assignments_leader ON public.workout_lead_assignments(leader_id);
CREATE INDEX IF NOT EXISTS idx_workout_lead_assignments_status ON public.workout_lead_assignments(status);

ALTER TABLE public.workout_lead_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workout lead assignments" ON public.workout_lead_assignments;
DROP POLICY IF EXISTS "Admins can create workout lead assignments" ON public.workout_lead_assignments;
DROP POLICY IF EXISTS "Admins can update workout lead assignments" ON public.workout_lead_assignments;
DROP POLICY IF EXISTS "Admins can delete workout lead assignments" ON public.workout_lead_assignments;

CREATE POLICY "Users can view workout lead assignments"
  ON public.workout_lead_assignments FOR SELECT
  USING (true);

CREATE POLICY "Admins can create workout lead assignments"
  ON public.workout_lead_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE POLICY "Admins can update workout lead assignments"
  ON public.workout_lead_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE POLICY "Admins can delete workout lead assignments"
  ON public.workout_lead_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

-- Keep updated_at in sync.
DROP TRIGGER IF EXISTS update_workout_lead_requests_updated_at ON public.workout_lead_requests;
CREATE TRIGGER update_workout_lead_requests_updated_at
  BEFORE UPDATE ON public.workout_lead_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workout_lead_assignments_updated_at ON public.workout_lead_assignments;
CREATE TRIGGER update_workout_lead_assignments_updated_at
  BEFORE UPDATE ON public.workout_lead_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validate request target event and block pending requests for already-assigned workouts.
CREATE OR REPLACE FUNCTION public.validate_workout_lead_request_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_event RECORD;
  existing_assignment UUID;
BEGIN
  SELECT id, is_workout, starts_at
  INTO target_event
  FROM public.sweatpals_schedule_events
  WHERE id = NEW.schedule_event_id
  LIMIT 1;

  IF target_event.id IS NULL THEN
    RAISE EXCEPTION 'Workout event not found for request';
  END IF;

  IF target_event.is_workout IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Only workout events can be requested';
  END IF;

  IF target_event.starts_at < NOW() THEN
    RAISE EXCEPTION 'Cannot request past workout events';
  END IF;

  IF NEW.status = 'pending' THEN
    SELECT id
    INTO existing_assignment
    FROM public.workout_lead_assignments
    WHERE schedule_event_id = NEW.schedule_event_id
      AND status = 'assigned'
    LIMIT 1;

    IF existing_assignment IS NOT NULL THEN
      RAISE EXCEPTION 'This workout already has an assigned leader';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_workout_lead_request_event_trigger ON public.workout_lead_requests;
CREATE TRIGGER validate_workout_lead_request_event_trigger
  BEFORE INSERT OR UPDATE ON public.workout_lead_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_workout_lead_request_event();

-- Link workout submissions to assignment model.
ALTER TABLE public.workout_submissions
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.workout_lead_assignments(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workout_submissions_assignment_unique
  ON public.workout_submissions(assignment_id)
  WHERE assignment_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workout_submissions'
      AND column_name = 'slot_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.workout_submissions ALTER COLUMN slot_id DROP NOT NULL;
  END IF;
END $$;

-- Ensure submission leader matches assignment leader.
CREATE OR REPLACE FUNCTION public.sync_submission_leader_from_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  assignment_leader UUID;
BEGIN
  IF NEW.assignment_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT leader_id
  INTO assignment_leader
  FROM public.workout_lead_assignments
  WHERE id = NEW.assignment_id
  LIMIT 1;

  IF assignment_leader IS NULL THEN
    RAISE EXCEPTION 'Assignment not found for workout submission';
  END IF;

  NEW.leader_id := assignment_leader;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_submission_leader_from_assignment_trigger ON public.workout_submissions;
CREATE TRIGGER sync_submission_leader_from_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.workout_submissions
  FOR EACH ROW EXECUTE FUNCTION public.sync_submission_leader_from_assignment();

-- Admin helper RPC: approve a request and close competing pending requests.
CREATE OR REPLACE FUNCTION public.approve_workout_lead_request(p_request_id UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  request_row public.workout_lead_requests%ROWTYPE;
  assignment_id UUID;
  is_admin_user BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
  ) INTO is_admin_user;

  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT *
  INTO request_row
  FROM public.workout_lead_requests
  WHERE id = p_request_id
  LIMIT 1;

  IF request_row.id IS NULL THEN
    RAISE EXCEPTION 'Lead request not found';
  END IF;

  INSERT INTO public.workout_lead_assignments (
    schedule_event_id,
    leader_id,
    assigned_by,
    status
  )
  VALUES (
    request_row.schedule_event_id,
    request_row.user_id,
    auth.uid(),
    'assigned'
  )
  ON CONFLICT (schedule_event_id)
  DO UPDATE SET
    leader_id = EXCLUDED.leader_id,
    assigned_by = EXCLUDED.assigned_by,
    status = 'assigned',
    updated_at = NOW()
  RETURNING id INTO assignment_id;

  UPDATE public.workout_lead_requests
  SET
    status = CASE WHEN id = p_request_id THEN 'approved' ELSE 'rejected' END,
    updated_at = NOW()
  WHERE schedule_event_id = request_row.schedule_event_id
    AND status = 'pending';

  RETURN assignment_id;
END;
$$;

-- Admin helper RPC: direct assign from member list.
CREATE OR REPLACE FUNCTION public.assign_workout_leader_direct(
  p_schedule_event_id UUID,
  p_leader_id UUID,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  assignment_id UUID;
  is_admin_user BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
  ) INTO is_admin_user;

  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  INSERT INTO public.workout_lead_assignments (
    schedule_event_id,
    leader_id,
    assigned_by,
    status
  )
  VALUES (
    p_schedule_event_id,
    p_leader_id,
    auth.uid(),
    'assigned'
  )
  ON CONFLICT (schedule_event_id)
  DO UPDATE SET
    leader_id = EXCLUDED.leader_id,
    assigned_by = EXCLUDED.assigned_by,
    status = 'assigned',
    updated_at = NOW()
  RETURNING id INTO assignment_id;

  INSERT INTO public.workout_lead_requests (
    schedule_event_id,
    user_id,
    notes,
    status
  )
  VALUES (
    p_schedule_event_id,
    p_leader_id,
    COALESCE(p_note, 'Assigned directly by admin'),
    'approved'
  )
  ON CONFLICT (schedule_event_id, user_id)
  DO UPDATE SET
    status = 'approved',
    notes = COALESCE(EXCLUDED.notes, public.workout_lead_requests.notes),
    updated_at = NOW();

  UPDATE public.workout_lead_requests
  SET
    status = 'rejected',
    updated_at = NOW()
  WHERE schedule_event_id = p_schedule_event_id
    AND user_id <> p_leader_id
    AND status = 'pending';

  RETURN assignment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_workout_lead_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_workout_leader_direct(UUID, UUID, TEXT) TO authenticated;

-- Read model for upcoming workout leadership queue.
CREATE OR REPLACE VIEW public.upcoming_leadable_workouts AS
SELECT
  se.id AS schedule_event_id,
  se.external_event_id,
  se.alias AS event_alias,
  se.title,
  se.starts_at,
  se.ends_at,
  se.location,
  COALESCE(se.event_url, se.checkout_url) AS event_url,
  (wa.id IS NOT NULL AND wa.status = 'assigned') AS is_assigned,
  wa.id AS assignment_id,
  wa.leader_id AS assigned_leader_id,
  pp.full_name AS assigned_leader_name,
  COALESCE(req.pending_requests, 0)::INT AS pending_requests
FROM public.sweatpals_schedule_events se
LEFT JOIN public.workout_lead_assignments wa
  ON wa.schedule_event_id = se.id
  AND wa.status = 'assigned'
LEFT JOIN public.public_profiles pp
  ON pp.id = wa.leader_id
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INT AS pending_requests
  FROM public.workout_lead_requests wr
  WHERE wr.schedule_event_id = se.id
    AND wr.status = 'pending'
) req ON true
WHERE se.provider = 'sweatpals'
  AND se.is_workout = true
  AND se.starts_at >= NOW()
ORDER BY se.starts_at ASC;

GRANT SELECT ON public.upcoming_leadable_workouts TO anon, authenticated;

-- Compatibility backfill: map existing slot assignments to schedule events by calendar date.
INSERT INTO public.workout_lead_assignments (
  schedule_event_id,
  leader_id,
  assigned_by,
  status,
  created_at,
  updated_at
)
SELECT
  se.id,
  ws.leader_id,
  ws.leader_id,
  'assigned',
  ws.created_at,
  ws.updated_at
FROM public.workout_slots ws
JOIN public.sweatpals_schedule_events se
  ON se.is_workout = true
  AND se.starts_at::date = ws.workout_date
WHERE ws.leader_id IS NOT NULL
ON CONFLICT (schedule_event_id) DO NOTHING;

-- Backfill submissions by matching slot -> schedule event date and leader.
UPDATE public.workout_submissions sub
SET assignment_id = wa.id
FROM public.workout_slots ws
JOIN public.sweatpals_schedule_events se
  ON se.is_workout = true
  AND se.starts_at::date = ws.workout_date
JOIN public.workout_lead_assignments wa
  ON wa.schedule_event_id = se.id
WHERE sub.slot_id = ws.id
  AND wa.leader_id = sub.leader_id
  AND sub.assignment_id IS NULL;
