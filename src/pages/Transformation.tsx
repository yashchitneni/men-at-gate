import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

const beforeImage =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1600&q=80";
const afterImage =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80";

const whoBullets = [
  "You were an athlete once. That fire didn't die, it got buried.",
  "You've got the career, the title, the desk. And something still feels missing.",
  "You want real friendships with men who chase more, not small talk.",
  "You want to be a better father, husband, and leader, not just on paper.",
  "You're done coasting. You want to be tested again.",
];

const shifts = [
  {
    number: "01",
    from: "From Isolated",
    to: "To Brotherhood",
    description:
      "You stop walking through life alone. You get a crew that shows up rain or shine.",
  },
  {
    number: "02",
    from: "From Coasting",
    to: "To Competing",
    description:
      "You train for real events again. You remember what your body can do.",
  },
  {
    number: "03",
    from: "From Going Through Motions",
    to: "To Living On Purpose",
    description:
      "Duty, challenge, reflection, fellowship. You build a life that means something.",
  },
  {
    number: "04",
    from: "From Absent",
    to: "To Present",
    description:
      "You become the father, husband, and leader your people need.",
  },
];

const SectionKicker = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="h-px w-8 bg-accent" />
    <p className="text-[10px] uppercase tracking-[0.5em] text-accent font-bold">
      {label}
    </p>
  </div>
);

const Transformation = () => {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-black relative">
        <div className="container px-4 relative z-10">
          <ScrollReveal>
            <div className="max-w-5xl">
              <SectionKicker label="The Transformation" />
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black mb-8 uppercase tracking-tighter text-white leading-[0.9]">
                You Traded The Arena For A Desk
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl font-light leading-relaxed">
                You used to be the guy who competed. The athlete. The one who showed up. Somewhere between the career and the commute, you lost that man. We help you get him back.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Before / After Slider */}
      <section className="py-20 md:py-28 bg-black relative">
        <div className="container px-4 relative z-10">
          <ScrollReveal>
            <div className="max-w-5xl mx-auto">
              <BeforeAfterSlider
                beforeImage={beforeImage}
                afterImage={afterImage}
                beforeAlt="Before transformation"
                afterAlt="After transformation"
              />
              <p className="text-center text-sm uppercase tracking-[0.4em] text-gray-500 mt-6">
                Drag to see the shift
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-24 bg-black relative">
        <div className="container px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <SectionKicker label="The Mirror" />
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black mb-6 uppercase tracking-tighter text-white leading-[0.9]">
                Who This Is For
              </h2>
              <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl">
                If this sounds like you, you're already one of us.
              </p>
            </ScrollReveal>

            <div className="space-y-4">
              {whoBullets.map((bullet, i) => (
                <ScrollReveal key={i} delay={i * 80} animation="fade-in-left">
                  <div className="flex items-start gap-5 border-l-4 border-accent bg-white/5 hover:bg-white/10 transition-colors duration-300 px-6 py-5">
                    <span className="text-accent font-heading font-black text-lg pt-0.5">
                      0{i + 1}
                    </span>
                    <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                      {bullet}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Shift */}
      <section className="py-24 bg-black relative">
        <div className="container px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <SectionKicker label="The Shift" />
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black mb-16 uppercase tracking-tighter text-white leading-[0.9]">
                The Shift
              </h2>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-6">
              {shifts.map((shift, i) => (
                <ScrollReveal key={shift.number} delay={i * 100} animation="slide-up">
                  <div className="relative bg-white/[0.03] border-l-4 border-accent p-8 md:p-10 h-full overflow-hidden group hover:bg-white/[0.06] transition-colors duration-300 min-h-[260px]">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                      <span className="text-[8rem] md:text-[10rem] leading-none font-heading font-black text-white">
                        {shift.number}
                      </span>
                    </div>
                    <div className="relative z-10">
                      <span className="text-accent font-bold text-sm tracking-widest uppercase mb-4 block">
                        Step {shift.number}
                      </span>
                      <h3 className="text-2xl md:text-3xl font-heading font-black uppercase tracking-tight text-white mb-1">
                        {shift.from}
                      </h3>
                      <h3 className="text-2xl md:text-3xl font-heading font-black uppercase tracking-tight text-accent mb-5">
                        {shift.to}
                      </h3>
                      <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-md">
                        {shift.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-28 md:py-36 bg-black relative">
        <div className="container px-4 relative z-10">
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center">
              <SectionKicker label="The Call" />
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black mb-8 uppercase tracking-tighter text-white leading-[0.9]">
                Stop Waiting. Step In.
              </h2>
              <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                We gather every other Friday, rain or shine. No experience necessary. Just show up ready to work.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-white font-bold uppercase tracking-widest rounded-none px-8 h-14 text-base"
                >
                  <Link to="/brotherhood">Step Into The Arena</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-black font-bold uppercase tracking-widest rounded-none px-8 h-14 text-base"
                >
                  <Link to="/calendar">Find A Workout</Link>
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Transformation;