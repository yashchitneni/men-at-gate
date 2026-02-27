import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useMyAssignedWorkouts,
  useLeadableWorkouts,
  useMyWorkoutLeadRequests,
  useCreateWorkoutLeadRequests,
  useCancelWorkoutLeadRequest,
} from '@/hooks/useWorkouts';
import { useSweatpalsNextWorkout } from '@/hooks/useIntegrations';
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
  Dumbbell,
  Loader2,
  Hand,
  Check,
  FileEdit,
  AlertCircle,
  Clock,
  MapPin,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format, isAfter, startOfToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export default function Workouts() {
  const { user, profile } = useAuth();
  const { data: sweatpalsNextWorkout, isLoading: isLoadingSweatpalsWorkout } = useSweatpalsNextWorkout();
  const { data: leadableWorkouts = [], isLoading: leadableLoading } = useLeadableWorkouts(20);
  const { data: myAssignedWorkouts = [] } = useMyAssignedWorkouts();
  const { data: myLeadRequests = [] } = useMyWorkoutLeadRequests();

  const createLeadRequests = useCreateWorkoutLeadRequests();
  const cancelLeadRequest = useCancelWorkoutLeadRequest();
  const { toast } = useToast();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [interestModalOpen, setInterestModalOpen] = useState(false);
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
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Workouts</h1>
              <p className="text-lg text-muted-foreground">
                Every other Friday, a different brother leads us. Step up and take your turn in the arena.
              </p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-accent" />
                  Next Workout
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSweatpalsWorkout ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : sweatpalsNextWorkout ? (
                  <div className="space-y-4">
                    <Badge variant="secondary" className="w-fit">
                      Synced from SweatPals
                    </Badge>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">
                        {format(new Date(sweatpalsNextWorkout.starts_at), 'EEEE, MMMM d, yyyy h:mm a')}
                      </span>
                    </div>

                    {sweatpalsNextWorkout.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{sweatpalsNextWorkout.location}</span>
                      </div>
                    )}

                    <div className="p-4 bg-accent/10 rounded-lg">
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

            {myAssignedWorkouts.length > 0 && (
              <Card className={myAssignedWorkouts.some((w) => w.submission?.status === 'changes_requested') ? 'border-yellow-500/50 mb-8' : 'border-accent/50 mb-8'}>
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hand className="h-5 w-5 text-accent" />
                  Want to Lead a Workout?
                </CardTitle>
                <CardDescription>
                  Request the upcoming dates you can lead. Core leadership will approve one leader per workout.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingRequests.length > 0 && (
                  <div className="space-y-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-700">You have {pendingRequests.length} pending request{pendingRequests.length > 1 ? 's' : ''}</span>
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

                <Dialog open={interestModalOpen} onOpenChange={setInterestModalOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Lead a Workout</DialogTitle>
                      <DialogDescription>
                        Select which upcoming workouts you can lead.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Available Dates *</Label>
                        {leadableLoading ? (
                          <div className="space-y-2">
                            <Skeleton className="h-14 w-full" />
                            <Skeleton className="h-14 w-full" />
                          </div>
                        ) : openLeadableWorkouts.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            No open workout dates available right now.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-56 overflow-y-auto">
                            {openLeadableWorkouts.map((event) => (
                              <label
                                key={event.schedule_event_id}
                                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/5 transition-colors"
                              >
                                <Checkbox
                                  checked={selectedEventIds.includes(event.schedule_event_id)}
                                  onCheckedChange={() => toggleDate(event.schedule_event_id)}
                                />
                                <div>
                                  <p className="font-medium">
                                    {format(new Date(event.starts_at), 'EEEE, MMMM d, yyyy')}
                                  </p>
                                  {event.location && (
                                    <p className="text-xs text-muted-foreground">{event.location}</p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any other details you want to share..."
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
              </CardContent>
            </Card>

            {profile?.is_admin && (
              <div className="mt-8 text-center">
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
