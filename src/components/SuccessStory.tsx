import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import successStoryImg from "@/assets/success-story.jpg";

const SuccessStory = () => {
    return (
        <section className="py-24 bg-background relative overflow-hidden">
            <div className="container px-4">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
                    {/* Image Side */}
                    <div className="w-full lg:w-1/2 relative">
                        <ScrollReveal animation="fade-in-right">
                            <div className="relative aspect-[4/5] w-full max-w-md mx-auto lg:max-w-none">
                                <div className="absolute inset-0 bg-accent/20 translate-x-4 translate-y-4 rounded-none" />
                                <img
                                    src={successStoryImg}
                                    alt="Success Story"
                                    className="w-full h-full object-cover relative z-10 grayscale hover:grayscale-0 transition-all duration-500"
                                />
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* Content Side */}
                    <div className="w-full lg:w-1/2">
                        <ScrollReveal animation="fade-in-left">
                            <h2 className="text-4xl md:text-6xl font-heading font-black mb-8 uppercase tracking-tighter">
                                Real Change.<br />
                                <span className="text-accent">Real Results.</span>
                            </h2>

                            <blockquote className="text-xl md:text-2xl font-light leading-relaxed mb-8 border-l-4 border-accent pl-6 italic text-muted-foreground">
                                "I was drifting through life, successful at work but failing at home. The challenge and accountability here woke me up. I'm a present father again, and I'm in the best shape of my life."
                            </blockquote>

                            <div className="mb-8">
                                <h4 className="text-xl font-bold uppercase tracking-widest text-foreground">Marcus T.</h4>
                                <p className="text-accent font-medium">Member since 2021</p>
                            </div>

                            <Button
                                variant="outline"
                                className="border-2 border-foreground text-foreground hover:bg-foreground hover:text-background uppercase font-bold tracking-widest px-8 py-6 h-auto rounded-none"
                            >
                                Read More Stories
                            </Button>
                        </ScrollReveal>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SuccessStory;
