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
import SuccessStory from "@/components/SuccessStory";
import Vision from "@/components/Vision";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Hero />
      <Stats />
      <Mission />
      <Pillars />
      <Story />
      <SuccessStory />
      <GetInvolved />
      <Events />
      <Impact />
      <Vision />
      <FAQ />
      <Footer />
    </div >
  );
};

export default Index;
