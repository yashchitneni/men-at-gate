import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";

const GetInvolved = () => {
  const opportunities = [
    {
      number: "01",
      title: "Join a Workout",
      description: "Start your journey with us at one of our regular group workouts. No experience necessary—just show up ready to work.",
      cta: "Find a Workout",
      link: "/calendar"
    },
    {
      number: "02",
      title: "Lead the Charge",
      description: "Take the next step in the arena. Compete in our challenges, volunteer for events, or step into a leadership role.",
      cta: "Explore Opportunities",
      link: "https://www.instagram.com/meninthearena_/"
    },
    {
      number: "03",
      title: "Join The Grit Test",
      description: "Enter the arena and give back. Join our special Donate & Train Challenge—your entry fee becomes a tax-deductible donation.",
      cta: "Support Our Mission",
      link: "/donate-challenge"
    }
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gritty-texture opacity-20 pointer-events-none" />

      <div className="container px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-6xl font-heading font-black mb-6 text-center uppercase tracking-tighter">
              Get Involved
            </h2>
            <p className="text-xl text-muted-foreground text-center mb-20 max-w-2xl mx-auto">
              Whether you're ready to train, lead, or support our mission, there's a place for you in the arena.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {opportunities.map((opportunity, index) => (
              <ScrollReveal key={index} delay={index * 100} animation="slide-up">
                <div className="bg-card p-8 md:p-10 rounded-none border-l-4 border-accent hover:bg-accent/5 transition-all duration-300 flex flex-col h-full group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="text-8xl font-black text-foreground">{opportunity.number}</span>
                  </div>

                  <div className="relative z-10">
                    <span className="text-accent font-bold text-sm tracking-widest uppercase mb-4 block">Step {opportunity.number}</span>
                    <h3 className="text-2xl font-bold mb-4 uppercase tracking-tight">{opportunity.title}</h3>
                    <p className="text-muted-foreground mb-8 leading-relaxed">{opportunity.description}</p>

                    <Button asChild variant="outline" className="w-full border-2 border-foreground hover:bg-foreground hover:text-background uppercase tracking-widest font-bold rounded-none transition-all">
                      {opportunity.link.startsWith('#') ? (
                        <a href={opportunity.link}>{opportunity.cta}</a>
                      ) : (
                        <Link to={opportunity.link}>{opportunity.cta}</Link>
                      )}
                    </Button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GetInvolved;
