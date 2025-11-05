const Story = () => {
  const milestones = [
    {
      year: "2020",
      title: "Started Small Group Workouts",
      description: "Began with small group workouts to combat isolation during uncertain times"
    },
    {
      year: "2021",
      title: "Launched Endurance Challenges",
      description: "Introduced overnight ruck marches and endurance challenges to build resilience"
    },
    {
      year: "2022",
      title: "Community Service & Growth",
      description: "Hosted our first community service project and expanded membership"
    },
    {
      year: "2023",
      title: "Became a 501(c)(3) Nonprofit",
      description: "Officially incorporated as a nonprofit to serve our mission at scale"
    },
    {
      year: "2025",
      title: "Expanding Our Reach",
      description: "Launching digital platform and expanding to new communities nationwide"
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
