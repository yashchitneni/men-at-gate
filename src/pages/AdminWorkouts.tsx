import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  useWorkoutSlots, 
  useWorkoutInterest, 
  useCreateWorkoutSlot, 
  useAssignLeader,
  useDeleteWorkoutSlot 
} from '@/hooks/useWorkouts';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Plus, 
  Calendar, 
  User, 
  Loader2, 
  Trash2,
  UserPlus 
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function AdminWorkouts() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { data: slots, isLoading: slotsLoading } = useWorkoutSlots();
  const { data: interests, isLoading: interestsLoading } = useWorkoutInterest();
  const createSlot = useCreateWorkoutSlot();
  const assignLeader = useAssignLeader();
  const deleteSlot = useDeleteWorkoutSlot();
  const { toast } = useToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      navigate('/workouts');
    }
  }, [profile, authLoading, navigate]);

  async function handleCreateSlot() {
    if (!newDate) return;
    
    try {
      await createSlot.mutateAsync({ workoutDate: newDate });
      toast({
        title: 'Workout slot created',
        description: `Added slot for ${format(new Date(newDate), 'MMMM d, yyyy')}`,
      });
      setCreateModalOpen(false);
      setNewDate('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create slot',
        variant: 'destructive',
      });
    }
  }

  async function handleAssignLeader(leaderId: string) {
    if (!selectedSlot) return;
    
    try {
      await assignLeader.mutateAsync({ slotId: selectedSlot, leaderId });
      toast({
        title: 'Leader assigned',
        description: 'The workout has been assigned.',
      });
      setAssignModalOpen(false);
      setSelectedSlot(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign leader',
        variant: 'destructive',
      });
    }
  }

  async function handleDeleteSlot(slotId: string) {
    try {
      await deleteSlot.mutateAsync(slotId);
      toast({
        title: 'Slot deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete slot',
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

  const pendingInterests = interests?.filter(i => i.status === 'pending') || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 pb-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <Link to="/workouts" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workouts
            </Link>

            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold font-heading">Manage Workouts</h1>
              <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-accent hover:bg-accent/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Slot
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Workout Slot</DialogTitle>
                    <DialogDescription>
                      Add a new date to the workout schedule.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleCreateSlot}
                      disabled={createSlot.isPending || !newDate}
                    >
                      {createSlot.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Slot
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Workout Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Workout Schedule
                  </CardTitle>
                  <CardDescription>
                    Upcoming and past workout slots
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {slotsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : slots?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No workout slots yet. Create one to get started.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {slots?.map(slot => (
                        <div 
                          key={slot.id} 
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">
                                {format(new Date(slot.workout_date), 'EEE, MMM d, yyyy')}
                              </p>
                              {slot.leader ? (
                                <p className="text-sm text-muted-foreground">
                                  Led by {slot.leader.full_name || slot.leader.email}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">No leader assigned</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={slot.status === 'assigned' ? 'default' : 'secondary'}>
                              {slot.status}
                            </Badge>
                            {!slot.leader && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSlot(slot.id);
                                  setAssignModalOpen(true);
                                }}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSlot(slot.id)}
                              disabled={deleteSlot.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Interest List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Interest List
                    {pendingInterests.length > 0 && (
                      <Badge variant="secondary">{pendingInterests.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    People who want to lead a workout
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {interestsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : pendingInterests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No one has expressed interest yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {pendingInterests.map(interest => (
                        <div 
                          key={interest.id} 
                          className="p-3 border rounded-lg space-y-2"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {interest.profile?.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {interest.profile?.full_name || interest.profile?.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Submitted {format(new Date(interest.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          {interest.preferred_dates && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Preferred: </span>
                              {interest.preferred_dates}
                            </p>
                          )}
                          {interest.notes && (
                            <p className="text-sm text-muted-foreground">
                              {interest.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Assign Leader Modal */}
            <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Leader</DialogTitle>
                  <DialogDescription>
                    Select someone from the interest list to lead this workout.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {pendingInterests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No one on the interest list yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {pendingInterests.map(interest => (
                        <Button
                          key={interest.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleAssignLeader(interest.user_id)}
                          disabled={assignLeader.isPending}
                        >
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarFallback className="text-xs">
                              {interest.profile?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          {interest.profile?.full_name || interest.profile?.email}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>
    </div>
  );
}
