import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      quote: "I went from having zero close friends to having a brotherhood I can count on. These men showed up for me when I needed it most.",
      author: "James M.",
      role: "Member since 2022"
    },
    {
      quote: "The workouts push me physically, but the real transformation has been mental and emotional. I'm a better husband and father because of this community.",
      author: "Michael S.",
      role: "Member since 2023"
    },
    {
      quote: "I was skeptical about 'men's groups' but this is different. It's about action, not just talk. We show up, we do the work, we hold each other accountable.",
      author: "David R.",
      role: "Member since 2021"
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
            <Card key={index} className="border-none shadow-lg">
              <CardContent className="pt-6">
                <Quote className="w-10 h-10 text-accent mb-4" />
                <p className="text-lg mb-6 leading-relaxed">{testimonial.quote}</p>
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
