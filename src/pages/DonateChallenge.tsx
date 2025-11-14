import { CheckCircle, Heart, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import gritTestHero from "@/assets/grit-test-hero.png";

const DonateChallenge = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Enter the Arena. Give Back.
              </h1>
              <h2 className="text-xl md:text-2xl text-muted-foreground mb-6">
                Join The Grit Test community challenge and turn your workout into impact.
              </h2>
              <p className="text-lg mb-8 leading-relaxed">
                Men in the Arena is a 501(c)(3) nonprofit calling men to step into the arena and become who they're meant to be.
              </p>
              <p className="text-lg mb-8 leading-relaxed">
                For this special Donate & Train Challenge, your entry fee isn't just a ticket to a brutal, fun workout—it's a direct investment into helping more men serve, lead, and give back.
              </p>
              <div>
                <Button size="lg" className="w-full md:w-auto mb-2">
                  Join the Grit Test
                </Button>
                <p className="text-sm text-muted-foreground">
                  Your entry fee is a tax-deductible donation.
                </p>
              </div>
            </div>
            <div className="rounded-lg aspect-[4/5] overflow-hidden">
              <img 
                src={gritTestHero} 
                alt="Men training together in The Grit Test challenge" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Event Details Section */}
      <section className="py-20 bg-background">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              About the Event: The Grit Test
            </h2>
            <p className="text-lg text-center text-muted-foreground mb-12">
              This isn't just another workout. It's a test of grit, brotherhood, and purpose.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-bold text-lg mb-4">Event Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Date</p>
                      <p className="text-muted-foreground">Saturday, December 6th</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Time</p>
                      <p className="text-muted-foreground">9:30 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Location</p>
                      <p className="text-muted-foreground">Squatch Frontier Fitness – Austin, TX</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-bold text-lg mb-4">Format</h3>
                <p className="mb-4">Community workout challenge – 20 rounds for time</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>400 m run</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>12 m broad jump burpees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>12 m walking lunges</span>
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-center text-lg mb-6">
              Show up ready to run, jump, lunge, and leave better than you arrived.
            </p>

            <div className="text-center">
              <Button size="lg" variant="outline">
                Save My Spot
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Where Your Donation Goes */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              What Your Donation Makes Possible
            </h2>
            <p className="text-lg text-center text-muted-foreground mb-16">
              Every dollar from this challenge goes right back into helping men step into the arena and serve others.
            </p>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Pillar 1 */}
              <div className="bg-card p-8 rounded-lg border">
                <Heart className="w-12 h-12 text-accent mb-6" />
                <h3 className="text-2xl font-bold mb-4">
                  1. Sponsoring Race Entries to Push Disabled Athletes
                </h3>
                <p className="text-muted-foreground mb-4">
                  One of the most powerful things we do is purchase race entries for men who push disabled athletes in events like the Austin Marathon.
                </p>
                <p className="text-muted-foreground mb-4">
                  To join these races as a "pusher," our men have to buy their own race tickets. Your donation helps us cover those costs, remove financial barriers, and give more men the opportunity to:
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <span>Step into service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <span>Experience life-changing races</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <span>Help athletes who can't run on their own feel the joy of competition</span>
                  </li>
                </ul>
                <p className="text-muted-foreground italic">
                  You're not just funding a race bib—you're funding a moment that both men and athletes remember for the rest of their lives.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="bg-card p-8 rounded-lg border">
                <Users className="w-12 h-12 text-accent mb-6" />
                <h3 className="text-2xl font-bold mb-4">
                  2. Launching the Next Men in the Arena Chapter
                </h3>
                <p className="text-muted-foreground mb-4">
                  Right now, most of our work happens in Austin, Texas. But the problems men face—loneliness, lack of purpose, isolation—exist everywhere.
                </p>
                <p className="text-muted-foreground mb-4">
                  We're raising money to build the programming, content, and education needed to open a new Men in the Arena chapter outside of Austin.
                </p>
                <p className="text-muted-foreground mb-4">
                  Your donation helps us:
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <span>Create training and playbooks for new leaders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <span>Film and produce foundational content and workouts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <span>Build systems that make it easy to launch new chapters across the U.S. (and eventually the world)</span>
                  </li>
                </ul>
                <p className="text-muted-foreground italic">
                  This challenge is about more than one workout. It's about multiplying impact in cities you may never visit but will still touch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">
              How the Donate Challenge Works
            </h2>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-accent">1</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Register & Donate</h3>
                <p className="text-muted-foreground">
                  Sign up for The Grit Test and pay the small entry fee. Your spot is locked in and your donation goes straight to Men in the Arena's mission.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-accent">2</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Show Up & Give Your All</h3>
                <p className="text-muted-foreground">
                  Be at Squatch Frontier Fitness ready to work. Bring your grit, your humility, and your willingness to be pushed.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-accent">3</span>
                </div>
                <h3 className="text-xl font-bold mb-4">See Your Impact</h3>
                <p className="text-muted-foreground">
                  After the event, we'll share updates on how many men we sponsored into races and progress toward launching the next Men in the Arena chapter.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Button size="lg">
                I'm In – Join the Challenge
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              FAQ
            </h2>

            <div className="space-y-8">
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-xl font-bold mb-3">
                  Can I donate even if I can't make the event?
                </h3>
                <p className="text-muted-foreground">
                  Yes. You can still support the mission. Use the button above to donate, and just note that you're giving but not attending.
                </p>
              </div>

              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-xl font-bold mb-3">
                  Is my donation tax-deductible?
                </h3>
                <p className="text-muted-foreground">
                  Yes. Men in the Arena is a registered 501(c)(3) nonprofit. Your entry fee and any additional donation are tax-deductible to the extent allowed by law.
                </p>
              </div>

              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-xl font-bold mb-3">
                  Can I give more than the entry fee?
                </h3>
                <p className="text-muted-foreground">
                  Absolutely. There will be an option to add an extra donation if you want to further support race sponsorships and new chapter development.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DonateChallenge;
