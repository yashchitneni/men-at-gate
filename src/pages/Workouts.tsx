import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useMyAssignedWorkouts,
  useLeadableWorkouts,
  useMyWorkoutLeadRequests,
  useCreateWorkoutLeadRequests,
  useCancelWorkoutLeadRequest,
  useWorkoutHistory,
  useWorkoutGuide,
} from '@/hooks/useWorkouts';
import { useSweatpalsNextWorkout } from '@/hooks/useIntegrations';
import { getLeaderChecklist, parseLeaderGuideContent } from '@/lib/workoutGuides';
import { AuthModal } from '@/components/AuthModal';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Calendar,
  ChevronRight,
  Dumbbell,
  Loader2,
  Hand,
  History,
  Check,
  FileEdit,
  RefreshCw,
  AlertCircle,
  Clock,
  MapPin,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, isAfter, startOfToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Workouts() {
  const { user, profile } = useAuth();
  const {
    data: sweatpalsNextWorkout,
    isLoading: isLoadingSweatpalsWorkout,
    isError: isSweatpalsWorkoutError,
    refetch: refetchSweatpalsWorkout,
  } = useSweatpalsNextWorkout();
  const { data: leadableWorkouts = [], isLoading: leadableLoading } = useLeadableWorkouts(20);
  const { data: workoutHistory = [], isLoading: historyLoading } = useWorkoutHistory(12);
  const { data: myAssignedWorkouts = [] } = useMyAssignedWorkouts();
  const { data: myLeadRequests = [] } = useMyWorkoutLeadRequests();
  const { data: leaderGuide } = useWorkoutGuide('leader_guidelines', !!user && myAssignedWorkouts.length > 0);

  const createLeadRequests = useCreateWorkoutLeadRequests();
  const cancelLeadRequest = useCancelWorkoutLeadRequest();
  const { toast } = useToast();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [selectedHistoryWorkoutId, setSelectedHistoryWorkoutId] = useState<string | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const pendingRequests = useMemo(() => {
    const today = startOfToday();
    return myLeadRequests.filter((request) => {
      if (request.status !== 'pending' || !request.schedule_event?.starts_at) return false;
      return isAfter(new Date(request.schedule_event.starts_at), today);
    });
  }, [myLeadRequests]);

  const openLeadableWorkouts = useMemo(
    () => leadableWorkouts.filter((event) => !event.is_assigned),
    [leadableWorkouts],
  );
  const pendingRequestEventIds = useMemo(
    () => new Set(pendingRequests.map((request) => request.schedule_event_id)),
    [pendingRequests],
  );
  const selectedHistoryWorkout = useMemo(
    () => workoutHistory.find((workout) => workout.id === selectedHistoryWorkoutId) || null,
    [selectedHistoryWorkoutId, workoutHistory],
  );
  const leaderGuideContent = useMemo(
    () => parseLeaderGuideContent(leaderGuide?.content_json),
    [leaderGuide?.content_json],
  );
  const leaderQuickChecklist = useMemo(
    () => getLeaderChecklist(leaderGuideContent, 3),
    [leaderGuideContent],
  );

  useEffect(() => {
    if (!interestModalOpen) return;
    setSelectedEventIds(pendingRequests.map((request) => request.schedule_event_id));
  }, [interestModalOpen, pendingRequests]);

  function toggleDate(scheduleEventId: string) {
    setSelectedEventIds((prev) =>
      prev.includes(scheduleEventId)
        ? prev.filter((id) => id !== scheduleEventId)
        : [...prev, scheduleEventId],
    );
  }

  async function handleExpressInterest() {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (selectedEventIds.length === 0) {
      toast({
        title: 'Select at least one date',
        description: "Please pick which dates you're available.",
        variant: 'destructive',
      });
      return;
    }

    try {
      await createLeadRequests.mutateAsync({
        userId: user.id,
        scheduleEventIds: selectedEventIds,
        notes: notes || undefined,
      });

      toast({
        title: "You're on the list!",
        description: 'Core leadership will review your request.',
      });

      setInterestModalOpen(false);
      setNotes('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleCancelRequest(requestId: string) {
    try {
      await cancelLeadRequest.mutateAsync(requestId);
      toast({
        title: 'Request removed',
        description: 'You can request another date anytime.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to cancel request. Please try again.',
        variant: 'destructive',
      });
    }
  }

  const nextWorkoutDestination = sweatpalsNextWorkout?.destination_path || sweatpalsNextWorkout?.destination_url || '/events';
  const isExternalWorkoutDestination = /^https?:\/\//.test(nextWorkoutDestination);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      <section className="pt-24 pb-20">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <Badge variant="outline" className="mx-auto w-fit">Every Other Friday</Badge>
              <h1 className="text-4xl md:text-5xl font-bold font-heading">Workouts</h1>
              <p className="text-lg text-muted-foreground">
                A brother leads each session. Show up, push hard, and keep the tradition moving.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-accent/30">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Dumbbell className="h-5 w-5 text-accent" />
                    Next Workout
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingSweatpalsWorkout ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-2/3 mx-auto" />
                      <Skeleton className="h-4 w-1/2 mx-auto" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : isSweatpalsWorkoutError ? (
                    <div className="space-y-4 text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        We couldn&apos;t load the latest workout right now.
                      </p>
                      <Button variant="outline" size="sm" onClick={() => refetchSweatpalsWorkout()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  ) : sweatpalsNextWorkout ? (
                    <div className="space-y-4 text-center">
                      <Badge variant="secondary" className="mx-auto w-fit">
                        Synced from SweatPals
                      </Badge>

                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          {format(new Date(sweatpalsNextWorkout.starts_at), 'EEEE, MMMM d, yyyy h:mm a')}
                        </span>
                      </div>

                      {sweatpalsNextWorkout.location && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{sweatpalsNextWorkout.location}</span>
                        </div>
                      )}

                      <div className="p-4 bg-accent/10 rounded-lg text-left">
                        <p className="font-semibold text-lg">{sweatpalsNextWorkout.title}</p>
                      </div>

                      <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        {isExternalWorkoutDestination ? (
                          <a href={nextWorkoutDestination} target="_blank" rel="noreferrer">
                            View Workout Event
                          </a>
                        ) : (
                          <Link to={nextWorkoutDestination}>View Workout Event</Link>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No upcoming workouts scheduled yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Hand className="h-5 w-5 text-accent" />
                    Want to Lead a Workout?
                  </CardTitle>
                  <CardDescription>
                    Pick the upcoming dates you can lead. Core leadership approves one brother per workout.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingRequests.length > 0 && (
                    <div className="space-y-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20 text-left">
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-700">
                          You have {pendingRequests.length} pending request{pendingRequests.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {pendingRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-foreground">
                              {request.schedule_event?.starts_at
                                ? format(new Date(request.schedule_event.starts_at), 'EEEE, MMMM d, yyyy')
                                : 'Date unavailable'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelRequest(request.id)}
                              disabled={cancelLeadRequest.isPending}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <Button
                      className="bg-accent hover:bg-accent/90"
                      onClick={() => {
                        if (!user) {
                          setAuthModalOpen(true);
                        } else {
                          setInterestModalOpen(true);
                        }
                      }}
                    >
                      <Hand className="mr-2 h-4 w-4" />
                      {pendingRequests.length > 0 ? 'Update Availability' : 'I Want to Lead'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {myAssignedWorkouts.length > 0 && (
              <Card className={myAssignedWorkouts.some((w) => w.submission?.status === 'changes_requested') ? 'border-yellow-500/50' : 'border-accent/50'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileEdit className="h-5 w-5 text-accent" />
                    Your Assigned Workout
                  </CardTitle>
                  <CardDescription>
                    You&apos;ve been selected to lead. Submit your workout plan for review.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {myAssignedWorkouts.map((assignment) => {
                    const submission = assignment.submission;
                    const status = submission?.status || 'not_started';

                    const statusConfig = {
                      not_started: {
                        label: 'Not started',
                        variant: 'outline' as const,
                        icon: Clock,
                        buttonText: 'Submit Workout Plan',
                      },
                      draft: {
                        label: 'Draft saved',
                        variant: 'secondary' as const,
                        icon: FileEdit,
                        buttonText: 'Continue Draft',
                      },
                      submitted: {
                        label: 'Submitted for review',
                        variant: 'default' as const,
                        icon: Check,
                        buttonText: 'View Submission',
                      },
                      changes_requested: {
                        label: 'Revisions needed',
                        variant: 'destructive' as const,
                        icon: AlertCircle,
                        buttonText: 'Revise Your Workout',
                      },
                      approved: {
                        label: 'Approved',
                        variant: 'default' as const,
                        icon: Check,
                        buttonText: 'View Approved Workout',
                      },
                    };

                    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
                    const StatusIcon = config.icon;

                    return (
                      <div key={assignment.id} className="p-4 bg-accent/10 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold">
                              {assignment.schedule_event
                                ? format(new Date(assignment.schedule_event.starts_at), 'EEEE, MMMM d, yyyy')
                                : 'Date TBD'}
                            </p>
                            <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                              <StatusIcon className="h-3 w-3" />
                              {config.label}
                            </Badge>
                          </div>
                        </div>

                        <div className="rounded-lg border bg-background/80 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Leader Brief</p>
                            {leaderGuide?.updated_at && (
                              <p className="text-xs text-muted-foreground">
                                Updated {format(new Date(leaderGuide.updated_at), 'MMM d')}
                              </p>
                            )}
                          </div>
                          <ul className="space-y-1 text-xs text-muted-foreground">
                            {leaderQuickChecklist.map((item, index) => (
                              <li key={`${assignment.id}-brief-${index}`}>• {item}</li>
                            ))}
                          </ul>
                        </div>

                        {status === 'changes_requested' && submission?.admin_feedback && (
                          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-1">
                            <p className="text-sm font-semibold text-yellow-700 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Admin feedback:
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{submission.admin_feedback}</p>
                          </div>
                        )}

                        <Button asChild className={status === 'changes_requested' ? 'w-full bg-yellow-600 hover:bg-yellow-700' : 'w-full bg-accent hover:bg-accent/90'}>
                          <Link to={`/workout-submit/${assignment.id}`}>
                            <StatusIcon className="mr-2 h-4 w-4" />
                            {config.buttonText}
                          </Link>
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <History className="h-5 w-5 text-accent" />
                  Historical Workouts
                </CardTitle>
                <CardDescription>
                  Tap any workout to see what was approved and how the session was designed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-44 w-full" />
                    <Skeleton className="h-44 w-full" />
                  </div>
                ) : workoutHistory.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <History className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>No historical workouts available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {workoutHistory.map((workout) => (
                        <button
                          key={workout.id}
                          type="button"
                          onClick={() => setSelectedHistoryWorkoutId(workout.id)}
                          className="text-left border rounded-lg p-4 space-y-3 transition-colors hover:border-accent/60 hover:bg-accent/5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <Badge variant="outline">
                              {format(new Date(workout.starts_at), 'EEE, MMM d, yyyy')}
                            </Badge>
                            <Badge variant={workout.source === 'approved_submission' ? 'default' : 'secondary'}>
                              {workout.source === 'approved_submission' ? 'Approved Plan' : 'Archive Note'}
                            </Badge>
                          </div>
                          <div>
                            <h3 className="font-semibold">{workout.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {workout.summary || 'View details from this workout.'}
                            </p>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {workout.leader_name && <p>Led by {workout.leader_name}</p>}
                            {workout.location && (
                              <p className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {workout.location}
                              </p>
                            )}
                          </div>
                          <p className="inline-flex items-center text-sm font-medium text-accent">
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </p>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-center">
                      <Button variant="outline" asChild>
                        <Link to="/workouts/archive">Browse Full Archive</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={interestModalOpen} onOpenChange={setInterestModalOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Lead a Workout</DialogTitle>
                  <DialogDescription>
                    Pick the dates you can lead. You can choose multiple upcoming workouts.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label>Available Dates *</Label>
                    {selectedEventIds.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setSelectedEventIds([])}>
                        Clear selection
                      </Button>
                    )}
                  </div>

                  {leadableLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : openLeadableWorkouts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      No open workout dates available right now.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {openLeadableWorkouts.map((event) => {
                        const isSelected = selectedEventIds.includes(event.schedule_event_id);
                        const isAlreadyRequested = pendingRequestEventIds.has(event.schedule_event_id);

                        return (
                          <button
                            key={event.schedule_event_id}
                            type="button"
                            onClick={() => toggleDate(event.schedule_event_id)}
                            className={cn(
                              'w-full rounded-lg border p-3 text-left transition-colors',
                              isSelected
                                ? 'border-accent bg-accent/10'
                                : 'border-border hover:border-accent/40 hover:bg-accent/5',
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium">
                                  {format(new Date(event.starts_at), 'EEEE, MMMM d, yyyy')}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(event.starts_at), 'h:mm a')}
                                </p>
                                {event.location && (
                                  <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {isAlreadyRequested && <Badge variant="secondary">Pending</Badge>}
                                <Badge variant={isSelected ? 'default' : 'outline'}>
                                  {isSelected ? 'Selected' : 'Select'}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Anything leadership should know?"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full bg-accent hover:bg-accent/90"
                    onClick={handleExpressInterest}
                    disabled={createLeadRequests.isPending || openLeadableWorkouts.length === 0}
                  >
                    {createLeadRequests.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Interest ({selectedEventIds.length} selected)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={!!selectedHistoryWorkout}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedHistoryWorkoutId(null);
                }
              }}
            >
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedHistoryWorkout?.title || 'Workout Details'}</DialogTitle>
                  <DialogDescription className="space-y-1">
                    {selectedHistoryWorkout && (
                      <>
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(selectedHistoryWorkout.starts_at), 'EEEE, MMMM d, yyyy')}
                        </span>
                        {selectedHistoryWorkout.location && (
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {selectedHistoryWorkout.location}
                          </span>
                        )}
                      </>
                    )}
                  </DialogDescription>
                </DialogHeader>

                {selectedHistoryWorkout && (
                  <div className="space-y-5 pt-2">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant={selectedHistoryWorkout.source === 'approved_submission' ? 'default' : 'secondary'}>
                        {selectedHistoryWorkout.source === 'approved_submission' ? 'Final Approved Workout' : 'Archive Workout'}
                      </Badge>
                      {selectedHistoryWorkout.leader_name && (
                        <p className="text-xs text-muted-foreground">Led by {selectedHistoryWorkout.leader_name}</p>
                      )}
                    </div>

                    {selectedHistoryWorkout.workout_plan && (
                      <div>
                        <h4 className="font-semibold mb-2">1. The Workout</h4>
                        <div className="p-3 bg-muted rounded-lg whitespace-pre-wrap text-sm font-mono">
                          {selectedHistoryWorkout.workout_plan}
                        </div>
                      </div>
                    )}

                    {selectedHistoryWorkout.message && (
                      <div>
                        <h4 className="font-semibold mb-2">2. The Message</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedHistoryWorkout.message}</p>
                      </div>
                    )}

                    {selectedHistoryWorkout.leadership_note && (
                      <div>
                        <h4 className="font-semibold mb-2">3. Leadership Approach</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedHistoryWorkout.leadership_note}
                        </p>
                      </div>
                    )}

                    {!selectedHistoryWorkout.workout_plan && !selectedHistoryWorkout.message && !selectedHistoryWorkout.leadership_note && (
                      <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedHistoryWorkout.summary || 'No additional details were submitted for this workout.'}
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {profile?.is_admin && (
              <div className="text-center">
                <Button variant="outline" asChild>
                  <Link to="/admin/workouts">Manage Workouts (Admin)</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
