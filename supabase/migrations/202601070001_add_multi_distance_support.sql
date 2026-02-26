-- Add support for multi-distance race events
-- A race can now have multiple available distances (e.g., Marathon, Half Marathon, 10K, 5K)
-- Participants select which distance they're running when they join

-- Add available_distances to races table
ALTER TABLE races
ADD COLUMN available_distances JSONB DEFAULT '[]'::jsonb;

-- Add selected_distance to race_participants table
ALTER TABLE race_participants
ADD COLUMN selected_distance VARCHAR(50);

-- Migrate existing races: set available_distances to [distance_type]
UPDATE races
SET available_distances = jsonb_build_array(distance_type)
WHERE available_distances = '[]'::jsonb;

-- Migrate existing participants: set selected_distance to race's distance_type
UPDATE race_participants rp
SET selected_distance = r.distance_type
FROM races r
WHERE rp.race_id = r.id AND rp.selected_distance IS NULL;
