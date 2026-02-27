import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Settings, Shield } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyAssignedWorkouts, useMyPendingWorkoutActionCount } from "@/hooks/useWorkouts";
import { AuthModal } from "@/components/AuthModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const navigate = useNavigate();
  const {
    user,
    profile,
    signOut
  } = useAuth();
  const { data: pendingWorkoutCount = 0 } = useMyPendingWorkoutActionCount();
  const { data: myAssignedWorkouts = [] } = useMyAssignedWorkouts();

  const actionableAssignment = myAssignedWorkouts.find((assignment) =>
    !assignment.submission ||
    assignment.submission.status === "draft" ||
    assignment.submission.status === "changes_requested"
  );
  const actionableAssignmentPath = actionableAssignment ? `/workout-submit/${actionableAssignment.id}` : "/workouts";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
      setIsOpen(false);
    } else {
      // If on another page, navigate to home first
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({
          behavior: "smooth"
        });
      }, 100);
    }
  };
  const navItems = [{
    label: "Gallery",
    id: "mission"
  }, {
    label: "Testimonials",
    id: "testimonials"
  }, {
    label: "FAQ",
    id: "faq"
  }];
  return <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] backdrop-blur-sm">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/" onClick={() => window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img 
                src="/favicon.jpg" 
                alt="Men in the Arena" 
                className="h-10 w-10 rounded-sm object-contain"
              />
              <span className="text-xl font-bold text-white">
                Men in the Arena
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/events" className="text-sm font-medium text-white hover:text-accent transition-colors uppercase tracking-wider">
              Events
            </Link>
            <Link to="/races" className="text-sm font-medium text-white hover:text-accent transition-colors uppercase tracking-wider">
              Races
            </Link>
            <Link to="/workouts" className="text-sm font-medium text-white hover:text-accent transition-colors uppercase tracking-wider">
              Workouts
            </Link>
            <Link to="/brotherhood" className="text-sm font-medium text-white hover:text-accent transition-colors uppercase tracking-wider">
              Brotherhood
            </Link>
            
            
            {user ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="relative font-bold uppercase tracking-wider">
                    <User className="h-4 w-4 mr-2" />
                    {profile?.full_name?.split(' ')[0] || 'Profile'}
                    {pendingWorkoutCount > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-accent text-accent-foreground text-[11px] leading-5 font-bold">
                        {pendingWorkoutCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {pendingWorkoutCount > 0 && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={actionableAssignmentPath} className="flex items-center">
                          <Settings className="h-4 w-4 mr-2" />
                          Create Workout Plan ({pendingWorkoutCount})
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  {profile?.is_admin && <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => {
                    void handleSignOut();
                  }}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <Button className="bg-accent hover:bg-accent/90 text-white font-bold uppercase tracking-wider" onClick={() => setAuthModalOpen(true)}>
                Join Now
              </Button>}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && <div className="md:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-md border-b border-border p-4 flex flex-col gap-4 animate-fade-in">
            <Link to="/events" className="text-lg font-medium hover:text-accent transition-colors" onClick={() => setIsOpen(false)}>
              Events
            </Link>
            <Link to="/races" className="text-lg font-medium hover:text-accent transition-colors" onClick={() => setIsOpen(false)}>
              Races
            </Link>
            <Link to="/workouts" className="text-lg font-medium hover:text-accent transition-colors" onClick={() => setIsOpen(false)}>
              Workouts
            </Link>
            <Link to="/brotherhood" className="text-lg font-medium hover:text-accent transition-colors" onClick={() => setIsOpen(false)}>
              Brotherhood
            </Link>
            {pendingWorkoutCount > 0 && (
              <Link to={actionableAssignmentPath} className="text-lg font-medium hover:text-accent transition-colors" onClick={() => setIsOpen(false)}>
                Create Workout Plan ({pendingWorkoutCount})
              </Link>
            )}
            <Link to="/donate" className="text-lg font-medium hover:text-accent transition-colors" onClick={() => setIsOpen(false)}>
              Donate
            </Link>
            {user ? <Button variant="outline" className="w-full" onClick={() => {
          void handleSignOut();
          setIsOpen(false);
        }}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button> : <Button className="bg-accent hover:bg-accent/90 text-white w-full" onClick={() => {
          setAuthModalOpen(true);
          setIsOpen(false);
        }}>
                Join Now
              </Button>}
          </div>}
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </nav>;
};
export default Navigation;
