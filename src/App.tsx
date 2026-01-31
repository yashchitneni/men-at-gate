import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { OnboardingModal } from "@/components/OnboardingModal";
import { AppErrorBoundary, RouteErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import DonateChallenge from "./pages/DonateChallenge";
import Donate from "./pages/Donate";
import Men from "./pages/Men";
import Races from "./pages/Races";
import RaceSubmit from "./pages/RaceSubmit";
import Workouts from "./pages/Workouts";
import AdminWorkouts from "./pages/AdminWorkouts";
import AdminMembers from "./pages/AdminMembers";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import WorkoutSubmit from "./pages/WorkoutSubmit";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <OnboardingModal />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RouteErrorBoundary><Index /></RouteErrorBoundary>} />
              <Route path="/calendar" element={<RouteErrorBoundary><Calendar /></RouteErrorBoundary>} />
              <Route path="/donate-challenge" element={<RouteErrorBoundary><DonateChallenge /></RouteErrorBoundary>} />
              <Route path="/donate" element={<RouteErrorBoundary><Donate /></RouteErrorBoundary>} />
              <Route path="/men" element={<RouteErrorBoundary><Men /></RouteErrorBoundary>} />
              <Route path="/races" element={<RouteErrorBoundary><Races /></RouteErrorBoundary>} />
              <Route path="/races/submit" element={<RouteErrorBoundary><RaceSubmit /></RouteErrorBoundary>} />
              <Route path="/workouts" element={<RouteErrorBoundary><Workouts /></RouteErrorBoundary>} />
              <Route path="/profile" element={<RouteErrorBoundary><Profile /></RouteErrorBoundary>} />
              <Route path="/admin" element={<RouteErrorBoundary><Admin /></RouteErrorBoundary>} />
              <Route path="/admin/workouts" element={<RouteErrorBoundary><AdminWorkouts /></RouteErrorBoundary>} />
              <Route path="/admin/members" element={<RouteErrorBoundary><AdminMembers /></RouteErrorBoundary>} />
              <Route path="/workout-submit/:slotId" element={<RouteErrorBoundary><WorkoutSubmit /></RouteErrorBoundary>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
