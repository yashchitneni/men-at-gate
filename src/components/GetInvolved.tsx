import { Dumbbell, Trophy, Users, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const GetInvolved = () => {
  const opportunities = [
    {
      icon: Dumbbell,
      title: "Join a Workout",
      description: "Start your journey with us at one of our regular group workouts. No experience necessary—just show up ready to work.",
      cta: "Find a Workout",
      link: "/calendar"
    },
    {
      icon: Users,
      title: "Lead the Charge",
      description: "Take the next step in the arena. Compete in our challenges, volunteer for events, or step into a leadership role. This is your call to action.",
      cta: "Explore Opportunities",
      link: "https://www.instagram.com/meninthearena_/"
    },
    {
      icon: Heart,
      title: "Join The Grit Test",
      description: "Enter the arena and give back. Join our special Donate & Train Challenge—your entry fee becomes a tax-deductible donation that helps men serve, lead, and give back.",
      cta: "Support Our Mission",
      link: "/donate-challenge"
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {opportunities.map((opportunity, index) => (
              <div key={index} className="bg-card p-8 rounded-lg border hover:border-accent/50 transition-colors flex flex-col">
                <opportunity.icon className="w-12 h-12 text-accent mb-4" />
                <h3 className="text-xl font-bold mb-3">{opportunity.title}</h3>
                <p className="text-muted-foreground mb-6 flex-grow">{opportunity.description}</p>
                <Button asChild className="w-full">
                  {opportunity.link.startsWith('#') ? (
                    <a href={opportunity.link}>{opportunity.cta}</a>
                  ) : (
                    <Link to={opportunity.link}>{opportunity.cta}</Link>
                  )}
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
