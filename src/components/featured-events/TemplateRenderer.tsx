import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isExternalUrl } from "@/lib/url";
import {
  asObject,
  buildTemplateBlocks,
  type FeaturedEventBlockDraft,
} from "@/lib/featuredEventTemplates";
import type { FeaturedEvent, FeaturedEventBlock } from "@/types/database.types";

interface TemplateRendererProps {
  event: FeaturedEvent;
  blocks: FeaturedEventBlock[];
}

type JsonItem = Record<string, unknown>;

function getString(content: JsonItem, key: string, fallback = ""): string {
  const value = content[key];
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function getItems(content: JsonItem): JsonItem[] {
  const value = content.items;
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is JsonItem => typeof item === "object" && item !== null && !Array.isArray(item));
}

function getImageList(content: JsonItem): string[] {
  const value = content.images;
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}

function CtaLink({ href, label }: { href: string; label: string }) {
  if (!href) return null;

  if (isExternalUrl(href)) {
    return (
      <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
        <a href={href} target="_blank" rel="noreferrer">
          {label}
        </a>
      </Button>
    );
  }

  return (
    <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
      <Link to={href}>{label}</Link>
    </Button>
  );
}

export default function TemplateRenderer({ event, blocks }: TemplateRendererProps) {
  const fallbackBlocks = buildTemplateBlocks(event.template_key, {
    title: event.title,
    subtitle: event.subtitle,
    summary: event.summary,
    badgeText: event.badge_text,
    dateText: event.event_date_text,
    registrationUrl: event.registration_url,
    heroImageUrl: event.hero_image_url || event.image_url,
  });

  const effectiveBlocks: FeaturedEventBlockDraft[] = (blocks.length
    ? blocks.map((block) => ({
        id: block.id,
        block_type: block.block_type,
        position: block.position,
        is_enabled: block.is_enabled,
        content_json: block.content_json,
        image_url: block.image_url,
        image_confirmed: block.image_confirmed,
      }))
    : fallbackBlocks
  )
    .filter((block) => block.is_enabled)
    .sort((left, right) => left.position - right.position);

  const heroBlock = effectiveBlocks.find((block) => block.block_type === "hero");
  const heroContent = asObject(heroBlock?.content_json);
  const heroImage = heroBlock?.image_url || event.hero_image_url || event.image_url || event.cover_image_url;
  const heroTitle = getString(heroContent, "title", event.title);
  const heroSubtitle = getString(heroContent, "subtitle", event.subtitle || "");
  const heroSummary = getString(heroContent, "summary", event.summary || "");
  const heroDate = getString(heroContent, "date", event.event_date_text || "");
  const heroBadge = getString(heroContent, "badge", event.badge_text || "Featured Event");
  const heroCtaLabel = getString(heroContent, "cta_label", event.hero_cta_label || "View Event");
  const heroCtaUrl = getString(heroContent, "cta_url", event.registration_url || event.hero_cta_url || event.event_path);

  return (
    <div className="bg-background text-foreground">
      <section className="relative min-h-[80vh] flex items-center pt-20 overflow-hidden">
        {heroImage && (
          <div className="absolute inset-0">
            <img src={heroImage} alt={heroTitle} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60" />
          </div>
        )}
        <div className="container px-4 relative z-10 py-16">
          <p className="text-xs uppercase tracking-[0.25em] text-accent mb-4">{heroBadge}</p>
          <h1 className="text-5xl md:text-7xl font-heading font-black uppercase tracking-tight mb-6 text-primary-foreground">
            {heroTitle}
          </h1>
          {heroSubtitle && <p className="text-xl text-primary-foreground/90 mb-2">{heroSubtitle}</p>}
          {heroDate && <p className="text-sm uppercase tracking-[0.2em] text-accent mb-6">{heroDate}</p>}
          {heroSummary && <p className="text-lg text-primary-foreground/80 max-w-3xl mb-8">{heroSummary}</p>}
          <div className="flex flex-wrap gap-4">
            <CtaLink href={heroCtaUrl} label={heroCtaLabel} />
            <Button asChild variant="outline" size="lg" className="border-primary-foreground/40 text-primary-foreground">
              <Link to="/events">All Events</Link>
            </Button>
          </div>
        </div>
      </section>

      {effectiveBlocks
        .filter((block) => block.block_type !== "hero")
        .map((block) => {
          const content = asObject(block.content_json);

          if (block.block_type === "mission") {
            return (
              <section key={block.id || `${block.block_type}-${block.position}`} className="py-20">
                <div className="container px-4 max-w-4xl">
                  <h2 className="text-3xl md:text-5xl font-heading font-black uppercase mb-6">
                    {getString(content, "heading", "Mission")}
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {getString(content, "body", event.summary || "")}
                  </p>
                </div>
              </section>
            );
          }

          if (block.block_type === "spec_grid") {
            const items = getItems(content);
            return (
              <section key={block.id || `${block.block_type}-${block.position}`} className="py-20 bg-muted/40">
                <div className="container px-4">
                  <h2 className="text-3xl md:text-5xl font-heading font-black uppercase mb-10 text-center">
                    {getString(content, "heading", "Event Specs")}
                  </h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {items.map((item, index) => (
                      <div key={`${block.position}-${index}`} className="border rounded-lg p-6 bg-background">
                        <p className="text-xs uppercase tracking-[0.2em] text-accent mb-2">{getString(item, "label", "Item")}</p>
                        <h3 className="text-2xl font-heading font-black uppercase mb-3">{getString(item, "value", "TBA")}</h3>
                        <p className="text-muted-foreground">{getString(item, "description", "")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          if (block.block_type === "schedule") {
            const items = getItems(content);
            return (
              <section key={block.id || `${block.block_type}-${block.position}`} className="py-20">
                <div className="container px-4 max-w-5xl">
                  <h2 className="text-3xl md:text-5xl font-heading font-black uppercase mb-10">
                    {getString(content, "heading", "Schedule")}
                  </h2>
                  <div className="space-y-6">
                    {items.map((item, index) => (
                      <div key={`${block.position}-${index}`} className="border-l-2 border-accent pl-6">
                        <h3 className="text-2xl font-heading font-bold uppercase mb-2">{getString(item, "title", "Session")}</h3>
                        <p className="text-muted-foreground">{getString(item, "copy", "")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          if (block.block_type === "sponsor_cta") {
            const ctaLabel = getString(content, "cta_label", "Contact Team");
            const ctaUrl = getString(content, "cta_url", "mailto:community@meninthearena.co");
            return (
              <section key={block.id || `${block.block_type}-${block.position}`} className="py-20 bg-muted/40">
                <div className="container px-4 max-w-4xl text-center">
                  <h2 className="text-3xl md:text-5xl font-heading font-black uppercase mb-6">
                    {getString(content, "heading", "Support the Mission")}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    {getString(content, "body", "")}
                  </p>
                  <CtaLink href={ctaUrl} label={ctaLabel} />
                </div>
              </section>
            );
          }

          if (block.block_type === "quote") {
            return (
              <section key={block.id || `${block.block_type}-${block.position}`} className="py-20 bg-primary text-primary-foreground">
                <div className="container px-4 max-w-4xl text-center">
                  <p className="text-3xl md:text-4xl italic mb-6">
                    "{getString(content, "quote", "")}" 
                  </p>
                  <p className="uppercase tracking-[0.25em] text-sm text-accent">
                    {getString(content, "author", "")}
                  </p>
                </div>
              </section>
            );
          }

          if (block.block_type === "gallery") {
            const images = getImageList(content);
            const galleryImages = images.length ? images : (block.image_url ? [block.image_url] : []);
            return (
              <section key={block.id || `${block.block_type}-${block.position}`} className="py-20">
                <div className="container px-4">
                  <h2 className="text-3xl md:text-5xl font-heading font-black uppercase mb-6 text-center">
                    {getString(content, "heading", "Gallery")}
                  </h2>
                  <p className="text-center text-muted-foreground mb-10">{getString(content, "body", "")}</p>
                  {galleryImages.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {galleryImages.map((image, index) => (
                        <div key={`${block.position}-gallery-${index}`} className="aspect-[4/3] overflow-hidden rounded-lg border">
                          <img src={image} alt={`${event.title} gallery ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">No gallery images added yet.</div>
                  )}
                </div>
              </section>
            );
          }

          if (block.block_type === "final_cta") {
            const ctaLabel = getString(content, "cta_label", "View Event");
            const ctaUrl = getString(content, "cta_url", event.registration_url || event.hero_cta_url || event.event_path);
            return (
              <section key={block.id || `${block.block_type}-${block.position}`} className="py-24 border-t">
                <div className="container px-4 max-w-4xl text-center">
                  <h2 className="text-4xl md:text-6xl font-heading font-black uppercase mb-6">
                    {getString(content, "heading", "Take the Next Step")}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    {getString(content, "body", "")}
                  </p>
                  <CtaLink href={ctaUrl} label={ctaLabel} />
                </div>
              </section>
            );
          }

          return null;
        })}
    </div>
  );
}
