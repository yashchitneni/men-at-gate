-- Internalized workout leader guides + day-of reminder tracking.

-- Structured guide content authored by admins and displayed in-app.
CREATE TABLE IF NOT EXISTS public.workout_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  role_scope TEXT NOT NULL DEFAULT 'leader' CHECK (role_scope IN ('leader', 'host', 'admin', 'shared')),
  version_label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_guides_active ON public.workout_guides(is_active) WHERE is_active = true;

ALTER TABLE public.workout_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view workout guides" ON public.workout_guides;
DROP POLICY IF EXISTS "Admins can insert workout guides" ON public.workout_guides;
DROP POLICY IF EXISTS "Admins can update workout guides" ON public.workout_guides;
DROP POLICY IF EXISTS "Admins can delete workout guides" ON public.workout_guides;

CREATE POLICY "Authenticated can view workout guides"
  ON public.workout_guides FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert workout guides"
  ON public.workout_guides FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE POLICY "Admins can update workout guides"
  ON public.workout_guides FOR UPDATE
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

CREATE POLICY "Admins can delete workout guides"
  ON public.workout_guides FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

DROP TRIGGER IF EXISTS update_workout_guides_updated_at ON public.workout_guides;
CREATE TRIGGER update_workout_guides_updated_at
  BEFORE UPDATE ON public.workout_guides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT ON public.workout_guides TO authenticated;
GRANT ALL ON public.workout_guides TO service_role;

INSERT INTO public.workout_guides (
  slug,
  title,
  role_scope,
  version_label,
  is_active,
  content_json
)
VALUES (
  'leader_guidelines',
  'Workout Leader Guidelines',
  'leader',
  'v1',
  true,
  $$
  {
    "purpose": "An MTA workout is an experience built through movement, message, presence, and challenge. Lead with intention, preparation, and presence.",
    "source": {
      "name": "MTA Workout Leader Guidelines",
      "imported_at": "2026-02-27"
    },
    "sections": [
      {
        "id": "before_workout",
        "title": "Before the Workout",
        "summary": "Arrive early, align with host leadership, and confirm the room is ready.",
        "checklist": [
          "Arrive 20-30 minutes early (3:30 PM for a 4:00 PM start).",
          "Walk through your plan with a Founding Father or host.",
          "Confirm equipment, speaker, Bluetooth, and workout flow.",
          "Be open to real-time feedback and adjustments."
        ],
        "success_criteria": [
          "You can explain the flow in under two minutes.",
          "Setup is complete before men arrive.",
          "You and host are aligned on the day's intention."
        ]
      },
      {
        "id": "workout_design",
        "title": "What Is the Workout?",
        "summary": "Design a clear and scalable physical experience that fits the session timeline.",
        "checklist": [
          "Program 5 min intro, 10 min warm-up, 30-40 min main, and 10-15 min cool-down/reflection.",
          "Use a format that is simple to coach (stations, EMOM, AMRAP, partner sets).",
          "Include movement options for different fitness levels.",
          "Prioritize safe, clear, and efficient transitions."
        ],
        "success_criteria": [
          "Instructions are clear and concise.",
          "Men of different levels can participate fully.",
          "Session runs on time without confusion."
        ]
      },
      {
        "id": "message_intention",
        "title": "What Is the Message?",
        "summary": "Connect the workout to a real leadership message the men can carry into life.",
        "checklist": [
          "Define what the men should take away from today.",
          "Tie the physical challenge to effort, resilience, discipline, presence, or brotherhood.",
          "Speak from your lived experience and current challenges.",
          "Keep the message direct and grounded."
        ],
        "success_criteria": [
          "Message is authentic and specific.",
          "The group understands the intention before the main workout.",
          "Closing reflection reinforces the same theme."
        ]
      },
      {
        "id": "intensity_scaling",
        "title": "Intensity and Challenge",
        "summary": "Build challenge into every session while protecting safety and inclusion.",
        "checklist": [
          "Include a clear challenge element in the session.",
          "Coach moderate-to-hard effort, not reckless output.",
          "Offer easy-to-understand scaling options.",
          "Avoid unsafe or overly complex programming."
        ],
        "success_criteria": [
          "Men finish challenged and accomplished, not wrecked.",
          "Scaling options are used without stigma.",
          "No movement pattern introduces avoidable risk."
        ]
      },
      {
        "id": "final_word",
        "title": "How You Show Up",
        "summary": "Lead through presence and close by grounding the men together.",
        "checklist": [
          "Speak with confidence and keep cues simple.",
          "Encourage effort over ego throughout the session.",
          "Bring the men back together for a calm close-out.",
          "Leave them connected, grounded, and clear."
        ],
        "success_criteria": [
          "Energy is steady and intentional from start to finish.",
          "The room feels connected at close.",
          "Men leave with a clear takeaway beyond fitness."
        ]
      }
    ]
  }
  $$::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Track whether a day-of reminder has already been sent for the assignment.
ALTER TABLE public.workout_lead_assignments
  ADD COLUMN IF NOT EXISTS day_of_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_workout_lead_assignments_reminder_pending
  ON public.workout_lead_assignments(schedule_event_id)
  WHERE day_of_reminder_sent_at IS NULL;
