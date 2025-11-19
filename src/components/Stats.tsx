import ScrollReveal from "@/components/ScrollReveal";

const Stats = () => {
  const stats = [
    {
      number: "1 in 5",
      label: "men experience anxiety or depression each year"
    },
    {
      number: "Suicide",
      label: "is the leading cause of death for men under 50"
    },
    {
      number: "1 in 3",
      label: "men admit they have no close friends"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              The Problem Men Face Today
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
              Men today are struggling. Too many of us are walking through life alone—without purpose,
              accountability, or fellowship to lean on.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {stats.map((stat, index) => (
              <ScrollReveal key={index} delay={index * 100} animation="fade-in">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-3 text-[#dc2626]">
                    {stat.number}
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={300}>
            <div className="border-l-4 border-foreground pl-6 py-4 mb-6">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Crisis Support:</strong> If you are in crisis, call or text{" "}
                <strong className="text-foreground">988</strong> for the Suicide and Crisis Lifeline. You are not alone.
              </p>
            </div>

            <div className="text-left text-xs text-foreground space-x-4">
              <span>CDC Mental Health Statistics</span>
              <span>NIMH Data</span>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default Stats;
