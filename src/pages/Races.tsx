import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRaces, useJoinRace, useLeaveRace } from '@/hooks/useRaces';
import { AuthModal } from '@/components/AuthModal';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  MapPin,
  Users,
  Car,
  Home,
  ExternalLink,
  Plus,
  Loader2,
  Instagram,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { format } from 'date-fns';

export default function Races() {
  const { user, loading: authLoading } = useAuth();
  const { data: races, isLoading, error } = useRaces();
  const joinRace = useJoinRace();
  const leaveRace = useLeaveRace();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [expandedRaces, setExpandedRaces] = useState<string[]>([]);
  const [joinOptions, setJoinOptions] = useState<{ [key: string]: { carpool: boolean; lodging: boolean } }>({});

  function toggleExpanded(raceId: string) {
    setExpandedRaces(prev => 
      prev.includes(raceId) 
        ? prev.filter(id => id !== raceId)
        : [...prev, raceId]
    );
  }

  function handleJoinClick(raceId: string) {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    console.log('🟡 handleJoinClick called', { userId: user.id, raceId });
    const options = joinOptions[raceId] || { carpool: false, lodging: false };
    joinRace.mutate({
      userId: user.id,
      raceId,
      openToCarpool: options.carpool,
      openToSplitLodging: options.lodging,
    });
  }

  function handleLeaveClick(raceId: string) {
    if (!user) return;
    leaveRace.mutate({ userId: user.id, raceId });
  }

  function isUserParticipating(race: NonNullable<typeof races>[0]) {
    return race.participants.some((p) => p.user_id === user?.id);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      <section className="pt-24 pb-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Race Board</h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  See what races MTA brothers are running. Join them, coordinate carpools,
                  and push each other to new limits.
                </p>
              </div>
              <div className="mt-6 md:mt-0">
                {user ? (
                  <Button asChild size="lg" className="bg-accent hover:bg-accent/90">
                    <Link to="/races/submit">
                      <Plus className="mr-2 h-5 w-5" />
                      Submit a Race
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="bg-accent hover:bg-accent/90"
                    onClick={() => setAuthModalOpen(true)}
                  >
                    Sign in to Submit
                  </Button>
                )}
              </div>
            </div>

            {/* Race List */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="p-8 text-center">
                <p className="text-destructive">Error loading races. Please try again.</p>
              </Card>
            ) : races?.length === 0 ? (
              <Card className="p-12 text-center">
                <h3 className="text-xl font-semibold mb-2">No upcoming races yet</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to submit a race and rally the brothers!
                </p>
                {user && (
                  <Button asChild>
                    <Link to="/races/submit">Submit a Race</Link>
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {races?.map((race) => {
                  const isParticipating = isUserParticipating(race);
                  const carpoolCount = race.participants.filter((p) => p.open_to_carpool).length;
                  const lodgingCount = race.participants.filter((p) => p.open_to_split_lodging).length;

                  return (
                    <Card key={race.id} className="overflow-hidden hover:border-accent/50 transition-colors">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl mb-1">{race.race_name}</CardTitle>
                            <CardDescription>
                              <Badge variant="secondary" className="mr-2">
                                {race.distance_type}
                              </Badge>
                            </CardDescription>
                          </div>
                          {race.registration_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={race.registration_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Date & Location */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(race.race_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {race.location}
                          </div>
                        </div>

                        {/* Description */}
                        {race.description && (
                          <p className="text-sm text-muted-foreground">{race.description}</p>
                        )}

                        {/* Participants */}
                        <div className="pt-4 border-t">
                          <Collapsible 
                            open={expandedRaces.includes(race.id)} 
                            onOpenChange={() => toggleExpanded(race.id)}
                          >
                            <CollapsibleTrigger className="w-full">
                              <div className="flex items-center justify-between mb-3 cursor-pointer hover:bg-accent/5 -mx-2 px-2 py-1 rounded transition-colors">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    {race.participants.length} going
                                  </span>
                                  {expandedRaces.includes(race.id) ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {carpoolCount > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Car className="h-3 w-3" />
                                      {carpoolCount}
                                    </span>
                                  )}
                                  {lodgingCount > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Home className="h-3 w-3" />
                                      {lodgingCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CollapsibleTrigger>

                            {/* Collapsed: Show avatars */}
                            {!expandedRaces.includes(race.id) && race.participants.length > 0 && (
                              <div className="flex items-center gap-2 mb-4">
                                <div className="flex -space-x-2">
                                  {race.participants.slice(0, 5).map((p) => (
                                    <Avatar key={p.id} className="h-8 w-8 border-2 border-background">
                                      <AvatarFallback className="text-xs">
                                        {p.profile?.full_name?.charAt(0) || p.profile?.email?.charAt(0) || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                </div>
                                {race.participants.length > 5 && (
                                  <span className="text-sm text-muted-foreground">
                                    +{race.participants.length - 5} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Expanded: Show full list */}
                            <CollapsibleContent>
                              <div className="space-y-2 mb-4">
                                {race.participants.map((p) => (
                                  <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">
                                          {p.profile?.full_name?.charAt(0) || '?'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="text-sm font-medium">
                                          {p.profile?.full_name || 'Anonymous'}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          {p.open_to_carpool && (
                                            <span className="flex items-center gap-1">
                                              <Car className="h-3 w-3" /> Carpool
                                            </span>
                                          )}
                                          {p.open_to_split_lodging && (
                                            <span className="flex items-center gap-1">
                                              <Home className="h-3 w-3" /> Lodging
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {p.profile?.instagram_handle && (
                                      <a
                                        href={`https://instagram.com/${p.profile.instagram_handle.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-accent transition-colors"
                                      >
                                        <Instagram className="h-4 w-4" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>

                          {/* Action Button */}
                          {isParticipating ? (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => handleLeaveClick(race.id)}
                              disabled={leaveRace.isPending}
                            >
                              {leaveRace.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              I'm No Longer Going
                            </Button>
                          ) : (
                            <div className="space-y-3">
                              {/* Carpool/Lodging options */}
                              <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground font-medium">I'm open to:</p>
                                <div className="flex gap-4">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                      checked={joinOptions[race.id]?.carpool || false}
                                      onCheckedChange={(checked) => 
                                        setJoinOptions(prev => ({
                                          ...prev,
                                          [race.id]: { ...prev[race.id], carpool: !!checked }
                                        }))
                                      }
                                    />
                                    <span className="text-sm flex items-center gap-1">
                                      <Car className="h-3 w-3" /> Carpool
                                    </span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                      checked={joinOptions[race.id]?.lodging || false}
                                      onCheckedChange={(checked) => 
                                        setJoinOptions(prev => ({
                                          ...prev,
                                          [race.id]: { ...prev[race.id], lodging: !!checked }
                                        }))
                                      }
                                    />
                                    <span className="text-sm flex items-center gap-1">
                                      <Home className="h-3 w-3" /> Split Lodging
                                    </span>
                                  </label>
                                </div>
                              </div>
                              <Button
                                className="w-full"
                                onClick={() => handleJoinClick(race.id)}
                                disabled={joinRace.isPending}
                              >
                                {joinRace.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                I'm Going!
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
