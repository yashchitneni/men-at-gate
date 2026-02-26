import gritTestHero from "@/assets/grit-test-hero.png";
import heroWorkout from "@/assets/hero-workout.jpg";
import { buildTrackedUrl } from "@/lib/url";

export const MARATHON_RUCK_SLUG = "marathon-ruck";

export const SWEATPALS_DEFAULT_URL =
  import.meta.env.VITE_MARATHON_RUCK_SWEATPALS_URL || "https://events.sweatpals.com/4ce3b4ef";

export const MARATHON_RUCK_UTM = {
  utm_source: "men-at-gate",
  utm_medium: "website",
  utm_campaign: "marathon_ruck_2026",
};

export const DEFAULT_MARATHON_RUCK_REGISTRATION_URL = buildTrackedUrl(
  SWEATPALS_DEFAULT_URL,
  MARATHON_RUCK_UTM,
);

export type EventCardItem = {
  slug: string;
  title: string;
  category: string;
  dateLabel: string;
  location: string;
  summary: string;
  image: string;
  path: string;
  featured?: boolean;
};

export const eventCards: EventCardItem[] = [
  {
    slug: MARATHON_RUCK_SLUG,
    title: "The Weight We Carry",
    category: "Featured",
    dateLabel: "May 1, 2026",
    location: "Austin, TX",
    summary:
      "An overnight 26.2-mile ruck for men's mental health. Carry weight, move as brothers, finish together.",
    image: gritTestHero,
    path: "/events/marathon-ruck",
    featured: true,
  },
  {
    slug: "twice-a-month-workout",
    title: "Twice A Month Workout",
    category: "Recurring",
    dateLabel: "Every Other Friday · 4:00 PM",
    location: "Squatch Frontier Fitness, East Austin",
    summary:
      "High-intensity group training designed to challenge your body and connect you to the brotherhood.",
    image: heroWorkout,
    path: "/calendar",
  },
];

export const marathonRuckSpecs = [
  {
    label: "Distance",
    value: "26.2 Miles",
    description: "A full marathon through the night.",
  },
  {
    label: "Load",
    value: "Carry Extra Weight",
    description: "Ruck with intention and accountability.",
  },
  {
    label: "Impact",
    value: "Men's Mental Health",
    description: "Proceeds support brotherhood and mental health initiatives.",
  },
];

export const marathonRuckSponsorPoints = [
  {
    title: "Audience",
    copy: "Reach men committed to physical and mental growth.",
  },
  {
    title: "Alignment",
    copy: "Partner with Men in the Arena to support frontline mental health outcomes.",
  },
  {
    title: "Impact",
    copy: "Help fund initiatives that reduce isolation and build stronger men.",
  },
];
