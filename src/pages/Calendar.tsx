import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const Calendar = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  // Workout dates for the rest of 2025
  const workoutDates = [
    { date: 14, month: 10 }, // November 14th (month is 0-indexed)
    { date: 28, month: 10 }, // November 28th
    { date: 12, month: 11 }, // December 12th
    { date: 26, month: 11 }, // December 26th
  ];

  const months = [
    { name: "November", days: 30, startDay: 6, month: 10 }, // November 2025 starts on Saturday (6)
    { name: "December", days: 31, startDay: 1, month: 11 }, // December 2025 starts on Monday (1)
  ];

  const isWorkoutDate = (date: number, month: number) => {
    return workoutDates.some(wd => wd.date === date && wd.month === month);
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <section className="py-20 bg-subtle-gradient">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <Link to="/#events">
                <Button variant="ghost" className="mb-4">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Events
                </Button>
              </Link>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Workout Calendar 2025</h1>
              <p className="text-lg text-muted-foreground">
                Mark your calendars for our remaining workouts this year
              </p>
            </div>

            {/* Event Details */}
            <div className="bg-card p-6 rounded-lg border mb-8">
              <div className="flex items-start gap-4">
                <CalendarIcon className="w-6 h-6 text-accent mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Twice A Month Workout</h3>
                  <p className="text-muted-foreground mb-2">
                    Every Other Friday at 4:00 PM
                  </p>
                  <p className="text-muted-foreground mb-2">
                    📍 Squatch Frontier Fitness, East Austin
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Led by Men in our community, join us for high intensity workouts that will also have you asking yourself hard questions and meeting/making new friends within our community.
                  </p>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {months.map((month) => (
                <Card key={month.name} className="overflow-hidden">
                  <CardHeader className="bg-accent/10">
                    <CardTitle className="text-2xl text-center">{month.name} 2025</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Day names header */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {dayNames.map(day => (
                        <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-2">
                      {/* Empty cells for days before month starts */}
                      {Array.from({ length: month.startDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                      ))}
                      
                      {/* Days of the month */}
                      {Array.from({ length: month.days }).map((_, i) => {
                        const date = i + 1;
                        const isWorkout = isWorkoutDate(date, month.month);
                        
                        return (
                          <div
                            key={date}
                            className={`
                              aspect-square flex items-center justify-center rounded-lg
                              relative
                              ${isWorkout 
                                ? 'bg-accent text-accent-foreground font-bold ring-2 ring-accent' 
                                : 'bg-muted/30 hover:bg-muted/50'
                              }
                            `}
                          >
                            <span className="text-sm">{date}</span>
                            {isWorkout && (
                              <div className="absolute -top-1 -right-1">
                                <Badge className="h-4 w-4 p-0 flex items-center justify-center text-xs">
                                  💪
                                </Badge>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-8 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-accent" />
                <span className="text-sm text-muted-foreground">Workout Day</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Calendar;
