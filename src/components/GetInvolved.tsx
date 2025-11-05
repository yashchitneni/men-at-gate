import { Dumbbell, Trophy, Users, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const GetInvolved = () => {
  const opportunities = [
    {
      icon: Dumbbell,
      title: "Join a Workout",
      description: "Start your journey with us at one of our regular group workouts. No experience necessary—just show up ready to work.",
      cta: "Find a Workout",
      link: "#events"
    },
    {
      icon: Trophy,
      title: "Sign Up for Challenges & Competitions",
      description: "Push your limits with overnight rucks, endurance challenges, and competitive events designed to forge brotherhood.",
      cta: "View Challenges",
      link: "#events"
    },
    {
      icon: Users,
      title: "Volunteer or Lead",
      description: "Give back by serving the community, mentoring new members, or hosting an event. Leadership opportunities available.",
      cta: "Learn More",
      link: "#events"
    },
    {
      icon: Heart,
      title: "Donate & Support",
      description: "Men in the Arena is a 501(c)(3) nonprofit. Your donation fuels our mission to help men step into the arena and become who they're meant to be.",
      cta: "Support Our Mission",
      link: "#"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Get Involved</h2>
          <p className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            Whether you're ready to train, lead, or support our mission, there's a place for you in the arena.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {opportunities.map((opportunity, index) => (
              <div key={index} className="bg-card p-8 rounded-lg border hover:border-accent/50 transition-colors flex flex-col">
                <opportunity.icon className="w-12 h-12 text-accent mb-4" />
                <h3 className="text-xl font-bold mb-3">{opportunity.title}</h3>
                <p className="text-muted-foreground mb-6 flex-grow">{opportunity.description}</p>
                <Button asChild className="w-full">
                  <a href={opportunity.link}>{opportunity.cta}</a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GetInvolved;
