import { Users, TrendingUp, Phone, Heart } from "lucide-react";
import leadersGoFirstImg from "@/assets/leaders-go-first.jpg";
import answerTheCallImg from "@/assets/answer-the-call.png";
import vulnerabilityImg from "@/assets/vulnerability-is-strength.png";
import togetherWeRiseImg from "@/assets/together-we-rise.png";

const Mission = () => {
  const values = [
    {
      icon: Users,
      title: "Together We Rise",
      description: "Brotherhood and support lift us all higher",
      image: togetherWeRiseImg
    },
    {
      icon: TrendingUp,
      title: "Leaders Go First",
      description: "Setting the example through action and service",
      image: leadersGoFirstImg
    },
    {
      icon: Phone,
      title: "Answer the Call",
      description: "Take decisive action when it matters most",
      image: answerTheCallImg
    },
    {
      icon: Heart,
      title: "Vulnerability is Strength",
      description: "True power comes from authentic connection with one another",
      image: vulnerabilityImg
    }
  ];

  return (
    <section className="py-20 bg-subtle-gradient">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground">
            We are a collective of men helping one another step into the arena to compete, 
            to struggle, and to emerge as better men for our friends, family, teams and 
            everyone that we love most.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold mb-10 text-center">Our Values are Simple:</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-card rounded-lg border hover:border-accent/50 transition-colors overflow-hidden">
                {value.image && (
                  <div className="w-full h-64 overflow-hidden">
                    <img 
                      src={value.image} 
                      alt={value.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="p-8">
                  <value.icon className="w-12 h-12 text-accent mb-4" />
                  <h4 className="text-xl font-bold mb-3">{value.title}</h4>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Mission;
