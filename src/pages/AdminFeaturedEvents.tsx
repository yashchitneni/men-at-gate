import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  useDeleteFeaturedEvent,
  useFeaturedEventBlocks,
  useFeaturedEvents,
  useReplaceFeaturedEventBlocks,
  useSaveFeaturedEvent,
} from "@/hooks/useFeaturedEvents";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FeaturedEvent, FeaturedEventBlock } from "@/types/database.types";
import {
  asObject,
  buildEventPath,
  buildTemplateBlocks,
  normalizeSlug,
  type FeaturedEventBlockDraft,
  type FeaturedEventTemplateKey,
} from "@/lib/featuredEventTemplates";

interface FeaturedEventForm {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  badge_text: string;
  event_date_text: string;
  event_path: string;
  hero_cta_label: string;
  hero_cta_url: string;
  registration_url: string;
  image_url: string;
  hero_image_url: string;
  cover_image_url: string;
  start_at: string;
  end_at: string;
  is_active: boolean;
  template_key: FeaturedEventTemplateKey;
  publish_status: FeaturedEvent["publish_status"];
  published_at: string;

  mission_heading: string;
  mission_body: string;
  spec_format: string;
  spec_location: string;
  spec_registration: string;

  sponsor_heading: string;
  sponsor_body: string;
  sponsor_cta_label: string;
  sponsor_cta_url: string;

  quote: string;
  quote_author: string;

  final_heading: string;
  final_body: string;
  final_cta_label: string;
  final_cta_url: string;

  retreat_session_1_title: string;
  retreat_session_1_copy: string;
  retreat_session_2_title: string;
  retreat_session_2_copy: string;
  retreat_session_3_title: string;
  retreat_session_3_copy: string;
  retreat_gallery_heading: string;
  retreat_gallery_body: string;
  retreat_gallery_images: string;
}

const EDITOR_STEPS = ["Event Setup", "Page Content", "Images", "Publish"] as const;

const EMPTY_FORM: FeaturedEventForm = {
  slug: "",
  title: "",
  subtitle: "",
  summary: "",
  badge_text: "Featured Event",
  event_date_text: "",
  event_path: "",
  hero_cta_label: "View Event",
  hero_cta_url: "",
  registration_url: "",
  image_url: "",
  hero_image_url: "",
  cover_image_url: "",
  start_at: "",
  end_at: "",
  is_active: false,
  template_key: "challenge",
  publish_status: "draft",
  published_at: "",

  mission_heading: "Why We Show Up",
  mission_body: "This event exists to build brotherhood through action and accountability.",
  spec_format: "Challenge",
  spec_location: "TBA",
  spec_registration: "Open",

  sponsor_heading: "Support the Mission",
  sponsor_body: "Partner with Men in the Arena to support growth, accountability, and impact.",
  sponsor_cta_label: "Contact Partnership Team",
  sponsor_cta_url: "mailto:community@meninthearena.co",

  quote: "The credit belongs to the man who is actually in the arena.",
  quote_author: "Theodore Roosevelt",

  final_heading: "Ready to Commit?",
  final_body: "Register, prepare, and move with the brotherhood.",
  final_cta_label: "Register on SweatPals",
  final_cta_url: "",

  retreat_session_1_title: "Arrival + Grounding",
  retreat_session_1_copy: "Set context and shared expectations.",
  retreat_session_2_title: "Challenge Sessions",
  retreat_session_2_copy: "Guided physical and reflection blocks.",
  retreat_session_3_title: "Commitment Close",
  retreat_session_3_copy: "Leave with concrete next steps.",
  retreat_gallery_heading: "Retreat Moments",
  retreat_gallery_body: "Add supporting images and moments from previous retreats.",
  retreat_gallery_images: "",
};

const CHALLENGE_TEMPLATE_DEFAULTS: Omit<FeaturedEventForm, "id" | "start_at" | "end_at" | "is_active" | "template_key" | "publish_status" | "published_at" | "slug" | "title" | "subtitle" | "summary" | "badge_text" | "event_date_text" | "event_path" | "hero_cta_label" | "hero_cta_url" | "registration_url" | "image_url" | "hero_image_url" | "cover_image_url"> = {
  mission_heading: "Why We Show Up",
  mission_body: "This event exists to build brotherhood through action and accountability.",
  spec_format: "Challenge",
  spec_location: "TBA",
  spec_registration: "Open",
  sponsor_heading: "Support the Mission",
  sponsor_body: "Partner with Men in the Arena to support growth, accountability, and impact.",
  sponsor_cta_label: "Contact Partnership Team",
  sponsor_cta_url: "mailto:community@meninthearena.co",
  quote: "The credit belongs to the man who is actually in the arena.",
  quote_author: "Theodore Roosevelt",
  final_heading: "Ready to Commit?",
  final_body: "Register, prepare, and move with the brotherhood.",
  final_cta_label: "Register on SweatPals",
  final_cta_url: "",
  retreat_session_1_title: "",
  retreat_session_1_copy: "",
  retreat_session_2_title: "",
  retreat_session_2_copy: "",
  retreat_session_3_title: "",
  retreat_session_3_copy: "",
  retreat_gallery_heading: "",
  retreat_gallery_body: "",
  retreat_gallery_images: "",
};

const RETREAT_TEMPLATE_DEFAULTS: Omit<FeaturedEventForm, "id" | "start_at" | "end_at" | "is_active" | "template_key" | "publish_status" | "published_at" | "slug" | "title" | "subtitle" | "summary" | "badge_text" | "event_date_text" | "event_path" | "hero_cta_label" | "hero_cta_url" | "registration_url" | "image_url" | "hero_image_url" | "cover_image_url"> = {
  mission_heading: "Why Retreat",
  mission_body: "A reset to reconnect, build trust, and leave with clear commitments.",
  spec_format: "",
  spec_location: "",
  spec_registration: "",
  sponsor_heading: "",
  sponsor_body: "",
  sponsor_cta_label: "",
  sponsor_cta_url: "",
  quote: "Brotherhood is built through honest work, not comfort.",
  quote_author: "Men in the Arena",
  final_heading: "Reserve Your Spot",
  final_body: "Spots are limited. Register early and prepare intentionally.",
  final_cta_label: "Reserve on SweatPals",
  final_cta_url: "",
  retreat_session_1_title: "Arrival + Grounding",
  retreat_session_1_copy: "Set context and shared expectations.",
  retreat_session_2_title: "Challenge Sessions",
  retreat_session_2_copy: "Guided physical and reflection sessions.",
  retreat_session_3_title: "Commitment Close",
  retreat_session_3_copy: "Leave with concrete next steps.",
  retreat_gallery_heading: "Retreat Moments",
  retreat_gallery_body: "Add supporting images and moments from previous retreats.",
  retreat_gallery_images: "",
};

const TEMPLATE_DEFAULTS: Record<FeaturedEventTemplateKey, Omit<FeaturedEventForm, "id" | "start_at" | "end_at" | "is_active" | "template_key" | "publish_status" | "published_at" | "slug" | "title" | "subtitle" | "summary" | "badge_text" | "event_date_text" | "event_path" | "hero_cta_label" | "hero_cta_url" | "registration_url" | "image_url" | "hero_image_url" | "cover_image_url"> = {
  challenge: CHALLENGE_TEMPLATE_DEFAULTS,
  retreat: RETREAT_TEMPLATE_DEFAULTS,
};

type JsonRecord = Record<string, unknown>;

type JsonItem = Record<string, unknown>;

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(value: string) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

function getContent(content: JsonRecord | undefined, key: string, fallback = "") {
  return asString(content?.[key], fallback);
}

function getContentItems(content: JsonRecord | undefined): JsonItem[] {
  const raw = content?.items;
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry): entry is JsonItem => typeof entry === "object" && entry !== null && !Array.isArray(entry));
}

function getContentImages(content: JsonRecord | undefined): string[] {
  const raw = content?.images;
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function findBlockByType(
  blocks: FeaturedEventBlock[] | FeaturedEventBlockDraft[] | null | undefined,
  blockType: FeaturedEventBlock["block_type"],
): FeaturedEventBlock | FeaturedEventBlockDraft | null {
  return blocks?.find((block) => block.block_type === blockType) ?? null;
}

function splitImageLines(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatImageLines(value: string[]): string {
  return value.filter((entry) => entry.trim()).join("\n");
}

function withTemplateDefaults(form: FeaturedEventForm, templateKey: FeaturedEventTemplateKey): FeaturedEventForm {
  return {
    ...form,
    template_key: templateKey,
    ...TEMPLATE_DEFAULTS[templateKey],
  };
}

function createBlankForm(templateKey: FeaturedEventTemplateKey): FeaturedEventForm {
  return {
    ...EMPTY_FORM,
    template_key: templateKey,
    ...TEMPLATE_DEFAULTS[templateKey],
  };
}

function mapEventToForm(event: FeaturedEvent): FeaturedEventForm {
  const form = createBlankForm(event.template_key);

  return {
    ...form,
    id: event.id,
    slug: event.slug,
    title: event.title,
    subtitle: event.subtitle || "",
    summary: event.summary || "",
    badge_text: event.badge_text || "Featured Event",
    event_date_text: event.event_date_text || "",
    event_path: event.event_path,
    hero_cta_label: event.hero_cta_label || "View Event",
    hero_cta_url: event.hero_cta_url || buildEventPath(event.slug),
    registration_url: event.registration_url || "",
    image_url: event.image_url || "",
    hero_image_url: event.hero_image_url || "",
    cover_image_url: event.cover_image_url || "",
    is_active: !!event.is_active,
    template_key: event.template_key,
    publish_status: event.publish_status,
    published_at: event.published_at || "",
  };
}

function hydrateTemplateContentFromBlocks(form: FeaturedEventForm, blocks: FeaturedEventBlock[]): FeaturedEventForm {
  const missionBlock = findBlockByType(blocks, "mission");
  const missionContent = asObject(missionBlock?.content_json ?? {});
  const heroBlock = findBlockByType(blocks, "hero");
  const heroContent = asObject(heroBlock?.content_json ?? {});
  const finalCtaBlock = findBlockByType(blocks, "final_cta");
  const finalCtaContent = asObject(finalCtaBlock?.content_json ?? {});

  const next: FeaturedEventForm = {
    ...form,
    mission_heading: getContent(missionContent, "heading", form.mission_heading),
    mission_body: getContent(missionContent, "body", form.mission_body),
    hero_cta_label: getContent(heroContent, "cta_label", form.hero_cta_label),
    hero_cta_url: getContent(heroContent, "cta_url", form.hero_cta_url),
    final_heading: getContent(finalCtaContent, "heading", form.final_heading),
    final_body: getContent(finalCtaContent, "body", form.final_body),
    final_cta_label: getContent(finalCtaContent, "cta_label", form.final_cta_label),
    final_cta_url: getContent(finalCtaContent, "cta_url", form.final_cta_url),
  };

  if (form.template_key === "challenge") {
    const specGrid = findBlockByType(blocks, "spec_grid");
    const specItems = getContentItems(asObject(specGrid?.content_json ?? {}));

    const getSpecValue = (label: string, fallback: string) => {
      const item = specItems.find((entry) =>
        getContent(entry, "label", "").toLowerCase().includes(label.toLowerCase()),
      );
      return getContent(item, "value", fallback);
    };

    const sponsorBlock = findBlockByType(blocks, "sponsor_cta");
    const sponsorContent = asObject(sponsorBlock?.content_json ?? {});
    const quoteBlock = findBlockByType(blocks, "quote");
    const quoteContent = asObject(quoteBlock?.content_json ?? {});

    return {
      ...next,
      spec_format: getSpecValue("format", next.spec_format),
      spec_location: getSpecValue("location", next.spec_location),
      spec_registration: getSpecValue("registration", next.spec_registration),
      sponsor_heading: getContent(sponsorContent, "heading", next.sponsor_heading),
      sponsor_body: getContent(sponsorContent, "body", next.sponsor_body),
      sponsor_cta_label: getContent(sponsorContent, "cta_label", next.sponsor_cta_label),
      sponsor_cta_url: getContent(sponsorContent, "cta_url", next.sponsor_cta_url),
      quote: getContent(quoteContent, "quote", next.quote),
      quote_author: getContent(quoteContent, "author", next.quote_author),
    };
  }

  const scheduleBlock = findBlockByType(blocks, "schedule");
  const scheduleItems = getContentItems(asObject(scheduleBlock?.content_json ?? {}));

  const galleryBlock = findBlockByType(blocks, "gallery");
  const galleryContent = asObject(galleryBlock?.content_json ?? {});

  const quoteBlock = findBlockByType(blocks, "quote");
  const quoteContent = asObject(quoteBlock?.content_json ?? {});

  return {
    ...next,
    retreat_session_1_title: getContent(scheduleItems[0] as JsonRecord, "title", next.retreat_session_1_title),
    retreat_session_1_copy: getContent(scheduleItems[0] as JsonRecord, "copy", next.retreat_session_1_copy),
    retreat_session_2_title: getContent(scheduleItems[1] as JsonRecord, "title", next.retreat_session_2_title),
    retreat_session_2_copy: getContent(scheduleItems[1] as JsonRecord, "copy", next.retreat_session_2_copy),
    retreat_session_3_title: getContent(scheduleItems[2] as JsonRecord, "title", next.retreat_session_3_title),
    retreat_session_3_copy: getContent(scheduleItems[2] as JsonRecord, "copy", next.retreat_session_3_copy),
    retreat_gallery_heading: getContent(galleryContent, "heading", next.retreat_gallery_heading),
    retreat_gallery_body: getContent(galleryContent, "body", next.retreat_gallery_body),
    retreat_gallery_images: formatImageLines(getContentImages(galleryContent)),
    quote: getContent(quoteContent, "quote", next.quote),
    quote_author: getContent(quoteContent, "author", next.quote_author),
  };
}

function buildBlocksFromForm(form: FeaturedEventForm, existingBlocks: FeaturedEventBlock[]): FeaturedEventBlockDraft[] {
  const blocks = buildTemplateBlocks(form.template_key, {
    title: form.title || "Untitled Event",
    subtitle: form.subtitle,
    summary: form.summary,
    badgeText: form.badge_text,
    dateText: form.event_date_text,
    registrationUrl: form.registration_url,
    heroImageUrl: form.hero_image_url || form.image_url,
  }).map((block, index) => {
    const existing = existingBlocks.find((nextBlock) => nextBlock.block_type === block.block_type);
    return {
      ...block,
      position: index,
      image_url: existing?.image_url ?? block.image_url,
      image_confirmed: existing?.image_confirmed ?? block.image_confirmed,
      is_enabled: existing?.is_enabled ?? block.is_enabled,
      id: existing?.id,
    };
  });

  const baseHero = form.hero_cta_url || form.event_path || buildEventPath(form.slug);
  const heroBlockIndex = blocks.findIndex((block) => block.block_type === "hero");
  if (heroBlockIndex >= 0) {
    const heroContent = asObject(blocks[heroBlockIndex].content_json);
    blocks[heroBlockIndex].content_json = {
      ...heroContent,
      badge: form.badge_text || "Featured Event",
      title: form.title || "Untitled Event",
      subtitle: form.subtitle,
      summary: form.summary,
      date: form.event_date_text || "Date TBA",
      cta_label: form.hero_cta_label || "View Event",
      cta_url: baseHero,
    };
    blocks[heroBlockIndex].image_url = form.hero_image_url || form.image_url || blocks[heroBlockIndex].image_url;
  }

  const missionBlockIndex = blocks.findIndex((block) => block.block_type === "mission");
  if (missionBlockIndex >= 0) {
    blocks[missionBlockIndex].content_json = {
      heading: form.mission_heading || "Why We Show Up",
      body: form.mission_body || "",
    };
  }

  if (form.template_key === "challenge") {
    const specGridIndex = blocks.findIndex((block) => block.block_type === "spec_grid");
    if (specGridIndex >= 0) {
      blocks[specGridIndex].content_json = {
        heading: "Event Specs",
        items: [
          {
            label: "Format",
            value: form.spec_format || "Challenge",
            description: "Move together, finish together.",
          },
          {
            label: "Location",
            value: form.spec_location || "TBA",
            description: "Check details before arrival.",
          },
          {
            label: "Registration",
            value: form.spec_registration || "Open",
            description: "Reserve your spot in advance.",
          },
        ],
      };
    }

    const sponsorBlockIndex = blocks.findIndex((block) => block.block_type === "sponsor_cta");
    if (sponsorBlockIndex >= 0) {
      blocks[sponsorBlockIndex].content_json = {
        heading: form.sponsor_heading || "Support the Mission",
        body: form.sponsor_body || "",
        cta_label: form.sponsor_cta_label || "Contact Partnership Team",
        cta_url: form.sponsor_cta_url || "mailto:community@meninthearena.co",
      };
    }
  }

  const quoteBlockIndex = blocks.findIndex((block) => block.block_type === "quote");
  if (quoteBlockIndex >= 0) {
    blocks[quoteBlockIndex].content_json = {
      quote: form.quote || "",
      author: form.quote_author || "",
    };
  }

  const finalCtaIndex = blocks.findIndex((block) => block.block_type === "final_cta");
  if (finalCtaIndex >= 0) {
    blocks[finalCtaIndex].content_json = {
      heading: form.final_heading || "Take the Next Step",
      body: form.final_body || "",
      cta_label: form.final_cta_label || "View Event",
      cta_url: form.final_cta_url || baseHero,
    };
  }

  if (form.template_key === "retreat") {
    const scheduleIndex = blocks.findIndex((block) => block.block_type === "schedule");
    if (scheduleIndex >= 0) {
      blocks[scheduleIndex].content_json = {
        heading: "Retreat Flow",
        items: [
          {
            title: form.retreat_session_1_title || "Arrival + Grounding",
            copy: form.retreat_session_1_copy || "Set context and shared expectations.",
          },
          {
            title: form.retreat_session_2_title || "Challenge Sessions",
            copy: form.retreat_session_2_copy || "Guided physical and reflection blocks.",
          },
          {
            title: form.retreat_session_3_title || "Commitment Close",
            copy: form.retreat_session_3_copy || "Leave with concrete next steps.",
          },
        ],
      };
    }

    const galleryIndex = blocks.findIndex((block) => block.block_type === "gallery");
    if (galleryIndex >= 0) {
      const images = splitImageLines(form.retreat_gallery_images);
      blocks[galleryIndex].content_json = {
        heading: form.retreat_gallery_heading || "Retreat Moments",
        body: form.retreat_gallery_body || "",
        images,
      };
      blocks[galleryIndex].image_url = images[0] || blocks[galleryIndex].image_url;
    }
  }

  const preservedBlocks = existingBlocks
    .filter((block) => !blocks.some((nextBlock) => nextBlock.block_type === block.block_type))
    .map((block, index) => ({
      ...block,
      position: blocks.length + index,
    } as FeaturedEventBlockDraft));

  return [...blocks, ...preservedBlocks];
}

function isStepOneComplete(form: FeaturedEventForm) {
  return Boolean(normalizeSlug(form.slug) && form.title.trim() && normalizeSlug(form.event_path) !== "");
}

export default function AdminFeaturedEvents() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { data: featuredEvents, isLoading } = useFeaturedEvents();
  const saveFeaturedEvent = useSaveFeaturedEvent();
  const deleteFeaturedEvent = useDeleteFeaturedEvent();
  const replaceBlocks = useReplaceFeaturedEventBlocks();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<FeaturedEventForm>(createBlankForm("challenge"));
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const { data: editingBlocks = [], isLoading: blocksLoading } = useFeaturedEventBlocks(editingEventId);

  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      navigate("/");
    }
  }, [authLoading, profile, navigate]);

  useEffect(() => {
    if (!editingEventId) return;
    if (!editingBlocks.length) return;

    setForm((previous) => {
      if (previous.id !== editingEventId) return previous;
      return hydrateTemplateContentFromBlocks(previous, editingBlocks);
    });
  }, [editingEventId, editingBlocks]);

  function openCreateDialog() {
    setForm(createBlankForm("challenge"));
    setActiveStep(0);
    setEditingEventId(null);
    setDialogOpen(true);
  }

  function openEditDialog(event: FeaturedEvent) {
    setForm(mapEventToForm(event));
    setActiveStep(0);
    setEditingEventId(event.id);
    setDialogOpen(true);
  }

  function handleTemplateChange(templateKey: FeaturedEventTemplateKey) {
    setForm((previous) => withTemplateDefaults(previous, templateKey));
  }

  function nextStep() {
    setActiveStep((previous) => Math.min(previous + 1, EDITOR_STEPS.length - 1));
  }

  function previousStep() {
    setActiveStep((previous) => Math.max(previous - 1, 0));
  }

  async function handleSave() {
    const normalizedSlug = normalizeSlug(form.slug);
    const eventPath = form.event_path.trim() || buildEventPath(normalizedSlug);
    const ctaUrl = form.hero_cta_url.trim() || eventPath;

    if (!normalizedSlug || !form.title.trim() || !eventPath || !ctaUrl) {
      toast({
        title: "Missing required fields",
        description: "Slug, title, event path, and hero CTA URL are required.",
        variant: "destructive",
      });
      return;
    }

    if (form.publish_status === "published" && (!form.hero_image_url.trim() || !form.cover_image_url.trim())) {
      toast({
        title: "Missing required media",
        description: "Hero image and cover image are required before publishing.",
        variant: "destructive",
      });
      return;
    }

    try {
      const savedEvent = await saveFeaturedEvent.mutateAsync({
        id: form.id,
        slug: normalizedSlug,
        title: form.title.trim(),
        subtitle: form.subtitle,
        summary: form.summary,
        badge_text: form.badge_text,
        event_date_text: form.event_date_text,
        event_path: eventPath,
        hero_cta_label: form.hero_cta_label,
        hero_cta_url: ctaUrl,
        registration_url: form.registration_url,
        image_url: form.image_url,
        hero_image_url: form.hero_image_url,
        cover_image_url: form.cover_image_url,
        start_at: fromDatetimeLocal(form.start_at),
        end_at: fromDatetimeLocal(form.end_at),
        is_active: form.is_active,
        template_key: form.template_key,
        publish_status: form.publish_status,
        published_at: form.published_at || null,
      });

      await replaceBlocks.mutateAsync({
        featuredEventId: savedEvent.id,
        blocks: buildBlocksFromForm(form, editingBlocks),
      });

      toast({
        title: "Featured event saved",
        description:
          form.publish_status === "published"
            ? "Published and ready for the event page."
            : "Draft saved successfully.",
      });

      setDialogOpen(false);
      setForm(createBlankForm("challenge"));
      setActiveStep(0);
      setEditingEventId(null);
    } catch (error: unknown) {
      toast({
        title: "Failed to save featured event",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(event: FeaturedEvent) {
    const shouldDelete = window.confirm(`Delete "${event.title}"?`);
    if (!shouldDelete) return;

    try {
      await deleteFeaturedEvent.mutateAsync(event.id);
      toast({
        title: "Featured event deleted",
        description: `${event.title} has been removed.`,
      });
    } catch (error: unknown) {
      toast({
        title: "Failed to delete event",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isSaving = saveFeaturedEvent.isPending || replaceBlocks.isPending;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 pb-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <Link to="/admin" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Link>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
                  <Megaphone className="h-6 w-6 text-accent" />
                  Featured Events
                </h1>
                <p className="text-muted-foreground">
                  Create and publish event pages with template-based sections for easy content editing.
                </p>
              </div>
              <Button onClick={openCreateDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="h-4 w-4 mr-2" />
                New Featured Event
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading featured events...
              </div>
            ) : !featuredEvents?.length ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No featured events yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {featuredEvents.map((event) => (
                  <Card key={event.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-2xl">{event.title}</CardTitle>
                          <CardDescription className="mt-1">/{event.slug}</CardDescription>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge variant={event.is_active ? "default" : "secondary"}>
                            {event.is_active ? "Spotlight Active" : "Spotlight Inactive"}
                          </Badge>
                          <Badge variant={event.publish_status === "published" ? "default" : "outline"}>
                            {event.publish_status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p className="text-muted-foreground">{event.summary || event.subtitle || "No summary"}</p>
                      <p>
                        <span className="font-semibold">Template:</span> {event.template_key}
                      </p>
                      <p>
                        <span className="font-semibold">Path:</span> {event.event_path}
                      </p>
                      <p>
                        <span className="font-semibold">Published:</span>{" "}
                        {event.published_at ? toDatetimeLocal(event.published_at) : "Not published yet"}
                      </p>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(event)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(event)}
                          disabled={deleteFeaturedEvent.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Featured Event" : "Create Featured Event"}</DialogTitle>
            <DialogDescription>Use the guided flow to build the page sections and publish with confidence.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Step {activeStep + 1} of {EDITOR_STEPS.length}: {EDITOR_STEPS[activeStep]}
            </p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {EDITOR_STEPS.map((step, index) => (
                <div
                  key={step}
                  className={`text-center rounded-md px-2 py-1 border ${
                    index === activeStep ? "border-accent text-accent" : "border-muted text-muted-foreground"
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 mt-3">
            {activeStep === 0 && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event title *</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Event slug *</Label>
                    <Input
                      id="slug"
                      value={form.slug}
                      onChange={(event) =>
                        setForm((previous) => {
                          const nextSlug = normalizeSlug(event.target.value);
                          const shouldAutoPath = !previous.event_path || previous.event_path === buildEventPath(previous.slug);
                          const shouldAutoCta = !previous.hero_cta_url || previous.hero_cta_url === buildEventPath(previous.slug);

                          return {
                            ...previous,
                            slug: nextSlug,
                            event_path: shouldAutoPath ? buildEventPath(nextSlug) : previous.event_path,
                            hero_cta_url: shouldAutoCta ? buildEventPath(nextSlug) : previous.hero_cta_url,
                          };
                        })
                      }
                      placeholder="event-slug"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={form.subtitle}
                      onChange={(event) => setForm((previous) => ({ ...previous, subtitle: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      id="summary"
                      value={form.summary}
                      onChange={(event) => setForm((previous) => ({ ...previous, summary: event.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="badge_text">Badge text</Label>
                    <Input
                      id="badge_text"
                      value={form.badge_text}
                      onChange={(event) => setForm((previous) => ({ ...previous, badge_text: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event_date_text">Event date label</Label>
                    <Input
                      id="event_date_text"
                      value={form.event_date_text}
                      onChange={(event) => setForm((previous) => ({ ...previous, event_date_text: event.target.value }))}
                      placeholder="May 1, 2026"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event_path">Event path</Label>
                    <Input
                      id="event_path"
                      value={form.event_path}
                      onChange={(event) => setForm((previous) => ({ ...previous, event_path: event.target.value }))}
                      placeholder="/events/marathon-ruck"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template_key">Template</Label>
                    <select
                      id="template_key"
                      className="h-10 rounded-md border bg-background px-3 text-sm w-full"
                      value={form.template_key}
                      onChange={(event) => handleTemplateChange(event.target.value as FeaturedEventTemplateKey)}
                    >
                      <option value="challenge">Challenge</option>
                      <option value="retreat">Retreat</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {activeStep === 1 && form.template_key === "challenge" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mission_heading">Mission section title</Label>
                  <Input
                    id="mission_heading"
                    value={form.mission_heading}
                    onChange={(event) => setForm((previous) => ({ ...previous, mission_heading: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mission_body">Mission text</Label>
                  <Textarea
                    id="mission_body"
                    value={form.mission_body}
                    onChange={(event) => setForm((previous) => ({ ...previous, mission_body: event.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="spec_format">Format line</Label>
                    <Input
                      id="spec_format"
                      value={form.spec_format}
                      onChange={(event) => setForm((previous) => ({ ...previous, spec_format: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spec_location">Location line</Label>
                    <Input
                      id="spec_location"
                      value={form.spec_location}
                      onChange={(event) => setForm((previous) => ({ ...previous, spec_location: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spec_registration">Registration status</Label>
                    <Input
                      id="spec_registration"
                      value={form.spec_registration}
                      onChange={(event) => setForm((previous) => ({ ...previous, spec_registration: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_cta_label">Hero CTA label</Label>
                  <Input
                    id="hero_cta_label"
                    value={form.hero_cta_label}
                    onChange={(event) => setForm((previous) => ({ ...previous, hero_cta_label: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_cta_url">Hero CTA URL</Label>
                  <Input
                    id="hero_cta_url"
                    value={form.hero_cta_url}
                    onChange={(event) => setForm((previous) => ({ ...previous, hero_cta_url: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration_url">Registration URL</Label>
                  <Input
                    id="registration_url"
                    value={form.registration_url}
                    onChange={(event) => setForm((previous) => ({ ...previous, registration_url: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sponsor_heading">Sponsor section heading</Label>
                  <Input
                    id="sponsor_heading"
                    value={form.sponsor_heading}
                    onChange={(event) => setForm((previous) => ({ ...previous, sponsor_heading: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sponsor_body">Sponsor body copy</Label>
                  <Textarea
                    id="sponsor_body"
                    value={form.sponsor_body}
                    onChange={(event) => setForm((previous) => ({ ...previous, sponsor_body: event.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sponsor_cta_label">Sponsor CTA label</Label>
                    <Input
                      id="sponsor_cta_label"
                      value={form.sponsor_cta_label}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, sponsor_cta_label: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sponsor_cta_url">Sponsor CTA URL</Label>
                    <Input
                      id="sponsor_cta_url"
                      value={form.sponsor_cta_url}
                      onChange={(event) => setForm((previous) => ({ ...previous, sponsor_cta_url: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quote">Quote</Label>
                  <Textarea
                    id="quote"
                    value={form.quote}
                    onChange={(event) => setForm((previous) => ({ ...previous, quote: event.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote_author">Quote author</Label>
                  <Input
                    id="quote_author"
                    value={form.quote_author}
                    onChange={(event) => setForm((previous) => ({ ...previous, quote_author: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="final_heading">Final section heading</Label>
                  <Input
                    id="final_heading"
                    value={form.final_heading}
                    onChange={(event) => setForm((previous) => ({ ...previous, final_heading: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="final_body">Final section body</Label>
                  <Textarea
                    id="final_body"
                    value={form.final_body}
                    onChange={(event) => setForm((previous) => ({ ...previous, final_body: event.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="final_cta_label">Final CTA label</Label>
                    <Input
                      id="final_cta_label"
                      value={form.final_cta_label}
                      onChange={(event) => setForm((previous) => ({ ...previous, final_cta_label: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="final_cta_url">Final CTA URL</Label>
                    <Input
                      id="final_cta_url"
                      value={form.final_cta_url}
                      onChange={(event) => setForm((previous) => ({ ...previous, final_cta_url: event.target.value }))}
                    />
                  </div>
                </div>
              </>
            )}

            {activeStep === 1 && form.template_key === "retreat" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mission_heading">Mission section title</Label>
                  <Input
                    id="mission_heading"
                    value={form.mission_heading}
                    onChange={(event) => setForm((previous) => ({ ...previous, mission_heading: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mission_body">Mission text</Label>
                  <Textarea
                    id="mission_body"
                    value={form.mission_body}
                    onChange={(event) => setForm((previous) => ({ ...previous, mission_body: event.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retreat_session_1_title">Schedule item 1 title</Label>
                  <Input
                    id="retreat_session_1_title"
                    value={form.retreat_session_1_title}
                    onChange={(event) => setForm((previous) => ({ ...previous, retreat_session_1_title: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retreat_session_1_copy">Schedule item 1 details</Label>
                  <Textarea
                    id="retreat_session_1_copy"
                    value={form.retreat_session_1_copy}
                    onChange={(event) => setForm((previous) => ({ ...previous, retreat_session_1_copy: event.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retreat_session_2_title">Schedule item 2 title</Label>
                  <Input
                    id="retreat_session_2_title"
                    value={form.retreat_session_2_title}
                    onChange={(event) => setForm((previous) => ({ ...previous, retreat_session_2_title: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retreat_session_2_copy">Schedule item 2 details</Label>
                  <Textarea
                    id="retreat_session_2_copy"
                    value={form.retreat_session_2_copy}
                    onChange={(event) => setForm((previous) => ({ ...previous, retreat_session_2_copy: event.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retreat_session_3_title">Schedule item 3 title</Label>
                  <Input
                    id="retreat_session_3_title"
                    value={form.retreat_session_3_title}
                    onChange={(event) => setForm((previous) => ({ ...previous, retreat_session_3_title: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retreat_session_3_copy">Schedule item 3 details</Label>
                  <Textarea
                    id="retreat_session_3_copy"
                    value={form.retreat_session_3_copy}
                    onChange={(event) => setForm((previous) => ({ ...previous, retreat_session_3_copy: event.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_cta_label">Hero CTA label</Label>
                  <Input
                    id="hero_cta_label"
                    value={form.hero_cta_label}
                    onChange={(event) => setForm((previous) => ({ ...previous, hero_cta_label: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_cta_url">Hero CTA URL</Label>
                  <Input
                    id="hero_cta_url"
                    value={form.hero_cta_url}
                    onChange={(event) => setForm((previous) => ({ ...previous, hero_cta_url: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration_url">Registration URL</Label>
                  <Input
                    id="registration_url"
                    value={form.registration_url}
                    onChange={(event) => setForm((previous) => ({ ...previous, registration_url: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retreat_gallery_heading">Gallery heading</Label>
                  <Input
                    id="retreat_gallery_heading"
                    value={form.retreat_gallery_heading}
                    onChange={(event) => setForm((previous) => ({ ...previous, retreat_gallery_heading: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retreat_gallery_body">Gallery intro</Label>
                  <Textarea
                    id="retreat_gallery_body"
                    value={form.retreat_gallery_body}
                    onChange={(event) => setForm((previous) => ({ ...previous, retreat_gallery_body: event.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retreat_gallery_images">Gallery image URLs (one per line or comma)</Label>
                  <Textarea
                    id="retreat_gallery_images"
                    value={form.retreat_gallery_images}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, retreat_gallery_images: event.target.value }))
                    }
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quote">Quote</Label>
                  <Textarea
                    id="quote"
                    value={form.quote}
                    onChange={(event) => setForm((previous) => ({ ...previous, quote: event.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote_author">Quote author</Label>
                  <Input
                    id="quote_author"
                    value={form.quote_author}
                    onChange={(event) => setForm((previous) => ({ ...previous, quote_author: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="final_heading">Final section heading</Label>
                  <Input
                    id="final_heading"
                    value={form.final_heading}
                    onChange={(event) => setForm((previous) => ({ ...previous, final_heading: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="final_body">Final section body</Label>
                  <Textarea
                    id="final_body"
                    value={form.final_body}
                    onChange={(event) => setForm((previous) => ({ ...previous, final_body: event.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="final_cta_label">Final CTA label</Label>
                    <Input
                      id="final_cta_label"
                      value={form.final_cta_label}
                      onChange={(event) => setForm((previous) => ({ ...previous, final_cta_label: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="final_cta_url">Final CTA URL</Label>
                    <Input
                      id="final_cta_url"
                      value={form.final_cta_url}
                      onChange={(event) => setForm((previous) => ({ ...previous, final_cta_url: event.target.value }))}
                    />
                  </div>
                </div>
              </>
            )}

            {activeStep === 2 && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hero_image_url">Hero image URL *</Label>
                    <Input
                      id="hero_image_url"
                      value={form.hero_image_url}
                      onChange={(event) => setForm((previous) => ({ ...previous, hero_image_url: event.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cover_image_url">Cover image URL *</Label>
                    <Input
                      id="cover_image_url"
                      value={form.cover_image_url}
                      onChange={(event) => setForm((previous) => ({ ...previous, cover_image_url: event.target.value }))}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="image_url">Legacy/fallback image URL</Label>
                    <Input
                      id="image_url"
                      value={form.image_url}
                      onChange={(event) => setForm((previous) => ({ ...previous, image_url: event.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {(form.hero_image_url || form.image_url) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {form.hero_image_url || form.image_url ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Hero preview</p>
                        <img
                          src={form.hero_image_url || form.image_url}
                          alt="Hero preview"
                          className="w-full rounded-md border border-muted"
                        />
                      </div>
                    ) : null}
                    {form.cover_image_url ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Cover preview</p>
                        <img src={form.cover_image_url} alt="Cover preview" className="w-full rounded-md border border-muted" />
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}

            {activeStep === 3 && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="publish_status">Publish status</Label>
                    <select
                      id="publish_status"
                      className="h-10 rounded-md border bg-background px-3 text-sm w-full"
                      value={form.publish_status}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          publish_status: event.target.value as FeaturedEvent["publish_status"],
                          is_active: event.target.value === "published" ? previous.is_active : false,
                        }))
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publish-start">Publish visibility window</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        id="publish-start"
                        type="datetime-local"
                        value={form.start_at}
                        onChange={(event) => setForm((previous) => ({ ...previous, start_at: event.target.value }))}
                      />
                      <Input
                        id="publish-end"
                        type="datetime-local"
                        value={form.end_at}
                        onChange={(event) => setForm((previous) => ({ ...previous, end_at: event.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">Show as Spotlight</p>
                    <p className="text-sm text-muted-foreground">
                      Only published events can be set as the spotlight event. Spotlight is shown in the events list.
                    </p>
                  </div>
                  <Switch
                    disabled={form.publish_status !== "published"}
                    checked={form.publish_status === "published" ? form.is_active : false}
                    onCheckedChange={(checked) => setForm((previous) => ({ ...previous, is_active: checked }))}
                  />
                </div>
              </>
            )}
          </div>

          {blocksLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground pt-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing saved section content...
            </div>
          ) : null}

          <div className="flex justify-between items-center gap-2 mt-6">
            <Button variant="outline" onClick={previousStep} disabled={activeStep === 0}>
              Back
            </Button>

            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>

              {activeStep < 3 ? (
                <Button onClick={nextStep} disabled={activeStep === 0 ? !isStepOneComplete(form) : false}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Save Event
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
