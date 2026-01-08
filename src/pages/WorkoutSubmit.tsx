import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWorkoutSlots, useMyWorkoutSubmission, useSaveWorkoutSubmission } from '@/hooks/useWorkouts';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Send, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function WorkoutSubmit() {
  const { slotId } = useParams<{ slotId: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { data: slots } = useWorkoutSlots();
  const { data: existingSubmission, isLoading: submissionLoading } = useMyWorkoutSubmission(slotId || '');
  const saveSubmission = useSaveWorkoutSubmission();
  const { toast } = useToast();

  const [workoutPlan, setWorkoutPlan] = useState('');
  const [message, setMessage] = useState('');
  const [leadershipNote, setLeadershipNote] = useState('');

  // Find the slot
  const slot = slots?.find(s => s.id === slotId);

  // Redirect if not logged in or not the assigned leader
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/workouts');
      return;
    }
    if (slot && slot.leader_id !== user?.id) {
      navigate('/workouts');
      toast({
        title: 'Access denied',
        description: 'You are not assigned to this workout.',
        variant: 'destructive',
      });
    }
  }, [user, authLoading, slot, navigate, toast]);

  // Populate form with existing submission
  useEffect(() => {
    if (existingSubmission) {
      setWorkoutPlan(existingSubmission.workout_plan || '');
      setMessage(existingSubmission.message || '');
      setLeadershipNote(existingSubmission.leadership_note || '');
    }
  }, [existingSubmission]);

  async function handleSave(submit = false) {
    if (!slotId || !workoutPlan.trim()) {
      toast({
        title: 'Workout plan required',
        description: 'Please describe your workout plan.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await saveSubmission.mutateAsync({
        slotId,
        workoutPlan,
        message: message || undefined,
        leadershipNote: leadershipNote || undefined,
        status: submit ? 'submitted' : 'draft',
      });
      
      toast({
        title: submit ? 'Workout submitted!' : 'Draft saved',
        description: submit 
          ? 'Your workout has been submitted for review.' 
          : 'Your draft has been saved.',
      });

      if (submit) {
        navigate('/workouts');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save. Please try again.',
        variant: 'destructive',
      });
    }
  }

  if (authLoading || submissionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isApproved = existingSubmission?.status === 'approved';
  const isSubmitted = existingSubmission?.status === 'submitted';
  const changesRequested = existingSubmission?.status === 'changes_requested';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 pb-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <Link to="/workouts" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workouts
            </Link>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-heading">Submit Your Workout</CardTitle>
                    {slot && (
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(slot.workout_date), 'EEEE, MMMM d, yyyy')}
                      </CardDescription>
                    )}
                  </div>
                  {existingSubmission && (
                    <Badge
                      variant={
                        isApproved ? 'default' :
                        isSubmitted ? 'secondary' :
                        changesRequested ? 'destructive' :
                        'outline'
                      }
                    >
                      {isApproved ? 'Approved' : isSubmitted ? 'Submitted' : changesRequested ? 'Changes Requested' : 'Draft'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isApproved && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="text-sm text-green-500 font-medium">
                      Your workout has been approved! You're all set.
                    </p>
                  </div>
                )}

                {changesRequested && existingSubmission?.admin_feedback && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-2">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-700" />
                      <p className="text-sm text-yellow-700 font-semibold">
                        Admin has requested changes
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {existingSubmission.admin_feedback}
                    </p>
                  </div>
                )}

                {/* Workout Plan */}
                <div className="space-y-2">
                  <Label htmlFor="workoutPlan" className="text-base font-semibold">
                    1. What is the workout? *
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Describe the physical experience you're creating. Include warm-up (10 min), 
                    main workout (30-40 min), and cooldown/reflection (10-15 min).
                  </p>
                  <Textarea
                    id="workoutPlan"
                    placeholder="Example:

WARM-UP (10 min)
- 400m jog
- Dynamic stretches
- 10 burpees

MAIN WORKOUT (35 min)
- 4 rounds of:
  - 400m run
  - 20 air squats
  - 15 push-ups
  - 10 burpees
- Rest 2 min between rounds

CHALLENGE: Final 200m all-out sprint

COOLDOWN (10 min)
- Slow walk
- Static stretches
- Reflection circle"
                    value={workoutPlan}
                    onChange={(e) => setWorkoutPlan(e.target.value)}
                    className="min-h-[250px] font-mono text-sm"
                    disabled={isApproved || isSubmitted}
                  />
                </div>

                {/* Message/Intention */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-base font-semibold">
                    2. What is the message?
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    What do you want the men to take away? How does this connect to MTA's 
                    pillars of challenge, fellowship, duty, or reflection?
                  </p>
                  <Textarea
                    id="message"
                    placeholder="Example: Today's workout is about pushing through when your body wants to quit. The challenge isn't the workout itself—it's the voice in your head telling you to stop. We're here to prove that voice wrong, together."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[100px]"
                    disabled={isApproved || isSubmitted}
                  />
                </div>

                {/* Leadership Note */}
                <div className="space-y-2">
                  <Label htmlFor="leadershipNote" className="text-base font-semibold">
                    3. How are you showing up?
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Brief note on your leadership approach. How will you prepare, carry yourself, 
                    and support the brothers?
                  </p>
                  <Textarea
                    id="leadershipNote"
                    placeholder="Example: I'll arrive 20 min early to set up and greet everyone personally. During the workout, I'll run alongside and call out encouragement. At the end, I'll share a short reflection on what this workout means to me."
                    value={leadershipNote}
                    onChange={(e) => setLeadershipNote(e.target.value)}
                    className="min-h-[80px]"
                    disabled={isApproved || isSubmitted}
                  />
                </div>

                {/* Actions */}
                {!isApproved && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleSave(false)}
                      disabled={saveSubmission.isPending}
                    >
                      {saveSubmission.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Draft
                    </Button>
                    <Button
                      className="bg-accent hover:bg-accent/90"
                      onClick={() => handleSave(true)}
                      disabled={saveSubmission.isPending || !workoutPlan.trim()}
                    >
                      {saveSubmission.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      {changesRequested ? 'Resubmit for Review' : 'Submit for Review'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
