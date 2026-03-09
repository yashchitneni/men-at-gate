import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { OnboardingModal } from "@/components/OnboardingModal";
import SweatpalsIdentityPrompt from "@/components/SweatpalsIdentityPrompt";
import { SentryErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import DonateChallenge from "./pages/DonateChallenge";
import Donate from "./pages/Donate";
import Brotherhood from "./pages/Brotherhood";
import BrotherhoodProfile from "./pages/BrotherhoodProfile";
import Races from "./pages/Races";
import RaceSubmit from "./pages/RaceSubmit";
import Workouts from "./pages/Workouts";
import AdminWorkouts from "./pages/AdminWorkouts";
import AdminMembers from "./pages/AdminMembers";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import WorkoutSubmit from "./pages/WorkoutSubmit";
import Leaderboard from "./pages/Leaderboard";
import WorkoutArchive from "./pages/WorkoutArchive";
import ChapterLanding from "./pages/ChapterLanding";
import Challenges from "./pages/Challenges";
import EventsIndex from "./pages/EventsIndex";
import MarathonRuckEvent from "./pages/MarathonRuckEvent";
import MarathonRuckSponsorship from "./pages/MarathonRuckSponsorship";
import AdminFeaturedEvents from "./pages/AdminFeaturedEvents";
import AdminSweatpalsIntegration from "./pages/AdminSweatpalsIntegration";
import AdminSpotlights from "./pages/AdminSpotlights";
import LegacyMemberRedirect from "./pages/LegacyMemberRedirect";
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
          <SweatpalsIdentityPrompt />
          <SentryErrorBoundary>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/donate-challenge" element={<DonateChallenge />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/brotherhood" element={<Brotherhood />} />
            <Route path="/brotherhood/:slug" element={<BrotherhoodProfile />} />
            <Route path="/men" element={<Navigate to="/brotherhood" replace />} />
            <Route path="/men/:id" element={<LegacyMemberRedirect />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/chapters/:slug" element={<ChapterLanding />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/events" element={<EventsIndex />} />
            <Route path="/events/marathon-ruck" element={<MarathonRuckEvent />} />
            <Route path="/events/marathon-ruck/sponsor" element={<MarathonRuckSponsorship />} />
            <Route path="/races" element={<Races />} />
            <Route path="/races/submit" element={<RaceSubmit />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/workouts/archive" element={<WorkoutArchive />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/workouts" element={<AdminWorkouts />} />
            <Route path="/admin/members" element={<AdminMembers />} />
            <Route path="/admin/events" element={<AdminFeaturedEvents />} />
            <Route path="/admin/spotlights" element={<AdminSpotlights />} />
            <Route path="/admin/integrations/sweatpals" element={<AdminSweatpalsIntegration />} />
            <Route path="/workout-submit/:assignmentId" element={<WorkoutSubmit />} />
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
