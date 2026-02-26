import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Footprints, HeartPulse, Moon, Mountain, Users } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const specIcons = [Footprints, ShieldCheck, HeartPulse];
const sponsorIcons = [Mountain, Users, Moon];

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

  return (
    <div className="min-h-screen" style={{ background: 'hsl(0 0% 7%)' }}>
      <Navigation />

      {/* Hero */}
      <section className="pt-24 pb-20 relative overflow-hidden min-h-[70vh] flex items-end">
        <div className="absolute inset-0">
          <img
            src={featuredEvent?.image_url || heroImage}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, hsla(0,0%,4%,0.65) 0%, hsla(0,0%,4%,0.85) 100%)'
          }} />
        </div>

        <div className="container px-4 relative z-10 text-white">
          <div className="max-w-5xl mx-auto">
            <Link to="/events" className="inline-flex items-center text-white/60 hover:text-white mb-8 text-sm tracking-widest uppercase">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
            <p className="text-xs uppercase tracking-[0.35em] mb-6" style={{ color: 'hsl(0 55% 35%)' }}>
              Men in the Arena Presents
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black uppercase leading-[0.9] mb-6">
              {title}
            </h1>
            <p className="text-xl md:text-3xl uppercase tracking-[0.12em] mb-4" style={{ color: 'hsl(40 10% 78%)' }}>
              {subtitle}
            </p>
            <p className="text-lg md:text-xl max-w-3xl mb-6" style={{ color: 'hsl(40 10% 78%)' }}>
              {summary}
            </p>
            <p className="uppercase tracking-[0.25em] text-lg md:text-xl mb-10" style={{ color: 'hsl(0 55% 35%)' }}>
              {eventDate}
            </p>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="text-base font-bold tracking-wide" style={{
                background: 'hsl(0 55% 35%)',
                color: 'hsl(40 10% 90%)',
              }}>
                <a href={registrationUrl} target="_blank" rel="noreferrer">
                  Register on SweatPals
                </a>
              </Button>
              <Button asChild size="lg" className="text-base font-bold tracking-wide" style={{
                background: 'hsl(40 10% 90%)',
                color: 'hsl(0 0% 7%)',
                border: 'none',
              }}>
                <a href="#sponsor">Sponsor the Mission</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why We Ruck */}
      <section className="py-20 border-y" style={{
        background: 'hsl(0 0% 10%)',
        borderColor: 'hsl(0 0% 16%)',
      }}>
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Moon className="h-10 w-10 mx-auto mb-6" style={{ color: 'hsl(40 10% 78%)' }} />
            <h2 className="text-3xl md:text-5xl font-heading font-black uppercase mb-8" style={{ color: 'hsl(40 10% 90%)' }}>
              Why We Ruck
            </h2>
            <p className="text-lg md:text-xl leading-relaxed" style={{ color: 'hsl(40 10% 65%)' }}>
              Every man carries weight. Some of it is visible, most of it is not. This overnight marathon ruck is how we confront that weight together and raise support for men's mental health.
            </p>
          </div>
        </div>
      </section>

      {/* Event Specs */}
      <section className="py-20" style={{ background: 'hsl(0 0% 7%)' }}>
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-heading font-black uppercase text-center mb-12" style={{ color: 'hsl(40 10% 90%)' }}>
              Event Specs
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {marathonRuckSpecs.map((spec, index) => {
                const Icon = specIcons[index];
                return (
                  <Card key={spec.label} className="border-2" style={{
                    background: 'hsl(0 0% 12%)',
                    borderColor: 'hsl(0 0% 18%)',
                  }}>
                    <CardContent className="p-8 text-center">
                      <Icon className="h-9 w-9 mx-auto mb-5" style={{ color: 'hsl(0 55% 35%)' }} />
                      <p className="text-xs uppercase tracking-[0.24em] mb-3" style={{ color: 'hsl(40 10% 55%)' }}>
                        {spec.label}
                      </p>
                      <p className="text-2xl font-heading font-bold uppercase mb-3" style={{ color: 'hsl(40 10% 90%)' }}>
                        {spec.value}
                      </p>
                      <p style={{ color: 'hsl(40 10% 60%)' }}>{spec.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Sponsor */}
      <section id="sponsor" className="py-20 border-y" style={{
        background: 'hsl(0 0% 10%)',
        borderColor: 'hsl(0 0% 16%)',
      }}>
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-heading font-black uppercase mb-5" style={{ color: 'hsl(40 10% 90%)' }}>
                Partner with the Mission
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: 'hsl(40 10% 60%)' }}>
                Align your brand with brotherhood, resilience, and action for men's mental health.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {marathonRuckSponsorPoints.map((item, index) => {
                const Icon = sponsorIcons[index] || Mountain;
                return (
                  <Card key={item.title} className="border-2" style={{
                    background: 'hsl(0 0% 12%)',
                    borderColor: 'hsl(0 0% 18%)',
                  }}>
                    <CardContent className="p-8">
                      <Icon className="h-7 w-7 mb-4" style={{ color: 'hsl(0 55% 35%)' }} />
                      <h3 className="text-2xl font-heading font-bold mb-3 uppercase" style={{ color: 'hsl(40 10% 90%)' }}>
                        {item.title}
                      </h3>
                      <p style={{ color: 'hsl(40 10% 60%)' }}>{item.copy}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center">
              <Button asChild size="lg" className="text-base font-bold tracking-wide" style={{
                background: 'hsl(0 55% 35%)',
                color: 'hsl(40 10% 90%)',
              }}>
                <a href="mailto:community@meninthearena.co?subject=Marathon%20Ruck%20Sponsorship">
                  Request Sponsorship Kit
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-20" style={{ background: 'hsl(0 0% 7%)' }}>
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl md:text-3xl italic leading-relaxed" style={{ color: 'hsl(40 10% 78%)' }}>
              "It is not the critic who counts; not the man who points out how the strong man stumbles."
            </p>
            <p className="uppercase tracking-[0.24em] text-sm mt-8" style={{ color: 'hsl(0 55% 35%)' }}>
              - Theodore Roosevelt
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center" style={{
        background: 'linear-gradient(to bottom, hsl(0 0% 10%), hsl(0 0% 7%))',
      }}>
        <div className="container px-4">
          <h2 className="text-3xl md:text-5xl font-heading font-black uppercase mb-6" style={{ color: 'hsl(40 10% 90%)' }}>
            Ready to Carry the Weight?
          </h2>
          <p className="max-w-2xl mx-auto mb-8 text-lg" style={{ color: 'hsl(40 10% 60%)' }}>
            Register for the marathon ruck, show up prepared, and move with men who refuse to walk alone.
          </p>
          <Button asChild size="lg" className="text-base font-bold tracking-wide" style={{
            background: 'hsl(0 55% 35%)',
            color: 'hsl(40 10% 90%)',
          }}>
            <a href={registrationUrl} target="_blank" rel="noreferrer">
              Register on SweatPals
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
