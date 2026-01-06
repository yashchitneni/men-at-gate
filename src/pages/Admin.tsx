import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWorkoutSlots, useWorkoutInterest } from '@/hooks/useWorkouts';
import { useRaces } from '@/hooks/useRaces';
import { useAllProfiles } from '@/hooks/useProfiles';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Dumbbell, 
  Users, 
  Trophy, 
  Calendar,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';

export default function Admin() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { data: workoutSlots, isLoading: slotsLoading } = useWorkoutSlots();
  const { data: workoutInterest, isLoading: interestLoading } = useWorkoutInterest();
  const { data: races, isLoading: racesLoading } = useRaces();
  const { data: allProfiles, isLoading: profilesLoading } = useAllProfiles();

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      navigate('/');
    }
  }, [profile, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isLoading = slotsLoading || interestLoading || racesLoading || profilesLoading;

  // Calculate stats
  const today = new Date();
  const upcomingWorkouts = workoutSlots?.filter(s => 
    isAfter(new Date(s.workout_date), today) || 
    format(new Date(s.workout_date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  ) || [];
  const pendingInterest = workoutInterest?.filter(i => i.status === 'pending') || [];
  const unassignedSlots = upcomingWorkouts.filter(s => !s.leader_id);
  const upcomingRaces = races?.length || 0;
  const totalMembers = allProfiles?.length || 0;
  const coreMembers = allProfiles?.filter(p => p.is_core_member).length || 0;

  // Get next workout
  const nextWorkout = upcomingWorkouts[0];
  const needsAttention = unassignedSlots.length > 0 || pendingInterest.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 pb-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold font-heading mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage MTA workouts, members, and races.
              </p>
            </div>

            {/* Alert Banner */}
            {needsAttention && (
              <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-accent" />
                <div className="flex-1">
                  {unassignedSlots.length > 0 && (
                    <span className="text-sm">
                      {unassignedSlots.length} workout slot{unassignedSlots.length > 1 ? 's' : ''} need a leader.
                    </span>
                  )}
                  {unassignedSlots.length > 0 && pendingInterest.length > 0 && ' '}
                  {pendingInterest.length > 0 && (
                    <span className="text-sm">
                      {pendingInterest.length} pending interest request{pendingInterest.length > 1 ? 's' : ''}.
                    </span>
                  )}
                </div>
                <Button size="sm" asChild>
                  <Link to="/admin/workouts">View</Link>
                </Button>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Upcoming Workouts</p>
                      <p className="text-3xl font-bold">{upcomingWorkouts.length}</p>
                    </div>
                    <Dumbbell className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Interest</p>
                      <p className="text-3xl font-bold">{pendingInterest.length}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Races</p>
                      <p className="text-3xl font-bold">{upcomingRaces}</p>
                    </div>
                    <Trophy className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Members</p>
                      <p className="text-3xl font-bold">{totalMembers}</p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Management Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Workouts */}
              <Card className="hover:border-accent/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-accent" />
                    Manage Workouts
                  </CardTitle>
                  <CardDescription>
                    Schedule workout slots, assign leaders, review submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {nextWorkout && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Next Workout</p>
                      <p className="font-medium">
                        {format(new Date(nextWorkout.workout_date), 'EEE, MMM d')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={nextWorkout.leader_id ? 'default' : 'secondary'}>
                          {nextWorkout.leader_id ? 'Assigned' : 'Needs Leader'}
                        </Badge>
                      </div>
                    </div>
                  )}
                  <Button className="w-full" asChild>
                    <Link to="/admin/workouts">
                      Go to Workouts
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Members */}
              <Card className="hover:border-accent/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" />
                    Manage Members
                  </CardTitle>
                  <CardDescription>
                    View all members, set core members, manage admins
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{totalMembers}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{coreMembers}</p>
                        <p className="text-xs text-muted-foreground">Core</p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <Link to="/admin/members">
                      Go to Members
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Races */}
              <Card className="hover:border-accent/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-accent" />
                    Manage Races
                  </CardTitle>
                  <CardDescription>
                    View race board, edit races, see participation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Upcoming Races</p>
                    <p className="text-2xl font-bold">{upcomingRaces}</p>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <Link to="/races">
                      Go to Races
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
