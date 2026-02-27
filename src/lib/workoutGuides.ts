import type { Json } from '@/types/database.types';

export interface LeaderGuideSection {
  id: string;
  title: string;
  summary: string;
  checklist: string[];
  success_criteria: string[];
}

export interface LeaderGuideContent {
  purpose: string;
  sections: LeaderGuideSection[];
}

export const DEFAULT_LEADER_GUIDE_CONTENT: LeaderGuideContent = {
  purpose:
    'An MTA workout is an experience built through movement, message, presence, and challenge. Lead with intention, preparation, and presence.',
  sections: [
    {
      id: 'before_workout',
      title: 'Before the Workout',
      summary: 'Arrive early, align with host leadership, and confirm the room is ready.',
      checklist: [
        'Arrive 20-30 minutes early (3:30 PM for a 4:00 PM start).',
        'Walk through your plan with a Founding Father or host.',
        'Confirm equipment, speaker, Bluetooth, and workout flow.',
        'Be open to real-time feedback and adjustments.',
      ],
      success_criteria: [
        'You can explain the flow in under two minutes.',
        'Setup is complete before men arrive.',
        "You and host are aligned on the day's intention.",
      ],
    },
    {
      id: 'workout_design',
      title: 'What Is the Workout?',
      summary: 'Design a clear and scalable physical experience that fits the session timeline.',
      checklist: [
        'Program 5 min intro, 10 min warm-up, 30-40 min main, and 10-15 min cool-down/reflection.',
        'Use a format that is simple to coach (stations, EMOM, AMRAP, partner sets).',
        'Include movement options for different fitness levels.',
        'Prioritize safe, clear, and efficient transitions.',
      ],
      success_criteria: [
        'Instructions are clear and concise.',
        'Men of different levels can participate fully.',
        'Session runs on time without confusion.',
      ],
    },
    {
      id: 'message_intention',
      title: 'What Is the Message?',
      summary: 'Connect the workout to a real leadership message the men can carry into life.',
      checklist: [
        'Define what the men should take away from today.',
        'Tie the physical challenge to effort, resilience, discipline, presence, or brotherhood.',
        'Speak from your lived experience and current challenges.',
        'Keep the message direct and grounded.',
      ],
      success_criteria: [
        'Message is authentic and specific.',
        'The group understands the intention before the main workout.',
        'Closing reflection reinforces the same theme.',
      ],
    },
    {
      id: 'intensity_scaling',
      title: 'Intensity and Challenge',
      summary: 'Build challenge into every session while protecting safety and inclusion.',
      checklist: [
        'Include a clear challenge element in the session.',
        'Coach moderate-to-hard effort, not reckless output.',
        'Offer easy-to-understand scaling options.',
        'Avoid unsafe or overly complex programming.',
      ],
      success_criteria: [
        'Men finish challenged and accomplished, not wrecked.',
        'Scaling options are used without stigma.',
        'No movement pattern introduces avoidable risk.',
      ],
    },
    {
      id: 'final_word',
      title: 'How You Show Up',
      summary: 'Lead through presence and close by grounding the men together.',
      checklist: [
        'Speak with confidence and keep cues simple.',
        'Encourage effort over ego throughout the session.',
        'Bring the men back together for a calm close-out.',
        'Leave them connected, grounded, and clear.',
      ],
      success_criteria: [
        'Energy is steady and intentional from start to finish.',
        'The room feels connected at close.',
        'Men leave with a clear takeaway beyond fitness.',
      ],
    },
  ],
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function normalizeSection(raw: unknown): LeaderGuideSection | null {
  const section = asRecord(raw);
  if (!section) return null;

  const id = asString(section.id);
  const title = asString(section.title);

  if (!id || !title) return null;

  return {
    id,
    title,
    summary: asString(section.summary),
    checklist: asStringArray(section.checklist),
    success_criteria: asStringArray(section.success_criteria),
  };
}

export function parseLeaderGuideContent(contentJson: Json | null | undefined): LeaderGuideContent {
  const root = asRecord(contentJson);
  if (!root) return DEFAULT_LEADER_GUIDE_CONTENT;

  const sectionsRaw = Array.isArray(root.sections) ? root.sections : [];
  const sections = sectionsRaw
    .map((section) => normalizeSection(section))
    .filter((section): section is LeaderGuideSection => section !== null);

  if (sections.length === 0) return DEFAULT_LEADER_GUIDE_CONTENT;

  return {
    purpose: asString(root.purpose, DEFAULT_LEADER_GUIDE_CONTENT.purpose),
    sections,
  };
}

export function getLeaderChecklist(content: LeaderGuideContent, limit = 5): string[] {
  const flattened = content.sections.flatMap((section) => section.checklist);
  return flattened.slice(0, Math.max(1, limit));
}

export function toLeaderGuideJson(content: LeaderGuideContent): Json {
  return {
    purpose: content.purpose,
    sections: content.sections.map((section) => ({
      id: section.id,
      title: section.title,
      summary: section.summary,
      checklist: section.checklist,
      success_criteria: section.success_criteria,
    })),
  };
}
