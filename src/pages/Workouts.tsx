import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMyAssignedWorkouts } from '@/hooks/useWorkouts';
import { useSweatpalsNextWorkout } from '@/hooks/useIntegrations';
import { AuthModal } from '@/components/AuthModal';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Dumbbell,
  FileEdit,
  AlertCircle,
  Clock,
  MapPin,
  RefreshCw,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Workouts() {
  const { user, profile } = useAuth();
  const {
    data: sweatpalsNextWorkout,
    isLoading: isLoadingSweatpalsWorkout,
    isError: isSweatpalsWorkoutError,
    refetch: refetchSweatpalsWorkout,
  } = useSweatpalsNextWorkout();
  const { data: myAssignedWorkouts = [] } = useMyAssignedWorkouts();

  const [authModalOpen, setAuthModalOpen] = useState(false);

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
                        buttonText: 'Create Workout Plan',
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

            <p className="text-center text-sm text-muted-foreground">
              <Link to="/workouts/archive" className="underline hover:text-foreground">
                View past workouts
              </Link>
            </p>

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
