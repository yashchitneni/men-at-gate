import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Moon } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { buildTrackedUrl } from "@/lib/url";
import {
  MARATHON_RUCK_SLUG,
  MARATHON_RUCK_UTM,
  SWEATPALS_DEFAULT_URL,
  marathonRuckSpecs,
  marathonRuckSponsorPoints,
} from "@/data/events";
import { useFeaturedEventBySlug } from "@/hooks/useFeaturedEvents";
import heroImage from "@/assets/grit-test-hero.png";
import ScrollReveal from "@/components/ScrollReveal";

export default function MarathonRuckEvent() {
  const { data: featuredEvent } = useFeaturedEventBySlug(MARATHON_RUCK_SLUG);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const title = featuredEvent?.title || "The Weight We Carry";
  const subtitle = featuredEvent?.subtitle || "Overnight Marathon Ruck";
  const summary =
    featuredEvent?.summary ||
    "26.2 miles through the night, carrying extra weight and finishing shoulder-to-shoulder as brothers.";
  const eventDate = featuredEvent?.event_date_text || "May 1, 2026";
  const registrationUrl = buildTrackedUrl(
    featuredEvent?.registration_url || SWEATPALS_DEFAULT_URL,
    MARATHON_RUCK_UTM,
  );

  // Event specific palette:
  // Matte Black: #0f0f0f
  // Oxblood/Crimson: #8a1c1c
  // Soft Bone (Moon Tone): #e3e1d9

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e3e1d9] selection:bg-[#8a1c1c]/30 font-sans">
      <Navigation />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={featuredEvent?.image_url || heroImage}
            alt={title}
            className="w-full h-full object-cover scale-105"
            style={{ filter: "grayscale(30%) contrast(120%)" }}
          />
          {/* Gradient to Matte Black */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-[#0f0f0f]/30" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 gritty-overlay opacity-50" />
        </div>

        <div className="container relative z-10 px-4 mx-auto">
          <div className="max-w-5xl">
            <ScrollReveal>
              <Link to="/events" className="inline-flex items-center text-[#e3e1d9]/50 hover:text-[#e3e1d9] mb-12 text-xs tracking-[0.3em] uppercase transition-colors group">
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Back to Events
              </Link>
            </ScrollReveal>

            <ScrollReveal>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-8 bg-[#8a1c1c]" />
                <p className="text-[10px] uppercase tracking-[0.5em] text-[#8a1c1c] font-bold">
                  {eventDate}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black uppercase leading-[0.9] mb-8 tracking-tighter text-[#e3e1d9]">
                {title}
              </h1>
            </ScrollReveal>

            <ScrollReveal>
              <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12">
                <div>
                  <p className="text-xl md:text-2xl uppercase tracking-[0.15em] text-[#e3e1d9]/90 font-medium">
                    {subtitle}
                  </p>
                </div>
                <div className="hidden md:block h-12 w-px bg-[#e3e1d9]/20" />
                <div className="max-w-md">
                  <p className="text-lg text-[#e3e1d9]/60 leading-relaxed font-light">
                    {summary}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="flex flex-wrap gap-6">
                <Button asChild size="lg" className="h-14 px-10 text-sm font-bold tracking-[0.2em] uppercase bg-[#8a1c1c] hover:bg-[#6b1515] text-[#e3e1d9] rounded-none border-none transition-colors">
                  <a href={registrationUrl} target="_blank" rel="noreferrer">
                    Register Now
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-10 text-sm font-bold tracking-[0.2em] uppercase rounded-none border-[#e3e1d9]/20 hover:border-[#e3e1d9]/50 hover:bg-[#e3e1d9]/5 text-[#e3e1d9] bg-transparent transition-all">
                  <a href="#brief">The Mission</a>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Why We Ruck - Minimal Typographic Section */}
      <section id="brief" className="py-32 bg-[#0f0f0f] relative">
        <div className="container px-4 mx-auto">
          <ScrollReveal>
            <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
              <Moon className="h-8 w-8 mb-8 text-[#e3e1d9]/40" />
              <h2 className="text-3xl md:text-5xl font-heading font-black uppercase mb-8 tracking-tight text-[#e3e1d9]">
                Why We Ruck
              </h2>
              <div className="w-12 h-1 bg-[#8a1c1c] mb-10" />
              <p className="text-xl md:text-2xl leading-relaxed text-[#e3e1d9]/70 font-light">
                Every man carries weight. Some of it is visible, most of it is not. This overnight marathon ruck is how we confront that weight together, stepping into the dark to raise support for men's mental health. We finish shoulder-to-shoulder, or we don't finish at all.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Event Specs - Typographic Grid (No Cards) */}
      <section className="py-24 bg-[#141414] border-y border-[#e3e1d9]/5">
        <div className="container px-4 mx-auto">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#e3e1d9]/10">
            {marathonRuckSpecs.map((spec, index) => (
              <ScrollReveal key={spec.label}>
                <div className="p-12 flex flex-col items-center text-center group">
                  <p className="text-[11px] uppercase tracking-[0.4em] text-[#8a1c1c] font-bold mb-6">
                    {spec.label}
                  </p>
                  <h3 className="text-3xl md:text-4xl font-heading font-black uppercase text-[#e3e1d9] mb-4">
                    {spec.value}
                  </h3>
                  <p className="text-[#e3e1d9]/50 font-light leading-relaxed max-w-xs">
                    {spec.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Partner/Sponsor Section - Clean List Layout */}
      <section id="sponsor" className="py-32 bg-[#0f0f0f] relative overflow-hidden">
        <div className="container px-4 mx-auto">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
            <ScrollReveal>
              <div className="sticky top-24">
                <h2 className="text-4xl md:text-5xl font-heading font-black uppercase mb-6 tracking-tight text-[#e3e1d9]">
                  Partner with <br />
                  <span className="text-[#8a1c1c]">The Mission</span>
                </h2>
                <p className="text-lg text-[#e3e1d9]/60 leading-relaxed mb-10 max-w-md">
                  Align your brand with brotherhood, resilience, and actionable outcomes for men's mental health. We are looking for partners who refuse to let men walk alone.
                </p>
                <Button asChild size="lg" className="h-14 px-10 text-sm font-bold tracking-[0.2em] uppercase bg-[#e3e1d9] text-[#0f0f0f] hover:bg-white rounded-none transition-colors">
                  <a href="mailto:community@meninthearena.co?subject=Marathon%20Ruck%20Sponsorship">
                    Request Partner Kit
                  </a>
                </Button>
              </div>
            </ScrollReveal>

            <div className="space-y-12">
              {marathonRuckSponsorPoints.map((item, index) => (
                <ScrollReveal key={item.title}>
                  <div className="relative pl-8 md:pl-12 border-l border-[#8a1c1c]/30 hover:border-[#8a1c1c] transition-colors duration-300">
                    <div className="absolute left-0 top-0 w-1.5 h-6 bg-[#8a1c1c] -translate-x-[1px]" />
                    <h3 className="text-2xl font-heading font-bold uppercase mb-3 text-[#e3e1d9] tracking-wide">
                      {item.title}
                    </h3>
                    <p className="text-[#e3e1d9]/60 leading-relaxed font-light text-lg">
                      {item.copy}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-24 bg-[#141414] relative">
        <div className="absolute inset-0 gritty-overlay opacity-30" />
        <div className="container px-4 mx-auto relative z-10">
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-2xl md:text-4xl font-light italic leading-relaxed text-[#e3e1d9]/80 mb-8 font-serif">
                "It is not the critic who counts; not the man who points out how the strong man stumbles."
              </p>
              <p className="uppercase tracking-[0.3em] text-sm text-[#8a1c1c] font-bold">
                - Theodore Roosevelt
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-32 bg-[#0f0f0f] text-center border-t border-[#e3e1d9]/5">
        <div className="container px-4 mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-6xl font-heading font-black uppercase mb-6 tracking-tight text-[#e3e1d9]">
              Ready to Carry the Weight?
            </h2>
            <p className="max-w-2xl mx-auto mb-10 text-xl text-[#e3e1d9]/60 font-light">
              Register for the marathon ruck, show up prepared, and move with men who refuse to walk alone.
            </p>
            <Button asChild size="lg" className="h-16 px-12 text-base font-bold tracking-[0.2em] uppercase bg-[#8a1c1c] hover:bg-[#6b1515] text-[#e3e1d9] rounded-none border-none transition-colors">
              <a href={registrationUrl} target="_blank" rel="noreferrer">
                Commit to the Ruck
              </a>
            </Button>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
