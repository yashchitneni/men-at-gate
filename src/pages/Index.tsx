import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Mission from "@/components/Mission";
import Story from "@/components/Story";
import Pillars from "@/components/Pillars";
import Impact from "@/components/Impact";
import GetInvolved from "@/components/GetInvolved";
import Events from "@/components/Events";
import Testimonials from "@/components/Testimonials";
import Vision from "@/components/Vision";
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
      <Impact />
      <GetInvolved />
      <Events />
      <div id="testimonials">
        <Testimonials />
      </div>
      <Vision />
      <div id="faq">
        <FAQ />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
