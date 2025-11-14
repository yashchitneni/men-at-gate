import { useEffect, useRef, useState } from "react";

const Story = () => {
  const milestones = [
    {
      year: "May 2023",
      title: "Twice a Month Workouts",
      description: "Started hosting workouts twice a month (every other Friday) to provide more regular opportunities for men to gather, train, and connect over deeper levels of conversation."
    },
    {
      year: "Summer 2023",
      title: "Introduced Men's Social Gatherings",
      description: "Launched casual social gatherings to build deeper relationships outside of workouts"
    },
    {
      year: "Fall 2023",
      title: "Men In the Arena × PWR Lift HYROX Collaboration",
      description: "Partnered with PWR Lift for HYROX Dallas"
    },
    {
      year: "Spring 2024",
      title: "Introduction of Endurance & Fitness Challenges",
      description: "Expand our programming with endurance and fitness challenges designed to test and strengthen the community"
    },
    {
      year: "Fall 2024/Spring 2025",
      title: "Men In the Arena × Ainsley's Angels",
      description: "MTA Men collectively helped push dozens of Ainsley's Angels racers in the Houston Twilight 5k and the Austin Marathon"
    },
    {
      year: "May 2025",
      title: "2-Year Anniversary Overnight Marathon Ruck",
      description: "Celebrated our two-year anniversary with 30+ men completing an overnight marathon ruck to raise awareness for men's mental health"
    },
    {
      year: "Fall 2025",
      title: "Became a 501(c)(3) Non-Profit",
      description: "Officially achieve nonprofit status to support and expand our mission"
    }
  ];

  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = itemRefs.current.map((ref, index) => {
      if (!ref) return null;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleItems((prev) => [...new Set([...prev, index])]);
            }
          });
        },
        { threshold: 0.2 }
      );

      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Our Story</h2>
          
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <p className="text-lg text-muted-foreground mb-4">
              We started because we saw too many men suffering in silence.
            </p>
            <p className="text-lg text-muted-foreground">
              What began as a handful of guys meeting up for workouts has grown into a movement: a community where men push their limits, build genuine friendships, and become the fathers, husbands, and leaders they were meant to be.
            </p>
          </div>

          {/* Mobile & Tablet Timeline */}
          <div className="relative lg:hidden">
            {/* Vertical line - animates as items become visible */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-accent/20">
              <div 
                className="w-full bg-accent transition-all duration-1000 ease-out"
                style={{ 
                  height: visibleItems.length > 0 
                    ? `${(Math.max(...visibleItems) + 1) * (100 / milestones.length)}%` 
                    : '0%'
                }}
              />
            </div>
            
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div 
                  key={index} 
                  ref={(el) => (itemRefs.current[index] = el)}
                  className="relative pl-12"
                >
                  {/* Timeline dot - pulse animation when visible */}
                  <div 
                    className={`absolute left-2.5 top-2 w-3 h-3 bg-accent rounded-full transition-all duration-500 ${
                      visibleItems.includes(index) 
                        ? 'scale-100 opacity-100 animate-pulse' 
                        : 'scale-0 opacity-0'
                    }`}
                  />
                  
                  {/* Card - slide in from right */}
                  <div 
                    className={`bg-card p-6 rounded-lg border transition-all duration-700 ${
                      visibleItems.includes(index)
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 translate-x-8'
                    }`}
                  >
                    <h3 className="text-xl font-bold text-accent mb-2">{milestone.year}</h3>
                    <h4 className="text-lg font-semibold mb-2">{milestone.title}</h4>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Timeline - Alternating */}
          <div className="relative hidden lg:block">
            {/* Center vertical line */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-accent/20">
              <div 
                className="w-full bg-accent transition-all duration-1000 ease-out"
                style={{ 
                  height: visibleItems.length > 0 
                    ? `${(Math.max(...visibleItems) + 1) * (100 / milestones.length)}%` 
                    : '0%'
                }}
              />
            </div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => {
                const isLeft = index % 2 === 0;
                return (
                  <div 
                    key={index}
                    ref={(el) => (itemRefs.current[index] = el)}
                    className={`relative flex items-center ${isLeft ? 'justify-start' : 'justify-end'}`}
                  >
                    {/* Timeline dot */}
                    <div 
                      className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-accent rounded-full border-4 border-background z-10 transition-all duration-500 ${
                        visibleItems.includes(index)
                          ? 'scale-100 opacity-100 animate-pulse'
                          : 'scale-0 opacity-0'
                      }`}
                    />
                    
                    {/* Card */}
                    <div 
                      className={`w-5/12 bg-card p-6 rounded-lg border transition-all duration-700 ${
                        visibleItems.includes(index)
                          ? 'opacity-100 translate-x-0'
                          : isLeft 
                            ? 'opacity-0 -translate-x-8'
                            : 'opacity-0 translate-x-8'
                      }`}
                    >
                      <h3 className="text-xl font-bold text-accent mb-2">{milestone.year}</h3>
                      <h4 className="text-lg font-semibold mb-2">{milestone.title}</h4>
                      <p className="text-muted-foreground">{milestone.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Story;
