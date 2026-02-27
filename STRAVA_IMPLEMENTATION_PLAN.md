# The Arena - Strava Integration Implementation Plan

## Vision

Transform MTA's fitness tracking into "The Arena" - a competitive dashboard where brothers push each other through transparent accountability, friendly competition, and collective achievement tracking.

## Core Philosophy

- **Visibility drives accountability** - When brothers see who's crushing it and who's slacking, it motivates action
- **Competition breeds excellence** - Multiple leaderboard categories ensure everyone can win at something
- **Data tells the story** - Real numbers, real achievements, real progress
- **Community over individual** - Group stats show we're stronger together

## Implementation Phases

### Phase 1: Database & Strava OAuth Setup
**Time Estimate:** 4-6 hours

#### 1.1 Database Schema Changes

Add Strava columns to profiles table:

```sql
-- Strava integration columns
ALTER TABLE profiles ADD COLUMN strava_athlete_id bigint UNIQUE;
ALTER TABLE profiles ADD COLUMN strava_access_token text;
ALTER TABLE profiles ADD COLUMN strava_refresh_token text;
ALTER TABLE profiles ADD COLUMN strava_token_expires_at timestamptz;
ALTER TABLE profiles ADD COLUMN strava_connected_at timestamptz;
```

Create activities table:

```sql
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  strava_activity_id bigint UNIQUE NOT NULL,
  activity_type text NOT NULL, -- Run, Ride, Swim, Workout, etc.
  name text,
  distance_meters numeric,
  moving_time_seconds int,
  elapsed_time_seconds int,
  total_elevation_gain numeric,
  start_date timestamptz NOT NULL,
  average_speed numeric,
  max_speed numeric,
  average_heartrate numeric,
  max_heartrate numeric,
  calories int,
  is_manual boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_start_date ON activities(start_date);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_strava_id ON activities(strava_activity_id);
```

#### 1.2 Strava API App Registration

1. Go to https://www.strava.com/settings/api
2. Create new application:
   - Application Name: "Men in the Arena"
   - Category: "Training"
   - Website: https://meninthearena.co
   - Authorization Callback Domain: meninthearena.co
3. Save Client ID and Client Secret in Supabase secrets
4. Set required scopes: `activity:read_all`

#### 1.3 Environment Variables

```bash
VITE_STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret # Store in Supabase Edge Function secrets
```

#### 1.4 Build Connect with Strava Button

Update `src/pages/Profile.tsx`:

```typescript
// Add Strava OAuth URL generator
const getStravaAuthUrl = () => {
  const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
  const redirectUri = `${window.location.origin}/strava/callback`;
  const scope = 'activity:read_all';
  return `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${user?.id}`;
};

// In Profile component JSX:
{!profile?.strava_athlete_id ? (
  <Button
    onClick={() => window.location.href = getStravaAuthUrl()}
    className="bg-[#FC4C02] hover:bg-[#E34402]"
  >
    <Activity className="mr-2 h-4 w-4" />
    Connect with Strava
  </Button>
) : (
  <div className="flex items-center gap-2">
    <Check className="h-4 w-4 text-green-500" />
    <span>Strava Connected</span>
  </div>
)}
```

#### 1.5 OAuth Callback Handler

Create `src/pages/StravaCallback.tsx`:

```typescript
export default function StravaCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state'); // userId

    if (!code || !state) {
      toast({
        title: 'Error',
        description: 'Invalid Strava authorization',
        variant: 'destructive',
      });
      navigate('/profile');
      return;
    }

    // Exchange code for tokens via Edge Function
    fetch('/api/strava/exchange-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, userId: state }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          toast({
            title: 'Strava connected!',
            description: 'Syncing your activities...',
          });
          navigate('/profile');
        } else {
          throw new Error(data.error);
        }
      })
      .catch(err => {
        toast({
          title: 'Connection failed',
          description: err.message,
          variant: 'destructive',
        });
        navigate('/profile');
      });
  }, []);

  return <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>;
}
```

### Phase 2: Initial Activity Sync & Display
**Time Estimate:** 4-5 hours

#### 2.1 Supabase Edge Function for Token Exchange

Create `supabase/functions/strava-exchange-token/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { code, userId } = await req.json();

  // Exchange authorization code for tokens
  const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: Deno.env.get('STRAVA_CLIENT_ID'),
      client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
      code,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenResponse.json();

  // Store tokens in profile
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  await supabase
    .from('profiles')
    .update({
      strava_athlete_id: tokens.athlete.id,
      strava_access_token: tokens.access_token,
      strava_refresh_token: tokens.refresh_token,
      strava_token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
      strava_connected_at: new Date().toISOString(),
    })
    .eq('id', userId);

  // Trigger initial sync (last 30 days)
  await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/strava-sync-activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ userId }),
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### 2.2 Activity Sync Edge Function

Create `supabase/functions/strava-sync-activities/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { userId } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get user's Strava tokens
  const { data: profile } = await supabase
    .from('profiles')
    .select('strava_access_token, strava_refresh_token, strava_token_expires_at')
    .eq('id', userId)
    .single();

  // Check if token needs refresh (expires in 6 hours)
  const expiresAt = new Date(profile.strava_token_expires_at);
  const now = new Date();
  let accessToken = profile.strava_access_token;

  if (expiresAt.getTime() - now.getTime() < 6 * 60 * 60 * 1000) {
    // Refresh token
    const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: Deno.env.get('STRAVA_CLIENT_ID'),
        client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
        grant_type: 'refresh_token',
        refresh_token: profile.strava_refresh_token,
      }),
    });

    const tokens = await refreshResponse.json();
    accessToken = tokens.access_token;

    // Update tokens in database
    await supabase
      .from('profiles')
      .update({
        strava_access_token: tokens.access_token,
        strava_refresh_token: tokens.refresh_token,
        strava_token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
      })
      .eq('id', userId);
  }

  // Fetch activities from last 30 days
  const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
  const activitiesResponse = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${thirtyDaysAgo}&per_page=200`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  const activities = await activitiesResponse.json();

  // Upsert activities
  for (const activity of activities) {
    await supabase
      .from('activities')
      .upsert({
        user_id: userId,
        strava_activity_id: activity.id,
        activity_type: activity.type,
        name: activity.name,
        distance_meters: activity.distance,
        moving_time_seconds: activity.moving_time,
        elapsed_time_seconds: activity.elapsed_time,
        total_elevation_gain: activity.total_elevation_gain,
        start_date: activity.start_date,
        average_speed: activity.average_speed,
        max_speed: activity.max_speed,
        average_heartrate: activity.average_heartrate,
        max_heartrate: activity.max_heartrate,
        calories: activity.calories,
      }, {
        onConflict: 'strava_activity_id',
      });
  }

  return new Response(JSON.stringify({ success: true, synced: activities.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### 2.3 Display Recent Activities on Profile

Update `src/pages/Profile.tsx` to show recent activities:

```typescript
const { data: recentActivities } = useQuery({
  queryKey: ['activities', user?.id],
  queryFn: async () => {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(10);
    return data;
  },
  enabled: !!user?.id && !!profile?.strava_athlete_id,
});

// JSX:
{profile?.strava_athlete_id && (
  <Card>
    <CardHeader>
      <CardTitle>Recent Activities</CardTitle>
    </CardHeader>
    <CardContent>
      {recentActivities?.map(activity => (
        <div key={activity.id} className="flex justify-between py-2 border-b">
          <div>
            <p className="font-medium">{activity.name}</p>
            <p className="text-sm text-muted-foreground">
              {activity.activity_type} • {format(new Date(activity.start_date), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {(activity.distance_meters / 1609.34).toFixed(2)} mi
            </p>
            <p className="text-sm text-muted-foreground">
              {Math.floor(activity.moving_time_seconds / 60)} min
            </p>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
)}
```

### Phase 3: The Arena Dashboard - Core Stats
**Time Estimate:** 6-8 hours

#### 3.1 Create /arena Route

Create `src/pages/Arena.tsx`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, Users, Flame } from 'lucide-react';

export default function Arena() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 pb-20">
        <div className="container px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="text-5xl font-bold font-heading mb-4">
                The Arena
              </h1>
              <p className="text-xl text-muted-foreground">
                Where brothers compete, inspire, and push each other to greatness
              </p>
            </div>

            {/* Group Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Total Miles This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">1,247</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Active Brothers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">23/28</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Total Workouts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">156</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Avg Per Brother
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">54.2 mi</div>
                </CardContent>
              </Card>
            </div>

            {/* Leaderboards Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Most Miles */}
              {/* Most Consistent */}
              {/* Fastest 5K */}
              {/* Most Elevation */}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
```

#### 3.2 Database Views for Leaderboards

Create materialized views for performance:

```sql
-- Monthly stats per user
CREATE MATERIALIZED VIEW monthly_stats AS
SELECT
  user_id,
  DATE_TRUNC('month', start_date) as month,
  COUNT(*) as total_activities,
  SUM(distance_meters) / 1609.34 as total_miles,
  SUM(total_elevation_gain) * 3.28084 as total_elevation_feet,
  AVG(distance_meters) / 1609.34 as avg_distance_miles,
  COUNT(DISTINCT DATE(start_date)) as days_active,
  SUM(moving_time_seconds) / 3600 as total_hours
FROM activities
WHERE activity_type IN ('Run', 'Ride', 'Swim', 'Workout')
GROUP BY user_id, DATE_TRUNC('month', start_date);

CREATE INDEX idx_monthly_stats_user ON monthly_stats(user_id);
CREATE INDEX idx_monthly_stats_month ON monthly_stats(month);

-- Refresh schedule (run daily)
CREATE OR REPLACE FUNCTION refresh_monthly_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_stats;
END;
$$ LANGUAGE plpgsql;
```

#### 3.3 Leaderboard Query Hooks

Create `src/hooks/useArena.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMonthlyLeaderboard() {
  return useQuery({
    queryKey: ['arena', 'monthly-leaderboard'],
    queryFn: async () => {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      const { data } = await supabase
        .from('monthly_stats')
        .select(`
          *,
          profile:profiles(id, full_name, instagram_handle)
        `)
        .eq('month', currentMonth)
        .order('total_miles', { ascending: false })
        .limit(10);

      return data;
    },
  });
}

export function useConsistencyLeaderboard() {
  return useQuery({
    queryKey: ['arena', 'consistency'],
    queryFn: async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);

      const { data } = await supabase
        .from('monthly_stats')
        .select(`
          *,
          profile:profiles(id, full_name, instagram_handle)
        `)
        .eq('month', currentMonth)
        .order('days_active', { ascending: false })
        .limit(10);

      return data;
    },
  });
}

export function useFastest5K() {
  return useQuery({
    queryKey: ['arena', 'fastest-5k'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activities')
        .select(`
          *,
          profile:profiles(id, full_name, instagram_handle)
        `)
        .eq('activity_type', 'Run')
        .gte('distance_meters', 4800) // At least 3 miles
        .lte('distance_meters', 5400) // At most 3.35 miles
        .order('average_speed', { ascending: false })
        .limit(10);

      return data?.map(a => ({
        ...a,
        pace_min_per_mile: 26.8224 / a.average_speed, // Convert m/s to min/mile
      }));
    },
  });
}

export function useGroupStats() {
  return useQuery({
    queryKey: ['arena', 'group-stats'],
    queryFn: async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);

      const { data } = await supabase
        .from('monthly_stats')
        .select('*')
        .eq('month', currentMonth);

      const totalMembers = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      return {
        totalMiles: data?.reduce((sum, s) => sum + s.total_miles, 0) || 0,
        activeMembers: data?.length || 0,
        totalMembers: totalMembers.count || 0,
        totalWorkouts: data?.reduce((sum, s) => sum + s.total_activities, 0) || 0,
        avgMilesPerMember: data?.length
          ? (data.reduce((sum, s) => sum + s.total_miles, 0) / data.length)
          : 0,
      };
    },
  });
}
```

### Phase 4: Leaderboard Categories
**Time Estimate:** 3-4 hours

Build out individual leaderboard components:

```typescript
// src/components/arena/LeaderboardCard.tsx
interface LeaderboardCardProps {
  title: string;
  icon: React.ReactNode;
  data: Array<{
    rank: number;
    name: string;
    value: string;
    subtitle?: string;
  }>;
}

export function LeaderboardCard({ title, icon, data }: LeaderboardCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((entry) => (
            <div key={entry.rank} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  entry.rank === 1 ? 'bg-yellow-500' :
                  entry.rank === 2 ? 'bg-gray-400' :
                  entry.rank === 3 ? 'bg-orange-600' :
                  'bg-muted'
                }`}>
                  <span className="text-sm font-bold">{entry.rank}</span>
                </div>
                <div>
                  <p className="font-medium">{entry.name}</p>
                  {entry.subtitle && (
                    <p className="text-xs text-muted-foreground">{entry.subtitle}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{entry.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

Categories to implement:

1. **Most Miles** - Total distance this month
2. **Most Consistent** - Days with at least one activity
3. **Fastest 5K** - Best average pace on 3-3.5 mile runs
4. **Most Elevation** - Total feet climbed
5. **Early Bird** - Most activities started before 6am
6. **Most Workouts Led** - From workout_slots table

### Phase 5: Activity Feed
**Time Estimate:** 2-3 hours

Create real-time activity feed component:

```typescript
// src/components/arena/ActivityFeed.tsx
export function ActivityFeed() {
  const { data: recentActivities } = useQuery({
    queryKey: ['arena', 'activity-feed'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activities')
        .select(`
          *,
          profile:profiles(id, full_name, instagram_handle)
        `)
        .order('start_date', { ascending: false })
        .limit(20);

      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {recentActivities?.map(activity => (
            <div key={activity.id} className="flex items-start gap-3 pb-3 border-b">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {activity.profile.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{activity.profile.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {activity.activity_type}: {activity.name}
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span>{(activity.distance_meters / 1609.34).toFixed(2)} mi</span>
                  <span>{Math.floor(activity.moving_time_seconds / 60)} min</span>
                  <span>{formatDistanceToNow(new Date(activity.start_date))} ago</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Phase 6: Personal Stats Card
**Time Estimate:** 2-3 hours

Show user's personal stats and rank:

```typescript
// src/components/arena/PersonalStats.tsx
export function PersonalStats({ userId }: { userId: string }) {
  const { data: myStats } = useQuery({
    queryKey: ['arena', 'my-stats', userId],
    queryFn: async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Get user's stats
      const { data: stats } = await supabase
        .from('monthly_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .single();

      // Get user's rank
      const { data: allStats } = await supabase
        .from('monthly_stats')
        .select('total_miles')
        .eq('month', currentMonth)
        .order('total_miles', { ascending: false });

      const rank = allStats?.findIndex(s => s.total_miles <= stats?.total_miles) + 1 || 0;

      return { ...stats, rank };
    },
    enabled: !!userId,
  });

  return (
    <Card className="border-accent">
      <CardHeader>
        <CardTitle>Your Arena Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Rank</p>
            <p className="text-2xl font-bold">#{myStats?.rank || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Miles</p>
            <p className="text-2xl font-bold">{myStats?.total_miles?.toFixed(1) || '0'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Days Active</p>
            <p className="text-2xl font-bold">{myStats?.days_active || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Workouts</p>
            <p className="text-2xl font-bold">{myStats?.total_activities || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Phase 7: Callout Board
**Time Estimate:** 1-2 hours

Show who's crushing it and who needs to get moving:

```typescript
// src/components/arena/CalloutBoard.tsx
export function CalloutBoard() {
  const { data: callouts } = useQuery({
    queryKey: ['arena', 'callouts'],
    queryFn: async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      // Get all members with their stats
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, full_name');

      const { data: stats } = await supabase
        .from('monthly_stats')
        .select('*')
        .eq('month', currentMonth);

      const statsMap = new Map(stats?.map(s => [s.user_id, s]) || []);

      // Find slackers (no activity in last 7 days)
      const { data: recentActivities } = await supabase
        .from('activities')
        .select('user_id')
        .gte('start_date', lastWeek.toISOString());

      const activeUserIds = new Set(recentActivities?.map(a => a.user_id));

      const slackers = allProfiles
        ?.filter(p => !activeUserIds.has(p.id))
        .slice(0, 5) || [];

      // Find crushers (top performers this month)
      const crushers = stats
        ?.sort((a, b) => b.total_miles - a.total_miles)
        .slice(0, 5)
        .map(s => ({
          ...s,
          profile: allProfiles?.find(p => p.id === s.user_id),
        })) || [];

      return { slackers, crushers };
    },
  });

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-green-500" />
            Crushing It
          </CardTitle>
        </CardHeader>
        <CardContent>
          {callouts?.crushers.map((crusher) => (
            <div key={crusher.user_id} className="flex justify-between py-2">
              <p className="font-medium">{crusher.profile?.full_name}</p>
              <p className="text-green-500 font-bold">
                {crusher.total_miles.toFixed(1)} mi
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Get Off the Couch
          </CardTitle>
        </CardHeader>
        <CardContent>
          {callouts?.slackers.map((slacker) => (
            <div key={slacker.id} className="py-2">
              <p className="font-medium text-muted-foreground">{slacker.full_name}</p>
              <p className="text-xs text-orange-500">No activity in 7 days</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Phase 8: Webhooks & Real-time Sync
**Time Estimate:** 4-5 hours

#### 8.1 Set Up Strava Webhooks

Create `supabase/functions/strava-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Handle webhook verification
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === Deno.env.get('STRAVA_WEBHOOK_VERIFY_TOKEN')) {
      return new Response(JSON.stringify({ 'hub.challenge': challenge }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Handle activity events
  if (req.method === 'POST') {
    const event = await req.json();

    if (event.object_type === 'activity') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Find user by athlete_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, strava_access_token')
        .eq('strava_athlete_id', event.owner_id)
        .single();

      if (!profile) return new Response('OK', { status: 200 });

      if (event.aspect_type === 'create') {
        // Fetch activity details from Strava
        const activityResponse = await fetch(
          `https://www.strava.com/api/v3/activities/${event.object_id}`,
          {
            headers: { 'Authorization': `Bearer ${profile.strava_access_token}` },
          }
        );

        const activity = await activityResponse.json();

        // Insert into database
        await supabase
          .from('activities')
          .insert({
            user_id: profile.id,
            strava_activity_id: activity.id,
            activity_type: activity.type,
            name: activity.name,
            distance_meters: activity.distance,
            moving_time_seconds: activity.moving_time,
            elapsed_time_seconds: activity.elapsed_time,
            total_elevation_gain: activity.total_elevation_gain,
            start_date: activity.start_date,
            average_speed: activity.average_speed,
            max_speed: activity.max_speed,
            average_heartrate: activity.average_heartrate,
            max_heartrate: activity.max_heartrate,
            calories: activity.calories,
          });
      } else if (event.aspect_type === 'delete') {
        // Delete activity
        await supabase
          .from('activities')
          .delete()
          .eq('strava_activity_id', event.object_id);
      }
    }

    return new Response('OK', { status: 200 });
  }

  return new Response('Method not allowed', { status: 405 });
});
```

#### 8.2 Register Webhook with Strava

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=YOUR_CLIENT_ID \
  -F client_secret=YOUR_CLIENT_SECRET \
  -F callback_url=https://YOUR_PROJECT.supabase.co/functions/v1/strava-webhook \
  -F verify_token=YOUR_RANDOM_TOKEN
```

#### 8.3 Automatic Token Refresh

Create scheduled job to refresh expiring tokens:

```typescript
// supabase/functions/refresh-strava-tokens/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Find tokens expiring in next 24 hours
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, strava_refresh_token')
    .not('strava_refresh_token', 'is', null)
    .lt('strava_token_expires_at', tomorrow.toISOString());

  for (const profile of profiles || []) {
    const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: Deno.env.get('STRAVA_CLIENT_ID'),
        client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
        grant_type: 'refresh_token',
        refresh_token: profile.strava_refresh_token,
      }),
    });

    const tokens = await refreshResponse.json();

    await supabase
      .from('profiles')
      .update({
        strava_access_token: tokens.access_token,
        strava_refresh_token: tokens.refresh_token,
        strava_token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
      })
      .eq('id', profile.id);
  }

  return new Response('OK', { status: 200 });
});
```

Schedule via Supabase cron:

```sql
SELECT cron.schedule(
  'refresh-strava-tokens',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/refresh-strava-tokens',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

## Technical Stack Summary

- **Frontend:** React, TypeScript, TanStack Query, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Edge Functions, Auth)
- **External API:** Strava API v3
- **Real-time:** Supabase Realtime subscriptions (optional)
- **Caching:** Materialized views, React Query cache
- **Scheduling:** pg_cron for token refresh and stats updates

## Success Metrics

- **Adoption:** >80% of brothers connect Strava within first month
- **Engagement:** Average 3+ activities per brother per week
- **Competition:** Daily leaderboard checks, friendly trash talk in group chat
- **Accountability:** <5 brothers inactive for more than 7 days
- **Community:** Group stats show collective growth month-over-month

## Launch Sequence

1. **Week 1:** Phase 1-2 (OAuth + basic sync)
2. **Week 2:** Phase 3-4 (Arena dashboard + leaderboards)
3. **Week 3:** Phase 5-7 (Feed, personal stats, callouts)
4. **Week 4:** Phase 8 + testing (Webhooks, polish, real data)
5. **Launch:** Announce in group chat, encourage Strava connections
6. **Post-launch:** Monitor engagement, gather feedback, iterate

## Future Enhancements

- **Arena Points System:** Gamify with points for different achievements
- **Monthly Challenges:** "Run 100 miles in March" with progress tracking
- **Team Battles:** Split into teams for monthly competitions
- **Achievement Badges:** Unlock badges for milestones
- **PR Tracking:** Personal records for different distances
- **Training Plans:** Shared training plans for races
- **Social Features:** Comment on activities, kudos system
- **Mobile App:** React Native version with push notifications

---

*Built for the brotherhood. Step into the arena.*
