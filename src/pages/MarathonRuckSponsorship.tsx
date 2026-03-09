import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Users, Landmark, Mail } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import ruckGearAction from "@/assets/ruck-gear-action.jpg";
import ruckActivation from "@/assets/ruck-activation.jpg";
import ruckVisionary from "@/assets/ruck-visionary.jpg";

const CONTACT_EMAIL = "community@meninthearena.co";
const CONTACT_SUBJECT = "Marathon Ruck 2026 – Partnership Inquiry";
const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}`;

interface TierProps {
  icon: React.ReactNode;
  tierLabel: string;
  tierName: string;
  imageSrc: string;
  imageAlt: string;
  tagline: string;
  copy: string;
  details: string;
  reverse?: boolean;
}

function TierSection({ icon, tierLabel, tierName, imageSrc, imageAlt, tagline, copy, details, reverse }: TierProps) {
  return (
    <section className="py-20 md:py-28">
      <div className="container px-4 mx-auto">
        <div className={`max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-stretch ${reverse ? "lg:[direction:rtl]" : ""}`}>
          {/* Image */}
          <ScrollReveal>
            <div className="relative group h-full min-h-[320px] lg:min-h-[480px]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8B0000]/20 to-transparent rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
              <img
                src={imageSrc}
                alt={imageAlt}
                className="w-full h-full object-cover rounded-sm border border-white/5 group-hover:border-[#8B0000]/30 transition-all duration-500"
              />
            </div>
          </ScrollReveal>

          {/* Content Card */}
          <ScrollReveal>
            <div className={`h-full flex flex-col justify-center ${reverse ? "lg:[direction:ltr]" : ""}`}>
              <div className="relative p-8 md:p-10 rounded-sm border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:border-[#8B0000]/20 hover:bg-white/[0.035] transition-all duration-500 group">
                {/* Subtle corner accent */}
                <div className="absolute top-0 left-0 w-16 h-[2px] bg-gradient-to-r from-[#8B0000] to-transparent" />
                <div className="absolute top-0 left-0 h-16 w-[2px] bg-gradient-to-b from-[#8B0000] to-transparent" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="h-11 w-11 rounded-sm bg-[#8B0000]/15 border border-[#8B0000]/25 flex items-center justify-center text-[#8B0000] group-hover:bg-[#8B0000]/25 transition-colors duration-300">
                    {icon}
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.5em] text-[#8B0000] font-bold">
                    {tierLabel}
                  </p>
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-black uppercase tracking-tight text-white mb-3 leading-[0.95]">
                  {tierName}
                </h2>

                <p className="text-sm uppercase tracking-[0.3em] text-[#8B0000]/80 font-semibold mb-6">
                  {tagline}
                </p>

                <p className="text-lg text-white/70 leading-relaxed font-light mb-8">
                  {copy}
                </p>

                <div className="pl-6 border-l-2 border-[#8B0000]/30">
                  <p className="text-white/40 leading-relaxed text-sm italic">
                    {details}
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

export default function MarathonRuckSponsorship() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#8B0000]/30 font-sans">
      <Navigation />

      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 gritty-overlay opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,0,0,0.08)_0%,_transparent_70%)]" />

        <div className="container relative z-10 px-4 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal>
              <Link
                to="/events/marathon-ruck"
                className="inline-flex items-center text-white/40 hover:text-white mb-16 text-xs tracking-[0.3em] uppercase transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Back to Event
              </Link>
            </ScrollReveal>

            <ScrollReveal>
              <div className="w-12 h-1 bg-[#8B0000] mx-auto mb-10" />
            </ScrollReveal>

            <ScrollReveal>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black uppercase leading-[0.9] mb-8 tracking-tighter">
                Partner with{" "}
                <span className="text-[#8B0000]">the Mission</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal>
              <p className="text-xl md:text-2xl uppercase tracking-[0.15em] text-white/80 font-medium mb-8">
                The 2nd Annual Marathon Ruck: May 1st, 2026. 26.2 Miles. Overnight.
                <br className="hidden md:block" /> No man walks alone.
              </p>
            </ScrollReveal>

            <ScrollReveal>
              <p className="text-lg text-white/50 leading-relaxed font-light max-w-2xl mx-auto">
                You're here because you understand that resilience isn't built in
                isolation. We are looking for partners to get in the arena with us.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Tier 1 – Product Partner */}
      <TierSection
        icon={<Package className="h-5 w-5" />}
        tierLabel="Tier 1"
        tierName="Product Partner"
        tagline="Fueling the Grind"
        imageSrc={ruckGearAction}
        imageAlt="Rucking gear and nutrition fueling the marathon"
        copy="Your product becomes a lifeline. At Mile 18, when legs are screaming and the night is at its darkest, your fuel, hydration, or gear is what keeps men moving forward. This is brand association forged in fire—not a logo on a flyer."
        details="Logo placement on digital materials · Verbal recognition at the safety briefing · Product placement at aid stations"
      />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Tier 2 – Activation Partner */}
      <TierSection
        icon={<Users className="h-5 w-5" />}
        tierLabel="Tier 2"
        tierName="Activation Partner"
        tagline="Boots on the Ground"
        imageSrc={ruckActivation}
        imageAlt="Brand representatives rucking alongside the team"
        copy="Don't just send your gear—send your team. Ruck the marathon with us or manage a dedicated checkpoint. Shared hardship builds the deepest brand loyalty. When your people suffer alongside ours, you earn something no ad campaign can buy."
        details="All Tier 1 benefits · Social media spotlight · Dedicated checkpoint or 'Fuel Station' · Direct face-to-face engagement with participants"
        reverse
      />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Tier 3 – Visionary Partner */}
      <TierSection
        icon={<Landmark className="h-5 w-5" />}
        tierLabel="Tier 3"
        tierName="Visionary Partner"
        tagline="Visionary Impact"
        imageSrc={ruckVisionary}
        imageAlt="Community finish line celebration"
        copy="Anchor the movement. Your capital investment is the engine that scales the mission of Men in the Arena—funding the ruck logistics and the year-round mental health initiatives that change men's lives. This isn't sponsorship. This is legacy."
        details="'Presented By' status · Premier logo on event apparel, banners & post-event documentary · All Tier 1 & 2 benefits · Speaking opportunity at the event"
      />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Final CTA */}
      <section className="py-32 md:py-40 bg-black text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,0,0,0.06)_0%,_transparent_60%)]" />

        <div className="container px-4 mx-auto relative z-10">
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <div className="w-12 h-1 bg-[#8B0000] mx-auto mb-10" />
              <h2 className="text-4xl md:text-6xl font-heading font-black uppercase mb-6 tracking-tight">
                Get in the Arena
              </h2>
              <p className="text-xl text-white/50 font-light mb-14 max-w-xl mx-auto leading-relaxed">
                Let's build something that matters. Reach out and we'll send you
                the full partnership deck.
              </p>
              <Button
                asChild
                size="lg"
                className="h-16 px-14 text-base font-bold tracking-[0.25em] uppercase bg-[#8B0000] hover:bg-[#A00000] text-white rounded-none border border-[#8B0000] hover:border-[#A00000] hover:shadow-[0_0_40px_rgba(139,0,0,0.3)] transition-all duration-300"
              >
                <a href={CONTACT_HREF}>
                  <Mail className="h-5 w-5 mr-3" />
                  Secure Your Partnership
                </a>
              </Button>
              <p className="mt-6 text-xs text-white/25 tracking-[0.2em] uppercase">
                {CONTACT_EMAIL}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
