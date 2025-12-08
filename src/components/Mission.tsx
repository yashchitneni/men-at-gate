import { Mountain, Handshake, Target, Book } from "lucide-react";
import leadersGoFirstImg from "@/assets/leaders-go-first.jpg";
import answerTheCallImg from "@/assets/answer-the-call.png";
import vulnerabilityImg from "@/assets/vulnerability-is-strength.png";
import togetherWeRiseImg from "@/assets/together-we-rise.png";
import { useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import { cn } from "@/lib/utils";

const Mission = () => {
  const [activeTab, setActiveTab] = useState(0);

  const values = [
    {
      icon: Mountain,
      title: "Challenge",
      subtitle: "Answer the Call",
      description: "We step into hard things—training, endurance events, and challenges that forge character.",
      image: answerTheCallImg
    },
    {
      icon: Handshake,
      title: "Fellowship",
      subtitle: "Together We Rise",
      description: "We don't go it alone. Brotherhood and authentic connection are our foundation.",
      image: togetherWeRiseImg
    },
    {
      icon: Target,
      title: "Duty",
      subtitle: "Answer the Call",
      description: "We show up for our families, brothers, and community—owning responsibility with action.",
      image: leadersGoFirstImg
    },
    {
      icon: Book,
      title: "Reflection",
      subtitle: "Vulnerability is Strength",
      description: "We practice honest reflection—through journaling and discussion—to grow with integrity.",
      image: vulnerabilityImg
    }
  ];

  return (
    <section id="mission" className="py-24 bg-black relative overflow-hidden min-h-[800px] flex flex-col">
      <div className="container px-4 relative z-10 flex-1 flex flex-col">
        <ScrollReveal>
          <div className="max-w-4xl mb-12">
            <h2 className="text-4xl md:text-6xl font-heading font-black mb-6 uppercase tracking-tighter text-white">
              Our Code
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl">
              We live by a simple but powerful set of values. These aren't just words on a wall—they are the standards we hold ourselves to every single day.
            </p>
          </div>
        </ScrollReveal>

        <div className="flex flex-col lg:flex-row gap-8 flex-1">
          {/* Tabs Navigation */}
          <div className="flex flex-col justify-center gap-4 w-full lg:w-1/3 z-20">
            {values.map((value, index) => (
              <button
                key={value.title}
                onClick={() => setActiveTab(index)}
                className={cn(
                  "text-left px-8 py-6 transition-all duration-300 border-2 flex items-center gap-4 group relative overflow-hidden rounded-lg",
                  activeTab === index
                    ? "border-accent bg-accent text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                    : "border-white/10 bg-white/5 hover:border-accent/50 hover:bg-white/10 text-gray-400 hover:text-white"
                )}
              >
                <span className={cn(
                  "text-xl font-heading font-bold uppercase tracking-wider transition-colors duration-300",
                  activeTab === index ? "text-white" : "text-gray-400 group-hover:text-white"
                )}>
                  {value.title}
                </span>
                {activeTab === index && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Content Display */}
          <div className="w-full lg:w-2/3 relative rounded-2xl overflow-hidden min-h-[400px] lg:h-auto group">
            {values.map((value, index) => (
              <div
                key={index}
                className={cn(
                  "absolute inset-0 transition-all duration-700 ease-in-out",
                  activeTab === index ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"
                )}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                  <img
                    src={value.image}
                    alt={value.title}
                    className={cn(
                      "w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105",
                      value.title === "Brotherhood" ? "object-[center_20%]" : "object-center"
                    )}
                  />
                </div>

                {/* Text Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20">
                  <div className="overflow-hidden">
                    <h3 className={cn(
                      "text-3xl md:text-5xl font-bold text-white mb-4 transform transition-transform duration-500 delay-100",
                      activeTab === index ? "translate-y-0" : "translate-y-full"
                    )}>
                      {value.subtitle}
                    </h3>
                  </div>
                  <div className="overflow-hidden">
                    <p className={cn(
                      "text-lg md:text-xl text-white/90 max-w-2xl transform transition-transform duration-500 delay-200",
                      activeTab === index ? "translate-y-0" : "translate-y-full"
                    )}>
                      {value.description}
                    </p>
                  </div>
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
