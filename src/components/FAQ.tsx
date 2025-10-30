import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Do I need to be in shape to join?",
      answer: "Not at all. We meet you where you are. Our workouts are scalable for all fitness levels, and we believe growth happens when we push just beyond our current limits—wherever those are."
    },
    {
      question: "What does it cost?",
      answer: "Our weekly workouts are free and open to all. Some special events or longer excursions may have associated costs, but we keep everything accessible. The real investment is your time and commitment."
    },
    {
      question: "How do I get started?",
      answer: "Just show up to a Saturday morning workout. No registration needed. Introduce yourself, tell us you're new, and we'll take care of the rest. First-timers are always welcome."
    },
    {
      question: "What if I can't make every event?",
      answer: "Life happens. We get it. Come when you can, be present when you're there, and stay connected to the community. Consistency matters more than perfection."
    },
    {
      question: "Is this faith-based?",
      answer: "We welcome men of all backgrounds and beliefs. While many members have faith traditions, our focus is on shared values of growth, service, and authentic connection."
    },
    {
      question: "What age range participates?",
      answer: "We have men from their 20s to their 60s. The diversity in age and experience is one of our strengths—younger men learn from the wisdom of those ahead, older men stay sharp with fresh perspectives."
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Frequently Asked Questions
          </h2>
          
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
