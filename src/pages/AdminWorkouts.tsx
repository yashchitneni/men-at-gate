import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  useLeadableWorkouts,
  useAdminWorkoutLeadRequests,
  useWorkoutLeadAssignments,
  useApproveWorkoutLeadRequest,
  useRejectWorkoutLeadRequest,
  useAssignWorkoutLeaderDirect,
  useAllWorkoutSubmissions,
  useApproveSubmission,
  useRequestSubmissionChanges,
  useWorkoutGuide,
  useUpsertWorkoutGuide,
  type WorkoutSubmissionWithContext,
} from '@/hooks/useWorkouts';
import {
  type LeaderGuideSection,
  parseLeaderGuideContent,
  toLeaderGuideJson,
} from '@/lib/workoutGuides';
import { useAllProfiles } from '@/hooks/useProfiles';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  Loader2,
  UserCheck,
  UserPlus,
  Users,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function AdminWorkouts() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: leadableWorkouts = [], isLoading: workoutsLoading } = useLeadableWorkouts(30);
  const { data: pendingRequests = [], isLoading: requestsLoading } = useAdminWorkoutLeadRequests('pending');
  const { data: assignments = [] } = useWorkoutLeadAssignments('assigned');
  const { data: allProfiles = [] } = useAllProfiles();
  const { data: submissions = [], isLoading: submissionsLoading } = useAllWorkoutSubmissions();
  const { data: leaderGuide, isLoading: guideLoading } = useWorkoutGuide('leader_guidelines', !!profile?.is_admin);

  const approveLeadRequest = useApproveWorkoutLeadRequest();
  const rejectLeadRequest = useRejectWorkoutLeadRequest();
  const assignLeaderDirect = useAssignWorkoutLeaderDirect();
  const approveSubmission = useApproveSubmission();
  const requestChanges = useRequestSubmissionChanges();
  const upsertWorkoutGuide = useUpsertWorkoutGuide();

  const [requestsModalOpen, setRequestsModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  const [selectedScheduleEventId, setSelectedScheduleEventId] = useState<string | null>(null);
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<WorkoutSubmissionWithContext | null>(null);
  const [adminFeedback, setAdminFeedback] = useState('');
  const [guideTitle, setGuideTitle] = useState('Workout Leader Guidelines');
  const [guideVersionLabel, setGuideVersionLabel] = useState('v1');
  const [guidePurpose, setGuidePurpose] = useState('');
  const [guideSections, setGuideSections] = useState<LeaderGuideSection[]>([]);

  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      navigate('/workouts');
    }
  }, [profile, authLoading, navigate]);

  useEffect(() => {
    const content = parseLeaderGuideContent(leaderGuide?.content_json);
    setGuideTitle(leaderGuide?.title || 'Workout Leader Guidelines');
    setGuideVersionLabel(leaderGuide?.version_label || 'v1');
    setGuidePurpose(content.purpose);
    setGuideSections(content.sections.map((section) => ({ ...section })));
  }, [leaderGuide]);

  const requestsByEvent = useMemo(() => {
    const map = new Map<string, typeof pendingRequests>();
    for (const request of pendingRequests) {
      const group = map.get(request.schedule_event_id) || [];
      group.push(request);
      map.set(request.schedule_event_id, group);
    }
    return map;
  }, [pendingRequests]);

  const assignmentsByEvent = useMemo(() => {
    const map = new Map<string, (typeof assignments)[number]>();
    for (const assignment of assignments) {
      map.set(assignment.schedule_event_id, assignment);
    }
    return map;
  }, [assignments]);

  const selectedEventRequests = selectedScheduleEventId ? requestsByEvent.get(selectedScheduleEventId) || [] : [];
  const selectedEvent = selectedScheduleEventId
    ? leadableWorkouts.find((workout) => workout.schedule_event_id === selectedScheduleEventId) || null
    : null;

  const submissionByAssignmentId = useMemo(() => {
    const map = new Map<string, WorkoutSubmissionWithContext>();
    for (const submission of submissions) {
      if (!submission.assignment_id) continue;
      if (!map.has(submission.assignment_id)) {
        map.set(submission.assignment_id, submission);
      }
    }
    return map;
  }, [submissions]);

  const submissionByScheduleEventId = useMemo(() => {
    const map = new Map<string, WorkoutSubmissionWithContext>();
    for (const submission of submissions) {
      if (!submission.schedule_event?.id) continue;
      if (!map.has(submission.schedule_event.id)) {
        map.set(submission.schedule_event.id, submission);
      }
    }
    return map;
  }, [submissions]);

  function getSubmissionBadgeVariant(status: string) {
    if (status === 'approved') return 'default' as const;
    if (status === 'submitted') return 'secondary' as const;
    if (status === 'changes_requested') return 'destructive' as const;
    return 'outline' as const;
  }

  function getSubmissionLabel(status: string) {
    if (status === 'changes_requested') return 'Changes requested';
    if (status === 'submitted') return 'Submitted for review';
    if (status === 'approved') return 'Approved';
    if (status === 'draft') return 'Draft in progress';
    return status;
  }

  async function handleApproveRequest(requestId: string) {
    try {
      await approveLeadRequest.mutateAsync(requestId);
      toast({
        title: 'Leader approved',
        description: 'The workout now has an assigned leader.',
      });
      setRequestsModalOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve request.',
        variant: 'destructive',
      });
    }
  }

  async function handleRejectRequest(requestId: string) {
    try {
      await rejectLeadRequest.mutateAsync(requestId);
      toast({
        title: 'Request rejected',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject request.',
        variant: 'destructive',
      });
    }
  }

  async function handleDirectAssign() {
    if (!selectedScheduleEventId || !selectedLeaderId) return;

    try {
      await assignLeaderDirect.mutateAsync({
        scheduleEventId: selectedScheduleEventId,
        leaderId: selectedLeaderId,
      });
      toast({
        title: 'Leader assigned',
        description: 'Assignment was updated successfully.',
      });
      setAssignModalOpen(false);
      setSelectedLeaderId('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign leader.',
        variant: 'destructive',
      });
    }
  }

  async function handleApproveSubmission(submissionId: string) {
    try {
      await approveSubmission.mutateAsync(submissionId);
      toast({
        title: 'Submission approved',
        description: 'The workout plan has been approved.',
      });
      setSubmissionModalOpen(false);
      setSelectedSubmission(null);
      setAdminFeedback('');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to approve submission.',
        variant: 'destructive',
      });
    }
  }

  async function handleRequestChanges() {
    if (!selectedSubmission || !adminFeedback.trim()) return;

    try {
      await requestChanges.mutateAsync({
        submissionId: selectedSubmission.id,
        feedback: adminFeedback,
      });
      toast({
        title: 'Changes requested',
        description: 'The leader will be notified to revise the plan.',
      });
      setSubmissionModalOpen(false);
      setSelectedSubmission(null);
      setAdminFeedback('');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to request changes.',
        variant: 'destructive',
      });
    }
  }

  function updateSection(sectionId: string, patch: Partial<LeaderGuideSection>) {
    setGuideSections((sections) =>
      sections.map((section) => (section.id === sectionId ? { ...section, ...patch } : section)),
    );
  }

  function addSection() {
    const next = guideSections.length + 1;
    setGuideSections((sections) => [
      ...sections,
      {
        id: `section_${next}`,
        title: `New Section ${next}`,
        summary: '',
        checklist: [],
        success_criteria: [],
      },
    ]);
  }

  function removeSection(sectionId: string) {
    setGuideSections((sections) => sections.filter((section) => section.id !== sectionId));
  }

  async function handleSaveGuide() {
    const normalizedSections = guideSections
      .map((section) => ({
        ...section,
        id: section.id.trim(),
        title: section.title.trim(),
        summary: section.summary.trim(),
        checklist: section.checklist.map((item) => item.trim()).filter((item) => item.length > 0),
        success_criteria: section.success_criteria.map((item) => item.trim()).filter((item) => item.length > 0),
      }))
      .filter((section) => section.id.length > 0 && section.title.length > 0);

    if (!guideTitle.trim()) {
      toast({
        title: 'Guide title required',
        description: 'Add a title before saving.',
        variant: 'destructive',
      });
      return;
    }

    if (normalizedSections.length === 0) {
      toast({
        title: 'At least one section is required',
        description: 'Add at least one guide section before saving.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await upsertWorkoutGuide.mutateAsync({
        slug: 'leader_guidelines',
        title: guideTitle.trim(),
        roleScope: 'leader',
        versionLabel: guideVersionLabel.trim() || null,
        isActive: true,
        contentJson: toLeaderGuideJson({
          purpose: guidePurpose.trim(),
          sections: normalizedSections,
        }),
      });

      toast({
        title: 'Guide saved',
        description: 'Leader guidance content was updated.',
      });

      setGuideModalOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save guide content.',
        variant: 'destructive',
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
          <div className="max-w-6xl mx-auto space-y-8">
            <Link to="/admin" className="inline-flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Link>

            <div>
              <h1 className="text-3xl font-bold font-heading">Manage Workouts</h1>
              <p className="text-muted-foreground mt-1">
                Review lead requests for synced workout dates, assign leaders, and approve workout plans.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Leader Guide Content</CardTitle>
                <CardDescription>
                  This content appears inside the leader submission flow and reminder emails.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {guideLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="outline">Slug: leader_guidelines</Badge>
                      <Badge variant="secondary">{guideSections.length} sections</Badge>
                      {leaderGuide?.version_label && <Badge variant="outline">{leaderGuide.version_label}</Badge>}
                      {leaderGuide?.updated_at && (
                        <span className="text-muted-foreground">
                          Updated {format(new Date(leaderGuide.updated_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      )}
                    </div>
                    <Button onClick={() => setGuideModalOpen(true)} className="bg-accent hover:bg-accent/90">
                      Edit Leader Guide
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Workout Dates
                </CardTitle>
                <CardDescription>
                  Dates are synced from SweatPals schedule and used as the source of truth for assignments and workout plan review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {workoutsLoading || requestsLoading || submissionsLoading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map((value) => (
                      <Skeleton key={value} className="h-64 w-full" />
                    ))}
                  </div>
                ) : leadableWorkouts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No upcoming synced workout dates.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {leadableWorkouts.map((workout) => {
                      const assignment = assignmentsByEvent.get(workout.schedule_event_id);
                      const requestCount = requestsByEvent.get(workout.schedule_event_id)?.length || 0;
                      const submission =
                        (assignment?.id ? submissionByAssignmentId.get(assignment.id) : undefined)
                        || submissionByScheduleEventId.get(workout.schedule_event_id)
                        || null;

                      return (
                        <div key={workout.schedule_event_id} className="border rounded-lg p-4 space-y-4">
                          <div className="space-y-2">
                            <p className="font-semibold text-lg">
                              {format(new Date(workout.starts_at), 'EEEE, MMM d, yyyy h:mm a')}
                            </p>
                            <p className="text-sm text-muted-foreground">{workout.title}</p>
                            {workout.location && (
                              <p className="text-xs text-muted-foreground">{workout.location}</p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={assignment ? 'default' : 'secondary'}>
                              {assignment ? 'Assigned' : 'Needs Leader'}
                            </Badge>
                            {requestCount > 0 && (
                              <Badge variant="outline">
                                {requestCount} pending request{requestCount === 1 ? '' : 's'}
                              </Badge>
                            )}
                            {submission && (
                              <Badge variant={getSubmissionBadgeVariant(submission.status)}>
                                {getSubmissionLabel(submission.status)}
                              </Badge>
                            )}
                          </div>

                          {assignment && (
                            <div className="text-sm text-muted-foreground">
                              Assigned to <span className="font-medium text-foreground">{assignment.leader?.full_name || assignment.leader?.email || 'Unknown leader'}</span>
                            </div>
                          )}

                          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                            <p className="text-sm font-medium">Workout plan</p>
                            {submission ? (
                              <>
                                <p className="text-xs text-muted-foreground">
                                  Last updated {format(new Date(submission.updated_at), 'MMM d, yyyy h:mm a')}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSubmission(submission);
                                      setSubmissionModalOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Plan
                                  </Button>
                                  {submission.status === 'submitted' && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleApproveSubmission(submission.id)}
                                        disabled={approveSubmission.isPending}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedSubmission(submission);
                                          setAdminFeedback('');
                                          setSubmissionModalOpen(true);
                                        }}
                                      >
                                        Request Changes
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-muted-foreground">No plan started yet.</p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {requestCount > 0 && (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedScheduleEventId(workout.schedule_event_id);
                                  setRequestsModalOpen(true);
                                }}
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Review Requests
                              </Button>
                            )}
                            {(requestCount > 0 || !assignment) && (
                              <Button
                                onClick={() => {
                                  setSelectedScheduleEventId(workout.schedule_event_id);
                                  setSelectedLeaderId(assignment?.leader_id || '');
                                  setAssignModalOpen(true);
                                }}
                                className="bg-accent hover:bg-accent/90"
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign Leader
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={guideModalOpen} onOpenChange={setGuideModalOpen}>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Leader Guide</DialogTitle>
                  <DialogDescription>
                    Update the in-app guidance shown to assigned workout leaders.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-2">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guide-title">Guide title</Label>
                      <Input
                        id="guide-title"
                        value={guideTitle}
                        onChange={(event) => setGuideTitle(event.target.value)}
                        placeholder="Workout Leader Guidelines"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guide-version">Version label</Label>
                      <Input
                        id="guide-version"
                        value={guideVersionLabel}
                        onChange={(event) => setGuideVersionLabel(event.target.value)}
                        placeholder="v1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guide-purpose">Purpose</Label>
                    <Textarea
                      id="guide-purpose"
                      value={guidePurpose}
                      onChange={(event) => setGuidePurpose(event.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Sections</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addSection}>
                        Add Section
                      </Button>
                    </div>

                    {guideSections.map((section) => (
                      <div key={section.id} className="border rounded-lg p-4 space-y-3">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Section id</Label>
                            <Input
                              value={section.id}
                              onChange={(event) => updateSection(section.id, { id: event.target.value })}
                              placeholder="before_workout"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Section title</Label>
                            <Input
                              value={section.title}
                              onChange={(event) => updateSection(section.id, { title: event.target.value })}
                              placeholder="Before the Workout"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Summary</Label>
                          <Textarea
                            value={section.summary}
                            onChange={(event) => updateSection(section.id, { summary: event.target.value })}
                            rows={2}
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Checklist (one item per line)</Label>
                            <Textarea
                              value={section.checklist.join('\n')}
                              onChange={(event) =>
                                updateSection(section.id, {
                                  checklist: event.target.value
                                    .split('\n')
                                    .map((item) => item.trim())
                                    .filter((item) => item.length > 0),
                                })
                              }
                              rows={6}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Success criteria (one item per line)</Label>
                            <Textarea
                              value={section.success_criteria.join('\n')}
                              onChange={(event) =>
                                updateSection(section.id, {
                                  success_criteria: event.target.value
                                    .split('\n')
                                    .map((item) => item.trim())
                                    .filter((item) => item.length > 0),
                                })
                              }
                              rows={6}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSection(section.id)}
                            disabled={guideSections.length <= 1}
                          >
                            Remove Section
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t">
                    <Button variant="outline" onClick={() => setGuideModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveGuide} disabled={upsertWorkoutGuide.isPending} className="bg-accent hover:bg-accent/90">
                      {upsertWorkoutGuide.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Guide
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={requestsModalOpen} onOpenChange={setRequestsModalOpen}>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Lead Requests</DialogTitle>
                  <DialogDescription>
                    {selectedEvent?.starts_at
                      ? format(new Date(selectedEvent.starts_at), 'EEEE, MMMM d, yyyy h:mm a')
                      : 'Select the member to approve for this date.'}
                  </DialogDescription>
                </DialogHeader>

                {selectedEventRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No pending requests for this workout date.</p>
                ) : (
                  <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                    {selectedEventRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-medium">{request.profile?.full_name || request.profile?.email || 'Unknown member'}</p>
                            <p className="text-xs text-muted-foreground">
                              Requested {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveRequest(request.id)}
                              disabled={approveLeadRequest.isPending || rejectLeadRequest.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectRequest(request.id)}
                              disabled={approveLeadRequest.isPending || rejectLeadRequest.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                        {request.notes && <p className="text-sm text-muted-foreground">{request.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Leader</DialogTitle>
                  <DialogDescription>
                    {selectedEvent?.starts_at
                      ? `Assign a leader for ${format(new Date(selectedEvent.starts_at), 'EEEE, MMMM d, yyyy')}.`
                      : 'Select a member to assign.'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Member</Label>
                    <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {allProfiles.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name || member.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full bg-accent hover:bg-accent/90"
                    onClick={handleDirectAssign}
                    disabled={!selectedLeaderId || !selectedScheduleEventId || assignLeaderDirect.isPending}
                  >
                    {assignLeaderDirect.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserCheck className="mr-2 h-4 w-4" />
                    )}
                    Save Assignment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={submissionModalOpen} onOpenChange={setSubmissionModalOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Workout Submission</DialogTitle>
                  <DialogDescription>
                    {selectedSubmission?.schedule_event?.starts_at
                      ? `For ${format(new Date(selectedSubmission.schedule_event.starts_at), 'EEEE, MMMM d, yyyy')}`
                      : 'Workout details'}
                  </DialogDescription>
                </DialogHeader>

                {selectedSubmission && (
                  <div className="space-y-6 pt-2">
                    {selectedSubmission.admin_feedback && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <h4 className="font-semibold mb-2 text-yellow-700">Admin Feedback</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedSubmission.admin_feedback}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">1. The Workout</h4>
                      <div className="p-3 bg-muted rounded-lg whitespace-pre-wrap text-sm font-mono">
                        {selectedSubmission.workout_plan}
                      </div>
                    </div>

                    {selectedSubmission.message && (
                      <div>
                        <h4 className="font-semibold mb-2">2. The Message</h4>
                        <p className="text-sm text-muted-foreground">{selectedSubmission.message}</p>
                      </div>
                    )}

                    {selectedSubmission.leadership_note && (
                      <div>
                        <h4 className="font-semibold mb-2">3. Leadership Approach</h4>
                        <p className="text-sm text-muted-foreground">{selectedSubmission.leadership_note}</p>
                      </div>
                    )}

                    {selectedSubmission.status === 'submitted' && (
                      <>
                        <div className="space-y-3 pt-4 border-t">
                          <Label htmlFor="admin-feedback">Request Changes (Optional)</Label>
                          <Textarea
                            id="admin-feedback"
                            placeholder="Provide feedback on what needs to be revised..."
                            value={adminFeedback}
                            onChange={(event) => setAdminFeedback(event.target.value)}
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveSubmission(selectedSubmission.id)}
                            disabled={approveSubmission.isPending}
                          >
                            {approveSubmission.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleRequestChanges}
                            disabled={requestChanges.isPending || !adminFeedback.trim()}
                          >
                            {requestChanges.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Request Changes
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>
    </div>
  );
}
