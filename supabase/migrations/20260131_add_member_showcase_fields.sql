-- Add member showcase fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS why_i_joined TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS strava_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
