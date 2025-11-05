import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Mission from "@/components/Mission";
import Story from "@/components/Story";
import Pillars from "@/components/Pillars";
import Events from "@/components/Events";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <Stats />
      <div id="mission">
        <Mission />
      </div>
      <Story />
      <div id="pillars">
        <Pillars />
      </div>
      <Events />
      <div id="testimonials">
        <Testimonials />
      </div>
      <div id="faq">
        <FAQ />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
