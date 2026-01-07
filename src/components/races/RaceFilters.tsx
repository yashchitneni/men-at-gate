import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RaceFiltersProps {
  distanceTypes: string[];
  selectedDistance: string | null;
  onDistanceChange: (type: string | null) => void;
  raceCount: number;
}

export function RaceFilters({
  distanceTypes,
  selectedDistance,
  onDistanceChange,
  raceCount,
}: RaceFiltersProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={selectedDistance === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => onDistanceChange(null)}
          className={selectedDistance === null ? 'bg-accent hover:bg-accent/90' : ''}
        >
          All Types
        </Button>

        {distanceTypes.map((type) => (
          <Button
            key={type}
            variant={selectedDistance === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDistanceChange(type)}
            className={selectedDistance === type ? 'bg-accent hover:bg-accent/90' : ''}
          >
            {type}
          </Button>
        ))}

        <Badge variant="secondary" className="ml-auto">
          {raceCount} {raceCount === 1 ? 'race' : 'races'}
        </Badge>
      </div>
    </div>
  );
}
