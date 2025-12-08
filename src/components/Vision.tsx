import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";

const Vision = () => {
  const initiatives = [
    {
      year: "EXPANSION",
      title: "New Communities",
      description: "Bringing the arena to cities across the nation. Creating local chapters where men can gather, train, and grow together in person."
    },
    {
      year: "DIGITAL",
      title: "Online Platform",
      description: "Providing nationwide access through virtual challenges, resources, and a digital community for men who can't join us physically."
    },
    {
      year: "LEGACY",
      title: "Mentorship Program",
      description: "Pairing experienced members with new recruits. Ensuring every man has a guide on his journey through the arena."
    }
  ];

  return (
    <section className="py-24 bg-subtle-gradient relative overflow-hidden">
      <div className="container px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-6xl font-heading font-black mb-6 text-center uppercase tracking-tighter">
              Where We're Going
            </h2>
            <p className="text-xl text-muted-foreground text-center mb-20 max-w-2xl mx-auto">
              Our mission is bigger than any one city or group. We're building a nationwide movement.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 mb-24 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-border -z-10" />

            {initiatives.map((initiative, index) => (
              <ScrollReveal key={index} delay={index * 200} animation="slide-up">
                <div className="bg-background p-8 border border-border relative h-full group hover:border-accent transition-colors duration-300">
                  {/* Timeline Dot */}
                  <div className="w-4 h-4 bg-accent rounded-full absolute -top-2 left-1/2 -translate-x-1/2 hidden md:block ring-4 ring-background" />

                  <span className="text-accent font-bold text-xs tracking-[0.2em] uppercase mb-4 block">
                    {initiative.year}
                  </span>
                  <h3 className="text-2xl font-bold mb-4 uppercase">{initiative.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {initiative.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={600}>
            <div className="bg-foreground text-background p-8 md:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-accent/10" />
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-heading font-black mb-6 uppercase tracking-tight">
                  Help Us Scale This Impact
                </h3>
                <p className="text-lg md:text-xl text-background/80 mb-10 max-w-2xl mx-auto font-light">
                  As a 501(c)(3) nonprofit, we rely on donations and partnerships to bring this life-changing work to more men.
                </p>
                <div className="flex justify-center">
                  <Button size="lg" asChild className="bg-accent text-foreground hover:bg-accent/90 font-bold uppercase tracking-widest px-8 py-6 h-auto rounded-none">
                    <a href="#">Donate Now</a>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default Vision;
