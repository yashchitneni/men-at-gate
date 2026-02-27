import { Quote } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import heroWorkoutImage from "@/assets/hero-workout.jpg";
import type { PublicBrotherhoodProfile } from "@/types/database.types";

interface ImpactProps {
  testimonials: PublicBrotherhoodProfile[];
  isLoading?: boolean;
}

function getStorySnippet(testimonial: PublicBrotherhoodProfile) {
  return (
    testimonial.arena_meaning?.trim() ||
    testimonial.short_bio?.trim() ||
    testimonial.why_i_joined?.trim() ||
    testimonial.mission?.trim() ||
    ""
  );
}

const Impact = ({ testimonials, isLoading = false }: ImpactProps) => {
  const [selectedTestimonialId, setSelectedTestimonialId] = useState<string | null>(null);
  const selectedTestimonial =
    testimonials.find((testimonial) => testimonial.spotlight_submission_id === selectedTestimonialId) || null;

  return (
    <section className="relative py-32 bg-black text-white overflow-hidden min-h-[800px] flex items-center">
      {/* Background Image - Group Photo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/80 z-10" /> {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black z-10" />
        <img
          src={heroWorkoutImage}
          alt="Men in the Arena Brotherhood"
          className="w-full h-full object-cover object-center opacity-60 grayscale"
        />
      </div>

      <div className="container px-4 relative z-20">
        <ScrollReveal>
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-heading font-black mb-6 uppercase tracking-tighter text-white">
              Voices from<br /><span className="text-accent">The Arena</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              This isn't just a workout. It's a brotherhood that changes lives.
            </p>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="max-w-3xl mx-auto text-center text-gray-400">
            Loading member stories...
          </div>
        ) : testimonials.length === 0 ? (
          <div className="max-w-3xl mx-auto text-center text-gray-400">
            Member stories will appear here once spotlights are published.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={testimonial.spotlight_submission_id} className="relative z-10">
                <ScrollReveal delay={index * 100} animation="slide-up">
                  <button
                    type="button"
                    className="w-full text-left bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10 transition-all duration-300 group flex flex-col cursor-pointer relative overflow-hidden hover:bg-white/10 hover:border-white/20 h-full"
                    onClick={() => setSelectedTestimonialId(testimonial.spotlight_submission_id)}
                  >
                    <Quote className="w-10 h-10 text-accent/50 group-hover:text-accent transition-colors mb-6" />

                    <p className="text-lg md:text-xl font-light leading-relaxed mb-8 flex-1 text-gray-200 line-clamp-5">
                      "{getStorySnippet(testimonial)}"
                    </p>

                    <div className="border-t border-white/10 pt-6 mt-auto">
                      <h4 className="text-lg font-bold text-white uppercase tracking-widest mb-1">{testimonial.display_name}</h4>
                      <p className="text-sm text-accent uppercase tracking-wider">
                        {testimonial.profile_role || "Member Spotlight"}
                      </p>
                      <p className="text-xs text-gray-500 mt-4 uppercase tracking-widest group-hover:text-white transition-colors">
                        Click to read full story
                      </p>
                    </div>
                  </button>
                </ScrollReveal>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={selectedTestimonial !== null} onOpenChange={() => setSelectedTestimonialId(null)}>
        <DialogContent className="bg-black/95 border-white/10 text-white sm:max-w-2xl rounded-xl backdrop-blur-xl p-8 md:p-12">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-heading font-bold uppercase tracking-wide flex items-center gap-3">
              <Quote className="w-8 h-8 text-accent" />
              {selectedTestimonial?.display_name}
            </DialogTitle>
            <DialogDescription className="text-accent uppercase tracking-wider font-medium">
              {selectedTestimonial?.profile_role || "Member Spotlight"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {selectedTestimonial?.arena_meaning && (
              <p className="text-xl leading-relaxed text-gray-200 font-light">"{selectedTestimonial.arena_meaning}"</p>
            )}
            {selectedTestimonial?.short_bio && (
              <p className="text-gray-300 leading-relaxed italic">{selectedTestimonial.short_bio}</p>
            )}
            {!selectedTestimonial?.arena_meaning && selectedTestimonial?.why_i_joined && (
              <p className="text-xl leading-relaxed text-gray-200 font-light">"{selectedTestimonial.why_i_joined}"</p>
            )}
            {selectedTestimonial?.favorite_quotes && selectedTestimonial.favorite_quotes.length > 0 && (
              <div className="space-y-2">
                {selectedTestimonial.favorite_quotes.map((quote, index) => (
                  <p key={`${quote}-${index}`} className="text-gray-300 leading-relaxed italic">“{quote}”</p>
                ))}
              </div>
            )}
            {selectedTestimonial?.favorite_accomplishments && (
              <p className="text-gray-300 leading-relaxed">{selectedTestimonial.favorite_accomplishments}</p>
            )}
            {selectedTestimonial?.mission && (
              <p className="text-gray-300 leading-relaxed italic">{selectedTestimonial.mission}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Impact;
