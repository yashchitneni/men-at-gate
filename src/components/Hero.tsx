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
        <div className="absolute inset-0 bg-black/75" />
      </div>
      
      <div className="container relative z-10 px-4 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
          Enter the Arena.
        </h1>
        <p className="text-2xl md:text-3xl mb-8 text-white/95 max-w-3xl mx-auto font-light">
          Rise as the Man You Were Meant to Be.
        </p>
        <p className="text-lg md:text-xl mb-12 text-white/90 max-w-2xl mx-auto">
          We help men transform through duty, challenge, reflection, and fellowship.
        </p>
        <Button 
          size="lg" 
          className="bg-[#1e3a5f] hover:bg-[#2a4a75] text-white text-lg px-8 py-6 h-auto"
          onClick={() => scrollToSection('events')}
        >
          Join a Workout
        </Button>
      </div>
    </section>
  );
};

export default Hero;
