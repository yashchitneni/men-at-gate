import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, MapPin, ExternalLink, Users, ChevronDown, ChevronUp, Instagram, Loader2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { RaceWithParticipants } from '@/types/database.types';

interface RaceCardProps {
  race: RaceWithParticipants;
  currentUserId?: string;
  onJoin: (raceId: string, options: { carpool: boolean; lodging: boolean }) => void;
  onLeave: (raceId: string) => void;
  isJoining: boolean;
  isLeaving: boolean;
}

const distanceColors: Record<string, string> = {
  '5K': 'bg-blue-500',
  '10K': 'bg-green-500',
  'Half Marathon': 'bg-orange-500',
  'Marathon': 'bg-red-500',
  'Ultra (50K)': 'bg-purple-500',
  'Ultra (50M)': 'bg-purple-600',
  'Ultra (100K)': 'bg-purple-700',
  'Ultra (100M)': 'bg-purple-800',
  'Triathlon - Sprint': 'bg-cyan-500',
  'Triathlon - Olympic': 'bg-cyan-600',
  'Triathlon - 70.3': 'bg-cyan-700',
  'Triathlon - Ironman': 'bg-cyan-800',
  'HYROX': 'bg-yellow-600',
  'Spartan/OCR': 'bg-amber-600',
};

export function RaceCard({ race, currentUserId, onJoin, onLeave, isJoining, isLeaving }: RaceCardProps) {
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [carpoolChecked, setCarpoolChecked] = useState(false);
  const [lodgingChecked, setLodgingChecked] = useState(false);

  const isParticipating = race.participants.some(p => p.user_id === currentUserId);
  const myParticipation = race.participants.find(p => p.user_id === currentUserId);

  const visibleParticipants = race.participants.slice(0, 5);
  const participantNames = race.participants
    .map(p => p.profile?.full_name || 'Anonymous')
    .slice(0, 4)
    .join(' · ');
  const remainingCount = Math.max(0, race.participants.length - 4);

  const badgeColor = distanceColors[race.distance_type] || 'bg-gray-500';

  const handleJoinClick = () => {
    onJoin(race.id, {
      carpool: carpoolChecked,
      lodging: lodgingChecked,
    });
  };

  return (
    <Card className="overflow-hidden hover:border-accent/50 transition-colors">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl mb-2 break-words">{race.race_name}</CardTitle>
            <Badge className={`${badgeColor} text-white border-0`}>
              {race.distance_type}
            </Badge>
          </div>
          {race.registration_url && (
            <Button variant="ghost" size="icon" asChild className="shrink-0">
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
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="font-medium">
              {format(new Date(race.race_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{race.location}</span>
          </div>
        </div>

        {/* Description */}
        {race.description && (
          <p className="text-sm text-muted-foreground">{race.description}</p>
        )}

        {/* Participants Section */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {race.participants.length} {race.participants.length === 1 ? 'brother' : 'brothers'} going
            </span>
          </div>

          {race.participants.length > 0 && (
            <>
              {/* Avatar Stack */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex -space-x-2">
                  {visibleParticipants.map((p) => (
                    <Avatar key={p.id} className="h-8 w-8 border-2 border-background">
                      <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                        {p.profile?.full_name?.charAt(0) || '?'}
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

              {/* Participant Names */}
              <div className="text-sm text-muted-foreground mb-2">
                {participantNames}
                {remainingCount > 0 && ` + ${remainingCount} more`}
              </div>

              {/* Expandable Full List */}
              <Collapsible open={showAllParticipants} onOpenChange={setShowAllParticipants}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                    {showAllParticipants ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Hide details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show all
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-3">
                  <div className="space-y-2">
                    {race.participants.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="text-xs">
                              {p.profile?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {p.profile?.full_name || 'Anonymous'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {p.open_to_carpool && <span>🚗 Carpool</span>}
                              {p.open_to_split_lodging && <span>🏠 Lodging</span>}
                            </div>
                          </div>
                        </div>
                        {p.profile?.instagram_handle && (
                          <a
                            href={`https://instagram.com/${p.profile.instagram_handle.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-accent transition-colors shrink-0"
                          >
                            <Instagram className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </div>

        {/* Action Section */}
        <div className="pt-4 border-t">
          {isParticipating ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <span className="text-lg">✓</span>
                You're going
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={myParticipation?.open_to_carpool || false}
                    disabled
                  />
                  <span className="text-sm">Open to carpool</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={myParticipation?.open_to_split_lodging || false}
                    disabled
                  />
                  <span className="text-sm">Open to split lodging</span>
                </label>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onLeave(race.id)}
                disabled={isLeaving}
                className="text-xs"
              >
                {isLeaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Leave
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                className="w-full bg-accent hover:bg-accent/90"
                onClick={handleJoinClick}
                disabled={isJoining}
              >
                {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                I'm Going!
              </Button>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Optional:</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={carpoolChecked}
                    onCheckedChange={(checked) => setCarpoolChecked(!!checked)}
                  />
                  <span className="text-sm">Open to carpool</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={lodgingChecked}
                    onCheckedChange={(checked) => setLodgingChecked(!!checked)}
                  />
                  <span className="text-sm">Open to split lodging</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
