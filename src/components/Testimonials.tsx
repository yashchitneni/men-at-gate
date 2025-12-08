import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

const Testimonials = () => {
  const [selectedTestimonial, setSelectedTestimonial] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      preview: "Brothers who show up for each other when it matters most. This group has leveled me up in every way: fitness, mindset, leadership, and personal growth.",
      author: "Jake Morsch",
      quote: "Men in the Arena quickly became my community when I moved to Austin. It was the group of men I didn't know I needed. Brothers who show up for each other when it matters most. This group has leveled me up in every way: fitness, mindset, leadership, and personal growth. I'm proud to help organize and lead it, and I truly believe there's a place for every man here. MTA is making a real difference in men's lives."
    },
    {
      preview: "The honesty and brotherhood here are unlike anything I've been part of.",
      author: "Robin",
      quote: "Men in the Arena has been a place for me to reset, connect, and push myself with other men who want to grow. It challenged me not just as an athlete but as a leader. Leading four workouts taught me how to motivate, guide, and hold others accountable while being stretched myself. The honesty and brotherhood here are unlike anything I've been part of."
    },
    {
      preview: "For the first time in 15 years, I felt welcomed, seen, and connected with men who actually knew my name.",
      author: "Blair",
      quote: "In April 2023, I was coming out of a breakup and a divorce, feeling lost and without any real community. Finding Men in the Arena on Eventbrite changed everything. I showed up once and haven't stopped since. For the first time in 15 years, I felt welcomed, seen, and connected with men who actually knew my name. MTA gave me the brotherhood and support I didn't even realize I needed."
    }
  ];

  return (
    <>
      <section className="py-20 bg-subtle-gradient">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Real Change: <span className="text-accent">Voices from the Arena</span></h2>
            <p className="text-lg text-muted-foreground">
              Hear from the men who've stepped into the arena
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Carousel 
              opts={{ 
                align: "center",
                loop: false,
              }}
              className="w-full"
              setApi={(api) => {
                if (!api) return;
                
                setCurrentIndex(api.selectedScrollSnap());
                
                api.on("select", () => {
                  setCurrentIndex(api.selectedScrollSnap());
                });
              }}
            >
              <CarouselContent className="-ml-4">
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                    <Card className="border-none shadow-lg h-full">
                      <CardContent className="pt-8 pb-6 px-8 flex flex-col h-full">
                        <Quote className="w-16 h-16 text-accent mb-6 flex-shrink-0" />
                        <p className="text-lg mb-6 leading-relaxed flex-1">{testimonial.preview}</p>
                        <div className="border-t pt-4 flex-shrink-0">
                          <p className="font-semibold mb-3">— {testimonial.author}</p>
                          <button 
                            onClick={() => setSelectedTestimonial(index)}
                            className="text-primary hover:text-primary/80 font-medium underline underline-offset-4 transition-colors"
                          >
                            Read Full Story
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Pagination Dots */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex 
                        ? "bg-primary w-8" 
                        : "bg-muted-foreground/30"
                    }`}
                    onClick={() => {}}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      {/* Modal */}
      <Dialog open={selectedTestimonial !== null} onOpenChange={(open) => !open && setSelectedTestimonial(null)}>
        <DialogContent className="max-w-[90%] md:max-w-2xl p-6 md:p-8 rounded-xl">
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <div className="pt-2">
            <Quote className="w-12 h-12 text-accent mb-6" />
            <p className="text-lg leading-relaxed mb-4">
              "{selectedTestimonial !== null && testimonials[selectedTestimonial].quote}"
            </p>
            <p className="font-semibold text-accent text-lg mt-6">
              — {selectedTestimonial !== null && testimonials[selectedTestimonial].author}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Testimonials;
