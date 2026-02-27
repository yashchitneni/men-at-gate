import { Button } from "@/components/ui/button";
import type { FeaturedEvent } from "@/types/database.types";
import { isExternalUrl } from "@/lib/url";
import { Link } from "react-router-dom";
import { DEFAULT_MARATHON_RUCK_IMAGE_URL, MARATHON_RUCK_SLUG } from "@/data/events";

interface FeaturedEventSpotlightProps {
  event: FeaturedEvent | null;
}

const FeaturedEventSpotlight = ({ event }: FeaturedEventSpotlightProps) => {
  if (!event) return null;

  const destination = event.hero_cta_url || event.event_path;
  const title = event.title;
  const subtitle = event.subtitle || "Major event spotlight";
  const eventSummary = event.summary || "Step into the arena and be part of the mission.";
  const badgeText = event.badge_text || "Featured Event";
  const spotlightImage =
    event.slug === MARATHON_RUCK_SLUG
      ? DEFAULT_MARATHON_RUCK_IMAGE_URL
      : event.image_url;

  return (
    <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-gritty-texture opacity-20 pointer-events-none" />
      <div className="container px-4 relative z-10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-stretch">
          <div className="p-8 md:p-10 border border-primary-foreground/20 bg-primary-foreground/5 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-accent mb-4">{badgeText}</p>
            <h2 className="text-3xl md:text-5xl font-heading font-black uppercase tracking-tight mb-4">
              {title}
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-3">{subtitle}</p>
            {event.event_date_text && (
              <p className="text-sm uppercase tracking-[0.2em] text-accent mb-6">
                {event.event_date_text}
              </p>
            )}
            <p className="text-primary-foreground/80 leading-relaxed mb-8">{eventSummary}</p>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {isExternalUrl(destination) ? (
                  <a href={destination} target="_blank" rel="noreferrer">
                    {event.hero_cta_label || "View Event"}
                  </a>
                ) : (
                  <Link to={destination}>{event.hero_cta_label || "View Event"}</Link>
                )}
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/events">All Events</Link>
              </Button>
            </div>
          </div>

          <div className="min-h-[300px] border border-primary-foreground/20 overflow-hidden">
            {spotlightImage ? (
              <img
                src={spotlightImage}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-accent/30 via-transparent to-accent/10 flex items-center justify-center p-10 text-center">
                <p className="text-2xl md:text-3xl uppercase tracking-wide font-heading">{title}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedEventSpotlight;
