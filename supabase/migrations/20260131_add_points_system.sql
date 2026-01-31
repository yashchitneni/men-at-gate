-- Points log table
CREATE TABLE IF NOT EXISTS public.points_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'lead_workout', 'attend_workout', 'race_completed', 'podium'
  reference_id UUID, -- optional: ID of the workout/race
  reference_type TEXT, -- 'workout', 'race'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.points_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Points are viewable by everyone"
  ON public.points_log FOR SELECT USING (true);

CREATE POLICY "Only admins can insert points"
  ON public.points_log FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  );

CREATE INDEX idx_points_log_user ON public.points_log(user_id);
CREATE INDEX idx_points_log_created ON public.points_log(created_at);

-- Badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- emoji or icon name
  criteria_type TEXT NOT NULL, -- 'count', 'streak', 'milestone'
  criteria_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone"
  ON public.badges FOR SELECT USING (true);

-- User badges (earned)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges are viewable by everyone"
  ON public.user_badges FOR SELECT USING (true);

-- Seed default badges
INSERT INTO public.badges (name, description, icon, criteria_type, criteria_value) VALUES
  ('First Workout Led', 'Led your first workout', '🏋️', 'count', 1),
  ('10 Races', 'Completed 10 races', '🏅', 'count', 10),
  ('4-Week Streak', 'Attended workouts 4 weeks in a row', '🔥', 'streak', 4),
  ('Century Club', 'Earned 100 points', '💯', 'milestone', 100),
  ('Iron Will', 'Earned 500 points', '⚔️', 'milestone', 500),
  ('Podium Finisher', 'Finished on the podium', '🏆', 'count', 1)
ON CONFLICT (name) DO NOTHING;

-- Leaderboard view for efficient queries
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.id,
  p.full_name,
  COALESCE(SUM(pl.points), 0) as total_points,
  COUNT(pl.id) as activities_count
FROM public.profiles p
LEFT JOIN public.points_log pl ON pl.user_id = p.id
GROUP BY p.id, p.full_name
ORDER BY total_points DESC;
