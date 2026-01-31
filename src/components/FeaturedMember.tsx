import { useCoreRoster } from '@/hooks/useProfiles';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FeaturedMember() {
  const { data: members } = useCoreRoster();

  // Rotate featured member daily based on date
  const featured = useMemo(() => {
    if (!members?.length) return null;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return members[dayOfYear % members.length];
  }, [members]);

  if (!featured) return null;

  const photoUrl = featured.primary_photo?.photo_url ||
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face';

  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-sm uppercase tracking-widest text-accent mb-2 text-center">
            Featured Brother
          </h2>
          <h3 className="font-heading text-3xl md:text-4xl font-black text-center mb-12">
            Man in the Spotlight
          </h3>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="grid md:grid-cols-5 gap-8 items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Photo */}
            <div className="md:col-span-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl group">
                <img 
                  src={photoUrl} 
                  alt={featured.full_name || 'Featured Member'} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            </div>

            {/* Info */}
            <div className="md:col-span-3">
              <h4 className="font-heading text-3xl font-black uppercase">
                {featured.full_name}
              </h4>
              {featured.role && (
                <p className="text-accent font-semibold mt-1">{featured.role}</p>
              )}
              
              {featured.bio && (
                <p className="text-foreground/80 mt-4 text-lg leading-relaxed">
                  {featured.bio}
                </p>
              )}

              {featured.mission && (
                <div className="mt-6 border-l-4 border-accent pl-4 py-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Quote className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Mission</span>
                  </div>
                  <p className="italic text-foreground/70">{featured.mission}</p>
                </div>
              )}

              <Button asChild className="mt-6 bg-accent hover:bg-accent/90">
                <Link to={`/men/${featured.id}`}>
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
