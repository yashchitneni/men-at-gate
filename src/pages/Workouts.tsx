import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUpcomingWorkout, useWorkoutSlots, useMyWorkoutInterest, useExpressInterest, useCancelInterest } from '@/hooks/useWorkouts';
import { AuthModal } from '@/components/AuthModal';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar, User, Dumbbell, Loader2, Hand, Check, FileEdit, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export default function Workouts() {
  const { user, profile } = useAuth();
  const { data: upcomingWorkout, isLoading } = useUpcomingWorkout();
  const { data: allSlots } = useWorkoutSlots();
  const { data: myInterest } = useMyWorkoutInterest();
  const expressInterest = useExpressInterest();
  const cancelInterest = useCancelInterest();
  const { toast } = useToast();
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Filter to only show open slots (no leader assigned)
  const openSlots = allSlots?.filter(slot => !slot.leader_id && slot.status === 'open') || [];

  function toggleDate(date: string) {
    setSelectedDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  }

  async function handleExpressInterest() {
    console.log('🟡 handleExpressInterest called', { hasUser: !!user, selectedDates: selectedDates.length });

    if (!user) {
      console.log('🟡 No user, opening auth modal');
      setAuthModalOpen(true);
      return;
    }

    if (selectedDates.length === 0) {
      console.log('🟡 No dates selected');
      toast({
        title: 'Select at least one date',
        description: 'Please pick which dates you\'re available.',
        variant: 'destructive',
      });
      return;
    }

    console.log('🟡 Calling expressInterest mutation...');
    try {
      await expressInterest.mutateAsync({
        userId: user.id,
        preferredDates: selectedDates.map(d => format(new Date(d), 'MMM d, yyyy')).join(', '),
        notes: notes || undefined,
      });
      console.log('🟡 Mutation completed successfully');
      toast({
        title: "You're on the list!",
        description: "A leader will reach out to schedule you.",
      });
      setInterestModalOpen(false);
      setSelectedDates([]);
      setNotes('');
    } catch (error) {
      console.error('🟡 Mutation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleCancelInterest() {
    if (!myInterest) return;
    
    try {
      await cancelInterest.mutateAsync(myInterest.id);
      toast({
        title: 'Interest cancelled',
        description: 'You can sign up again anytime.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      <section className="pt-24 pb-20">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Workouts</h1>
              <p className="text-lg text-muted-foreground">
                Every other Friday, a different brother leads us. Step up and take your turn in the arena.
              </p>
            </div>

            {/* Upcoming Workout Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-accent" />
                  Next Workout
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : upcomingWorkout ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          {format(new Date(upcomingWorkout.workout_date), 'EEEE, MMMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    {upcomingWorkout.leader ? (
                      <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-accent text-accent-foreground">
                            {upcomingWorkout.leader.full_name?.charAt(0) || 'L'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm text-muted-foreground">Led by</p>
                          <p className="font-semibold text-lg">
                            {upcomingWorkout.leader.full_name || 'TBD'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-muted-foreground">Leader TBD</p>
                      </div>
                    )}

                    {upcomingWorkout.theme && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Theme</p>
                        <p className="font-medium">{upcomingWorkout.theme}</p>
                      </div>
                    )}

                    {upcomingWorkout.description && (
                      <p className="text-muted-foreground">{upcomingWorkout.description}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No upcoming workouts scheduled yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assigned Leader Card - Show if user is assigned to lead */}
            {allSlots?.some(slot => slot.leader_id === user?.id) && (
              <Card className="border-accent/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileEdit className="h-5 w-5 text-accent" />
                    Your Assigned Workout
                  </CardTitle>
                  <CardDescription>
                    You've been selected to lead! Submit your workout plan for review.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {allSlots?.filter(slot => slot.leader_id === user?.id).map(slot => (
                    <div key={slot.id} className="p-4 bg-accent/10 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {format(new Date(slot.workout_date), 'EEEE, MMMM d, yyyy')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Status: {slot.status}
                          </p>
                        </div>
                      </div>
                      <Button asChild className="w-full bg-accent hover:bg-accent/90">
                        <Link to={`/workout-submit/${slot.id}`}>
                          <FileEdit className="mr-2 h-4 w-4" />
                          Submit Workout Plan
                        </Link>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Lead a Workout Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hand className="h-5 w-5 text-accent" />
                  Want to Lead a Workout?
                </CardTitle>
                <CardDescription>
                  Step into the arena. Lead the brothers through a 35-45 minute workout of your design.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myInterest ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-lg">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-500">You're on the interest list!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      A leader will reach out to schedule you for an upcoming workout.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleCancelInterest}
                      disabled={cancelInterest.isPending}
                    >
                      {cancelInterest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Cancel Interest
                    </Button>
                  </div>
                ) : (
                  <>
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
                      I Want to Lead
                    </Button>
                    <Dialog open={interestModalOpen} onOpenChange={setInterestModalOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Lead a Workout</DialogTitle>
                        <DialogDescription>
                          Select which dates you're available to lead. A core leader will confirm your slot.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Available Dates *</Label>
                          {openSlots.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                              No open slots available right now. Check back later!
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {openSlots.map(slot => (
                                <label
                                  key={slot.id}
                                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/5 transition-colors"
                                >
                                  <Checkbox
                                    checked={selectedDates.includes(slot.workout_date)}
                                    onCheckedChange={() => toggleDate(slot.workout_date)}
                                  />
                                  <div>
                                    <p className="font-medium">
                                      {format(new Date(slot.workout_date), 'EEEE, MMMM d, yyyy')}
                                    </p>
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
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>
                        <Button 
                          className="w-full bg-accent hover:bg-accent/90" 
                          onClick={handleExpressInterest}
                          disabled={expressInterest.isPending || openSlots.length === 0}
                        >
                          {expressInterest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Submit Interest ({selectedDates.length} selected)
                        </Button>
                      </div>
                    </DialogContent>
                    </Dialog>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Admin Link */}
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
