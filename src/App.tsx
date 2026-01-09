import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Discover from "./pages/Discover";
import MapView from "./pages/MapView";
import Bookings from "./pages/Bookings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Beauty & Spa Mini-App
import BeautySpaIndex from "./pages/beauty/BeautySpaIndex";
import SalonDetail from "./pages/beauty/SalonDetail";
import BeautyBooking from "./pages/beauty/BeautyBooking";
import BeautyServices from "./pages/beauty/BeautyServices";
import BeautyMap from "./pages/beauty/BeautyMap";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Beauty & Spa Mini-App Routes */}
              <Route path="/beauty" element={<BeautySpaIndex />} />
              <Route path="/beauty/salon/:id" element={<SalonDetail />} />
              <Route path="/beauty/booking/:id" element={<BeautyBooking />} />
              <Route path="/beauty/services" element={<BeautyServices />} />
              <Route path="/beauty/map" element={<BeautyMap />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
