import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Activity, RefreshCcw, FlaskConical, Sparkles } from "lucide-react";
import { format } from "date-fns";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFeaturedEvents, usePromoteScheduleEventToFeatured } from "@/hooks/useFeaturedEvents";
import {
  useReplaySweatpalsRollups,
  useRunSweatpalsTestIngest,
  useSaveSweatpalsMapping,
  useSweatpalsSchedule,
  useSyncSweatpalsSchedule,
  useSweatpalsHealth,
  useSweatpalsMappings,
  type SweatpalsScheduleItem,
  useSweatpalsUnmappedEvents,
} from "@/hooks/useIntegrations";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildEventPath, normalizeSlug, type FeaturedEventTemplateKey } from "@/lib/featuredEventTemplates";

function formatTimestamp(value: string | null) {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return format(parsed, "MMM d, yyyy h:mm a");
}

export default function AdminSweatpalsIntegration() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { data: featuredEvents } = useFeaturedEvents();
  const { data: health, isLoading: healthLoading } = useSweatpalsHealth();
  const { data: mappings, isLoading: mappingsLoading } = useSweatpalsMappings();
  const { data: unmappedEvents, isLoading: unmappedLoading } = useSweatpalsUnmappedEvents();
  const { data: scheduleEvents, isLoading: scheduleLoading } = useSweatpalsSchedule({ limit: 50 });
  const runTestIngest = useRunSweatpalsTestIngest();
  const replayRollups = useReplaySweatpalsRollups();
  const syncSchedule = useSyncSweatpalsSchedule();
  const saveMapping = useSaveSweatpalsMapping();
  const promoteScheduleEvent = usePromoteScheduleEventToFeatured();
  const { toast } = useToast();

  const [selectionByExternalEvent, setSelectionByExternalEvent] = useState<Record<string, string>>({});
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);
  const [promotionEvent, setPromotionEvent] = useState<SweatpalsScheduleItem | null>(null);
  const [promotionTemplate, setPromotionTemplate] = useState<FeaturedEventTemplateKey>("challenge");
  const [promotionSlug, setPromotionSlug] = useState("");
  const [promotionTitle, setPromotionTitle] = useState("");
  const [prefillFromSchedule, setPrefillFromSchedule] = useState(true);
  const [mapOnPromotion, setMapOnPromotion] = useState(true);

  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      navigate("/");
    }
  }, [authLoading, profile, navigate]);

  const featuredOptions = useMemo(
    () =>
      (featuredEvents || [])
        .map((event) => ({
          id: event.id,
          label: `${event.title} (${event.slug})`,
        })),
    [featuredEvents],
  );

  async function handleTestIngest() {
    try {
      const result = await runTestIngest.mutateAsync({ dry_run: true });
      toast({
        title: "Test ingest completed",
        description: `Dry run: ${result.inserted_external_events} external events, ${result.inserted_attendance_facts} attendance facts.`,
      });
    } catch (error) {
      toast({
        title: "Test ingest failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleReplay() {
    try {
      await replayRollups.mutateAsync();
      toast({
        title: "Rollups refreshed",
        description: "Member and event rollups were replayed successfully.",
      });
    } catch (error) {
      toast({
        title: "Replay failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleSaveMapping(externalEventId: string, externalEventName: string | null) {
    const featuredEventId = selectionByExternalEvent[externalEventId];
    if (!featuredEventId) {
      toast({
        title: "Select a featured event",
        description: "Choose which featured event should receive this external event stream.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await saveMapping.mutateAsync({
        external_event_id: externalEventId,
        featured_event_id: featuredEventId,
        external_event_name: externalEventName,
        is_active: true,
      });

      toast({
        title: "Mapping saved",
        description: `${result.linked_external_events} external events and ${result.linked_attendance_facts} attendance facts were linked.`,
      });
    } catch (error) {
      toast({
        title: "Failed to save mapping",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleSyncSchedule() {
    try {
      const result = await syncSchedule.mutateAsync();
      toast({
        title: "Schedule sync complete",
        description: `${result.upserted} schedule events synced (${result.workouts} workouts).`,
      });
    } catch (error) {
      toast({
        title: "Schedule sync failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  function openPromotionDialog(event: SweatpalsScheduleItem) {
    setPromotionEvent(event);
    setPromotionTemplate("challenge");
    setPromotionSlug(normalizeSlug(event.title));
    setPromotionTitle(event.title);
    setPrefillFromSchedule(true);
    setMapOnPromotion(true);
    setPromotionDialogOpen(true);
  }

  async function handlePromoteEvent() {
    if (!promotionEvent) return;
    if (!promotionSlug.trim()) {
      toast({
        title: "Slug is required",
        description: "Add a slug before promoting this event.",
        variant: "destructive",
      });
      return;
    }

    try {
      const featuredEvent = await promoteScheduleEvent.mutateAsync({
        scheduleEvent: {
          external_event_id: promotionEvent.external_event_id,
          title: promotionEvent.title,
          starts_at: promotionEvent.starts_at,
          location: promotionEvent.location,
          image_url: promotionEvent.image_url,
          event_url: promotionEvent.event_url,
        },
        templateKey: promotionTemplate,
        slug: promotionSlug,
        title: promotionTitle,
        prefillFromSchedule,
      });

      if (mapOnPromotion) {
        await saveMapping.mutateAsync({
          external_event_id: promotionEvent.external_event_id,
          featured_event_id: featuredEvent.id,
          external_event_name: promotionEvent.title,
          is_active: true,
        });
      }

      toast({
        title: "Draft featured event created",
        description: `${featuredEvent.title} was created at ${buildEventPath(featuredEvent.slug)}.`,
      });
      setPromotionDialogOpen(false);
      setPromotionEvent(null);
    } catch (error) {
      toast({
        title: "Failed to promote event",
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
          <div className="max-w-6xl mx-auto space-y-6">
            <Link to="/admin" className="inline-flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Link>

            <div>
              <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
                <Activity className="h-6 w-6 text-accent" />
                SweatPals Integration
              </h1>
              <p className="text-muted-foreground mt-1">
                Webhook health, test tools, rollup replay, and external event mapping.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Health</CardTitle>
                  <CardDescription>Live webhook ingestion health and volume.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {healthLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading health...
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={health?.status === "ok" ? "default" : "destructive"}>
                          {health?.status === "ok" ? "Healthy" : "Needs Attention"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Last webhook: {formatTimestamp(health?.last_webhook_at || null)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Last webhook status: {health?.last_webhook_status || "unknown"}
                      </p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-md bg-muted">
                          <p className="text-xs text-muted-foreground">Ingested (24h)</p>
                          <p className="text-2xl font-bold">{health?.ingested_last_24h || 0}</p>
                        </div>
                        <div className="p-3 rounded-md bg-muted">
                          <p className="text-xs text-muted-foreground">Unmapped External Events</p>
                          <p className="text-2xl font-bold">{health?.unmapped_external_events || 0}</p>
                        </div>
                        <div className="p-3 rounded-md bg-muted">
                          <p className="text-xs text-muted-foreground">External Events</p>
                          <p className="text-2xl font-bold">{health?.external_events_count || 0}</p>
                        </div>
                        <div className="p-3 rounded-md bg-muted">
                          <p className="text-xs text-muted-foreground">Attendance Facts</p>
                          <p className="text-2xl font-bold">{health?.attendance_facts_count || 0}</p>
                        </div>
                        <div className="p-3 rounded-md bg-muted">
                          <p className="text-xs text-muted-foreground">Schedule Events</p>
                          <p className="text-2xl font-bold">{health?.schedule_events_count || 0}</p>
                        </div>
                        <div className="p-3 rounded-md bg-muted">
                          <p className="text-xs text-muted-foreground">Schedule Workouts</p>
                          <p className="text-2xl font-bold">{health?.schedule_workouts_count || 0}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last schedule sync: {formatTimestamp(health?.schedule_last_synced_at || null)}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Operations</CardTitle>
                  <CardDescription>Safe admin actions for integration ops.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleTestIngest} disabled={runTestIngest.isPending}>
                      {runTestIngest.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FlaskConical className="mr-2 h-4 w-4" />
                      )}
                      Send Test Ingest
                    </Button>
                    <Button variant="outline" onClick={handleReplay} disabled={replayRollups.isPending}>
                      {replayRollups.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="mr-2 h-4 w-4" />
                      )}
                      Replay Rollups
                    </Button>
                    <Button variant="outline" onClick={handleSyncSchedule} disabled={syncSchedule.isPending}>
                      {syncSchedule.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="mr-2 h-4 w-4" />
                      )}
                      Sync Schedule
                    </Button>
                  </div>

                  <div className="border rounded-md p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Recent Runs</p>
                    {!health?.recent_runs?.length ? (
                      <p className="text-sm text-muted-foreground">No run history yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-auto pr-1">
                        {health.recent_runs.map((run) => (
                          <div key={run.id} className="text-sm flex items-center justify-between gap-2">
                            <span className="truncate">
                              {run.action} • {run.triggered_by}
                            </span>
                            <Badge variant={run.status === "ok" ? "default" : "destructive"}>
                              {run.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Unmapped External Events</CardTitle>
                <CardDescription>
                  Map inbound external event IDs to your featured events so rollups and event pages stay aligned.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {unmappedLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading unmapped event streams...
                  </div>
                ) : !unmappedEvents?.length ? (
                  <p className="text-sm text-muted-foreground">No unmapped external events.</p>
                ) : (
                  <div className="space-y-4">
                    {unmappedEvents.map((item) => (
                      <div key={item.external_event_id} className="border rounded-md p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="font-semibold">{item.sample_event_name || item.external_event_id}</p>
                            <p className="text-xs text-muted-foreground">{item.external_event_id}</p>
                          </div>
                          <Badge variant="secondary">{item.occurrence_count} records</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last seen: {formatTimestamp(item.latest_occurred_at)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Types: {item.event_types.join(", ")}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <select
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                            value={selectionByExternalEvent[item.external_event_id] || ""}
                            onChange={(event) =>
                              setSelectionByExternalEvent((previous) => ({
                                ...previous,
                                [item.external_event_id]: event.target.value,
                              }))
                            }
                          >
                            <option value="">Select featured event</option>
                            {featuredOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <Button
                            onClick={() => handleSaveMapping(item.external_event_id, item.sample_event_name)}
                            disabled={saveMapping.isPending}
                          >
                            {saveMapping.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Mapping
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Mappings</CardTitle>
                <CardDescription>Known external event ID to featured event links.</CardDescription>
              </CardHeader>
              <CardContent>
                {mappingsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading mappings...
                  </div>
                ) : !mappings?.length ? (
                  <p className="text-sm text-muted-foreground">No mappings configured yet.</p>
                ) : (
                  <div className="space-y-3">
                    {mappings.map((mapping) => (
                      <div key={mapping.id} className="border rounded-md p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="font-semibold">{mapping.external_event_name || mapping.external_event_id}</p>
                          <p className="text-xs text-muted-foreground">{mapping.external_event_id}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {mapping.featured_event?.title || "Unknown featured event"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Synced Schedule Events</CardTitle>
                <CardDescription>
                  Promote a specific SweatPals event into a draft featured event. Nothing is auto-promoted.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scheduleLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading synced schedule events...
                  </div>
                ) : !scheduleEvents?.length ? (
                  <p className="text-sm text-muted-foreground">No synced schedule events available yet.</p>
                ) : (
                  <div className="space-y-3">
                    {scheduleEvents.map((event) => (
                      <div
                        key={`${event.external_event_id}-${event.starts_at}`}
                        className="border rounded-md p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.external_event_id}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(event.starts_at)} • {event.location || "Location TBA"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={event.is_workout ? "default" : "secondary"}>
                            {event.is_workout ? "Workout" : event.event_type || "Event"}
                          </Badge>
                          <Button size="sm" onClick={() => openPromotionDialog(event)}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Promote to Featured Event
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Dialog open={promotionDialogOpen} onOpenChange={setPromotionDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Promote to Featured Event</DialogTitle>
            <DialogDescription>
              Create a draft featured event from this synced SweatPals event.
            </DialogDescription>
          </DialogHeader>

          {!promotionEvent ? null : (
            <div className="space-y-4">
              <div className="rounded-md border p-3 bg-muted/40">
                <p className="font-semibold">{promotionEvent.title}</p>
                <p className="text-xs text-muted-foreground">{promotionEvent.external_event_id}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion_template">Template</Label>
                <select
                  id="promotion_template"
                  className="h-10 rounded-md border bg-background px-3 text-sm w-full"
                  value={promotionTemplate}
                  onChange={(event) => setPromotionTemplate(event.target.value as FeaturedEventTemplateKey)}
                >
                  <option value="challenge">Challenge (includes ruck)</option>
                  <option value="retreat">Retreat</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion_title">Title</Label>
                <Input
                  id="promotion_title"
                  value={promotionTitle}
                  onChange={(event) => setPromotionTitle(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion_slug">Slug</Label>
                <Input
                  id="promotion_slug"
                  value={promotionSlug}
                  onChange={(event) => setPromotionSlug(normalizeSlug(event.target.value))}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">Prefill from SweatPals</p>
                  <p className="text-sm text-muted-foreground">
                    Prefills title/date/image fields into the draft for faster editing.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefillFromSchedule}
                  onChange={(event) => setPrefillFromSchedule(event.target.checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">Save External Mapping</p>
                  <p className="text-sm text-muted-foreground">
                    Link this external event ID to the new featured event now.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={mapOnPromotion}
                  onChange={(event) => setMapOnPromotion(event.target.checked)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPromotionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePromoteEvent}
                  disabled={promoteScheduleEvent.isPending || saveMapping.isPending}
                >
                  {(promoteScheduleEvent.isPending || saveMapping.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Draft Featured Event
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
