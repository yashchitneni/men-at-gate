-- Ensure only one cron job exists for workout leader reminders.

CREATE OR REPLACE FUNCTION public.configure_workout_leader_reminder_schedule(
  p_secret TEXT,
  p_mode TEXT DEFAULT 'send',
  p_minute INTEGER DEFAULT 5
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, cron
AS $$
DECLARE
  target_url TEXT := 'https://prursaeokvkulphtskdn.functions.supabase.co/workout-leader-reminders';
  existing_job_id BIGINT;
  new_job_id BIGINT;
  schedule_expr TEXT;
BEGIN
  IF p_secret IS NULL OR LENGTH(TRIM(p_secret)) = 0 THEN
    RAISE EXCEPTION 'Reminder secret is required';
  END IF;

  IF p_mode NOT IN ('send', 'dry_run') THEN
    RAISE EXCEPTION 'Invalid mode: %', p_mode;
  END IF;

  IF p_minute < 0 OR p_minute > 59 THEN
    RAISE EXCEPTION 'Minute must be between 0 and 59';
  END IF;

  schedule_expr := FORMAT('%s * * * *', p_minute);

  FOR existing_job_id IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'workout-leader-reminders-hourly'
  LOOP
    PERFORM cron.unschedule(existing_job_id);
  END LOOP;

  SELECT cron.schedule(
    'workout-leader-reminders-hourly',
    schedule_expr,
    FORMAT(
      $cmd$SELECT net.http_post(
        url := %L,
        headers := %L::jsonb,
        body := %L::jsonb
      );$cmd$,
      target_url,
      jsonb_build_object(
        'Content-Type', 'application/json',
        'x-reminder-secret', p_secret
      )::TEXT,
      jsonb_build_object(
        'mode', p_mode
      )::TEXT
    )
  )
  INTO new_job_id;

  RETURN new_job_id;
END;
$$;
