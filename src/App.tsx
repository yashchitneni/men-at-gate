import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { OnboardingModal } from "@/components/OnboardingModal";
import { SentryErrorBoundary } from "@/components/ErrorBoundary";
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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <OnboardingModal />
        <BrowserRouter>
          <SentryErrorBoundary>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/donate-challenge" element={<DonateChallenge />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/men" element={<Men />} />
            <Route path="/races" element={<Races />} />
            <Route path="/races/submit" element={<RaceSubmit />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/workouts" element={<AdminWorkouts />} />
            <Route path="/admin/members" element={<AdminMembers />} />
            <Route path="/workout-submit/:slotId" element={<WorkoutSubmit />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SentryErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
