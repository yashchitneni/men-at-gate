import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TemplateRenderer from "@/components/featured-events/TemplateRenderer";
import { useFeaturedEventBySlug, useFeaturedEventBlocks } from "@/hooks/useFeaturedEvents";

interface FeaturedEventPageProps {
  forcedSlug?: string;
}

export default function FeaturedEventPage({ forcedSlug }: FeaturedEventPageProps) {
  const params = useParams<{ slug: string }>();
  const slug = forcedSlug || params.slug || "";

  const { data: featuredEvent, isLoading: eventLoading } = useFeaturedEventBySlug(slug, {
    publishedOnly: true,
  });

  const { data: blocks, isLoading: blocksLoading } = useFeaturedEventBlocks(featuredEvent?.id || null, {
    publishedOnly: true,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (eventLoading || (featuredEvent && blocksLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!featuredEvent) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <section className="pt-32 pb-20">
          <div className="container px-4 text-center">
            <h1 className="text-4xl font-heading font-black uppercase mb-4">Event Not Found</h1>
            <p className="text-muted-foreground">This featured event is not published yet.</p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <TemplateRenderer event={featuredEvent} blocks={blocks || []} />
      <Footer />
    </div>
  );
}
