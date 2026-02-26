import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteFeaturedEvent, useFeaturedEvents, useSaveFeaturedEvent } from "@/hooks/useFeaturedEvents";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FeaturedEvent } from "@/types/database.types";

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
  priority: string;
  start_at: string;
  end_at: string;
  is_active: boolean;
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(value: string) {
  if (!value) return null;
  return new Date(value).toISOString();
}

const EMPTY_FORM: FeaturedEventForm = {
  slug: "",
  title: "",
  subtitle: "",
  summary: "",
  badge_text: "Featured Event",
  event_date_text: "",
  event_path: "/events/marathon-ruck",
  hero_cta_label: "View Event",
  hero_cta_url: "/events/marathon-ruck",
  registration_url: "https://www.sweatpals.com/",
  image_url: "",
  priority: "0",
  start_at: "",
  end_at: "",
  is_active: false,
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
    priority: String(event.priority ?? 0),
    start_at: toDatetimeLocal(event.start_at),
    end_at: toDatetimeLocal(event.end_at),
    is_active: !!event.is_active,
  };
}

export default function AdminFeaturedEvents() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { data: featuredEvents, isLoading } = useFeaturedEvents();
  const saveFeaturedEvent = useSaveFeaturedEvent();
  const deleteFeaturedEvent = useDeleteFeaturedEvent();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FeaturedEventForm>(EMPTY_FORM);

  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      navigate("/");
    }
  }, [authLoading, profile, navigate]);

  const sortedEvents = useMemo(
    () =>
      [...(featuredEvents || [])].sort((a, b) => {
        if (!!a.is_active !== !!b.is_active) return a.is_active ? -1 : 1;
        return (b.priority || 0) - (a.priority || 0);
      }),
    [featuredEvents],
  );

  function openCreateDialog() {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(event: FeaturedEvent) {
    setForm(mapEventToForm(event));
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.slug.trim() || !form.title.trim() || !form.event_path.trim() || !form.hero_cta_url.trim()) {
      toast({
        title: "Missing required fields",
        description: "Slug, title, event path, and hero CTA URL are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveFeaturedEvent.mutateAsync({
        id: form.id,
        slug: form.slug.trim(),
        title: form.title.trim(),
        subtitle: form.subtitle,
        summary: form.summary,
        badge_text: form.badge_text,
        event_date_text: form.event_date_text,
        event_path: form.event_path.trim(),
        hero_cta_label: form.hero_cta_label,
        hero_cta_url: form.hero_cta_url.trim(),
        registration_url: form.registration_url,
        image_url: form.image_url,
        priority: Number(form.priority || 0),
        start_at: fromDatetimeLocal(form.start_at),
        end_at: fromDatetimeLocal(form.end_at),
        is_active: form.is_active,
      });

      toast({
        title: "Featured event saved",
        description: form.is_active
          ? "Event saved and spotlight activated."
          : "Event saved successfully.",
      });

      setDialogOpen(false);
      setForm(EMPTY_FORM);
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
                  Control homepage spotlight events and CTA routing.
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
                        <Badge variant={event.is_active ? "default" : "secondary"}>
                          {event.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p className="text-muted-foreground">{event.summary || event.subtitle || "No summary"}</p>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Featured Event" : "Create Featured Event"}</DialogTitle>
            <DialogDescription>
              When active, this event can be spotlighted on the homepage.
            </DialogDescription>
          </DialogHeader>

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
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="marathon-ruck"
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

            <div className="space-y-2">
              <Label htmlFor="registration_url">Registration URL</Label>
              <Input
                id="registration_url"
                value={form.registration_url}
                onChange={(e) => setForm((prev) => ({ ...prev, registration_url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
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

            <div className="md:col-span-2 flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Active Spotlight</p>
                <p className="text-sm text-muted-foreground">
                  Turning this on will automatically deactivate other events.
                </p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveFeaturedEvent.isPending}>
              {saveFeaturedEvent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
