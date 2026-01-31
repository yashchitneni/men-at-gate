import { useParams, Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfiles';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Instagram, Loader2, User, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: profile, isLoading, error } = useProfile(id || '');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32 text-center">
          <h1 className="text-2xl font-heading font-bold">Member not found</h1>
          <Button asChild className="mt-4">
            <Link to="/men">Back to The Men</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const photoUrl = profile.primary_photo?.photo_url || 
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=700&fit=crop&crop=face';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-20 relative overflow-hidden">
        {/* Diagonal background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-background" />
        
        <div className="container px-4 relative z-10">
          <Link to="/men" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to The Men
          </Link>

          <div className="grid md:grid-cols-5 gap-8 md:gap-12 pb-16">
            {/* Photo - Left Column */}
            <motion.div 
              className="md:col-span-2"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={photoUrl} 
                  alt={profile.full_name || 'Member'} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  {profile.role && (
                    <Badge className="bg-accent/90 text-accent-foreground mb-2">
                      {profile.role}
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Info - Right Column */}
            <motion.div 
              className="md:col-span-3 flex flex-col justify-center"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="font-heading text-4xl md:text-6xl font-black uppercase tracking-tight">
                {profile.full_name || 'Unknown Member'}
              </h1>
              
              {profile.role && (
                <p className="text-accent text-lg font-semibold mt-2">{profile.role}</p>
              )}

              {/* Bio */}
              {profile.bio && (
                <motion.div 
                  className="mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3 font-semibold">About</h2>
                  <p className="text-lg text-foreground/90 leading-relaxed">{profile.bio}</p>
                </motion.div>
              )}

              {/* Mission */}
              {profile.mission && (
                <motion.div 
                  className="mt-8 border-l-4 border-accent pl-6 py-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Quote className="h-4 w-4 text-accent" />
                    <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Mission</h2>
                  </div>
                  <p className="text-lg italic text-foreground/80">{profile.mission}</p>
                </motion.div>
              )}

              {/* Socials */}
              <motion.div 
                className="mt-8 flex gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {profile.instagram_handle && (
                  <a 
                    href={`https://instagram.com/${profile.instagram_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors text-accent"
                  >
                    <Instagram className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      @{profile.instagram_handle.replace('@', '')}
                    </span>
                  </a>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section - Placeholder for when points system is built */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <h2 className="font-heading text-2xl font-bold mb-8 text-center">Activity</h2>
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { label: 'Workouts', value: '—' },
              { label: 'Races', value: '—' },
              { label: 'Points', value: '—' },
            ].map((stat) => (
              <motion.div 
                key={stat.label}
                className="text-center p-4 rounded-xl bg-background border"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl font-heading font-black text-accent">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">Stats coming soon</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
