import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Settings, Shield } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    } else {
      // If on another page, navigate to home first
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const navItems = [
    { label: "Gallery", id: "mission" },
    { label: "Testimonials", id: "testimonials" },
    { label: "FAQ", id: "faq" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] backdrop-blur-sm">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-xl font-bold text-white hover:text-white/80 transition-colors"
            >
              Men in the Arena
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/races" className="text-sm font-medium text-white hover:text-accent transition-colors uppercase tracking-wider">
              Races
            </Link>
            <Link to="/workouts" className="text-sm font-medium text-white hover:text-accent transition-colors uppercase tracking-wider">
              Workouts
            </Link>
            <Link to="/men" className="text-sm font-medium text-white hover:text-accent transition-colors uppercase tracking-wider">
              The Men
            </Link>
            <Link to="/donate" className="text-sm font-medium text-white hover:text-accent transition-colors uppercase tracking-wider">
              Donate
            </Link>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="font-bold uppercase tracking-wider"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {profile?.full_name?.split(' ')[0] || 'Profile'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  {profile?.is_admin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                className="bg-accent hover:bg-accent/90 text-white font-bold uppercase tracking-wider"
                onClick={() => setAuthModalOpen(true)}
              >
                Join Now
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-md border-b border-border p-4 flex flex-col gap-4 animate-fade-in">
            <Link
              to="/races"
              className="text-lg font-medium hover:text-accent transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Races
            </Link>
            <Link
              to="/workouts"
              className="text-lg font-medium hover:text-accent transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Workouts
            </Link>
            <Link
              to="/men"
              className="text-lg font-medium hover:text-accent transition-colors"
              onClick={() => setIsOpen(false)}
            >
              The Men
            </Link>
            <Link
              to="/donate"
              className="text-lg font-medium hover:text-accent transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Donate
            </Link>
            {user ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Button
                className="bg-accent hover:bg-accent/90 text-white w-full"
                onClick={() => {
                  setAuthModalOpen(true);
                  setIsOpen(false);
                }}
              >
                Join Now
              </Button>
            )}
          </div>
        )}
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </nav>
  );
};

export default Navigation;
