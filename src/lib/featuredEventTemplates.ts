import type { FeaturedEvent, FeaturedEventBlock, Json } from "@/types/database.types";

export type FeaturedEventTemplateKey = FeaturedEvent["template_key"];
export type FeaturedEventPublishStatus = FeaturedEvent["publish_status"];
export type FeaturedEventBlockType = FeaturedEventBlock["block_type"];

export interface FeaturedEventBlockDraft {
  id?: string;
  block_type: FeaturedEventBlockType;
  position: number;
  is_enabled: boolean;
  content_json: Json;
  image_url: string | null;
  image_confirmed: boolean;
}

export interface FeaturedEventTemplateSeedInput {
  title: string;
  subtitle?: string | null;
  summary?: string | null;
  badgeText?: string | null;
  dateText?: string | null;
  registrationUrl?: string | null;
  heroImageUrl?: string | null;
  location?: string | null;
  quote?: string | null;
  quoteAuthor?: string | null;
}

function createHeroContent(seed: FeaturedEventTemplateSeedInput): Json {
  return {
    badge: seed.badgeText || "Featured Event",
    title: seed.title,
    subtitle: seed.subtitle || "",
    summary: seed.summary || "",
    date: seed.dateText || "Date TBA",
    cta_label: "Register Now",
    cta_url: seed.registrationUrl || "",
  };
}

function challengeBlocks(seed: FeaturedEventTemplateSeedInput): FeaturedEventBlockDraft[] {
  return [
    {
      block_type: "hero",
      position: 0,
      is_enabled: true,
      content_json: createHeroContent(seed),
      image_url: seed.heroImageUrl || null,
      image_confirmed: false,
    },
    {
      block_type: "mission",
      position: 1,
      is_enabled: true,
      content_json: {
        heading: "Why We Show Up",
        body:
          seed.summary ||
          "This challenge exists to build brotherhood through hardship and shared accountability.",
      },
      image_url: null,
      image_confirmed: false,
    },
    {
      block_type: "spec_grid",
      position: 2,
      is_enabled: true,
      content_json: {
        heading: "Event Specs",
        items: [
          {
            label: "Format",
            value: "Challenge",
            description: "Move together, finish together.",
          },
          {
            label: "Location",
            value: seed.location || "TBA",
            description: "Check details before arrival.",
          },
          {
            label: "Registration",
            value: "Open",
            description: "Reserve your spot in advance.",
          },
        ],
      },
      image_url: null,
      image_confirmed: false,
    },
    {
      block_type: "sponsor_cta",
      position: 3,
      is_enabled: true,
      content_json: {
        heading: "Support the Mission",
        body: "Partner with Men in the Arena to strengthen outcomes for men.",
        cta_label: "Contact Partnership Team",
        cta_url: "mailto:community@meninthearena.co",
      },
      image_url: null,
      image_confirmed: false,
    },
    {
      block_type: "quote",
      position: 4,
      is_enabled: true,
      content_json: {
        quote:
          seed.quote ||
          "The credit belongs to the man who is actually in the arena.",
        author: seed.quoteAuthor || "Theodore Roosevelt",
      },
      image_url: null,
      image_confirmed: false,
    },
    {
      block_type: "final_cta",
      position: 5,
      is_enabled: true,
      content_json: {
        heading: "Ready to Commit?",
        body: "Register, prepare, and move with the brotherhood.",
        cta_label: "Register on SweatPals",
        cta_url: seed.registrationUrl || "",
      },
      image_url: null,
      image_confirmed: false,
    },
  ];
}

function retreatBlocks(seed: FeaturedEventTemplateSeedInput): FeaturedEventBlockDraft[] {
  return [
    {
      block_type: "hero",
      position: 0,
      is_enabled: true,
      content_json: createHeroContent(seed),
      image_url: seed.heroImageUrl || null,
      image_confirmed: false,
    },
    {
      block_type: "mission",
      position: 1,
      is_enabled: true,
      content_json: {
        heading: "Why Retreat",
        body:
          seed.summary ||
          "A retreat to reset, reconnect, and move forward shoulder-to-shoulder.",
      },
      image_url: null,
      image_confirmed: false,
    },
    {
      block_type: "schedule",
      position: 2,
      is_enabled: true,
      content_json: {
        heading: "Retreat Flow",
        items: [
          { title: "Arrival + Grounding", copy: "Set context and shared expectations." },
          { title: "Challenge Sessions", copy: "Guided physical and reflection blocks." },
          { title: "Commitment Close", copy: "Leave with concrete next steps." },
        ],
      },
      image_url: null,
      image_confirmed: false,
    },
    {
      block_type: "gallery",
      position: 3,
      is_enabled: true,
      content_json: {
        heading: "Retreat Moments",
        body: "Add supporting images and moments from previous retreats.",
        images: [],
      },
      image_url: null,
      image_confirmed: false,
    },
    {
      block_type: "quote",
      position: 4,
      is_enabled: true,
      content_json: {
        quote:
          seed.quote ||
          "Brotherhood is built through honest work, not comfort.",
        author: seed.quoteAuthor || "Men in the Arena",
      },
      image_url: null,
      image_confirmed: false,
    },
    {
      block_type: "final_cta",
      position: 5,
      is_enabled: true,
      content_json: {
        heading: "Reserve Your Spot",
        body: "Spots are limited. Register early and prepare intentionally.",
        cta_label: "Reserve on SweatPals",
        cta_url: seed.registrationUrl || "",
      },
      image_url: null,
      image_confirmed: false,
    },
  ];
}

export function buildTemplateBlocks(
  templateKey: FeaturedEventTemplateKey,
  seed: FeaturedEventTemplateSeedInput,
): FeaturedEventBlockDraft[] {
  if (templateKey === "retreat") return retreatBlocks(seed);
  return challengeBlocks(seed);
}

export function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildEventPath(slug: string): string {
  return `/events/${normalizeSlug(slug)}`;
}

export function sortBlocks(blocks: FeaturedEventBlock[]): FeaturedEventBlock[] {
  return [...blocks].sort((left, right) => left.position - right.position);
}

export function asObject(value: Json | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
