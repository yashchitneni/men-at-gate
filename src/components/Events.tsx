import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock } from "lucide-react";

const Events = () => {
  const events = [
    {
      title: "Weekly Workout",
      type: "Recurring",
      date: "Every Other Friday",
      time: "4:00 PM",
      location: "Local Park",
      description: "Join us for our signature weekly workout. High-intensity functional fitness followed by coffee and conversation."
    },
    {
      title: "Monthly Ruck",
      type: "Challenge",
      date: "First Sunday",
      time: "5:00 AM",
      location: "Trail System",
      description: "Load up your pack and push your limits. 10-15 mile weighted ruck march through challenging terrain."
    },
    {
      title: "Quarterly Gathering",
      type: "Fellowship",
      date: "Seasonal",
      time: "Evening",
      location: "Community Space",
      description: "Connect deeper with your brothers. Share stories, reflect on growth, and set intentions for the next quarter."
    }
  ];

  return (
    <section id="events" className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Upcoming Events</h2>
          <p className="text-lg text-muted-foreground">
            Step into the arena. Every event is designed to challenge you, build brotherhood, 
            and help you grow into the man you're meant to be.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mb-12">
          {events.map((event, index) => (
            <Card key={index} className="hover:border-accent/50 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary">{event.type}</Badge>
                </div>
                <CardTitle className="text-xl">{event.title}</CardTitle>
                <CardDescription>{event.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {event.date}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {event.time}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            View Full Calendar
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Events;
