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

// Property Mini-App
import PropertyIndex from "./pages/property/PropertyIndex";
import PropertyDetail from "./pages/property/PropertyDetail";
import PropertyInquiry from "./pages/property/PropertyInquiry";
import PropertyMap from "./pages/property/PropertyMap";

// Food & Delivery Mini-App
import FoodIndex from "./pages/food/FoodIndex";
import RestaurantDetail from "./pages/food/RestaurantDetail";
import FoodCheckout from "./pages/food/FoodCheckout";

// Transport Mini-App
import TransportIndex from "./pages/transport/TransportIndex";
import VehicleDetail from "./pages/transport/VehicleDetail";
import TransportBooking from "./pages/transport/TransportBooking";

// Fitness Mini-App
import FitnessIndex from "./pages/fitness/FitnessIndex";
import GymDetail from "./pages/fitness/GymDetail";
import FitnessBooking from "./pages/fitness/FitnessBooking";

// Medical Mini-App
import MedicalIndex from "./pages/medical/MedicalIndex";
import ClinicDetail from "./pages/medical/ClinicDetail";
import MedicalAppointment from "./pages/medical/MedicalAppointment";

// Events Mini-App
import EventsIndex from "./pages/events/EventsIndex";
import EventDetail from "./pages/events/EventDetail";
import EventBooking from "./pages/events/EventBooking";

// Education Mini-App
import EducationIndex from "./pages/education/EducationIndex";
import CourseDetail from "./pages/education/CourseDetail";
import TutorDetail from "./pages/education/TutorDetail";
import EducationBooking from "./pages/education/EducationBooking";

// Favorites
import Favorites from "./pages/Favorites";

// Search
import Search from "./pages/Search";

// Notifications
import Notifications from "./pages/Notifications";

// View History
import ViewHistory from "./pages/ViewHistory";

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
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/search" element={<Search />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/history" element={<ViewHistory />} />
              {/* Beauty & Spa Mini-App Routes */}
              <Route path="/beauty" element={<BeautySpaIndex />} />
              <Route path="/beauty/salon/:id" element={<SalonDetail />} />
              <Route path="/beauty/booking/:id" element={<BeautyBooking />} />
              <Route path="/beauty/services" element={<BeautyServices />} />
              <Route path="/beauty/map" element={<BeautyMap />} />
              
              {/* Property Mini-App Routes */}
              <Route path="/property" element={<PropertyIndex />} />
              <Route path="/property/:id" element={<PropertyDetail />} />
              <Route path="/property/inquiry/:id" element={<PropertyInquiry />} />
              <Route path="/property/map" element={<PropertyMap />} />
              
              {/* Food & Delivery Mini-App Routes */}
              <Route path="/food" element={<FoodIndex />} />
              <Route path="/food/restaurant/:id" element={<RestaurantDetail />} />
              <Route path="/food/checkout" element={<FoodCheckout />} />
              
              {/* Transport Mini-App Routes */}
              <Route path="/transport" element={<TransportIndex />} />
              <Route path="/transport/vehicle/:id" element={<VehicleDetail />} />
              <Route path="/transport/booking/:id" element={<TransportBooking />} />
              
              {/* Fitness Mini-App Routes */}
              <Route path="/fitness" element={<FitnessIndex />} />
              <Route path="/fitness/gym/:id" element={<GymDetail />} />
              <Route path="/fitness/booking/:id" element={<FitnessBooking />} />
              
              {/* Medical Mini-App Routes */}
              <Route path="/medical" element={<MedicalIndex />} />
              <Route path="/medical/clinic/:id" element={<ClinicDetail />} />
              <Route path="/medical/appointment/:id" element={<MedicalAppointment />} />
              {/* Events Mini-App Routes */}
              <Route path="/events" element={<EventsIndex />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/events/booking/:id" element={<EventBooking />} />
              
              {/* Education Mini-App Routes */}
              <Route path="/education" element={<EducationIndex />} />
              <Route path="/education/course/:id" element={<CourseDetail />} />
              <Route path="/education/tutor/:id" element={<TutorDetail />} />
              <Route path="/education/booking/:id" element={<EducationBooking />} />
              
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
