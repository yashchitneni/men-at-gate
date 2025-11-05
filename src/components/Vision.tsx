import { MapPin, Globe, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const Vision = () => {
  const initiatives = [
    {
      icon: MapPin,
      title: "Expanding to New Communities",
      description: "Bringing the arena to cities across the nation, creating local chapters where men can gather, train, and grow together."
    },
    {
      icon: Globe,
      title: "Launching a Digital Platform",
      description: "Providing nationwide access through virtual challenges, online resources, and digital community for men who can't join us in person."
    },
    {
      icon: GraduationCap,
      title: "Creating a Mentorship Program",
      description: "Pairing experienced members with new recruits to ensure every man has a guide on his journey through the arena."
    }
  ];

  return (
    <section className="py-20 bg-subtle-gradient">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Where We're Going</h2>
          <p className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            Our mission is bigger than any one city or group. We're building a nationwide movement 
            of men committed to stepping into the arena together.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {initiatives.map((initiative, index) => (
              <div key={index} className="bg-card p-6 rounded-lg border text-center">
                <initiative.icon className="w-10 h-10 text-accent mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-3">{initiative.title}</h3>
                <p className="text-sm text-muted-foreground">{initiative.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-card p-8 md:p-12 rounded-lg border text-center">
            <h3 className="text-2xl font-bold mb-4">Help Us Scale This Impact</h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              As a 501(c)(3) nonprofit, we rely on donations and partnerships to bring this life-changing 
              work to more men. Every contribution helps us expand our reach, host more events, and 
              strengthen our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="#">Donate Now</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#events">Join the Movement</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Vision;
