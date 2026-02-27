import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Instagram, Loader2, Quote } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBrotherhoodProfileBySlug } from "@/hooks/useSpotlights";

const FALLBACK_MEMBER_IMAGE =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=900&fit=crop&crop=face";

export default function BrotherhoodProfile() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: member, isLoading } = useBrotherhoodProfileBySlug(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-32 pb-24 container px-4 text-center">
          <h1 className="text-3xl font-heading font-black uppercase tracking-tight">Spotlight Not Found</h1>
          <p className="text-muted-foreground mt-3">This member spotlight is unavailable.</p>
          <Button className="mt-6" asChild>
            <Link to="/brotherhood">Back to Brotherhood</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-20 pb-20">
        <section className="container px-4">
          <div className="max-w-5xl mx-auto">
            <Link to="/brotherhood" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Brotherhood
            </Link>

            <div className="grid md:grid-cols-[340px_1fr] gap-8 md:gap-12">
              <div>
                <div className="rounded-2xl overflow-hidden border">
                  <img
                    src={member.photo_url || FALLBACK_MEMBER_IMAGE}
                    alt={member.display_name}
                    className="w-full aspect-[4/5] object-cover"
                  />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {member.profile_role && <Badge variant="secondary">{member.profile_role}</Badge>}
                  {member.is_featured && <Badge>Featured Spotlight</Badge>}
                </div>

                <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-tight">
                  {member.display_name}
                </h1>

                {member.headline && <p className="mt-3 text-lg text-foreground/80">{member.headline}</p>}

                {member.short_bio && (
                  <div className="mt-8">
                    <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-2">About</h2>
                    <p className="text-lg leading-relaxed text-foreground/90">{member.short_bio}</p>
                  </div>
                )}

                {member.why_i_joined && (
                  <div className="mt-8 border-l-4 border-accent pl-5 py-1">
                    <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-2 flex items-center gap-2">
                      <Quote className="h-4 w-4 text-accent" />
                      Why I Joined
                    </h2>
                    <p className="text-lg italic text-foreground/85">{member.why_i_joined}</p>
                  </div>
                )}

                {member.mission && (
                  <div className="mt-8">
                    <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-2">Mission</h2>
                    <p className="text-lg leading-relaxed text-foreground/90">{member.mission}</p>
                  </div>
                )}

                {member.instagram_handle && (
                  <div className="mt-8">
                    <a
                      href={`https://instagram.com/${member.instagram_handle.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors text-accent"
                    >
                      <Instagram className="h-4 w-4" />
                      @{member.instagram_handle.replace("@", "")}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
