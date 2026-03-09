import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Users, Landmark, Mail } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import ruckGearAction from "@/assets/ruck-gear-action.jpg";
import ruckActivation from "@/assets/ruck-activation.jpg";

const CONTACT_EMAIL = "community@meninthearena.co";
const CONTACT_SUBJECT = "Marathon Ruck 2026 – Partnership Inquiry";
const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}`;

interface TierProps {
  icon: React.ReactNode;
  tierLabel: string;
  tierName: string;
  imagePlaceholder: string;
  imageSrc?: string;
  copy: string;
  details: string;
}

function TierSection({ icon, tierLabel, tierName, imagePlaceholder, imageSrc, copy, details }: TierProps) {
  return (
    <section className="py-24 border-t border-white/5">
      <div className="container px-4 mx-auto">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <ScrollReveal>
            <div className="aspect-[4/3] w-full bg-[#111] border border-white/10 flex items-center justify-center rounded-sm overflow-hidden">
              {imageSrc ? (
                <img src={imageSrc} alt={tierName} className="w-full h-full object-cover" />
              ) : (
                <p className="text-white/20 text-sm tracking-[0.3em] uppercase text-center px-8 font-light">
                  {imagePlaceholder}
                </p>
              )}
            </div>
          </ScrollReveal>

          {/* Content */}
          <ScrollReveal>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-sm bg-[#8B0000]/20 border border-[#8B0000]/30 flex items-center justify-center text-[#8B0000]">
                  {icon}
                </div>
                <p className="text-[10px] uppercase tracking-[0.5em] text-[#8B0000] font-bold">
                  {tierLabel}
                </p>
              </div>

              <h2 className="text-3xl md:text-4xl font-heading font-black uppercase tracking-tight text-white mb-6">
                {tierName}
              </h2>

              <p className="text-lg text-white/70 leading-relaxed font-light mb-8">
                {copy}
              </p>

              <div className="pl-6 border-l-2 border-[#8B0000]/40">
                <p className="text-white/50 leading-relaxed text-sm">
                  {details}
                </p>
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
        {/* Dark textured background */}
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 gritty-overlay opacity-40" />
        {/* Subtle radial glow */}
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
                The 2nd Annual Marathon Ruck: March 2026. 26.2 Miles. Overnight.
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

      {/* Tier 1 – Product Partner */}
      <TierSection
        icon={<Package className="h-5 w-5" />}
        tierLabel="Tier 1"
        tierName="Product Partner"
        imagePlaceholder="[Action shot of rucking gear / nutrition]"
        imageSrc={ruckGearAction}
        copy="Support the physical grind. Provide the fuel, hydration, or gear our ruckers need to endure the night."
        details="Includes logo placement on digital materials and verbal recognition at the safety briefing."
      />

      {/* Tier 2 – Activation Partner */}
      <TierSection
        icon={<Users className="h-5 w-5" />}
        tierLabel="Tier 2"
        tierName="Activation Partner"
        imagePlaceholder="[Brand reps rucking or at a checkpoint]"
        imageSrc={ruckActivation}
        copy="Boots on the ground. Don't just send your gear—send your team. Ruck the marathon with us or manage a dedicated 'Fuel Station' at a checkpoint."
        details="Includes Tier 1 benefits + Social Media spotlight and direct face-to-face engagement with participants."
      />

      {/* Tier 3 – Visionary Partner */}
      <TierSection
        icon={<Landmark className="h-5 w-5" />}
        tierLabel="Tier 3"
        tierName="Visionary Partner"
        imagePlaceholder="[Community impact / Finish line shot]"
        copy="Anchor the movement. Your capital investment funds the ruck logistics and the year-round mental health initiatives of Men in the Arena."
        details="'Presented By' status. Premier logo placement on event apparel, banners, and the post-event documentary film."
      />

      {/* Final CTA */}
      <section className="py-32 bg-black text-center border-t border-white/5">
        <div className="container px-4 mx-auto">
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <div className="w-12 h-1 bg-[#8B0000] mx-auto mb-10" />
              <h2 className="text-4xl md:text-6xl font-heading font-black uppercase mb-6 tracking-tight">
                Get in the Arena
              </h2>
              <p className="text-xl text-white/50 font-light mb-12 max-w-xl mx-auto">
                Let's build something that matters. Reach out and we'll send you
                the full partnership deck.
              </p>
              <Button
                asChild
                size="lg"
                className="h-16 px-14 text-base font-bold tracking-[0.25em] uppercase bg-[#8B0000] hover:bg-[#6B0000] text-white rounded-none border-none transition-colors"
              >
                <a href={CONTACT_HREF}>
                  <Mail className="h-5 w-5 mr-3" />
                  Secure Your Partnership
                </a>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
