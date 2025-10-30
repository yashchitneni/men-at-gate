import { Mountain, Target, Book, Handshake } from "lucide-react";

const Pillars = () => {
  const pillars = [
    {
      icon: Mountain,
      title: "Challenge",
      description: "Stepping into the hard things—weekly workouts, overnight marathon rucks, and endurance events. Growth happens when we push beyond our comfort zones."
    },
    {
      icon: Target,
      title: "Duty",
      description: "Showing up for one another with accountability and commitment. We serve something bigger than ourselves and hold each other to a higher standard."
    },
    {
      icon: Book,
      title: "Reflection",
      description: "Looking inward with honesty and courage. Through journaling, discussion, and feedback, we understand who we are and who we want to become."
    },
    {
      icon: Handshake,
      title: "Fellowship",
      description: "Building genuine connections with other men. In shared struggle and celebration, we find belonging and brotherhood that carries us through life."
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">How We Do It</h2>
          <p className="text-lg text-muted-foreground">
            We believe men transform when they commit to four pillars:
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {pillars.map((pillar, index) => (
            <div 
              key={index} 
              className="bg-card p-8 rounded-lg border hover:shadow-lg transition-all group"
            >
              <div className="w-16 h-16 bg-accent/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <pillar.icon className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{pillar.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pillars;
