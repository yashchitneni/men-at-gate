-- Ensure marathon ruck registration CTA points to the concrete SweatPals event instance.
UPDATE public.featured_events
SET registration_url = 'https://www.sweatpals.com/event/the-weight-we-carry-overnight-ruck-hosted-by-mta/2026-05-01',
    updated_at = NOW()
WHERE slug = 'marathon-ruck';
