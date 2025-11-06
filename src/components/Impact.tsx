import { Users, Activity, Heart } from "lucide-react";

const Impact = () => {
  const stats = [
    {
      icon: Users,
      number: "300+",
      label: "Men Trained with Men In The Arena"
    },
    {
      icon: Activity,
      number: "150+",
      label: "Workouts & challenges Held"
    },
    {
      icon: Heart,
      number: "100+",
      label: "Hours Contributed to Giving Back"
    }
  ];

  return (
    <section className="py-20 bg-subtle-gradient">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">Our Impact</h2>
          
          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-12 mb-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-12 h-12 text-accent mx-auto mb-4" />
                <div className="text-4xl md:text-5xl font-bold mb-2 text-accent">
                  {stat.number}
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Success Story */}
          <div className="bg-card p-8 md:p-12 rounded-lg border">
            <h3 className="text-2xl font-bold mb-6 text-center">Success Story</h3>
            
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-2">Meet Marcus</h4>
                <p className="text-muted-foreground mb-4">
                  When Marcus first joined Men in the Arena in 2021, he was struggling. After years 
                  of focusing solely on his career, he found himself successful on paper but deeply 
                  isolated. He had no close friends, felt disconnected from his family, and was battling 
                  depression in silence.
                </p>
                <p className="text-muted-foreground mb-4">
                  Entering the arena changed everything. Through early morning workouts, challenging 
                  ruck marches, and honest conversations with other men, Marcus found his tribe. He 
                  discovered that vulnerability wasn't weakness—it was the foundation of real strength 
                  and authentic connection.
                </p>
                <p className="text-muted-foreground mb-6">
                  Today, Marcus leads a weekly workout group, has completed three overnight ruck 
                  challenges, and mentors new members through their journey. He's rebuilt his 
                  relationship with his kids and finally has the brotherhood he always needed.
                </p>
              </div>

              <blockquote className="border-l-4 border-accent pl-6 py-2 italic text-lg">
                "I used to think asking for help was weakness. Men in the Arena taught me that 
                showing up, being real, and leaning on your brothers is the most courageous thing 
                a man can do. This community saved my life."
                <footer className="text-sm text-muted-foreground mt-2 not-italic">
                  — Marcus, Member since 2021
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Impact;
