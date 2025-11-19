import { Mountain, Target, Book, Handshake } from "lucide-react";
import challengeImg from "@/assets/challenge.png";
import dutyImg from "@/assets/duty.png";
import reflectionImg from "@/assets/reflection.png";
import fellowshipImg from "@/assets/fellowship.png";
import ScrollReveal from "@/components/ScrollReveal";
import { cn } from "@/lib/utils";

const Pillars = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4">
        <ScrollReveal>
          <div className="max-w-4xl mb-16">
            <h2 className="text-4xl md:text-6xl font-heading font-black mb-6 uppercase tracking-tighter">
              The Framework
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl">
              We don't just talk about being better men. We have a proven framework that gets results.
            </p>
          </div>
        </ScrollReveal>

        <div className="flex flex-col md:flex-row gap-4 h-auto md:h-[600px]">

          {/* Challenge */}
          <div className="group relative flex-1 hover:flex-[2] transition-all duration-500 ease-in-out overflow-hidden rounded-2xl min-h-[300px] md:min-h-0">
            <div className="absolute inset-0">
              <img
                src={challengeImg}
                alt="Challenge"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-500" />
            </div>
            <div className="absolute bottom-0 left-0 p-8 w-full">
              <Mountain className="w-10 h-10 text-accent mb-4" />
              <h3 className="text-3xl font-bold text-white mb-2 whitespace-nowrap">Challenge</h3>
              <p className="text-white/80 max-w-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 delay-100">
                Stepping into the hard things—weekly workouts, overnight marathon rucks, and endurance events.
              </p>
            </div>
          </div>

          {/* Duty */}
          <div className="group relative flex-1 hover:flex-[2] transition-all duration-500 ease-in-out overflow-hidden rounded-2xl bg-black border border-white/10 hover:border-accent/50 min-h-[300px] md:min-h-0">
            <div className="absolute inset-0 h-full md:h-1/2 opacity-40 md:opacity-60 transition-all duration-500">
              <img
                src={dutyImg}
                alt="Duty"
                className="w-full h-full object-cover object-[center_30%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 p-8 w-full">
              <Target className="w-10 h-10 text-accent mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2 whitespace-nowrap">Duty</h3>
              <p className="text-gray-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 delay-100">
                Showing up for one another with accountability. We serve something bigger than ourselves.
              </p>
            </div>
          </div>

          {/* Reflection */}
          <div className="group relative flex-1 hover:flex-[2] transition-all duration-500 ease-in-out overflow-hidden rounded-2xl bg-[#1a1a1a] text-white min-h-[300px] md:min-h-0">
            <div className="absolute inset-0 opacity-20 md:opacity-40 transition-opacity duration-500">
              <img
                src={reflectionImg}
                alt="Reflection"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-0 p-8 w-full">
              <Book className="w-10 h-10 text-accent mb-4" />
              <h3 className="text-2xl font-bold mb-2 whitespace-nowrap">Reflection</h3>
              <p className="text-white/80 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 delay-100">
                Looking inward with honesty. Through journaling and discussion, we understand who we are.
              </p>
            </div>
          </div>

          {/* Fellowship */}
          <div className="group relative flex-1 hover:flex-[2] transition-all duration-500 ease-in-out overflow-hidden rounded-2xl bg-accent min-h-[300px] md:min-h-0">
            <div className="absolute inset-0 opacity-20 mix-blend-multiply">
              <img
                src={fellowshipImg}
                alt="Fellowship"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-0 p-8 w-full">
              <Handshake className="w-10 h-10 text-white mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2 whitespace-nowrap">Fellowship</h3>
              <p className="text-white/90 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 delay-100">
                Building genuine connections that carry us through life.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Pillars;
