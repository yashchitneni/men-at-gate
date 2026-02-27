import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, Star } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAllProfiles } from "@/hooks/useProfiles";
import {
  isSubmissionReadyForPublish,
  useModerateSpotlightSubmission,
  useSendSpotlightReminder,
  useSetFeaturedSpotlight,
  useSpotlightSubmissions,
} from "@/hooks/useSpotlights";
import type { SpotlightSubmission } from "@/types/database.types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function chicagoDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(date);
}

function statusBadgeVariant(status: SpotlightSubmission["status"]) {
  if (status === "approved" || status === "published") return "default" as const;
  if (status === "submitted") return "secondary" as const;
  if (status === "needs_update" || status === "rejected") return "destructive" as const;
  return "outline" as const;
}

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: "all", label: "All" },
  { id: "submitted", label: "Submitted" },
  { id: "needs_update", label: "Needs Update" },
  { id: "approved", label: "Approved" },
  { id: "draft", label: "Draft" },
  { id: "rejected", label: "Rejected" },
];

export default function AdminSpotlights() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { data: submissions = [], isLoading } = useSpotlightSubmissions({ enabled: !!profile?.is_admin });
  const { data: allProfiles = [] } = useAllProfiles();
  const moderate = useModerateSpotlightSubmission();
  const setFeatured = useSetFeaturedSpotlight();
  const sendReminder = useSendSpotlightReminder();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState("submitted");
  const [publishDates, setPublishDates] = useState<Record<string, string>>({});
  const [notesBySubmission, setNotesBySubmission] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      navigate("/");
    }
  }, [authLoading, profile, navigate]);

  const latestByProfile = useMemo(() => {
    const sorted = [...submissions].sort((a, b) =>
      new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime(),
    );

    const map = new Map<string, SpotlightSubmission>();
    for (const submission of sorted) {
      if (!map.has(submission.profile_id)) {
        map.set(submission.profile_id, submission);
      }
    }

    return map;
  }, [submissions]);

  const queue = useMemo(() => {
    const rows = Array.from(latestByProfile.values());
    if (statusFilter === "all") return rows;
    return rows.filter((row) => row.status === statusFilter);
  }, [latestByProfile, statusFilter]);

  const incompleteProfiles = useMemo(() => {
    return allProfiles
      .filter((p) => !p.is_admin && !p.is_super_admin)
      .filter((p) => {
        const latest = latestByProfile.get(p.id);
        if (!latest) return true;
        return !isSubmissionReadyForPublish(latest);
      })
      .slice(0, 20);
  }, [allProfiles, latestByProfile]);

  const memberNameById = useMemo(
    () =>
      allProfiles.reduce((acc, p) => {
        acc[p.id] = p.full_name || p.email;
        return acc;
      }, {} as Record<string, string>),
    [allProfiles],
  );

  async function updateStatus(
    submission: SpotlightSubmission,
    nextStatus: SpotlightSubmission["status"],
    options?: { publishOnDate?: string; markFeatured?: boolean },
  ) {
    try {
      const publishOnDate = options?.publishOnDate || publishDates[submission.id] || chicagoDateKey();
      const nowIso = new Date().toISOString();

      const patch: Partial<SpotlightSubmission> = {
        status: nextStatus,
        admin_notes: notesBySubmission[submission.id] || null,
        reviewed_by: profile?.id || null,
        reviewed_at: nowIso,
      };

      if (nextStatus === "approved" || nextStatus === "published") {
        patch.publish_on_date = publishOnDate;
      }

      if (nextStatus === "published") {
        patch.published_at = nowIso;
      }

      await moderate.mutateAsync({
        submissionId: submission.id,
        patch,
      });

      if (options?.markFeatured) {
        await setFeatured.mutateAsync({
          submissionId: submission.id,
          featureStartDate: publishOnDate,
          featureEndDate: null,
        });
      }

      toast({
        title: "Spotlight updated",
        description: `${submission.display_name} moved to ${nextStatus}.`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unable to update spotlight.",
        variant: "destructive",
      });
    }
  }

  async function handleSendReminder(profileId: string) {
    try {
      const result = await sendReminder.mutateAsync(profileId);
      toast({
        title: "Reminder sent",
        description: `Sent profile completion reminder to ${result.email}.`,
      });
    } catch (error) {
      toast({
        title: "Reminder failed",
        description: error instanceof Error ? error.message : "Could not send reminder email.",
        variant: "destructive",
      });
    }
  }

  async function handleRemoveFeatured(submissionId: string) {
    try {
      await moderate.mutateAsync({
        submissionId,
        patch: {
          is_featured: false,
          feature_start_date: null,
          feature_end_date: null,
        },
      });
      toast({
        title: "Featured spotlight removed",
        description: "This profile is no longer pinned as featured.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not remove featured spotlight.",
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
              <h1 className="text-3xl font-bold font-heading">Member Spotlights</h1>
              <p className="text-muted-foreground mt-1">
                Review submissions, schedule publishing, and set weekly featured spotlight.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Review Queue</CardTitle>
                <CardDescription>Only approved submissions with publish dates become public on /brotherhood.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                  <TabsList className="flex flex-wrap h-auto">
                    {STATUS_FILTERS.map((item) => (
                      <TabsTrigger key={item.id} value={item.id}>
                        {item.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : queue.length === 0 ? (
                  <p className="text-muted-foreground text-center py-10">No spotlights in this filter.</p>
                ) : (
                  <div className="space-y-6">
                    {queue.map((submission) => {
                      const publishDate = publishDates[submission.id] || submission.publish_on_date || chicagoDateKey();
                      return (
                        <Card key={submission.id} className="border-muted">
                          <CardContent className="pt-6 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">{submission.display_name}</h3>
                                  <Badge variant={statusBadgeVariant(submission.status)}>{submission.status}</Badge>
                                  {submission.is_featured && <Badge>Featured</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Member: {memberNameById[submission.profile_id] || submission.profile_id}
                                </p>
                              </div>
                              <div className="w-full md:w-56">
                                <Label htmlFor={`publish-${submission.id}`} className="text-xs text-muted-foreground">
                                  Publish Date (America/Chicago)
                                </Label>
                                <Input
                                  id={`publish-${submission.id}`}
                                  type="date"
                                  value={publishDate}
                                  onChange={(event) =>
                                    setPublishDates((prev) => ({
                                      ...prev,
                                      [submission.id]: event.target.value,
                                    }))
                                  }
                                />
                              </div>
                            </div>

                            <p className="text-sm text-foreground/90 leading-relaxed">
                              {submission.why_i_joined || submission.short_bio || "No spotlight story provided yet."}
                            </p>

                            <div>
                              <Label htmlFor={`notes-${submission.id}`}>Admin Notes</Label>
                              <Input
                                id={`notes-${submission.id}`}
                                placeholder="Optional feedback for member"
                                value={notesBySubmission[submission.id] || ""}
                                onChange={(event) =>
                                  setNotesBySubmission((prev) => ({
                                    ...prev,
                                    [submission.id]: event.target.value,
                                  }))
                                }
                              />
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateStatus(submission, "approved", { publishOnDate: publishDate })}
                                disabled={moderate.isPending || setFeatured.isPending}
                              >
                                Approve + Schedule
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateStatus(submission, "approved", {
                                    publishOnDate: publishDate,
                                    markFeatured: true,
                                  })
                                }
                                disabled={moderate.isPending || setFeatured.isPending}
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Approve + Feature
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => updateStatus(submission, "needs_update")}
                                disabled={moderate.isPending}
                              >
                                Request Updates
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateStatus(submission, "rejected")}
                                disabled={moderate.isPending}
                              >
                                Reject
                              </Button>
                              {submission.is_featured && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveFeatured(submission.id)}
                                  disabled={moderate.isPending}
                                >
                                  Remove Featured
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Completion Reminders</CardTitle>
                <CardDescription>
                  Send a one-click email prompt to members who have not completed a publish-ready spotlight profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {incompleteProfiles.length === 0 ? (
                  <p className="text-muted-foreground">All current members have publish-ready spotlight profiles.</p>
                ) : (
                  <div className="space-y-3">
                    {incompleteProfiles.map((member) => (
                      <div key={member.id} className="flex items-center justify-between border rounded-lg p-3 gap-3">
                        <div>
                          <p className="font-medium">{member.full_name || member.email}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendReminder(member.id)}
                          disabled={sendReminder.isPending}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Reminder
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
