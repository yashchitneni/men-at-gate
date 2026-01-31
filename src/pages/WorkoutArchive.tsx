import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkoutSlots } from '@/hooks/useWorkouts';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, Star, Loader2 } from 'lucide-react';

export default function WorkoutArchive() {
  const { data: slots, isLoading } = useWorkoutSlots();

  // Filter to past workouts
  const today = new Date().toISOString().split('T')[0];
  const pastWorkouts = (slots || [])
    .filter(s => s.workout_date < today)
    .sort((a, b) => b.workout_date.localeCompare(a.workout_date));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 pb-20">
        <div className="container px-4">
          <Link to="/workouts" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workouts
          </Link>

          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-heading text-4xl md:text-5xl font-black uppercase tracking-tight">
              Workout <span className="text-accent">Archive</span>
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              Every session that shaped us
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : pastWorkouts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No past workouts yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastWorkouts.map((workout, index) => (
                <motion.div
                  key={workout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {new Date(workout.workout_date + 'T00:00:00').toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-heading">
                        {workout.theme || 'Morning Workout'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {workout.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {workout.description}
                        </p>
                      )}
                      {workout.leader_id && (
                        <div className="flex items-center gap-2 text-sm text-accent">
                          <User className="h-4 w-4" />
                          <span>Led by a brother</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
