import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLeaderboard, REASON_LABELS, type LeaderboardEntry } from '@/hooks/useLeaderboard';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Flame, ArrowLeft, Crown } from 'lucide-react';

type TimeFilter = 'week' | 'month' | 'all';

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
  if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
  return <span className="text-lg font-bold text-muted-foreground w-6 text-center">{rank}</span>;
}

function getRankBg(rank: number) {
  if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/30';
  if (rank === 2) return 'bg-gray-400/10 border-gray-400/30';
  if (rank === 3) return 'bg-amber-600/10 border-amber-600/30';
  return 'bg-background border-border';
}

export default function Leaderboard() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const { data: entries = [], isLoading } = useLeaderboard(timeFilter);

  const hasData = entries.length > 0 && entries.some(e => e.total_points > 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 pb-20">
        <div className="container px-4">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Home
          </Link>

          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="h-10 w-10 text-accent" />
              <h1 className="font-heading text-4xl md:text-5xl font-black uppercase tracking-tight">
                Leaderboard
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Who's putting in the work?
            </p>
          </motion.div>

          {/* Time Filter */}
          <div className="flex justify-center mb-8">
            <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
              <TabsList>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Leaderboard */}
          <div className="max-w-2xl mx-auto">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : !hasData ? (
              <motion.div 
                className="text-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Flame className="h-16 w-16 text-accent/30 mx-auto mb-4" />
                <h2 className="text-xl font-heading font-bold mb-2">No points yet</h2>
                <p className="text-muted-foreground mb-6">
                  Points are earned by leading workouts, attending sessions, and completing races.
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-sm">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="font-bold text-accent text-lg">50</div>
                    <div className="text-muted-foreground">Lead Workout</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="font-bold text-accent text-lg">20</div>
                    <div className="text-muted-foreground">Attend</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="font-bold text-accent text-lg">30</div>
                    <div className="text-muted-foreground">Race</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="font-bold text-accent text-lg">50</div>
                    <div className="text-muted-foreground">Podium</div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {entries.filter(e => e.total_points > 0).map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={`/men/${entry.id}`}>
                      <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${getRankBg(index + 1)}`}>
                        <div className="flex items-center justify-center w-10">
                          {getRankIcon(index + 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-heading font-bold text-lg truncate">
                            {entry.full_name || 'Anonymous'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {entry.activities_count} activities
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-heading text-2xl font-black text-accent">
                            {entry.total_points}
                          </div>
                          <div className="text-xs text-muted-foreground">pts</div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
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
