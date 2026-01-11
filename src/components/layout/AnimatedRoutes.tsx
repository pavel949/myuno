import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './PageTransition';

import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Discover from '@/pages/Discover';
import MapView from '@/pages/MapView';
import Bookings from '@/pages/Bookings';
import BookingDetail from '@/pages/BookingDetail';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';

// Beauty & Spa Mini-App
import BeautySpaIndex from '@/pages/beauty/BeautySpaIndex';
import SalonDetail from '@/pages/beauty/SalonDetail';
import BeautyBooking from '@/pages/beauty/BeautyBooking';
import BeautyServices from '@/pages/beauty/BeautyServices';
import BeautyMap from '@/pages/beauty/BeautyMap';

// Property Mini-App
import PropertyIndex from '@/pages/property/PropertyIndex';
import PropertyDetail from '@/pages/property/PropertyDetail';
import PropertyInquiry from '@/pages/property/PropertyInquiry';
import PropertyMap from '@/pages/property/PropertyMap';

// Food & Delivery Mini-App (legacy)
import FoodIndex from '@/pages/food/FoodIndex';
import FoodRestaurantDetail from '@/pages/food/RestaurantDetail';
import FoodCheckout from '@/pages/food/FoodCheckout';

// Restaurants Mini-App
import RestaurantsIndex from '@/pages/restaurants/RestaurantsIndex';
import RestaurantDetail from '@/pages/restaurants/RestaurantDetail';
import TableReservation from '@/pages/restaurants/TableReservation';
import DeliveryCheckout from '@/pages/restaurants/DeliveryCheckout';
import SetMenuBooking from '@/pages/restaurants/SetMenuBooking';
import RestaurantMap from '@/pages/restaurants/RestaurantMap';

// Transport Mini-App
import TransportIndex from '@/pages/transport/TransportIndex';
import VehicleDetail from '@/pages/transport/VehicleDetail';
import TransportBooking from '@/pages/transport/TransportBooking';
import AirportTransferBooking from '@/pages/transport/AirportTransferBooking';
import TaxiBooking from '@/pages/transport/TaxiBooking';

// Fitness Mini-App
import FitnessIndex from '@/pages/fitness/FitnessIndex';
import GymDetail from '@/pages/fitness/GymDetail';
import FitnessBooking from '@/pages/fitness/FitnessBooking';

// Medical Mini-App
import MedicalIndex from '@/pages/medical/MedicalIndex';
import ClinicDetail from '@/pages/medical/ClinicDetail';
import MedicalAppointment from '@/pages/medical/MedicalAppointment';

// Events Mini-App
import EventsIndex from '@/pages/events/EventsIndex';
import EventDetail from '@/pages/events/EventDetail';
import EventBooking from '@/pages/events/EventBooking';

// Education Mini-App
import EducationIndex from '@/pages/education/EducationIndex';
import CourseDetail from '@/pages/education/CourseDetail';
import TutorDetail from '@/pages/education/TutorDetail';
import EducationBooking from '@/pages/education/EducationBooking';

// Flowers Mini-App
import FlowersIndex from '@/pages/flowers/FlowersIndex';
import FlowerShopDetail from '@/pages/flowers/FlowerShopDetail';
import FlowersOrder from '@/pages/flowers/FlowersOrder';
import BouquetDetail from '@/pages/flowers/BouquetDetail';

// Home Services Mini-App
import ServicesIndex from '@/pages/services/ServicesIndex';
import ServiceProviderDetail from '@/pages/services/ServiceProviderDetail';
import ServiceBooking from '@/pages/services/ServiceBooking';
import ServicesMap from '@/pages/services/ServicesMap';

// Legal & Business Services Mini-App
import LegalServicesIndex from '@/pages/legal/LegalServicesIndex';
import LegalProviderDetail from '@/pages/legal/LegalProviderDetail';
import LegalBooking from '@/pages/legal/LegalBooking';

// Insurance Mini-App
import InsuranceIndex from '@/pages/insurance/InsuranceIndex';
import InsuranceDetail from '@/pages/insurance/InsuranceDetail';
import InsuranceQuote from '@/pages/insurance/InsuranceQuote';

// Tours Mini-App
import ToursIndex from '@/pages/tours/ToursIndex';
import TourDetail from '@/pages/tours/TourDetail';
import TourBooking from '@/pages/tours/TourBooking';

// Water Activities Mini-App
import WaterActivitiesIndex from '@/pages/water/WaterActivitiesIndex';
import WaterActivityDetail from '@/pages/water/WaterActivityDetail';
import WaterActivityBooking from '@/pages/water/WaterActivityBooking';

// Pharmacy Mini-App
import PharmacyIndex from '@/pages/pharmacy/PharmacyIndex';
import PharmacyDetail from '@/pages/pharmacy/PharmacyDetail';

// Pets Mini-App
import PetsIndex from '@/pages/pets/PetsIndex';
import PetServiceDetail from '@/pages/pets/PetServiceDetail';
import PetServiceBooking from '@/pages/pets/PetServiceBooking';
import PetTransport from '@/pages/pets/PetTransport';

// Yachts Mini-App
import YachtsIndex from '@/pages/yachts/YachtsIndex';
import YachtDetail from '@/pages/yachts/YachtDetail';
import YachtBooking from '@/pages/yachts/YachtBooking';

// Cleaning Mini-App
import CleaningIndex from '@/pages/cleaning/CleaningIndex';
import CleaningDetail from '@/pages/cleaning/CleaningDetail';
import CleaningBooking from '@/pages/cleaning/CleaningBooking';

// Babysitter Mini-App
import BabysitterDetail from '@/pages/babysitter/BabysitterDetail';
import BabysitterBooking from '@/pages/babysitter/BabysitterBooking';
import BabysitterIndex from '@/pages/babysitter/BabysitterIndex';

// Delivery Mini-App
import DeliveryIndex from '@/pages/delivery/DeliveryIndex';

// Market Mini-App
import MarketIndex from '@/pages/market/MarketIndex';
import StoreDetail from '@/pages/market/StoreDetail';
import MarketCheckout from '@/pages/market/MarketCheckout';

// Other pages
import Favorites from '@/pages/Favorites';
import Search from '@/pages/Search';
import Notifications from '@/pages/Notifications';
import ViewHistory from '@/pages/ViewHistory';
import Cart from '@/pages/Cart';
import Wallet from '@/pages/Wallet';
import SOS from '@/pages/SOS';
import VipConcierge from '@/pages/VipConcierge';
import Support from '@/pages/Support';

// Info pages
import AboutPage from '@/pages/info/AboutPage';
import HowItWorksPage from '@/pages/info/HowItWorksPage';
import FAQPage from '@/pages/info/FAQPage';
import PartnersPage from '@/pages/info/PartnersPage';
import PrivacyPage from '@/pages/info/PrivacyPage';
import TermsPage from '@/pages/info/TermsPage';
import BecomePartnerPage from '@/pages/info/BecomePartnerPage';

// Admin pages
import PartnerApplicationsAdmin from '@/pages/admin/PartnerApplicationsAdmin';

// Vendor pages
import VendorDashboard from '@/pages/vendor/VendorDashboard';
import VendorOnboarding from '@/pages/vendor/VendorOnboarding';
import VendorBookings from '@/pages/vendor/VendorBookings';
import VendorServices from '@/pages/vendor/VendorServices';
import VendorAnalytics from '@/pages/vendor/VendorAnalytics';
import VendorPayouts from '@/pages/vendor/VendorPayouts';
import VendorProperties from '@/pages/vendor/VendorProperties';
import VendorTours from '@/pages/vendor/VendorTours';
import VendorActivities from '@/pages/vendor/VendorActivities';

// Owner (Property Care) pages
import OwnerDashboard from '@/pages/owner/OwnerDashboard';
import OwnerProperties from '@/pages/owner/OwnerProperties';
import OwnerPropertyDetail from '@/pages/owner/OwnerPropertyDetail';
import OwnerCalendar from '@/pages/owner/OwnerCalendar';
import OwnerFinancials from '@/pages/owner/OwnerFinancials';
import OwnerFinancialForm from '@/pages/owner/OwnerFinancialForm';
import OwnerMessages from '@/pages/owner/OwnerMessages';
import OwnerChatRoom from '@/pages/owner/OwnerChatRoom';
import OwnerSupportChat from '@/pages/owner/OwnerSupportChat';
import AddProperty from '@/pages/owner/AddProperty';
import ServiceRequest from '@/pages/owner/ServiceRequest';
import InspectionRequest from '@/pages/owner/InspectionRequest';
import OwnerRentalTerms from '@/pages/owner/OwnerRentalTerms';

export const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/discover" element={<PageTransition><Discover /></PageTransition>} />
        <Route path="/map" element={<PageTransition><MapView /></PageTransition>} />
        <Route path="/bookings" element={<PageTransition><Bookings /></PageTransition>} />
        <Route path="/bookings/:id" element={<PageTransition><BookingDetail /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/favorites" element={<PageTransition><Favorites /></PageTransition>} />
        <Route path="/search" element={<PageTransition><Search /></PageTransition>} />
        <Route path="/notifications" element={<PageTransition><Notifications /></PageTransition>} />
        <Route path="/history" element={<PageTransition><ViewHistory /></PageTransition>} />
        <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
        <Route path="/wallet" element={<PageTransition><Wallet /></PageTransition>} />
        <Route path="/sos" element={<PageTransition><SOS /></PageTransition>} />
        <Route path="/vip-concierge" element={<PageTransition><VipConcierge /></PageTransition>} />
        <Route path="/support" element={<PageTransition><Support /></PageTransition>} />
        
        {/* Beauty & Spa Mini-App Routes */}
        <Route path="/beauty" element={<PageTransition><BeautySpaIndex /></PageTransition>} />
        <Route path="/beauty/salon/:id" element={<PageTransition><SalonDetail /></PageTransition>} />
        <Route path="/beauty/booking/:id" element={<PageTransition><BeautyBooking /></PageTransition>} />
        <Route path="/beauty/services" element={<PageTransition><BeautyServices /></PageTransition>} />
        <Route path="/beauty/map" element={<PageTransition><BeautyMap /></PageTransition>} />
        
        {/* Property Mini-App Routes */}
        <Route path="/property" element={<PageTransition><PropertyIndex /></PageTransition>} />
        <Route path="/property/:id" element={<PageTransition><PropertyDetail /></PageTransition>} />
        <Route path="/property/inquiry/:id" element={<PageTransition><PropertyInquiry /></PageTransition>} />
        <Route path="/property/map" element={<PageTransition><PropertyMap /></PageTransition>} />
        
        {/* Food & Delivery Mini-App Routes (legacy - redirects) */}
        <Route path="/food" element={<Navigate to="/restaurants" replace />} />
        <Route path="/food/restaurant/:id" element={<PageTransition><FoodRestaurantDetail /></PageTransition>} />
        <Route path="/food/checkout" element={<PageTransition><FoodCheckout /></PageTransition>} />
        
        {/* Restaurants Mini-App Routes */}
        <Route path="/restaurants" element={<PageTransition><RestaurantsIndex /></PageTransition>} />
        <Route path="/restaurants/map" element={<PageTransition><RestaurantMap /></PageTransition>} />
        <Route path="/restaurants/:id" element={<PageTransition><RestaurantDetail /></PageTransition>} />
        <Route path="/restaurants/:id/reserve" element={<PageTransition><TableReservation /></PageTransition>} />
        <Route path="/restaurants/:id/delivery" element={<PageTransition><DeliveryCheckout /></PageTransition>} />
        <Route path="/restaurants/:id/experience/:setId" element={<PageTransition><SetMenuBooking /></PageTransition>} />
        
        {/* Transport Mini-App Routes */}
        <Route path="/transport" element={<PageTransition><TransportIndex /></PageTransition>} />
        <Route path="/transport/vehicle/:id" element={<PageTransition><VehicleDetail /></PageTransition>} />
        <Route path="/transport/booking/:id" element={<PageTransition><TransportBooking /></PageTransition>} />
        <Route path="/transport/airport-transfer" element={<PageTransition><AirportTransferBooking /></PageTransition>} />
        <Route path="/transport/airport" element={<Navigate to="/transport/airport-transfer" replace />} />
        <Route path="/airport-transfer" element={<Navigate to="/transport/airport-transfer" replace />} />
        <Route path="/transport/taxi" element={<PageTransition><TaxiBooking /></PageTransition>} />
        
        {/* Fitness Mini-App Routes */}
        <Route path="/fitness" element={<PageTransition><FitnessIndex /></PageTransition>} />
        <Route path="/fitness/gym/:id" element={<PageTransition><GymDetail /></PageTransition>} />
        <Route path="/fitness/booking/:id" element={<PageTransition><FitnessBooking /></PageTransition>} />
        
        {/* Medical Mini-App Routes */}
        <Route path="/medical" element={<PageTransition><MedicalIndex /></PageTransition>} />
        <Route path="/medical/clinic/:id" element={<PageTransition><ClinicDetail /></PageTransition>} />
        <Route path="/medical/appointment/:id" element={<PageTransition><MedicalAppointment /></PageTransition>} />
        
        {/* Events Mini-App Routes */}
        <Route path="/events" element={<PageTransition><EventsIndex /></PageTransition>} />
        <Route path="/events/:id" element={<PageTransition><EventDetail /></PageTransition>} />
        <Route path="/events/booking/:id" element={<PageTransition><EventBooking /></PageTransition>} />
        
        {/* Education Mini-App Routes */}
        <Route path="/education" element={<PageTransition><EducationIndex /></PageTransition>} />
        <Route path="/education/course/:id" element={<PageTransition><CourseDetail /></PageTransition>} />
        <Route path="/education/tutor/:id" element={<PageTransition><TutorDetail /></PageTransition>} />
        <Route path="/education/booking/:id" element={<PageTransition><EducationBooking /></PageTransition>} />
        
        {/* Flowers Mini-App Routes */}
        <Route path="/flowers" element={<PageTransition><FlowersIndex /></PageTransition>} />
        <Route path="/flowers/bouquet/:id" element={<PageTransition><BouquetDetail /></PageTransition>} />
        <Route path="/flowers/shop/:id" element={<PageTransition><FlowerShopDetail /></PageTransition>} />
        <Route path="/flowers/order" element={<PageTransition><FlowersOrder /></PageTransition>} />
        <Route path="/flowers/order/:id" element={<PageTransition><FlowersOrder /></PageTransition>} />
        
        {/* Home Services Mini-App Routes */}
        <Route path="/services" element={<PageTransition><ServicesIndex /></PageTransition>} />
        <Route path="/services/provider/:id" element={<PageTransition><ServiceProviderDetail /></PageTransition>} />
        <Route path="/services/booking/:id" element={<PageTransition><ServiceBooking /></PageTransition>} />
        <Route path="/services/map" element={<PageTransition><ServicesMap /></PageTransition>} />
        
        {/* Legal & Business Services Mini-App Routes */}
        <Route path="/legal" element={<PageTransition><LegalServicesIndex /></PageTransition>} />
        <Route path="/legal/provider/:id" element={<PageTransition><LegalProviderDetail /></PageTransition>} />
        <Route path="/legal/booking/:id" element={<PageTransition><LegalBooking /></PageTransition>} />
        
        {/* Insurance Mini-App Routes */}
        <Route path="/insurance" element={<PageTransition><InsuranceIndex /></PageTransition>} />
        <Route path="/insurance/:id" element={<PageTransition><InsuranceDetail /></PageTransition>} />
        <Route path="/insurance/:id/quote" element={<PageTransition><InsuranceQuote /></PageTransition>} />
        
        {/* Tours Mini-App Routes */}
        <Route path="/tours" element={<PageTransition><ToursIndex /></PageTransition>} />
        <Route path="/tours/:id" element={<PageTransition><TourDetail /></PageTransition>} />
        <Route path="/tours/:id/book" element={<PageTransition><TourBooking /></PageTransition>} />
        
        {/* Water Activities Mini-App Routes */}
        <Route path="/water" element={<PageTransition><WaterActivitiesIndex /></PageTransition>} />
        <Route path="/water/:id" element={<PageTransition><WaterActivityDetail /></PageTransition>} />
        <Route path="/water/:id/book" element={<PageTransition><WaterActivityBooking /></PageTransition>} />
        
        {/* Pharmacy Mini-App Routes */}
        <Route path="/pharmacy" element={<PageTransition><PharmacyIndex /></PageTransition>} />
        
        {/* Pets Mini-App Routes */}
        <Route path="/pets" element={<PageTransition><PetsIndex /></PageTransition>} />
        <Route path="/pets/transport" element={<PageTransition><PetTransport /></PageTransition>} />
        <Route path="/pets/:id" element={<PageTransition><PetServiceDetail /></PageTransition>} />
        <Route path="/pets/:id/booking" element={<PageTransition><PetServiceBooking /></PageTransition>} />
        <Route path="/pharmacy/:id" element={<PageTransition><PharmacyDetail /></PageTransition>} />
        
        {/* Yachts Mini-App Routes */}
        <Route path="/yachts" element={<PageTransition><YachtsIndex /></PageTransition>} />
        <Route path="/yachts/:id" element={<PageTransition><YachtDetail /></PageTransition>} />
        <Route path="/yachts/:id/booking" element={<PageTransition><YachtBooking /></PageTransition>} />
        
        {/* Cleaning Mini-App Routes */}
        <Route path="/cleaning" element={<PageTransition><CleaningIndex /></PageTransition>} />
        <Route path="/cleaning/:id" element={<PageTransition><CleaningDetail /></PageTransition>} />
        <Route path="/cleaning/:id/book" element={<PageTransition><CleaningBooking /></PageTransition>} />
        
        {/* Babysitter Mini-App Routes */}
        <Route path="/babysitter" element={<PageTransition><BabysitterIndex /></PageTransition>} />
        <Route path="/babysitter/:id" element={<PageTransition><BabysitterDetail /></PageTransition>} />
        <Route path="/babysitter/:id/book" element={<PageTransition><BabysitterBooking /></PageTransition>} />
        
        {/* Delivery Mini-App Routes */}
        <Route path="/delivery" element={<PageTransition><DeliveryIndex /></PageTransition>} />
        
        {/* Market Mini-App Routes */}
        <Route path="/market" element={<PageTransition><MarketIndex /></PageTransition>} />
        <Route path="/market/store/:id" element={<PageTransition><StoreDetail /></PageTransition>} />
        <Route path="/market/checkout" element={<PageTransition><MarketCheckout /></PageTransition>} />
        
        {/* Info Pages */}
        <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
        <Route path="/how-it-works" element={<PageTransition><HowItWorksPage /></PageTransition>} />
        <Route path="/faq" element={<PageTransition><FAQPage /></PageTransition>} />
        <Route path="/partners" element={<PageTransition><PartnersPage /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><PrivacyPage /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
        <Route path="/become-partner" element={<PageTransition><BecomePartnerPage /></PageTransition>} />
        <Route path="/view-history" element={<PageTransition><ViewHistory /></PageTransition>} />
        
        {/* Admin Routes */}
        <Route path="/admin/partner-applications" element={<PageTransition><PartnerApplicationsAdmin /></PageTransition>} />
        
        {/* Vendor Routes */}
        <Route path="/vendor" element={<PageTransition><VendorDashboard /></PageTransition>} />
        <Route path="/vendor/onboarding" element={<PageTransition><VendorOnboarding /></PageTransition>} />
        <Route path="/vendor/bookings" element={<PageTransition><VendorBookings /></PageTransition>} />
        <Route path="/vendor/services" element={<PageTransition><VendorServices /></PageTransition>} />
        <Route path="/vendor/analytics" element={<PageTransition><VendorAnalytics /></PageTransition>} />
        <Route path="/vendor/payouts" element={<PageTransition><VendorPayouts /></PageTransition>} />
        <Route path="/vendor/properties" element={<PageTransition><VendorProperties /></PageTransition>} />
        <Route path="/vendor/tours" element={<PageTransition><VendorTours /></PageTransition>} />
        <Route path="/vendor/activities" element={<PageTransition><VendorActivities /></PageTransition>} />
        
        {/* Owner (Property Care) Routes */}
        <Route path="/owner" element={<PageTransition><OwnerDashboard /></PageTransition>} />
        <Route path="/owner/properties" element={<PageTransition><OwnerProperties /></PageTransition>} />
        <Route path="/owner/properties/new" element={<PageTransition><AddProperty /></PageTransition>} />
        <Route path="/owner/properties/:id" element={<PageTransition><OwnerPropertyDetail /></PageTransition>} />
        <Route path="/owner/properties/:id/terms" element={<PageTransition><OwnerRentalTerms /></PageTransition>} />
        <Route path="/owner/calendar" element={<PageTransition><OwnerCalendar /></PageTransition>} />
        <Route path="/owner/financials" element={<PageTransition><OwnerFinancials /></PageTransition>} />
        <Route path="/owner/financials/new" element={<PageTransition><OwnerFinancialForm /></PageTransition>} />
        <Route path="/owner/financials/:id" element={<PageTransition><OwnerFinancialForm /></PageTransition>} />
        <Route path="/owner/messages" element={<PageTransition><OwnerMessages /></PageTransition>} />
        <Route path="/owner/chat/:type/:id" element={<PageTransition><OwnerChatRoom /></PageTransition>} />
        <Route path="/owner/support-chat" element={<PageTransition><OwnerSupportChat /></PageTransition>} />
        <Route path="/owner/service-request" element={<PageTransition><ServiceRequest /></PageTransition>} />
        <Route path="/owner/inspection" element={<PageTransition><InspectionRequest /></PageTransition>} />
        
        {/* Catch-all */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};
