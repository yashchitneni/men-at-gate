import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicBrotherhoodProfile } from "@/types/database.types";

function initialsFromName(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

interface FeaturedMemberProps {
  featuredMember: PublicBrotherhoodProfile | null;
  isLoading?: boolean;
}

export default function FeaturedMember({ featuredMember, isLoading = false }: FeaturedMemberProps) {
  if (isLoading || !featuredMember) return null;

  const spotlightText = featuredMember.short_bio?.trim() || featuredMember.why_i_joined?.trim() || null;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-sm uppercase tracking-widest text-accent mb-2 text-center">Featured Brother</h2>
          <h3 className="font-heading text-3xl md:text-4xl font-black text-center mb-12">Man in the Spotlight</h3>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            className="grid md:grid-cols-5 gap-8 items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="md:col-span-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl group">
                {featuredMember.photo_url ? (
                  <img
                    src={featuredMember.photo_url}
                    alt={featuredMember.display_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent/20 via-background to-foreground/20 flex items-center justify-center">
                    <span className="font-heading text-6xl font-black tracking-tight text-foreground/80">
                      {initialsFromName(featuredMember.display_name)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-3">
              <h4 className="font-heading text-3xl font-black uppercase">{featuredMember.display_name}</h4>
              {featuredMember.profile_role && <p className="text-accent font-semibold mt-1">{featuredMember.profile_role}</p>}

              {spotlightText && <p className="text-foreground/80 mt-4 text-lg leading-relaxed">{spotlightText}</p>}

              {featuredMember.mission && (
                <div className="mt-6 border-l-4 border-accent pl-4 py-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Quote className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Mission</span>
                  </div>
                  <p className="italic text-foreground/70">{featuredMember.mission}</p>
                </div>
              )}

              <Button asChild className="mt-6 bg-accent hover:bg-accent/90">
                <Link to={`/brotherhood/${featuredMember.slug}`}>
                  View Full Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
