import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkoutHistory } from '@/hooks/useWorkouts';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, ChevronRight, History, Loader2, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export default function WorkoutArchive() {
  const { data: workoutHistory = [], isLoading } = useWorkoutHistory(120);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  const selectedWorkout = useMemo(
    () => workoutHistory.find((workout) => workout.id === selectedWorkoutId) || null,
    [selectedWorkoutId, workoutHistory],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 pb-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <Link to="/workouts" className="inline-flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workouts
            </Link>

            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h1 className="font-heading text-4xl md:text-5xl font-bold">
                Workout Archive
              </h1>
              <p className="text-muted-foreground text-lg">
                Review past sessions and see the approved workout details.
              </p>
            </div>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <History className="h-5 w-5 text-accent" />
                  Historical Workouts
                </CardTitle>
                <CardDescription>
                  Click any workout to open its full details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-44 w-full" />
                    <Skeleton className="h-44 w-full" />
                    <Skeleton className="h-44 w-full" />
                  </div>
                ) : workoutHistory.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No past workouts yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {workoutHistory.map((workout) => (
                      <button
                        key={workout.id}
                        type="button"
                        onClick={() => setSelectedWorkoutId(workout.id)}
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
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Dialog
        open={!!selectedWorkout}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedWorkoutId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedWorkout?.title || 'Workout Details'}</DialogTitle>
            <DialogDescription className="space-y-1">
              {selectedWorkout && (
                <>
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedWorkout.starts_at), 'EEEE, MMMM d, yyyy')}
                  </span>
                  {selectedWorkout.location && (
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {selectedWorkout.location}
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedWorkout ? (
            <div className="space-y-5 pt-2">
              <div className="flex items-center justify-between gap-3">
                <Badge variant={selectedWorkout.source === 'approved_submission' ? 'default' : 'secondary'}>
                  {selectedWorkout.source === 'approved_submission' ? 'Final Approved Workout' : 'Archive Workout'}
                </Badge>
                {selectedWorkout.leader_name && (
                  <p className="text-xs text-muted-foreground">Led by {selectedWorkout.leader_name}</p>
                )}
              </div>

              {selectedWorkout.workout_plan && (
                <div>
                  <h4 className="font-semibold mb-2">1. The Workout</h4>
                  <div className="p-3 bg-muted rounded-lg whitespace-pre-wrap text-sm font-mono">
                    {selectedWorkout.workout_plan}
                  </div>
                </div>
              )}

              {selectedWorkout.message && (
                <div>
                  <h4 className="font-semibold mb-2">2. The Message</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedWorkout.message}</p>
                </div>
              )}

              {selectedWorkout.leadership_note && (
                <div>
                  <h4 className="font-semibold mb-2">3. Leadership Approach</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedWorkout.leadership_note}</p>
                </div>
              )}

              {!selectedWorkout.workout_plan && !selectedWorkout.message && !selectedWorkout.leadership_note && (
                <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedWorkout.summary || 'No additional details were submitted for this workout.'}
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
