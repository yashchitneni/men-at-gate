import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { eventCards } from "@/data/events";
import { useFeaturedEvents } from "@/hooks/useFeaturedEvents";

export default function EventsIndex() {
  const { data: featuredEvents } = useFeaturedEvents();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const cards = useMemo(() => {
    const featuredCards =
      featuredEvents && featuredEvents.length
        ? featuredEvents.map((event) => ({
            slug: event.slug,
            title: event.title,
            category: event.is_active ? "Featured" : "Event",
            dateLabel: event.event_date_text || "Date TBA",
            location: "See event details",
            summary:
              event.summary ||
              event.subtitle ||
              "Step into the arena and move with the brotherhood.",
            image: event.image_url || eventCards[0].image,
            path: event.event_path,
            featured: event.is_active,
          }))
        : [eventCards[0]];

    const staticCards = eventCards.filter((event) => event.slug !== "marathon-ruck");
    return [...featuredCards, ...staticCards];
  }, [featuredEvents]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 pb-20 bg-subtle-gradient">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-heading font-black uppercase tracking-tight mb-4">
                Events
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Big moments, hard challenges, and brotherhood on mission. Start with the featured event, then explore what is next.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {cards.map((event) => (
                <Card key={`${event.slug}-${event.path}`} className="overflow-hidden border-2 hover:border-accent/60 transition-colors">
                  <div className="h-56 overflow-hidden">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant={event.featured ? "default" : "secondary"}>
                        {event.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl">{event.title}</CardTitle>
                    <p className="text-muted-foreground">{event.summary}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{event.dateLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="pt-2">
                      <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground w-full">
                        <Link to={event.path}>View Event</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
