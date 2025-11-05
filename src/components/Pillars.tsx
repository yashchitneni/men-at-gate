import { Mountain, Target, Book, Handshake } from "lucide-react";
import challengeImg from "@/assets/challenge.png";
import dutyImg from "@/assets/duty.png";
import reflectionImg from "@/assets/reflection.png";
import fellowshipImg from "@/assets/fellowship.png";

const Pillars = () => {
  const pillars = [
    {
      icon: Mountain,
      title: "Challenge",
      description: "Stepping into the hard things—weekly workouts, overnight marathon rucks, and endurance events. Growth happens when we push beyond our comfort zones.",
      image: challengeImg
    },
    {
      icon: Target,
      title: "Duty",
      description: "Showing up for one another with accountability and commitment. We serve something bigger than ourselves and hold each other to a higher standard.",
      image: dutyImg
    },
    {
      icon: Book,
      title: "Reflection",
      description: "Looking inward with honesty and courage. Through journaling, discussion, and feedback, we understand who we are and who we want to become.",
      image: reflectionImg
    },
    {
      icon: Handshake,
      title: "Fellowship",
      description: "Building genuine connections with other men. In shared struggle and celebration, we find belonging and brotherhood that carries us through life.",
      image: fellowshipImg
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
              className="bg-card rounded-lg border hover:border-accent/50 transition-colors overflow-hidden"
            >
              {pillar.image && (
                <div className="w-full h-64 overflow-hidden">
                  <img 
                    src={pillar.image} 
                    alt={pillar.title}
                    className={`w-full h-full object-cover ${
                      pillar.title === "Duty" ? "object-[center_32%]" : 
                      pillar.title === "Fellowship" ? "object-[center_45%]" : ""
                    }`}
                  />
                </div>
              )}
              <div className="p-8">
                <pillar.icon className="w-12 h-12 text-accent mb-4" />
                <h3 className="text-xl font-bold mb-3">{pillar.title}</h3>
                <p className="text-muted-foreground">{pillar.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pillars;
