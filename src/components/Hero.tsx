import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-workout.jpg";
import type { FeaturedEvent } from "@/types/database.types";
import { isExternalUrl } from "@/lib/url";
import { Link } from "react-router-dom";

interface HeroProps {
  featuredEvent?: FeaturedEvent | null;
}

const Hero = ({ featuredEvent = null }: HeroProps) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const featuredCtaUrl = featuredEvent?.hero_cta_url || featuredEvent?.event_path || "/events";

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image/Video with Parallax Effect */}
      <div className="absolute inset-0 z-0">
        {/* Gradient Overlay - Adjusted for better image visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gritty-texture opacity-20 z-10 mix-blend-overlay" />

        {/* TODO: Future Video Background Implementation
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover object-center scale-105"
        >
          <source src="/path/to/video.mp4" type="video/mp4" />
        </video>
        */}

        <img
          src={heroImage}
          alt="Men in the Arena Workout"
          className="w-full h-full object-cover object-center scale-105 animate-pulse-slow"
        />
      </div>

      {/* Content */}
      <div className="relative z-20 container h-full flex flex-col justify-center px-4 md:px-8 lg:px-16">
        <div className="max-w-3xl">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-heading font-black leading-[0.9] mb-8 tracking-tighter uppercase text-accent animate-fade-in" style={{ animationDelay: "150ms" }}>
            <span className="block">MEN</span>
            <span className="block">IN THE</span>
            <span className="block">ARENA</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-xl leading-relaxed animate-fade-in font-light" style={{ animationDelay: "400ms" }}>
            Stop walking through life alone. Join a brotherhood that challenges you to be physically harder, mentally stronger, and spiritually alive.
          </p>

          {featuredEvent && (
            <div className="mb-8 p-4 border border-accent/40 bg-black/40 backdrop-blur-sm max-w-2xl animate-fade-in" style={{ animationDelay: "450ms" }}>
              <p className="text-xs uppercase tracking-[0.25em] text-accent mb-2">
                {featuredEvent.badge_text || "Featured Event"}
              </p>
              <p className="text-lg md:text-xl font-heading font-bold uppercase tracking-wide text-white">
                {featuredEvent.title}
              </p>
              {featuredEvent.event_date_text && (
                <p className="text-sm uppercase tracking-[0.2em] text-white/80 mt-2">
                  {featuredEvent.event_date_text}
                </p>
              )}
              <div className="mt-4">
                <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground uppercase tracking-wider font-bold rounded-none">
                  {isExternalUrl(featuredCtaUrl) ? (
                    <a href={featuredCtaUrl} target="_blank" rel="noreferrer">
                      {featuredEvent.hero_cta_label || "View Event"}
                    </a>
                  ) : (
                    <Link to={featuredCtaUrl}>{featuredEvent.hero_cta_label || "View Event"}</Link>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-6 animate-fade-in" style={{ animationDelay: "500ms" }}>
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-white text-lg px-12 py-8 h-auto uppercase font-bold tracking-widest transition-all duration-300 rounded-none border-2 border-accent"
              onClick={() => scrollToSection('get-involved')}
            >
              Enter the Arena
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black text-lg px-12 py-8 h-auto uppercase font-bold tracking-widest transition-all duration-300 rounded-none"
              onClick={() => scrollToSection('mission')}
            >
              Our Mission
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce hidden md:block">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
          <div className="w-1 h-2 bg-accent rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
