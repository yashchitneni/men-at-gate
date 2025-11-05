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
      description: "Launch casual social gatherings to build deeper relationships outside of workouts"
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

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Our Story</h2>
          
          <div className="mb-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">
              We started because we saw too many men suffering in silence—isolated, without purpose, 
              and lacking the brotherhood that makes us stronger. What began as a handful of guys meeting 
              for early morning workouts has grown into a movement.
            </p>
            <p className="text-lg text-muted-foreground">
              Our aim is simple but profound: to create spaces where men can show up authentically, 
              push their limits, and build the kind of deep friendships that change lives. Every challenge 
              we face together makes us better fathers, better husbands, better leaders, and better men.
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-accent/30 hidden md:block" />
            
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="relative pl-0 md:pl-20">
                  {/* Timeline dot */}
                  <div className="absolute left-6 top-2 w-4 h-4 bg-accent rounded-full border-4 border-background hidden md:block" />
                  
                  <div className="bg-card p-6 rounded-lg border hover:border-accent/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                      <h3 className="text-2xl font-bold text-accent">{milestone.year}</h3>
                      <h4 className="text-lg font-semibold">{milestone.title}</h4>
                    </div>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Story;
