import { useParams, Link } from 'react-router-dom';
import { useChapter } from '@/hooks/useChapters';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowRight, Users, Loader2 } from 'lucide-react';

export default function ChapterLanding() {
  const { slug } = useParams<{ slug: string }>();
  const { data: chapter, isLoading } = useChapter(slug || '');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32 text-center">
          <h1 className="text-2xl font-heading font-bold">Chapter not found</h1>
          <Button asChild className="mt-4">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-24 pb-16 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5"
          style={{ backgroundColor: chapter.primary_color }}
        />
        <div className="container px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {chapter.logo_url && (
              <img src={chapter.logo_url} alt={chapter.name} className="h-20 mx-auto mb-6" />
            )}
            <Badge className="mb-4" style={{ backgroundColor: chapter.primary_color }}>
              <MapPin className="h-3 w-3 mr-1" />
              {chapter.city}, {chapter.state}
            </Badge>
            <h1 className="font-heading text-5xl md:text-7xl font-black uppercase tracking-tight">
              MITA <span style={{ color: chapter.primary_color }}>{chapter.name}</span>
            </h1>
            {chapter.description && (
              <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
                {chapter.description}
              </p>
            )}
            {chapter.founded_date && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Founded {new Date(chapter.founded_date).getFullYear()}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { title: 'Workouts', desc: 'Join the next session', to: '/workouts', icon: '🏋️' },
              { title: 'Races', desc: 'Run with your brothers', to: '/races', icon: '🏃' },
              { title: 'The Men', desc: 'Meet the chapter', to: '/men', icon: '👊' },
            ].map((item, i) => (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <Link to={item.to}>
                  <div className="p-6 rounded-xl border bg-background hover:shadow-lg transition-all hover:border-accent group">
                    <div className="text-3xl mb-3">{item.icon}</div>
                    <h3 className="font-heading font-bold text-lg group-hover:text-accent transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                    <ArrowRight className="h-4 w-4 mt-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
