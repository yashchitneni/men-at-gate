import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-workout.jpg";

const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/70" />
      </div>
      
      <div className="container relative z-10 px-4 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-primary-foreground">
          Enter the Arena.
        </h1>
        <p className="text-2xl md:text-3xl mb-8 text-primary-foreground/90 max-w-3xl mx-auto font-light">
          Rise as the Man You Were Meant to Be.
        </p>
        <p className="text-lg md:text-xl mb-12 text-primary-foreground/80 max-w-2xl mx-auto">
          We help men transform through duty, challenge, reflection, and fellowship.
        </p>
        <Button 
          size="lg" 
          className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 h-auto"
          onClick={() => scrollToSection('events')}
        >
          Join a Workout
        </Button>
      </div>
    </section>
  );
};

export default Hero;
