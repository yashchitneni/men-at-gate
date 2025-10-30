import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            The Problem Men Face Today
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Men today are struggling. Too many of us are walking through life alone—without purpose, 
            accountability, or fellowship to lean on.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-card rounded-lg border">
                <div className="text-3xl md:text-4xl font-bold mb-2 text-accent">
                  {stat.number}
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <Alert className="border-destructive/50 bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-sm">
              <strong>Crisis Support:</strong> If you are in crisis, call or text{" "}
              <a href="tel:988" className="underline font-semibold">988</a> for the Suicide and Crisis Lifeline. 
              You are not alone.
            </AlertDescription>
          </Alert>

          <div className="mt-6 text-center text-xs text-muted-foreground space-x-4">
            <a href="https://www.cdc.gov/nchs/products/databriefs/db464.htm" target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">
              CDC Mental Health Statistics
            </a>
            <a href="https://www.nimh.nih.gov/health/statistics/mental-illness" target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">
              NIMH Data
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
