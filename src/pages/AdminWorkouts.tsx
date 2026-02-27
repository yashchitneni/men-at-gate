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
  type WorkoutSubmissionWithContext,
} from '@/hooks/useWorkouts';
import { useAllProfiles } from '@/hooks/useProfiles';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  FileText,
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

  const approveLeadRequest = useApproveWorkoutLeadRequest();
  const rejectLeadRequest = useRejectWorkoutLeadRequest();
  const assignLeaderDirect = useAssignWorkoutLeaderDirect();
  const approveSubmission = useApproveSubmission();
  const requestChanges = useRequestSubmissionChanges();

  const [requestsModalOpen, setRequestsModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);

  const [selectedScheduleEventId, setSelectedScheduleEventId] = useState<string | null>(null);
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<WorkoutSubmissionWithContext | null>(null);
  const [adminFeedback, setAdminFeedback] = useState('');

  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      navigate('/workouts');
    }
  }, [profile, authLoading, navigate]);

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

  const pendingSubmissions = submissions.filter((submission) => submission.status === 'submitted');

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
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Workout Dates
                </CardTitle>
                <CardDescription>
                  Dates are synced from SweatPals schedule and used as the source of truth for leadership assignments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {workoutsLoading || requestsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((value) => (
                      <Skeleton key={value} className="h-24 w-full" />
                    ))}
                  </div>
                ) : leadableWorkouts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No upcoming synced workout dates.</p>
                ) : (
                  <div className="space-y-3">
                    {leadableWorkouts.map((workout) => {
                      const assignment = assignmentsByEvent.get(workout.schedule_event_id);
                      const requestCount = requestsByEvent.get(workout.schedule_event_id)?.length || 0;

                      return (
                        <div key={workout.schedule_event_id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <p className="font-semibold text-lg">
                                {format(new Date(workout.starts_at), 'EEEE, MMMM d, yyyy h:mm a')}
                              </p>
                              <p className="text-sm text-muted-foreground">{workout.title}</p>
                              {workout.location && (
                                <p className="text-xs text-muted-foreground mt-1">{workout.location}</p>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={assignment ? 'default' : 'secondary'}>
                                {assignment ? 'Assigned' : 'Needs Leader'}
                              </Badge>
                              <Badge variant="outline">
                                {requestCount} pending request{requestCount === 1 ? '' : 's'}
                              </Badge>
                            </div>
                          </div>

                          {assignment && (
                            <div className="text-sm text-muted-foreground">
                              Assigned to <span className="font-medium text-foreground">{assignment.leader?.full_name || assignment.leader?.email || 'Unknown leader'}</span>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Workout Submissions
                  {pendingSubmissions.length > 0 && <Badge variant="secondary">{pendingSubmissions.length} pending</Badge>}
                </CardTitle>
                <CardDescription>
                  Review and approve workout plans from assigned leaders.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((value) => (
                      <Skeleton key={value} className="h-16 w-full" />
                    ))}
                  </div>
                ) : submissions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No workout submissions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="flex items-center justify-between border rounded-lg p-3 gap-3">
                        <div>
                          <p className="font-medium">
                            {submission.schedule_event?.starts_at
                              ? format(new Date(submission.schedule_event.starts_at), 'EEE, MMM d, yyyy')
                              : 'Unknown date'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {submission.leader_profile?.full_name || submission.leader_profile?.email || 'Unknown leader'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              submission.status === 'approved'
                                ? 'default'
                                : submission.status === 'submitted'
                                  ? 'secondary'
                                  : submission.status === 'changes_requested'
                                    ? 'destructive'
                                    : 'outline'
                            }
                          >
                            {submission.status === 'changes_requested' ? 'changes requested' : submission.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setSubmissionModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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
