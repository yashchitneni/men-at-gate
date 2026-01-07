import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRaces, useJoinRace, useLeaveRace } from '@/hooks/useRaces';
import { AuthModal } from '@/components/AuthModal';
import { RaceCard, RaceFilters } from '@/components/races';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';

export default function Races() {
  const { user } = useAuth();
  const { data: races, isLoading, error } = useRaces();
  const joinRace = useJoinRace();
  const leaveRace = useLeaveRace();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [distanceFilter, setDistanceFilter] = useState<string | null>(null);

  const distanceTypes = useMemo(() => {
    if (!races) return [];
    return [...new Set(races.map(r => r.distance_type))].sort();
  }, [races]);

  const filteredRaces = useMemo(() => {
    if (!races) return [];
    if (!distanceFilter) return races;
    return races.filter(r => r.distance_type === distanceFilter);
  }, [races, distanceFilter]);

  const handleJoin = (raceId: string, options: { carpool: boolean; lodging: boolean }) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    joinRace.mutate({
      userId: user.id,
      raceId,
      openToCarpool: options.carpool,
      openToSplitLodging: options.lodging,
    });
  };

  const handleLeave = (raceId: string) => {
    if (!user) return;
    leaveRace.mutate({ userId: user.id, raceId });
  };

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
                  See what races MTA brothers are running. Join them and connect directly via Instagram.
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

            {/* Filters */}
            {!isLoading && !error && races && races.length > 0 && (
              <RaceFilters
                distanceTypes={distanceTypes}
                selectedDistance={distanceFilter}
                onDistanceChange={setDistanceFilter}
                raceCount={filteredRaces.length}
              />
            )}

            {/* Race List */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-1/2 mb-6" />
                    <Skeleton className="h-20 w-full" />
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
            ) : filteredRaces.length === 0 ? (
              <Card className="p-12 text-center">
                <h3 className="text-xl font-semibold mb-2">No races found</h3>
                <p className="text-muted-foreground mb-6">
                  Try selecting a different distance type.
                </p>
                <Button onClick={() => setDistanceFilter(null)}>
                  Show All Races
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredRaces.map((race) => (
                  <RaceCard
                    key={race.id}
                    race={race}
                    currentUserId={user?.id}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    isJoining={joinRace.isPending}
                    isLeaving={leaveRace.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
