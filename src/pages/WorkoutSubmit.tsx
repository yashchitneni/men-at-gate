import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  useMyWorkoutAssignment,
  useMyWorkoutSubmission,
  useSaveWorkoutSubmission,
  useWorkoutGuide,
} from '@/hooks/useWorkouts';
import { parseLeaderGuideContent } from '@/lib/workoutGuides';
import { AuthModal } from '@/components/AuthModal';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Send, Calendar, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export default function WorkoutSubmit() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: assignment, isLoading: assignmentLoading } = useMyWorkoutAssignment(assignmentId || '');
  const { data: existingSubmission, isLoading: submissionLoading } = useMyWorkoutSubmission(assignmentId || '');
  const { data: leaderGuide } = useWorkoutGuide('leader_guidelines', !!assignmentId && !!user);
  const saveSubmission = useSaveWorkoutSubmission();
  const { toast } = useToast();

  const [workoutPlan, setWorkoutPlan] = useState('');
  const [message, setMessage] = useState('');
  const [leadershipNote, setLeadershipNote] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      setAuthModalOpen(true);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading || assignmentLoading) return;
    if (!assignmentId) {
      navigate('/workouts');
      return;
    }
    if (!assignment) {
      navigate('/workouts');
      toast({
        title: 'Access denied',
        description: 'You are not assigned to this workout.',
        variant: 'destructive',
      });
    }
  }, [assignment, assignmentId, assignmentLoading, authLoading, navigate, toast]);

  useEffect(() => {
    if (existingSubmission) {
      setWorkoutPlan(existingSubmission.workout_plan || '');
      setMessage(existingSubmission.message || '');
      setLeadershipNote(existingSubmission.leadership_note || '');
    }
  }, [existingSubmission]);

  async function handleSave(submit = false) {
    if (!assignmentId || !workoutPlan.trim()) {
      toast({
        title: 'Workout plan required',
        description: 'Please describe your workout plan.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await saveSubmission.mutateAsync({
        assignmentId,
        workoutPlan,
        message: message || undefined,
        leadershipNote: leadershipNote || undefined,
        status: submit ? 'submitted' : 'draft',
      });

      toast({
        title: submit ? 'Workout submitted!' : 'Draft saved',
        description: submit ? 'Your workout has been submitted for review.' : 'Your draft has been saved.',
      });

      if (submit) {
        navigate('/workouts');
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save. Please try again.',
        variant: 'destructive',
      });
    }
  }

  const leaderGuideContent = useMemo(
    () => parseLeaderGuideContent(leaderGuide?.content_json),
    [leaderGuide?.content_json],
  );

  if (authLoading || assignmentLoading || submissionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <section className="pt-24 pb-20">
          <div className="container px-4">
            <div className="max-w-md mx-auto text-center space-y-4">
              <h1 className="text-2xl font-bold font-heading">Sign in to continue</h1>
              <p className="text-muted-foreground">
                You need to sign in to access your workout assignment.
              </p>
              <Button className="bg-accent hover:bg-accent/90" onClick={() => setAuthModalOpen(true)}>
                Sign In
              </Button>
            </div>
          </div>
        </section>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
        <Footer />
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
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-heading">Submit Your Workout</CardTitle>
                    {assignment?.schedule_event && (
                      <CardDescription className="space-y-1 mt-2">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(assignment.schedule_event.starts_at), 'EEEE, MMMM d, yyyy h:mm a')}
                        </span>
                        {assignment.schedule_event.location && (
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {assignment.schedule_event.location}
                          </span>
                        )}
                      </CardDescription>
                    )}
                  </div>
                  {existingSubmission && (
                    <Badge
                      variant={
                        isApproved
                          ? 'default'
                          : isSubmitted
                            ? 'secondary'
                            : changesRequested
                              ? 'destructive'
                              : 'outline'
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
                      Your workout has been approved. You&apos;re all set.
                    </p>
                  </div>
                )}

                {changesRequested && existingSubmission?.admin_feedback && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-2">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-700" />
                      <p className="text-sm text-yellow-700 font-semibold">Admin has requested changes</p>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{existingSubmission.admin_feedback}</p>
                  </div>
                )}

                <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="font-semibold">Leader Brief</p>
                      <p className="text-sm text-muted-foreground">{leaderGuideContent.purpose}</p>
                    </div>
                    {leaderGuide?.updated_at && (
                      <Badge variant="outline">Updated {format(new Date(leaderGuide.updated_at), 'MMM d, yyyy')}</Badge>
                    )}
                  </div>

                  <Accordion
                    type="single"
                    collapsible
                    defaultValue={leaderGuideContent.sections[0]?.id}
                  >
                    {leaderGuideContent.sections.map((section) => (
                      <AccordionItem key={section.id} value={section.id}>
                        <AccordionTrigger className="text-left">{section.title}</AccordionTrigger>
                        <AccordionContent className="space-y-3">
                          <p className="text-sm text-muted-foreground">{section.summary}</p>
                          {section.checklist.length > 0 && (
                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Checklist</p>
                              <ul className="space-y-1 text-sm text-muted-foreground">
                                {section.checklist.map((item, index) => (
                                  <li key={`${section.id}-item-${index}`}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {section.success_criteria.length > 0 && (
                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Success Criteria</p>
                              <ul className="space-y-1 text-sm text-muted-foreground">
                                {section.success_criteria.map((item, index) => (
                                  <li key={`${section.id}-success-${index}`}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workoutPlan" className="text-base font-semibold">
                    1. What is the workout? *
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Describe the physical experience you&apos;re creating. Include warm-up (10 min), main workout (30-40 min), and cooldown/reflection (10-15 min).
                  </p>
                  <Textarea
                    id="workoutPlan"
                    placeholder={`Example:\n\nWARM-UP (10 min)\n- 400m jog\n- Dynamic stretches\n- 10 burpees\n\nMAIN WORKOUT (35 min)\n- 4 rounds of:\n  - 400m run\n  - 20 air squats\n  - 15 push-ups\n  - 10 burpees\n- Rest 2 min between rounds\n\nCHALLENGE: Final 200m all-out sprint\n\nCOOLDOWN (10 min)\n- Slow walk\n- Static stretches\n- Reflection circle`}
                    value={workoutPlan}
                    onChange={(event) => setWorkoutPlan(event.target.value)}
                    className="min-h-[250px] font-mono text-sm"
                    disabled={isApproved || isSubmitted}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-base font-semibold">
                    2. What is the message?
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    What do you want the men to take away? How does this connect to MTA&apos;s pillars of challenge, fellowship, duty, or reflection?
                  </p>
                  <Textarea
                    id="message"
                    placeholder="Example: Today's workout is about pushing through when your body wants to quit..."
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className="min-h-[100px]"
                    disabled={isApproved || isSubmitted}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadershipNote" className="text-base font-semibold">
                    3. How are you showing up?
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Brief note on your leadership approach. How will you prepare, carry yourself, and support the brothers?
                  </p>
                  <Textarea
                    id="leadershipNote"
                    placeholder="Example: I'll arrive 20 min early to set up and greet everyone personally..."
                    value={leadershipNote}
                    onChange={(event) => setLeadershipNote(event.target.value)}
                    className="min-h-[80px]"
                    disabled={isApproved || isSubmitted}
                  />
                </div>

                {!isApproved && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => handleSave(false)} disabled={saveSubmission.isPending}>
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
