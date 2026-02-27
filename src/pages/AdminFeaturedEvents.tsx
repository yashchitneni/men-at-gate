import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
  ListTree,
  Globe,
  FileEdit,
  Palette,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FeaturedEvent } from "@/types/database.types";
import {
  buildEventPath,
  buildTemplateBlocks,
  normalizeSlug,
  type FeaturedEventBlockDraft,
  type FeaturedEventTemplateKey,
} from "@/lib/featuredEventTemplates";

type FeaturedEventForm = {
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
  priority: string;
  start_at: string;
  end_at: string;
  is_active: boolean;
  template_key: FeaturedEventTemplateKey;
  publish_status: FeaturedEvent["publish_status"];
};

const BLOCK_TYPE_OPTIONS: FeaturedEventBlockDraft["block_type"][] = [
  "hero",
  "mission",
  "spec_grid",
  "schedule",
  "sponsor_cta",
  "quote",
  "final_cta",
  "gallery",
];

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
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
  priority: "0",
  start_at: "",
  end_at: "",
  is_active: false,
  template_key: "challenge",
  publish_status: "draft",
};

function mapEventToForm(event: FeaturedEvent): FeaturedEventForm {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    subtitle: event.subtitle || "",
    summary: event.summary || "",
    badge_text: event.badge_text || "",
    event_date_text: event.event_date_text || "",
    event_path: event.event_path,
    hero_cta_label: event.hero_cta_label || "",
    hero_cta_url: event.hero_cta_url,
    registration_url: event.registration_url || "",
    image_url: event.image_url || "",
    hero_image_url: event.hero_image_url || "",
    cover_image_url: event.cover_image_url || "",
    priority: String(event.priority ?? 0),
    start_at: toDatetimeLocal(event.start_at),
    end_at: toDatetimeLocal(event.end_at),
    is_active: !!event.is_active,
    template_key: event.template_key,
    publish_status: event.publish_status,
  };
}

function blockToJson(block: FeaturedEventBlockDraft): string {
  return JSON.stringify(block.content_json, null, 2);
}

function hydrateTemplateBlocks(form: FeaturedEventForm): FeaturedEventBlockDraft[] {
  return buildTemplateBlocks(form.template_key, {
    title: form.title || "Untitled Event",
    subtitle: form.subtitle,
    summary: form.summary,
    badgeText: form.badge_text,
    dateText: form.event_date_text,
    registrationUrl: form.registration_url,
    heroImageUrl: form.hero_image_url || form.image_url,
  });
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
  const [form, setForm] = useState<FeaturedEventForm>(EMPTY_FORM);
  const [blocks, setBlocks] = useState<FeaturedEventBlockDraft[]>(hydrateTemplateBlocks(EMPTY_FORM));
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const { data: editingBlocks, isLoading: blocksLoading } = useFeaturedEventBlocks(editingEventId);

  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      navigate("/");
    }
  }, [authLoading, profile, navigate]);

  useEffect(() => {
    if (!editingEventId) return;
    if (!editingBlocks) return;
    if (!editingBlocks.length) return;

    setBlocks(
      editingBlocks
        .sort((left, right) => left.position - right.position)
        .map((block) => ({
          id: block.id,
          block_type: block.block_type,
          position: block.position,
          is_enabled: block.is_enabled,
          content_json: block.content_json,
          image_url: block.image_url,
          image_confirmed: block.image_confirmed,
        })),
    );
  }, [editingEventId, editingBlocks]);

  const sortedEvents = useMemo(
    () =>
      [...(featuredEvents || [])].sort((a, b) => {
        if (!!a.is_active !== !!b.is_active) return a.is_active ? -1 : 1;
        if (a.publish_status !== b.publish_status) {
          const rank = { published: 0, draft: 1, archived: 2 } as const;
          return rank[a.publish_status] - rank[b.publish_status];
        }
        return (b.priority || 0) - (a.priority || 0);
      }),
    [featuredEvents],
  );

  function openCreateDialog() {
    const createForm = {
      ...EMPTY_FORM,
      slug: "",
      title: "",
    };
    setForm(createForm);
    setBlocks(hydrateTemplateBlocks(createForm));
    setEditingEventId(null);
    setDialogOpen(true);
  }

  function openEditDialog(event: FeaturedEvent) {
    const mapped = mapEventToForm(event);
    setForm(mapped);
    setBlocks(hydrateTemplateBlocks(mapped));
    setEditingEventId(event.id);
    setDialogOpen(true);
  }

  function updateBlock(index: number, patch: Partial<FeaturedEventBlockDraft>) {
    setBlocks((previous) =>
      previous.map((block, blockIndex) =>
        blockIndex === index
          ? {
              ...block,
              ...patch,
            }
          : block,
      ),
    );
  }

  function removeBlock(index: number) {
    setBlocks((previous) => previous.filter((_, blockIndex) => blockIndex !== index));
  }

  function addBlock() {
    setBlocks((previous) => [
      ...previous,
      {
        block_type: "mission",
        position: previous.length,
        is_enabled: true,
        content_json: {
          heading: "New Section",
          body: "Add section content",
        },
        image_url: null,
        image_confirmed: false,
      },
    ]);
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

    const invalidJsonBlock = blocks.find((block) => !block.content_json);
    if (invalidJsonBlock) {
      toast({
        title: "Invalid block content",
        description: "One or more blocks has invalid content JSON.",
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
        priority: Number(form.priority || 0),
        start_at: fromDatetimeLocal(form.start_at),
        end_at: fromDatetimeLocal(form.end_at),
        is_active: form.is_active,
        template_key: form.template_key,
        publish_status: form.publish_status,
      });

      await replaceBlocks.mutateAsync({
        featuredEventId: savedEvent.id,
        blocks: blocks.map((block, index) => ({
          ...block,
          position: index,
        })),
      });

      toast({
        title: "Featured event saved",
        description:
          form.publish_status === "published"
            ? "Published and ready for /events/:slug rendering."
            : "Draft saved successfully.",
      });

      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setBlocks(hydrateTemplateBlocks(EMPTY_FORM));
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
                  Draft, publish, template, and spotlight control for event pages.
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
            ) : sortedEvents.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No featured events yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {sortedEvents.map((event) => (
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
                        <span className="font-semibold">Hero CTA:</span> {event.hero_cta_label || "View Event"}
                      </p>
                      <p>
                        <span className="font-semibold">Priority:</span> {event.priority}
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Featured Event" : "Create Featured Event"}</DialogTitle>
            <DialogDescription>
              Draft and publish template-based event pages. Spotlight applies only to published events.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basics" className="mt-2">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="basics"><FileEdit className="h-4 w-4 mr-2" />Basics</TabsTrigger>
              <TabsTrigger value="template"><Palette className="h-4 w-4 mr-2" />Template</TabsTrigger>
              <TabsTrigger value="blocks"><ListTree className="h-4 w-4 mr-2" />Blocks</TabsTrigger>
              <TabsTrigger value="media"><Globe className="h-4 w-4 mr-2" />Media</TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => {
                      const slug = normalizeSlug(e.target.value);
                      setForm((prev) => ({
                        ...prev,
                        slug,
                        event_path: prev.event_path || buildEventPath(slug),
                        hero_cta_url: prev.hero_cta_url || buildEventPath(slug),
                      }));
                    }}
                    placeholder="event-slug"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={form.subtitle}
                    onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea
                    id="summary"
                    value={form.summary}
                    onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="badge_text">Badge Text</Label>
                  <Input
                    id="badge_text"
                    value={form.badge_text}
                    onChange={(e) => setForm((prev) => ({ ...prev, badge_text: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event_date_text">Event Date Label</Label>
                  <Input
                    id="event_date_text"
                    value={form.event_date_text}
                    onChange={(e) => setForm((prev) => ({ ...prev, event_date_text: e.target.value }))}
                    placeholder="May 1, 2026"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_path">Event Path *</Label>
                  <Input
                    id="event_path"
                    value={form.event_path}
                    onChange={(e) => setForm((prev) => ({ ...prev, event_path: e.target.value }))}
                    placeholder="/events/marathon-ruck"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publish_status">Publish Status</Label>
                  <select
                    id="publish_status"
                    className="h-10 rounded-md border bg-background px-3 text-sm w-full"
                    value={form.publish_status}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        publish_status: event.target.value as FeaturedEvent["publish_status"],
                        is_active:
                          event.target.value === "published" ? previous.is_active : false,
                      }))
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
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
              </div>
            </TabsContent>

            <TabsContent value="template" className="space-y-4 mt-4">
              <div className="rounded-md border p-4 space-y-3">
                <p className="font-medium">Template Preset</p>
                <p className="text-sm text-muted-foreground">
                  Use template defaults to regenerate starter blocks. Existing block edits will be replaced.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!window.confirm("Reset blocks to template defaults?")) return;
                    setBlocks(hydrateTemplateBlocks(form));
                  }}
                >
                  Reset Blocks From Template
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hero_cta_label">Hero CTA Label</Label>
                  <Input
                    id="hero_cta_label"
                    value={form.hero_cta_label}
                    onChange={(e) => setForm((prev) => ({ ...prev, hero_cta_label: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_cta_url">Hero CTA URL *</Label>
                  <Input
                    id="hero_cta_url"
                    value={form.hero_cta_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, hero_cta_url: e.target.value }))}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="registration_url">Registration URL</Label>
                  <Input
                    id="registration_url"
                    value={form.registration_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, registration_url: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="blocks" className="space-y-4 mt-4">
              {blocksLoading && form.id ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading blocks...
                </div>
              ) : (
                <>
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={addBlock}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Block
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {blocks.map((block, index) => (
                      <div key={`${block.id || "new"}-${index}`} className="rounded-md border p-4 space-y-3">
                        <div className="grid md:grid-cols-3 gap-3 items-end">
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <select
                              className="h-10 rounded-md border bg-background px-3 text-sm w-full"
                              value={block.block_type}
                              onChange={(event) =>
                                updateBlock(index, {
                                  block_type: event.target.value as FeaturedEventBlockDraft["block_type"],
                                })
                              }
                            >
                              {BLOCK_TYPE_OPTIONS.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input
                              value={block.image_url || ""}
                              onChange={(event) => updateBlock(index, { image_url: event.target.value || null })}
                              placeholder="https://..."
                            />
                          </div>

                          <div className="flex items-center gap-3 pb-2">
                            <Switch
                              checked={block.is_enabled}
                              onCheckedChange={(checked) => updateBlock(index, { is_enabled: checked })}
                            />
                            <span className="text-sm">Enabled</span>
                            <Switch
                              checked={block.image_confirmed}
                              onCheckedChange={(checked) => updateBlock(index, { image_confirmed: checked })}
                            />
                            <span className="text-sm">Image Confirmed</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Content JSON</Label>
                          <Textarea
                            defaultValue={blockToJson(block)}
                            onBlur={(event) => {
                              try {
                                const nextJson = JSON.parse(event.target.value);
                                updateBlock(index, { content_json: nextJson });
                              } catch {
                                toast({
                                  title: "Invalid JSON",
                                  description: "Block content must be valid JSON before saving.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            rows={8}
                            className="font-mono text-xs"
                          />
                          <p className="text-xs text-muted-foreground">
                            Tip: use valid JSON. Invalid edits are ignored until corrected.
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <Button variant="destructive" size="sm" onClick={() => removeBlock(index)}>
                            Remove Block
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hero_image_url">Hero Image URL *</Label>
                  <Input
                    id="hero_image_url"
                    value={form.hero_image_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, hero_image_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cover_image_url">Cover Image URL *</Label>
                  <Input
                    id="cover_image_url"
                    value={form.cover_image_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, cover_image_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="image_url">Legacy/Fallback Image URL</Label>
                  <Input
                    id="image_url"
                    value={form.image_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_at">Start At</Label>
                  <Input
                    id="start_at"
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(e) => setForm((prev) => ({ ...prev, start_at: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_at">End At</Label>
                  <Input
                    id="end_at"
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(e) => setForm((prev) => ({ ...prev, end_at: e.target.value }))}
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">Active Spotlight</p>
                  <p className="text-sm text-muted-foreground">
                    Turning this on will automatically deactivate other published events.
                  </p>
                </div>
                <Switch
                  disabled={form.publish_status !== "published"}
                  checked={form.publish_status === "published" ? form.is_active : false}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveFeaturedEvent.isPending || replaceBlocks.isPending}>
              {(saveFeaturedEvent.isPending || replaceBlocks.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
