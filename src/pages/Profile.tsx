import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile } from '@/hooks/useProfiles';
import { useRaces } from '@/hooks/useRaces';
import { useWorkoutSlots } from '@/hooks/useWorkouts';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Save, Calendar, Trophy, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';

const SHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const updateProfile = useUpdateProfile();
  const { data: races, isLoading: racesLoading, error: racesError } = useRaces();
  const { data: workoutSlots, isLoading: slotsLoading, error: slotsError } = useWorkoutSlots();
  const { toast } = useToast();

  // Debug logging
  console.log('Profile page state:', {
    authLoading,
    hasUser: !!user,
    hasProfile: !!profile,
    racesLoading,
    slotsLoading,
    racesError: racesError?.message,
    slotsError: slotsError?.message,
  });

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [shirtSize, setShirtSize] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Populate form with profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setInstagramHandle(profile.instagram_handle || '');
      setShirtSize(profile.shirt_size || '');
    }
  }, [profile]);

  async function handleSave() {
    if (!user) return;

    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        data: {
          full_name: fullName,
          phone: phone || undefined,
          instagram_handle: instagramHandle.replace('@', '').trim() || undefined,
          shirt_size: shirtSize || undefined,
        },
      });
      await refreshProfile();
      setIsEditing(false);
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    }
  }

  // Get user's race participations
  const myRaces = races?.filter(race => 
    race.participants.some(p => p.user_id === user?.id)
  ) || [];

  // Get workouts user has led
  const myWorkouts = workoutSlots?.filter(slot => 
    slot.leader_id === user?.id
  ) || [];

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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold font-heading mb-8">My Profile</h1>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Info */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                      </CardTitle>
                      {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleSave}
                            disabled={updateProfile.isPending}
                          >
                            {updateProfile.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                    <CardDescription>
                      {profile?.email}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      {isEditing ? (
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      ) : (
                        <p className="text-lg">{profile?.full_name || '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(512) 555-1234"
                        />
                      ) : (
                        <p className="text-lg">{profile?.phone || '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            @
                          </span>
                          <Input
                            id="instagram"
                            value={instagramHandle}
                            onChange={(e) => setInstagramHandle(e.target.value)}
                            className="pl-8"
                            placeholder="yourhandle"
                          />
                        </div>
                      ) : (
                        <p className="text-lg">
                          {profile?.instagram_handle ? `@${profile.instagram_handle}` : '-'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shirtSize">T-Shirt Size</Label>
                      {isEditing ? (
                        <Select value={shirtSize} onValueChange={setShirtSize}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            {SHIRT_SIZES.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-lg">{profile?.shirt_size || '-'}</p>
                      )}
                    </div>

                    {/* Status badges */}
                    <div className="pt-4 flex gap-2">
                      {profile?.is_admin && (
                        <Badge variant="default">Admin</Badge>
                      )}
                      {profile?.is_core_member && (
                        <Badge variant="secondary">Core Member</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stats Sidebar */}
              <div className="space-y-6">
                {/* Races */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-accent" />
                      My Races
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myRaces.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No races yet</p>
                    ) : (
                      <div className="space-y-2">
                        {myRaces.slice(0, 5).map(race => (
                          <div key={race.id} className="text-sm">
                            <p className="font-medium">{race.race_name}</p>
                            <p className="text-muted-foreground">
                              {format(new Date(race.race_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        ))}
                        {myRaces.length > 5 && (
                          <p className="text-sm text-muted-foreground">
                            +{myRaces.length - 5} more
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Workouts Led */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-accent" />
                      Workouts Led
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myWorkouts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">None yet</p>
                    ) : (
                      <div className="space-y-2">
                        {myWorkouts.map(workout => (
                          <div key={workout.id} className="text-sm">
                            <p className="font-medium">
                              {format(new Date(workout.workout_date), 'MMM d, yyyy')}
                            </p>
                            {workout.theme && (
                              <p className="text-muted-foreground">{workout.theme}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Future: Strava connection will go here */}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
