import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      quote: "Men in the Arena has been a place for me to reset, connect, and push myself with other men who want to grow. It challenged me not just as an athlete but as a leader. Leading four workouts taught me how to motivate, guide, and hold others accountable while being stretched myself. The honesty and brotherhood here are unlike anything I've been part of.",
      author: "Robin",
      role: "Workout Leader"
    },
    {
      quote: "In April 2023, I was coming out of a breakup and a divorce, feeling lost and without any real community. Finding Men in the Arena on Eventbrite changed everything. I showed up once and haven't stopped since. For the first time in 15 years, I felt welcomed, seen, and connected with men who actually knew my name. MTA gave me the brotherhood and support I didn't even realize I needed.",
      author: "Blair",
      role: "Member since 2023"
    },
    {
      quote: "Men in the Arena quickly became my community when I moved to Austin. It was the group of men I didn't know I needed. Brothers who show up for each other when it matters most. This group has leveled me up in every way: fitness, mindset, leadership, and personal growth. I'm proud to help organize and lead it, and I truly believe there's a place for every man here. MTA is making a real difference in men's lives.",
      author: "Jake",
      role: "Organizer & Leader"
    }
  ];

  return (
    <section className="py-20 bg-subtle-gradient">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Testimonials</h2>
          <p className="text-lg text-muted-foreground">
            Hear from the men who've stepped into the arena
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-none shadow-lg flex flex-col">
              <CardContent className="pt-6 flex flex-col flex-1">
                <Quote className="w-10 h-10 text-accent mb-4" />
                <p className="text-lg mb-6 leading-relaxed flex-1">{testimonial.quote}</p>
                <div className="border-t pt-4">
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
