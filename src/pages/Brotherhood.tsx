import { Link } from "react-router-dom";
import { Loader2, Quote } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { findActiveFeaturedProfile, useBrotherhoodDirectory } from "@/hooks/useSpotlights";


function initialsFromName(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Brotherhood() {
  const { data: members = [], isLoading } = useBrotherhoodDirectory();
  const featured = findActiveFeaturedProfile(members);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-24 pb-20">
        <section className="container px-4">
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-black font-heading uppercase tracking-tight">Brotherhood</h1>
              <p className="text-muted-foreground mt-3 text-lg">
                Meet the men building momentum together inside Men in the Arena.
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                {featured && (
                  <Card className="mb-10 overflow-hidden border-accent/40">
                    <div className="grid md:grid-cols-[280px_1fr]">
                      <div className="h-72 md:h-full">
                        {featured.photo_url ? (
                          <img
                            src={featured.photo_url}
                            alt={featured.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 via-background to-foreground/20 text-3xl font-black tracking-tight">
                            {initialsFromName(featured.display_name)}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-8 flex flex-col justify-center gap-4">
                        <div className="flex items-center gap-2">
                          <Badge>Featured Spotlight</Badge>
                          {featured.profile_role && <Badge variant="secondary">{featured.profile_role}</Badge>}
                        </div>
                        <h2 className="text-3xl font-black font-heading uppercase tracking-tight">{featured.display_name}</h2>
                        {featured.headline && <p className="text-lg text-foreground/80">{featured.headline}</p>}
                        {(featured.arena_meaning || featured.why_i_joined) && (
                          <p className="text-muted-foreground leading-relaxed">
                            <Quote className="inline h-4 w-4 mr-1 text-accent" />
                            {featured.arena_meaning || featured.why_i_joined}
                          </p>
                        )}
                        <div>
                          <Button asChild>
                            <Link to={`/brotherhood/${featured.slug}`}>Read Spotlight</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                )}

                {members.length === 0 ? (
                  <Card>
                    <CardContent className="py-16 text-center text-muted-foreground">
                      No published member spotlights yet.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map((member) => (
                    <Link key={member.spotlight_submission_id} to={`/brotherhood/${member.slug}`}>
                        <Card className="overflow-hidden hover:border-accent/50 transition-colors h-full">
                          <div className="aspect-[4/5] overflow-hidden">
                            {member.photo_url ? (
                              <img
                                src={member.photo_url}
                                alt={member.display_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 via-background to-foreground/20 text-3xl font-black tracking-tight">
                                {initialsFromName(member.display_name)}
                              </div>
                            )}
                          </div>
                          <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-heading font-black uppercase tracking-tight">{member.display_name}</h3>
                              {member.is_featured && <Badge variant="secondary">Featured</Badge>}
                            </div>
                            {member.profile_role && (
                              <p className="text-sm font-medium text-accent mb-2">{member.profile_role}</p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {member.arena_meaning || member.short_bio || member.why_i_joined || "Read this member spotlight."}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
