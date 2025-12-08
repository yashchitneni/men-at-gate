import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Mission from "@/components/Mission";
import Story from "@/components/Story";
/* Framework/Pillars removed per feedback */
import Impact from "@/components/Impact";
import GetInvolved from "@/components/GetInvolved";
/* Events removed per feedback */
/* Testimonials not shown on homepage per preference */
import Vision from "@/components/Vision";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Hero />
      <Stats />
      <Mission />
      {/* <Pillars /> removed */}
      <Story />
      <Impact />
      <GetInvolved />
      {/* <Events /> removed */}
      <Vision />
      <FAQ />
      <Footer />
    </div >
  );
};

export default Index;
