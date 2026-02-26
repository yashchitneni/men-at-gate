import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Footprints, HeartPulse } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={featuredEvent?.image_url || heroImage}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="container px-4 relative z-10 text-white">
          <div className="max-w-5xl mx-auto">
            <Link to="/events" className="inline-flex items-center text-white/80 hover:text-white mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
            <p className="text-xs uppercase tracking-[0.35em] text-accent mb-6">Men in the Arena Presents</p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black uppercase leading-[0.9] mb-6">
              {title}
            </h1>
            <p className="text-xl md:text-3xl uppercase tracking-[0.12em] text-white/85 mb-4">{subtitle}</p>
            <p className="text-lg md:text-xl max-w-3xl text-white/90 mb-6">{summary}</p>
            <p className="text-accent uppercase tracking-[0.25em] text-lg md:text-xl mb-10">{eventDate}</p>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <a href={registrationUrl} target="_blank" rel="noreferrer">
                  Register on SweatPals
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                <a href="#sponsor">Sponsor the Mission</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card border-y">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-heading font-black uppercase mb-8">Why We Ruck</h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Every man carries weight. Some of it is visible, most of it is not. This overnight marathon ruck is how we confront that weight together and raise support for men's mental health.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-heading font-black uppercase text-center mb-12">
              Event Specs
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {marathonRuckSpecs.map((spec, index) => {
                const Icon = specIcons[index];
                return (
                  <Card key={spec.label} className="border-2">
                    <CardContent className="p-8 text-center">
                      <Icon className="h-9 w-9 text-accent mx-auto mb-5" />
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground mb-3">{spec.label}</p>
                      <p className="text-2xl font-heading font-bold uppercase mb-3">{spec.value}</p>
                      <p className="text-muted-foreground">{spec.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="sponsor" className="py-20 bg-muted/20 border-y">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-heading font-black uppercase mb-5">
                Partner with the Mission
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Align your brand with brotherhood, resilience, and action for men's mental health.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {marathonRuckSponsorPoints.map((item) => (
                <Card key={item.title} className="border-2">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-heading font-bold mb-3 uppercase">{item.title}</h3>
                    <p className="text-muted-foreground">{item.copy}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <a href="mailto:contact@meninthearena.com?subject=Marathon%20Ruck%20Sponsorship">
                  Request Sponsorship Kit
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl md:text-3xl italic leading-relaxed">
              "It is not the critic who counts; not the man who points out how the strong man stumbles."
            </p>
            <p className="text-accent uppercase tracking-[0.24em] text-sm mt-8">- Theodore Roosevelt</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-black uppercase mb-6">
            Ready to Carry the Weight?
          </h2>
          <p className="text-primary-foreground/85 max-w-2xl mx-auto mb-8 text-lg">
            Register for the marathon ruck, show up prepared, and move with men who refuse to walk alone.
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
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
