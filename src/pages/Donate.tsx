import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Heart, Shield, Users, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import heroImage from "@/assets/hero-workout.jpg"; // Reusing hero image as placeholder

const Donate = () => {
    const impactTiers = [
        {
            amount: "$50",
            title: "Gear Up",
            description: "Funds gear for a ruck or workout session.",
            icon: Shield
        },
        {
            amount: "$150",
            title: "Race Entry Support",
            description: "Pays part of a marathon entry for a disabled athlete.",
            icon: Users
        },
        {
            amount: "$300",
            title: "Full Race Sponsorship",
            description: "Covers a full race entry for a disabled athlete.",
            icon: Heart
        },
        {
            amount: "$500",
            title: "Leadership Training",
            description: "Funds a leadership training session for new city leaders.",
            icon: Check
        },
        {
            amount: "$1,000",
            title: "New City Starter Kit",
            description: "Sponsors a starter kit to launch Men in the Arena in a new city.",
            icon: ArrowRight
        }
    ];

    const faqs = [
        {
            question: "Is my donation tax-deductible?",
            answer: "Yes, Men in the Arena is a 501(c)(3) non-profit organization. All donations are tax-deductible to the extent allowed by law."
        },
        {
            question: "Can I donate in honor of someone?",
            answer: "Absolutely. You can specify a dedication in the donation form notes."
        },
        {
            question: "How is my donation used?",
            answer: "Donations directly fund race entries for disabled athletes, leadership training, and community expansion efforts."
        },
        {
            question: "Is my payment information secure?",
            answer: "Yes, we use industry-standard encryption and secure payment processors to protect your information."
        }
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <Navigation />

            {/* Hero Section */}
            <section className="relative py-24 md:py-32 flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: `url(${heroImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="absolute inset-0 bg-black/80" />
                </div>

                <div className="container relative z-10 px-4 text-center">
                    <ScrollReveal>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
                            Fuel the Mission. <br />
                            <span className="text-accent">Change a Man's Life.</span>
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto font-light">
                            Your support funds adaptive race entries and scales the Men in the Arena community to new cities.
                        </p>
                        <Button
                            size="lg"
                            className="bg-accent hover:bg-accent/90 text-white text-lg px-8 py-6 h-auto"
                            onClick={() => document.getElementById('donate-form')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Donate Now
                        </Button>
                    </ScrollReveal>
                </div>
            </section>

            {/* Why We Exist */}
            <section className="py-20 bg-background">
                <div className="container px-4">
                    <ScrollReveal>
                        <div className="max-w-3xl mx-auto text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Men in the Arena Exists</h2>
                            <p className="text-lg text-muted-foreground">
                                Men today are facing a crisis of purpose and connection. We exist to break the cycle of isolation
                                by providing a brotherhood that challenges men to be better—physically, mentally, and spiritually.
                                Your donation helps us remove barriers to entry and expand this life-changing community.
                            </p>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* Impact Matrix */}
            <section className="py-20 bg-secondary/30">
                <div className="container px-4">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Your Impact</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {impactTiers.map((tier, index) => (
                                <ScrollReveal key={index} delay={index * 100} animation="fade-in-left">
                                    <Card className="h-full hover:border-accent/50 transition-colors">
                                        <CardHeader>
                                            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                                                <tier.icon className="w-6 h-6 text-accent" />
                                            </div>
                                            <CardTitle className="text-2xl font-bold text-accent">{tier.amount}</CardTitle>
                                            <h3 className="font-semibold text-lg">{tier.title}</h3>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground">{tier.description}</p>
                                        </CardContent>
                                    </Card>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Donation Form Placeholder */}
            <section id="donate-form" className="py-20 bg-background">
                <div className="container px-4">
                    <div className="max-w-2xl mx-auto bg-card border rounded-xl p-8 shadow-sm">
                        <h2 className="text-3xl font-bold mb-8 text-center">Make a Donation</h2>
                        <div className="space-y-6">
                            {/* This is where the embedded form would go */}
                            <div className="bg-muted/50 p-12 rounded-lg text-center border-2 border-dashed border-muted-foreground/25">
                                <p className="text-muted-foreground font-medium">Secure Donation Form Loading...</p>
                                <p className="text-sm text-muted-foreground mt-2">(Integration Placeholder)</p>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Shield className="w-4 h-4" />
                                <span>Secure 256-bit Encryption</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonial */}
            <section className="py-20 bg-accent text-white">
                <div className="container px-4">
                    <ScrollReveal>
                        <div className="max-w-4xl mx-auto text-center">
                            <blockquote className="text-2xl md:text-3xl font-light italic mb-8">
                                "Making friends has always been easy, however, developing greater value and intention behind relationships for purpose of lifting up myself and other men around me with the support of MITA has been a critical and impactful element in my life since moving to Austin. I've met others who share similar passions, visions, ideas, etc, and, foundationally we all want to become greater men."
                            </blockquote>
                            <cite className="not-italic font-bold text-lg">— Kevin Kurz</cite>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 bg-background">
                <div className="container px-4">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                                    <AccordionContent>{faq.answer}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Donate;
