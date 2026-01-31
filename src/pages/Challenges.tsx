import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useChallenges, type Challenge } from '@/hooks/useChallenges';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowLeft, Target, Calendar, Flame, Trophy, Loader2 } from 'lucide-react';

function getStatus(c: Challenge): 'active' | 'upcoming' | 'completed' {
  const today = new Date().toISOString().split('T')[0];
  if (c.end_date < today) return 'completed';
  if (c.start_date > today) return 'upcoming';
  return 'active';
}

const statusColors = {
  active: 'bg-green-500/10 text-green-600 border-green-500/30',
  upcoming: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  completed: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
};

export default function Challenges() {
  const { data: challenges = [], isLoading } = useChallenges();

  const grouped = useMemo(() => {
    const active: Challenge[] = [];
    const upcoming: Challenge[] = [];
    const completed: Challenge[] = [];
    for (const c of challenges) {
      const status = getStatus(c);
      if (status === 'active') active.push(c);
      else if (status === 'upcoming') upcoming.push(c);
      else completed.push(c);
    }
    return { active, upcoming, completed };
  }, [challenges]);

  const hasAny = challenges.length > 0;

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
              <Target className="h-10 w-10 text-accent" />
              <h1 className="font-heading text-4xl md:text-5xl font-black uppercase tracking-tight">
                Challenges
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Push your limits. Together.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : !hasAny ? (
            <motion.div 
              className="text-center py-16 max-w-md mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Flame className="h-16 w-16 text-accent/30 mx-auto mb-4" />
              <h2 className="text-xl font-heading font-bold mb-2">No challenges yet</h2>
              <p className="text-muted-foreground">
                Challenges will be posted here when they go live. 
                Think daily push-up goals, weekly mileage targets, or month-long commitments.
              </p>
            </motion.div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-10">
              {/* Active */}
              {grouped.active.length > 0 && (
                <div>
                  <h2 className="font-heading text-2xl font-bold flex items-center gap-2 mb-4">
                    <Flame className="h-5 w-5 text-green-500" /> Active
                  </h2>
                  <div className="space-y-4">
                    {grouped.active.map((c, i) => (
                      <ChallengeCard key={c.id} challenge={c} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              {grouped.upcoming.length > 0 && (
                <div>
                  <h2 className="font-heading text-2xl font-bold flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-blue-500" /> Upcoming
                  </h2>
                  <div className="space-y-4">
                    {grouped.upcoming.map((c, i) => (
                      <ChallengeCard key={c.id} challenge={c} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed */}
              {grouped.completed.length > 0 && (
                <div>
                  <h2 className="font-heading text-2xl font-bold flex items-center gap-2 mb-4">
                    <Trophy className="h-5 w-5 text-gray-500" /> Completed
                  </h2>
                  <div className="space-y-4">
                    {grouped.completed.map((c, i) => (
                      <ChallengeCard key={c.id} challenge={c} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ChallengeCard({ challenge, index }: { challenge: Challenge; index: number }) {
  const status = getStatus(challenge);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={statusColors[status]}>
              {status}
            </Badge>
            {challenge.metric && (
              <Badge variant="secondary">{challenge.metric}</Badge>
            )}
          </div>
          <CardTitle className="font-heading text-xl">{challenge.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {challenge.description && (
            <p className="text-muted-foreground mb-3">{challenge.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {new Date(challenge.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' — '}
              {new Date(challenge.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            {challenge.target_value && (
              <span>Target: {challenge.target_value} {challenge.metric}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
