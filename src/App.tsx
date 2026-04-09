import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import Events from "./pages/Events";
import EventsPage from "./pages/EventsPage";
import Winners from "./pages/Winners";
import WinnersPage from "./pages/WinnersPage";
import Team from "./pages/Team";
import Alumni from "./pages/Alumni";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RegistrationPage from "./pages/RegistrationPage";
import NotFound from "./pages/NotFound";
import RegisterPage from "./pages/RegisterPage";
import { RegistrationSubmissions } from "@/components/RegistrationSubmissions";
import { AdminLayout } from "@/components/AdminLayout";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  // Hide navbar on login, dashboard and admin pages
  const hideNavbar = ["/login", "/dashboard", "/admin/events", "/admin/winners", "/admin/registrations"].includes(location.pathname) || location.pathname.startsWith("/admin/submissions") || location.pathname.startsWith("/register/");

  return (
    <div className="min-h-screen bg-background relative matrix-bg">
      {!hideNavbar && <Navigation />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/events" element={<Events />} />
        <Route path="/winners" element={<Winners />} />
        <Route path="/team" element={<Team />} />
        <Route path="/alumni" element={<Alumni />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute>
              <EventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/winners"
          element={
            <ProtectedRoute>
              <WinnersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/submissions/:eventId"
          element={
            <ProtectedRoute>
              <AdminLayout title="Registrations">
                <RegistrationSubmissions />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/registrations"
          element={
            <ProtectedRoute>
              <RegistrationPage />
            </ProtectedRoute>
          }
        />
        <Route path="/register/:eventId" element={<RegisterPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
