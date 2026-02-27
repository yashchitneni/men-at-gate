-- Point Marathon Ruck to the new uploaded event hero image.
UPDATE public.featured_events
SET image_url = 'https://prursaeokvkulphtskdn.supabase.co/storage/v1/object/public/member-photos/featured-events/overnight-ruck.jpg'
WHERE slug = 'marathon-ruck';
