import { useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ExternalLink, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { useSweatpalsSchedule } from "@/hooks/useIntegrations";

const Calendar = () => {
  const {
    data: workouts = [],
    isLoading,
    isError,
    refetch,
  } = useSweatpalsSchedule({
    workoutsOnly: true,
    limit: 60,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-20 bg-subtle-gradient">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Link to="/events">
                <Button variant="ghost" className="mb-4">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Events
                </Button>
              </Link>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Workout Calendar</h1>
              <p className="text-lg text-muted-foreground">
                Upcoming workouts pulled from SweatPals. Click any card to register.
              </p>
            </div>

            <div className="bg-card p-5 rounded-lg border mb-8 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="w-4 h-4 text-accent" />
                <span>Showing workouts only</span>
                <Badge variant="secondary">SweatPals Sync</Badge>
              </div>
              <div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="h-56 bg-muted animate-pulse" />
                    <CardContent className="p-5 space-y-3">
                      <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : isError ? (
              <Card>
                <CardHeader>
                  <CardTitle>Unable to Load Workouts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    We could not load workout events from SweatPals right now.
                  </p>
                  <Button onClick={() => refetch()} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : workouts.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Upcoming Workouts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    No future workout events are in the schedule yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workouts.map((workout) => {
                  const startsAt = new Date(workout.starts_at);
                  const destinationUrl =
                    workout.checkout_url ||
                    workout.event_url ||
                    (workout.event_alias ? `https://www.sweatpals.com/event/${workout.event_alias}` : null);

                  return (
                    <Card key={`${workout.external_event_id}-${workout.starts_at}`} className="overflow-hidden border-2 hover:border-accent/60 transition-colors">
                      <div className="h-56 overflow-hidden bg-muted">
                        <img
                          src={workout.image_url || "/placeholder.svg"}
                          alt={workout.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <CardContent className="p-5 space-y-3">
                        <h3 className="text-2xl font-semibold leading-tight">{workout.title}</h3>

                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CalendarIcon className="w-4 h-4 mt-0.5" />
                          <span>
                            {format(startsAt, "EEE, MMM d")} at {format(startsAt, "h:mm a")}
                          </span>
                        </div>

                        {workout.location && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mt-0.5" />
                            <span>{workout.location}</span>
                          </div>
                        )}

                        <div className="pt-2">
                          {destinationUrl ? (
                            <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                              <a href={destinationUrl} target="_blank" rel="noreferrer">
                                View on SweatPals
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </a>
                            </Button>
                          ) : (
                            <Button disabled className="w-full">
                              Registration link unavailable
                            </Button>
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
};

export default Calendar;
