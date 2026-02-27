-- Backfill image_confirmed for environments where featured_event_blocks existed
-- before templating migration introduced this column.
ALTER TABLE public.featured_event_blocks
  ADD COLUMN IF NOT EXISTS image_confirmed BOOLEAN;

UPDATE public.featured_event_blocks
SET image_confirmed = false
WHERE image_confirmed IS NULL;

ALTER TABLE public.featured_event_blocks
  ALTER COLUMN image_confirmed SET DEFAULT false;

ALTER TABLE public.featured_event_blocks
  ALTER COLUMN image_confirmed SET NOT NULL;
