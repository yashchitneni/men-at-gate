import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import FeaturedEventSpotlight from "@/components/FeaturedEventSpotlight";
import Stats from "@/components/Stats";
import Mission from "@/components/Mission";
import Story from "@/components/Story";
/* Framework/Pillars removed per feedback */
import Impact from "@/components/Impact";
import GetInvolved from "@/components/GetInvolved";
/* Events removed per feedback */
/* Testimonials not shown on homepage per preference */
import FeaturedMember from "@/components/FeaturedMember";
import Vision from "@/components/Vision";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import { useActiveFeaturedEvent } from "@/hooks/useFeaturedEvents";

const Index = () => {
  const { data: featuredEvent } = useActiveFeaturedEvent();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />
      <Hero featuredEvent={featuredEvent} />
      <FeaturedEventSpotlight event={featuredEvent} />
      <Stats />
      <Mission />
      {/* <Pillars /> removed */}
      <Story />
      <Impact />
      <GetInvolved />
      <FeaturedMember />
      {/* <Events /> removed */}
      <Vision />
      <FAQ />
      <Footer />
    </div >
  );
};

export default Index;
