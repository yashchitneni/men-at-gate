import { Quote, X } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { useState } from "react";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/hero-workout.jpg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const Impact = () => {
  const [selectedTestimonial, setSelectedTestimonial] = useState<number | null>(null);

  const testimonials = [
    {
      quote: "Brothers who show up for each other when it matters most. This group has leveled me up in every way.",
      fullQuote: "Men in the Arena quickly became my community when I moved to Austin. It was the group of men I didn't know I needed. Brothers who show up for each other when it matters most. This group has leveled me up in every way: fitness, mindset, leadership, and personal growth. I'm proud to help organize and lead it, and I truly believe there's a place for every man here.",
      author: "Jake Morsch",
      role: "Member since 2022"
    },
    {
      quote: "The honesty and brotherhood here are unlike anything I've been part of. It's a lifeline.",
      fullQuote: "Men in the Arena has been a place for me to reset, connect, and push myself with other men who want to grow. It challenged me not just as an athlete but as a leader. Leading four workouts taught me how to motivate, guide, and hold others accountable while being stretched myself. The honesty and brotherhood here are unlike anything I've been part of.",
      author: "Robin",
      role: "Member since 2023"
    },
    {
      quote: "For the first time in 15 years, I felt welcomed, seen, and connected with men who actually knew my name.",
      fullQuote: "In April 2023, I was coming out of a breakup and a divorce, feeling lost and without any real community. Finding Men in the Arena on Eventbrite changed everything. I showed up once and haven't stopped since. For the first time in 15 years, I felt welcomed, seen, and connected with men who actually knew my name. MTA gave me the brotherhood and support I didn't even realize I needed.",
      author: "Blair",
      role: "Member since 2021"
    }
  ];

  return (
    <section className="relative py-32 bg-black text-white overflow-hidden min-h-[800px] flex items-center">
      {/* Background Image - Group Photo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/80 z-10" /> {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black z-10" />
        <img
          src={heroImage}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="relative z-10">
              <ScrollReveal delay={index * 100} animation="slide-up">
                <div
                  className="bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10 transition-all duration-300 group flex flex-col cursor-pointer relative overflow-hidden hover:bg-white/10 hover:border-white/20 h-full"
                  onClick={() => setSelectedTestimonial(index)}
                >
                  <Quote className="w-10 h-10 text-accent/50 group-hover:text-accent transition-colors mb-6" />

                  <p className="text-lg md:text-xl font-light leading-relaxed mb-8 flex-1 text-gray-200">
                    "{testimonial.quote}"
                  </p>

                  <div className="border-t border-white/10 pt-6 mt-auto">
                    <h4 className="text-lg font-bold text-white uppercase tracking-widest mb-1">{testimonial.author}</h4>
                    <p className="text-sm text-accent uppercase tracking-wider">{testimonial.role}</p>
                    <p className="text-xs text-gray-500 mt-4 uppercase tracking-widest group-hover:text-white transition-colors">Click to read full story</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={selectedTestimonial !== null} onOpenChange={() => setSelectedTestimonial(null)}>
        <DialogContent className="bg-black/95 border-white/10 text-white sm:max-w-2xl rounded-xl backdrop-blur-xl p-8 md:p-12">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-heading font-bold uppercase tracking-wide flex items-center gap-3">
              <Quote className="w-8 h-8 text-accent" />
              {selectedTestimonial !== null && testimonials[selectedTestimonial].author}
            </DialogTitle>
            <DialogDescription className="text-accent uppercase tracking-wider font-medium">
              {selectedTestimonial !== null && testimonials[selectedTestimonial].role}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <p className="text-xl leading-relaxed text-gray-200 font-light">
              "{selectedTestimonial !== null && testimonials[selectedTestimonial].fullQuote}"
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Impact;
