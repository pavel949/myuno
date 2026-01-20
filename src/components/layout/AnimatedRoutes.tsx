import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './PageTransition';
import { ScrollToTop } from './ScrollToTop';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { AdminGuard, VendorGuard, OwnerGuard } from '@/components/auth/RoleGuard';

// Core pages - load eagerly for fast initial navigation
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';

// Lazy load all other pages for code splitting
const Discover = lazy(() => import('@/pages/Discover'));
const MapView = lazy(() => import('@/pages/MapView'));
const Bookings = lazy(() => import('@/pages/Bookings'));
const BookingDetail = lazy(() => import('@/pages/BookingDetail'));
const Profile = lazy(() => import('@/pages/Profile'));
const EditProfile = lazy(() => import('@/pages/profile/EditProfile'));

// Beauty & Spa Mini-App
const BeautySpaIndex = lazy(() => import('@/pages/beauty/BeautySpaIndex'));
const SalonDetail = lazy(() => import('@/pages/beauty/SalonDetail'));
const BeautyBooking = lazy(() => import('@/pages/beauty/BeautyBooking'));
const BeautyServices = lazy(() => import('@/pages/beauty/BeautyServices'));
const BeautyMap = lazy(() => import('@/pages/beauty/BeautyMap'));

// Property Mini-App
const PropertyIndex = lazy(() => import('@/pages/property/PropertyIndex'));
const PropertyDetail = lazy(() => import('@/pages/property/PropertyDetail'));
const PropertyInquiry = lazy(() => import('@/pages/property/PropertyInquiry'));
const PropertyMap = lazy(() => import('@/pages/property/PropertyMap'));

// Food & Delivery Mini-App (legacy)
const FoodIndex = lazy(() => import('@/pages/food/FoodIndex'));
const FoodRestaurantDetail = lazy(() => import('@/pages/food/RestaurantDetail'));
const FoodCheckout = lazy(() => import('@/pages/food/FoodCheckout'));

// Restaurants Mini-App
const RestaurantsIndex = lazy(() => import('@/pages/restaurants/RestaurantsIndex'));
const RestaurantDetail = lazy(() => import('@/pages/restaurants/RestaurantDetail'));
const TableReservation = lazy(() => import('@/pages/restaurants/TableReservation'));
const DeliveryCheckout = lazy(() => import('@/pages/restaurants/DeliveryCheckout'));
const SetMenuBooking = lazy(() => import('@/pages/restaurants/SetMenuBooking'));
const RestaurantMap = lazy(() => import('@/pages/restaurants/RestaurantMap'));

// Transport Mini-App
const TransportIndex = lazy(() => import('@/pages/transport/TransportIndex'));
const VehicleDetail = lazy(() => import('@/pages/transport/VehicleDetail'));
const TransportBooking = lazy(() => import('@/pages/transport/TransportBooking'));
const AirportTransferBooking = lazy(() => import('@/pages/transport/AirportTransferBooking'));
const TaxiBooking = lazy(() => import('@/pages/transport/TaxiBooking'));

// Fitness Mini-App
const FitnessIndex = lazy(() => import('@/pages/fitness/FitnessIndex'));
const GymDetail = lazy(() => import('@/pages/fitness/GymDetail'));
const FitnessBooking = lazy(() => import('@/pages/fitness/FitnessBooking'));

// Medical Mini-App
const MedicalIndex = lazy(() => import('@/pages/medical/MedicalIndex'));
const ClinicDetail = lazy(() => import('@/pages/medical/ClinicDetail'));
const MedicalAppointment = lazy(() => import('@/pages/medical/MedicalAppointment'));

// Events Mini-App
const EventsIndex = lazy(() => import('@/pages/events/EventsIndex'));
const EventDetail = lazy(() => import('@/pages/events/EventDetail'));
const EventBooking = lazy(() => import('@/pages/events/EventBooking'));
const VenueDetail = lazy(() => import('@/pages/events/VenueDetail'));

// Education Mini-App
const EducationIndex = lazy(() => import('@/pages/education/EducationIndex'));
const CourseDetail = lazy(() => import('@/pages/education/CourseDetail'));
const TutorDetail = lazy(() => import('@/pages/education/TutorDetail'));
const EducationBooking = lazy(() => import('@/pages/education/EducationBooking'));

// Flowers Mini-App
const FlowersIndex = lazy(() => import('@/pages/flowers/FlowersIndex'));
const FlowerShopDetail = lazy(() => import('@/pages/flowers/FlowerShopDetail'));
const FlowersOrder = lazy(() => import('@/pages/flowers/FlowersOrder'));
const BouquetDetail = lazy(() => import('@/pages/flowers/BouquetDetail'));

// Home Services Mini-App
const ServicesIndex = lazy(() => import('@/pages/services/ServicesIndex'));
const ServiceProviderDetail = lazy(() => import('@/pages/services/ServiceProviderDetail'));
const ServiceBooking = lazy(() => import('@/pages/services/ServiceBooking'));
const ServicesMap = lazy(() => import('@/pages/services/ServicesMap'));

// Legal & Business Services Mini-App
const LegalServicesIndex = lazy(() => import('@/pages/legal/LegalServicesIndex'));
const LegalProviderDetail = lazy(() => import('@/pages/legal/LegalProviderDetail'));
const LegalBooking = lazy(() => import('@/pages/legal/LegalBooking'));
const VisaServiceDetail = lazy(() => import('@/pages/legal/VisaServiceDetail'));

// Insurance Mini-App
const InsuranceIndex = lazy(() => import('@/pages/insurance/InsuranceIndex'));
const InsuranceDetail = lazy(() => import('@/pages/insurance/InsuranceDetail'));
const InsuranceQuote = lazy(() => import('@/pages/insurance/InsuranceQuote'));
const InsurancePlanDetail = lazy(() => import('@/pages/insurance/InsurancePlanDetail'));

// Install Page
const Install = lazy(() => import('@/pages/Install'));
// Tours Mini-App
const ToursIndex = lazy(() => import('@/pages/tours/ToursIndex'));
const TourDetail = lazy(() => import('@/pages/tours/TourDetail'));
const TourBooking = lazy(() => import('@/pages/tours/TourBooking'));

// Water Activities Mini-App
const WaterActivitiesIndex = lazy(() => import('@/pages/water/WaterActivitiesIndex'));
const WaterActivityDetail = lazy(() => import('@/pages/water/WaterActivityDetail'));
const WaterActivityBooking = lazy(() => import('@/pages/water/WaterActivityBooking'));

// Pharmacy Mini-App
const PharmacyIndex = lazy(() => import('@/pages/pharmacy/PharmacyIndex'));
const PharmacyDetail = lazy(() => import('@/pages/pharmacy/PharmacyDetail'));

// Pets Mini-App
const PetsIndex = lazy(() => import('@/pages/pets/PetsIndex'));
const PetServiceDetail = lazy(() => import('@/pages/pets/PetServiceDetail'));
const PetServiceBooking = lazy(() => import('@/pages/pets/PetServiceBooking'));
const PetTransport = lazy(() => import('@/pages/pets/PetTransport'));

// Yachts Mini-App
const YachtsIndex = lazy(() => import('@/pages/yachts/YachtsIndex'));
const YachtDetail = lazy(() => import('@/pages/yachts/YachtDetail'));
const YachtBooking = lazy(() => import('@/pages/yachts/YachtBooking'));

// Cleaning Mini-App
const CleaningIndex = lazy(() => import('@/pages/cleaning/CleaningIndex'));
const CleaningDetail = lazy(() => import('@/pages/cleaning/CleaningDetail'));
const CleaningBooking = lazy(() => import('@/pages/cleaning/CleaningBooking'));

// Babysitter Mini-App
const BabysitterDetail = lazy(() => import('@/pages/babysitter/BabysitterDetail'));
const BabysitterBooking = lazy(() => import('@/pages/babysitter/BabysitterBooking'));
const BabysitterIndex = lazy(() => import('@/pages/babysitter/BabysitterIndex'));

// Delivery Mini-App
const DeliveryIndex = lazy(() => import('@/pages/delivery/DeliveryIndex'));

// Market Mini-App
const MarketIndex = lazy(() => import('@/pages/market/MarketIndex'));
const StoreDetail = lazy(() => import('@/pages/market/StoreDetail'));
const MarketCheckout = lazy(() => import('@/pages/market/MarketCheckout'));

// Other pages
const Favorites = lazy(() => import('@/pages/Favorites'));
const Search = lazy(() => import('@/pages/Search'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const ViewHistory = lazy(() => import('@/pages/ViewHistory'));
const Cart = lazy(() => import('@/pages/Cart'));
const Wallet = lazy(() => import('@/pages/Wallet'));
const SOS = lazy(() => import('@/pages/SOS'));
const VipConcierge = lazy(() => import('@/pages/VipConcierge'));
const Support = lazy(() => import('@/pages/Support'));

// Info pages
const AboutPage = lazy(() => import('@/pages/info/AboutPage'));
const HowItWorksPage = lazy(() => import('@/pages/info/HowItWorksPage'));
const FAQPage = lazy(() => import('@/pages/info/FAQPage'));
const PartnersPage = lazy(() => import('@/pages/info/PartnersPage'));
const PrivacyPage = lazy(() => import('@/pages/info/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/info/TermsPage'));
const BecomePartnerPage = lazy(() => import('@/pages/info/BecomePartnerPage'));

// Admin pages
const PartnerApplicationsAdmin = lazy(() => import('@/pages/admin/PartnerApplicationsAdmin'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminProviders = lazy(() => import('@/pages/admin/AdminProviders'));
const AdminServices = lazy(() => import('@/pages/admin/AdminServices'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));
const InvestorPitchDeck = lazy(() => import('@/pages/admin/InvestorPitchDeck'));
const OperationsHub = lazy(() => import('@/pages/admin/OperationsHub'));
const AdminYachts = lazy(() => import('@/pages/admin/AdminYachts'));
const AdminTours = lazy(() => import('@/pages/admin/AdminTours'));
const AdminActivities = lazy(() => import('@/pages/admin/AdminActivities'));
const AdminProperties = lazy(() => import('@/pages/admin/AdminProperties'));
const AdminRestaurants = lazy(() => import('@/pages/admin/AdminRestaurants'));
const AdminSalons = lazy(() => import('@/pages/admin/AdminSalons'));
const AdminClinics = lazy(() => import('@/pages/admin/AdminClinics'));
const AdminGyms = lazy(() => import('@/pages/admin/AdminGyms'));
const AdminVehicles = lazy(() => import('@/pages/admin/AdminVehicles'));
const AdminEvents = lazy(() => import('@/pages/admin/AdminEvents'));
const AdminEducation = lazy(() => import('@/pages/admin/AdminEducation'));
const AdminLegal = lazy(() => import('@/pages/admin/AdminLegal'));
const AdminPets = lazy(() => import('@/pages/admin/AdminPets'));
const AdminCleaning = lazy(() => import('@/pages/admin/AdminCleaning'));
const AdminBabysitters = lazy(() => import('@/pages/admin/AdminBabysitters'));
const AdminFlowers = lazy(() => import('@/pages/admin/AdminFlowers'));
const AdminLookups = lazy(() => import('@/pages/admin/AdminLookups'));
const AcquisitionMetrics = lazy(() => import('@/pages/admin/AcquisitionMetrics'));

// Vendor pages
const VendorDashboard = lazy(() => import('@/pages/vendor/VendorDashboard'));
const VendorOnboarding = lazy(() => import('@/pages/vendor/VendorOnboarding'));
const VendorBookings = lazy(() => import('@/pages/vendor/VendorBookings'));
const VendorServices = lazy(() => import('@/pages/vendor/VendorServices'));
const VendorAnalytics = lazy(() => import('@/pages/vendor/VendorAnalytics'));
const VendorPayouts = lazy(() => import('@/pages/vendor/VendorPayouts'));
const VendorProperties = lazy(() => import('@/pages/vendor/VendorProperties'));
const VendorTours = lazy(() => import('@/pages/vendor/VendorTours'));
const VendorActivities = lazy(() => import('@/pages/vendor/VendorActivities'));
const VendorYachts = lazy(() => import('@/pages/vendor/VendorYachts'));
const VendorTransport = lazy(() => import('@/pages/vendor/VendorTransport'));
const VendorBeauty = lazy(() => import('@/pages/vendor/VendorBeauty'));
const VendorFitness = lazy(() => import('@/pages/vendor/VendorFitness'));
const VendorClinics = lazy(() => import('@/pages/vendor/VendorClinics'));
const VendorSubscription = lazy(() => import('@/pages/vendor/VendorSubscription'));
const VendorRestaurants = lazy(() => import('@/pages/vendor/VendorRestaurants'));
const VendorEvents = lazy(() => import('@/pages/vendor/VendorEvents'));
const VendorEducation = lazy(() => import('@/pages/vendor/VendorEducation'));
const VendorLegal = lazy(() => import('@/pages/vendor/VendorLegal'));
const VendorPets = lazy(() => import('@/pages/vendor/VendorPets'));
const VendorCleaning = lazy(() => import('@/pages/vendor/VendorCleaning'));
const VendorBabysitters = lazy(() => import('@/pages/vendor/VendorBabysitters'));
const VendorFlowers = lazy(() => import('@/pages/vendor/VendorFlowers'));

// Owner (Property Care) pages
const OwnerDashboard = lazy(() => import('@/pages/owner/OwnerDashboard'));
const OwnerProperties = lazy(() => import('@/pages/owner/OwnerProperties'));
const OwnerPropertyDetail = lazy(() => import('@/pages/owner/OwnerPropertyDetail'));
const OwnerCalendar = lazy(() => import('@/pages/owner/OwnerCalendar'));
const OwnerFinancials = lazy(() => import('@/pages/owner/OwnerFinancials'));
const OwnerFinancialForm = lazy(() => import('@/pages/owner/OwnerFinancialForm'));
const OwnerMessages = lazy(() => import('@/pages/owner/OwnerMessages'));
const OwnerChatRoom = lazy(() => import('@/pages/owner/OwnerChatRoom'));
const OwnerSupportChat = lazy(() => import('@/pages/owner/OwnerSupportChat'));
const AddProperty = lazy(() => import('@/pages/owner/AddProperty'));
const ServiceRequest = lazy(() => import('@/pages/owner/ServiceRequest'));
const InspectionRequest = lazy(() => import('@/pages/owner/InspectionRequest'));
const OwnerRentalTerms = lazy(() => import('@/pages/owner/OwnerRentalTerms'));
const EditProperty = lazy(() => import('@/pages/owner/EditProperty'));

// Guest pages
const MyStay = lazy(() => import('@/pages/guest/MyStay'));
const GuestCheckIn = lazy(() => import('@/pages/guest/GuestCheckIn'));
const GuestGuidebook = lazy(() => import('@/pages/guest/GuestGuidebook'));

// Owner Guidebook
const OwnerGuidebookEdit = lazy(() => import('@/pages/owner/OwnerGuidebookEdit'));

// Staff pages
const StaffDashboard = lazy(() => import('@/pages/staff/StaffDashboard'));

// Suspense wrapper for lazy loaded components
const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingState />}>
    <PageTransition>{children}</PageTransition>
  </Suspense>
);

// Prefetch popular routes on idle
const prefetchRoutes = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Prefetch most common user journeys
      import('@/pages/property/PropertyIndex');
      import('@/pages/restaurants/RestaurantsIndex');
      import('@/pages/tours/ToursIndex');
      import('@/pages/beauty/BeautySpaIndex');
    });
  }
};

export const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  // Prefetch on mount
  React.useEffect(() => {
    prefetchRoutes();
  }, []);
  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
        {/* Core routes - eagerly loaded */}
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        
        {/* Lazy loaded routes */}
        <Route path="/discover" element={<LazyPage><Discover /></LazyPage>} />
        <Route path="/map" element={<LazyPage><MapView /></LazyPage>} />
        <Route path="/bookings" element={<LazyPage><Bookings /></LazyPage>} />
        <Route path="/bookings/:id" element={<LazyPage><BookingDetail /></LazyPage>} />
        <Route path="/profile" element={<LazyPage><Profile /></LazyPage>} />
        <Route path="/profile/edit" element={<LazyPage><EditProfile /></LazyPage>} />
        <Route path="/favorites" element={<LazyPage><Favorites /></LazyPage>} />
        <Route path="/search" element={<LazyPage><Search /></LazyPage>} />
        <Route path="/notifications" element={<LazyPage><Notifications /></LazyPage>} />
        <Route path="/history" element={<LazyPage><ViewHistory /></LazyPage>} />
        <Route path="/cart" element={<LazyPage><Cart /></LazyPage>} />
        <Route path="/wallet" element={<LazyPage><Wallet /></LazyPage>} />
        <Route path="/sos" element={<LazyPage><SOS /></LazyPage>} />
        <Route path="/vip-concierge" element={<LazyPage><VipConcierge /></LazyPage>} />
        <Route path="/support" element={<LazyPage><Support /></LazyPage>} />
        <Route path="/install" element={<LazyPage><Install /></LazyPage>} />
        
        {/* Beauty & Spa Mini-App Routes */}
        <Route path="/beauty" element={<LazyPage><BeautySpaIndex /></LazyPage>} />
        <Route path="/beauty/salon/:id" element={<LazyPage><SalonDetail /></LazyPage>} />
        <Route path="/beauty/booking/:id" element={<LazyPage><BeautyBooking /></LazyPage>} />
        <Route path="/beauty/services" element={<LazyPage><BeautyServices /></LazyPage>} />
        <Route path="/beauty/map" element={<LazyPage><BeautyMap /></LazyPage>} />
        
        {/* Property Mini-App Routes */}
        <Route path="/property" element={<LazyPage><PropertyIndex /></LazyPage>} />
        <Route path="/property/:id" element={<LazyPage><PropertyDetail /></LazyPage>} />
        <Route path="/property/:id/inquiry" element={<LazyPage><PropertyInquiry /></LazyPage>} />
        <Route path="/property/map" element={<LazyPage><PropertyMap /></LazyPage>} />
        
        {/* Food & Delivery Mini-App Routes (legacy - redirects) */}
        <Route path="/food" element={<Navigate to="/restaurants" replace />} />
        <Route path="/food/restaurant/:id" element={<LazyPage><FoodRestaurantDetail /></LazyPage>} />
        <Route path="/food/checkout" element={<LazyPage><FoodCheckout /></LazyPage>} />
        
        {/* Restaurants Mini-App Routes */}
        <Route path="/restaurants" element={<LazyPage><RestaurantsIndex /></LazyPage>} />
        <Route path="/restaurants/map" element={<LazyPage><RestaurantMap /></LazyPage>} />
        <Route path="/restaurants/:id" element={<LazyPage><RestaurantDetail /></LazyPage>} />
        <Route path="/restaurants/:id/reserve" element={<LazyPage><TableReservation /></LazyPage>} />
        <Route path="/restaurants/:id/delivery" element={<LazyPage><DeliveryCheckout /></LazyPage>} />
        <Route path="/restaurants/:id/experience/:setId" element={<LazyPage><SetMenuBooking /></LazyPage>} />
        
        {/* Transport Mini-App Routes */}
        <Route path="/transport" element={<LazyPage><TransportIndex /></LazyPage>} />
        <Route path="/transport/vehicle/:id" element={<LazyPage><VehicleDetail /></LazyPage>} />
        <Route path="/transport/booking/:id" element={<LazyPage><TransportBooking /></LazyPage>} />
        <Route path="/transport/airport-transfer" element={<LazyPage><AirportTransferBooking /></LazyPage>} />
        <Route path="/transport/airport" element={<Navigate to="/transport/airport-transfer" replace />} />
        <Route path="/airport-transfer" element={<Navigate to="/transport/airport-transfer" replace />} />
        <Route path="/transport/taxi" element={<LazyPage><TaxiBooking /></LazyPage>} />
        <Route path="/taxi-booking" element={<Navigate to="/transport/taxi" replace />} />
        
        {/* Fitness Mini-App Routes */}
        <Route path="/fitness" element={<LazyPage><FitnessIndex /></LazyPage>} />
        <Route path="/fitness/gym/:id" element={<LazyPage><GymDetail /></LazyPage>} />
        <Route path="/fitness/booking/:id" element={<LazyPage><FitnessBooking /></LazyPage>} />
        
        {/* Medical Mini-App Routes */}
        <Route path="/medical" element={<LazyPage><MedicalIndex /></LazyPage>} />
        <Route path="/medical/clinic/:id" element={<LazyPage><ClinicDetail /></LazyPage>} />
        <Route path="/medical/appointment/:id" element={<LazyPage><MedicalAppointment /></LazyPage>} />
        
        {/* Events Mini-App Routes */}
        <Route path="/events" element={<LazyPage><EventsIndex /></LazyPage>} />
        <Route path="/events/:id" element={<LazyPage><EventDetail /></LazyPage>} />
        <Route path="/events/booking/:id" element={<LazyPage><EventBooking /></LazyPage>} />
        <Route path="/venues/:id" element={<LazyPage><VenueDetail /></LazyPage>} />
        
        {/* Education Mini-App Routes */}
        <Route path="/education" element={<LazyPage><EducationIndex /></LazyPage>} />
        <Route path="/education/course/:id" element={<LazyPage><CourseDetail /></LazyPage>} />
        <Route path="/education/tutor/:id" element={<LazyPage><TutorDetail /></LazyPage>} />
        <Route path="/education/booking/:id" element={<LazyPage><EducationBooking /></LazyPage>} />
        
        {/* Flowers Mini-App Routes */}
        <Route path="/flowers" element={<LazyPage><FlowersIndex /></LazyPage>} />
        <Route path="/flowers/bouquet/:id" element={<LazyPage><BouquetDetail /></LazyPage>} />
        <Route path="/flowers/shop" element={<Navigate to="/flowers" replace />} />
        <Route path="/flowers/shop/:id" element={<LazyPage><FlowerShopDetail /></LazyPage>} />
        <Route path="/flowers/order" element={<LazyPage><FlowersOrder /></LazyPage>} />
        <Route path="/flowers/order/:id" element={<LazyPage><FlowersOrder /></LazyPage>} />
        
        {/* Home Services Mini-App Routes */}
        <Route path="/services" element={<LazyPage><ServicesIndex /></LazyPage>} />
        <Route path="/services/provider/:id" element={<LazyPage><ServiceProviderDetail /></LazyPage>} />
        <Route path="/services/booking/:id" element={<LazyPage><ServiceBooking /></LazyPage>} />
        <Route path="/services/map" element={<LazyPage><ServicesMap /></LazyPage>} />
        
        {/* Legal & Business Services Mini-App Routes */}
        <Route path="/legal" element={<LazyPage><LegalServicesIndex /></LazyPage>} />
        <Route path="/legal/provider/:id" element={<LazyPage><LegalProviderDetail /></LazyPage>} />
        <Route path="/legal/visa/:id" element={<LazyPage><VisaServiceDetail /></LazyPage>} />
        <Route path="/legal/booking/:id" element={<LazyPage><LegalBooking /></LazyPage>} />
        
        {/* Insurance Mini-App Routes */}
        <Route path="/insurance" element={<LazyPage><InsuranceIndex /></LazyPage>} />
        <Route path="/insurance/plan/:planId" element={<LazyPage><InsurancePlanDetail /></LazyPage>} />
        <Route path="/insurance/:id" element={<LazyPage><InsuranceDetail /></LazyPage>} />
        <Route path="/insurance/:id/quote" element={<LazyPage><InsuranceQuote /></LazyPage>} />
        
        {/* Tours Mini-App Routes */}
        <Route path="/tours" element={<LazyPage><ToursIndex /></LazyPage>} />
        <Route path="/tours/:id" element={<LazyPage><TourDetail /></LazyPage>} />
        <Route path="/tours/:id/book" element={<LazyPage><TourBooking /></LazyPage>} />
        
        {/* Water Activities Mini-App Routes */}
        <Route path="/water" element={<LazyPage><WaterActivitiesIndex /></LazyPage>} />
        <Route path="/water/:id" element={<LazyPage><WaterActivityDetail /></LazyPage>} />
        <Route path="/water/:id/book" element={<LazyPage><WaterActivityBooking /></LazyPage>} />
        
        {/* Pharmacy Mini-App Routes */}
        <Route path="/pharmacy" element={<LazyPage><PharmacyIndex /></LazyPage>} />
        
        {/* Pets Mini-App Routes */}
        <Route path="/pets" element={<LazyPage><PetsIndex /></LazyPage>} />
        <Route path="/pets/transport" element={<LazyPage><PetTransport /></LazyPage>} />
        <Route path="/pets/:id" element={<LazyPage><PetServiceDetail /></LazyPage>} />
        <Route path="/pets/:id/booking" element={<LazyPage><PetServiceBooking /></LazyPage>} />
        <Route path="/pharmacy/:id" element={<LazyPage><PharmacyDetail /></LazyPage>} />
        
        {/* Yachts Mini-App Routes */}
        <Route path="/yachts" element={<LazyPage><YachtsIndex /></LazyPage>} />
        <Route path="/yachts/:id" element={<LazyPage><YachtDetail /></LazyPage>} />
        <Route path="/yachts/:id/booking" element={<LazyPage><YachtBooking /></LazyPage>} />
        
        {/* Cleaning Mini-App Routes */}
        <Route path="/cleaning" element={<LazyPage><CleaningIndex /></LazyPage>} />
        <Route path="/cleaning/:id" element={<LazyPage><CleaningDetail /></LazyPage>} />
        <Route path="/cleaning/:id/book" element={<LazyPage><CleaningBooking /></LazyPage>} />
        
        {/* Babysitter Mini-App Routes */}
        <Route path="/babysitter" element={<LazyPage><BabysitterIndex /></LazyPage>} />
        <Route path="/babysitter/:id" element={<LazyPage><BabysitterDetail /></LazyPage>} />
        <Route path="/babysitter/:id/book" element={<LazyPage><BabysitterBooking /></LazyPage>} />
        
        {/* Delivery Mini-App Routes */}
        <Route path="/delivery" element={<LazyPage><DeliveryIndex /></LazyPage>} />
        
        {/* Market Mini-App Routes */}
        <Route path="/market" element={<LazyPage><MarketIndex /></LazyPage>} />
        <Route path="/market/store/:id" element={<LazyPage><StoreDetail /></LazyPage>} />
        <Route path="/market/checkout" element={<LazyPage><MarketCheckout /></LazyPage>} />
        
        {/* Info Pages */}
        <Route path="/about" element={<LazyPage><AboutPage /></LazyPage>} />
        <Route path="/how-it-works" element={<LazyPage><HowItWorksPage /></LazyPage>} />
        <Route path="/faq" element={<LazyPage><FAQPage /></LazyPage>} />
        <Route path="/partners" element={<LazyPage><PartnersPage /></LazyPage>} />
        <Route path="/privacy" element={<LazyPage><PrivacyPage /></LazyPage>} />
        <Route path="/terms" element={<LazyPage><TermsPage /></LazyPage>} />
        <Route path="/become-partner" element={<LazyPage><BecomePartnerPage /></LazyPage>} />
        <Route path="/view-history" element={<LazyPage><ViewHistory /></LazyPage>} />
        
        {/* Admin Routes - Protected */}
        <Route path="/admin" element={<LazyPage><AdminGuard><AdminDashboard /></AdminGuard></LazyPage>} />
        <Route path="/admin/analytics" element={<LazyPage><AdminGuard><AdminAnalytics /></AdminGuard></LazyPage>} />
        <Route path="/admin/providers" element={<LazyPage><AdminGuard><AdminProviders /></AdminGuard></LazyPage>} />
        <Route path="/admin/services" element={<LazyPage><AdminGuard><AdminServices /></AdminGuard></LazyPage>} />
        <Route path="/admin/partner-applications" element={<LazyPage><AdminGuard><PartnerApplicationsAdmin /></AdminGuard></LazyPage>} />
        <Route path="/admin/pitch-deck" element={<LazyPage><AdminGuard><InvestorPitchDeck /></AdminGuard></LazyPage>} />
        <Route path="/admin/operations" element={<LazyPage><AdminGuard><OperationsHub /></AdminGuard></LazyPage>} />
        {/* Admin management routes */}
        <Route path="/admin/yachts" element={<LazyPage><AdminGuard><AdminYachts /></AdminGuard></LazyPage>} />
        <Route path="/admin/tours" element={<LazyPage><AdminGuard><AdminTours /></AdminGuard></LazyPage>} />
        <Route path="/admin/activities" element={<LazyPage><AdminGuard><AdminActivities /></AdminGuard></LazyPage>} />
        <Route path="/admin/properties" element={<LazyPage><AdminGuard><AdminProperties /></AdminGuard></LazyPage>} />
        <Route path="/admin/restaurants" element={<LazyPage><AdminGuard><AdminRestaurants /></AdminGuard></LazyPage>} />
        <Route path="/admin/salons" element={<LazyPage><AdminGuard><AdminSalons /></AdminGuard></LazyPage>} />
        <Route path="/admin/clinics" element={<LazyPage><AdminGuard><AdminClinics /></AdminGuard></LazyPage>} />
        <Route path="/admin/gyms" element={<LazyPage><AdminGuard><AdminGyms /></AdminGuard></LazyPage>} />
        <Route path="/admin/vehicles" element={<LazyPage><AdminGuard><AdminVehicles /></AdminGuard></LazyPage>} />
        <Route path="/admin/events" element={<LazyPage><AdminGuard><AdminEvents /></AdminGuard></LazyPage>} />
        <Route path="/admin/education" element={<LazyPage><AdminGuard><AdminEducation /></AdminGuard></LazyPage>} />
        <Route path="/admin/legal" element={<LazyPage><AdminGuard><AdminLegal /></AdminGuard></LazyPage>} />
        <Route path="/admin/pets" element={<LazyPage><AdminGuard><AdminPets /></AdminGuard></LazyPage>} />
        <Route path="/admin/cleaning" element={<LazyPage><AdminGuard><AdminCleaning /></AdminGuard></LazyPage>} />
        <Route path="/admin/babysitters" element={<LazyPage><AdminGuard><AdminBabysitters /></AdminGuard></LazyPage>} />
        <Route path="/admin/flowers" element={<LazyPage><AdminGuard><AdminFlowers /></AdminGuard></LazyPage>} />
        <Route path="/admin/lookups" element={<LazyPage><AdminGuard><AdminLookups /></AdminGuard></LazyPage>} />
        <Route path="/admin/acquisition-metrics" element={<LazyPage><AdminGuard><AcquisitionMetrics /></AdminGuard></LazyPage>} />
        
        {/* Staff Routes - Protected */}
        <Route path="/staff" element={<LazyPage><AdminGuard><StaffDashboard /></AdminGuard></LazyPage>} />
        
        {/* Guest Routes */}
        <Route path="/my-stay" element={<LazyPage><MyStay /></LazyPage>} />
        <Route path="/guest/check-in/:bookingId" element={<LazyPage><GuestCheckIn /></LazyPage>} />
        <Route path="/guest/guidebook/:propertyId" element={<LazyPage><GuestGuidebook /></LazyPage>} />
        
        {/* Vendor Routes - Protected */}
        <Route path="/vendor" element={<LazyPage><VendorGuard><VendorDashboard /></VendorGuard></LazyPage>} />
        <Route path="/vendor/onboarding" element={<LazyPage><VendorOnboarding /></LazyPage>} />
        <Route path="/vendor/bookings" element={<LazyPage><VendorGuard><VendorBookings /></VendorGuard></LazyPage>} />
        <Route path="/vendor/services" element={<LazyPage><VendorGuard><VendorServices /></VendorGuard></LazyPage>} />
        <Route path="/vendor/analytics" element={<LazyPage><VendorGuard><VendorAnalytics /></VendorGuard></LazyPage>} />
        <Route path="/vendor/payouts" element={<LazyPage><VendorGuard><VendorPayouts /></VendorGuard></LazyPage>} />
        <Route path="/vendor/properties" element={<LazyPage><VendorGuard><VendorProperties /></VendorGuard></LazyPage>} />
        <Route path="/vendor/tours" element={<LazyPage><VendorGuard><VendorTours /></VendorGuard></LazyPage>} />
        <Route path="/vendor/activities" element={<LazyPage><VendorGuard><VendorActivities /></VendorGuard></LazyPage>} />
        <Route path="/vendor/yachts" element={<LazyPage><VendorGuard><VendorYachts /></VendorGuard></LazyPage>} />
        <Route path="/vendor/transport" element={<LazyPage><VendorGuard><VendorTransport /></VendorGuard></LazyPage>} />
        <Route path="/vendor/beauty" element={<LazyPage><VendorGuard><VendorBeauty /></VendorGuard></LazyPage>} />
        <Route path="/vendor/fitness" element={<LazyPage><VendorGuard><VendorFitness /></VendorGuard></LazyPage>} />
        <Route path="/vendor/clinics" element={<LazyPage><VendorGuard><VendorClinics /></VendorGuard></LazyPage>} />
        <Route path="/vendor/subscription" element={<LazyPage><VendorGuard><VendorSubscription /></VendorGuard></LazyPage>} />
        <Route path="/vendor/restaurants" element={<LazyPage><VendorGuard><VendorRestaurants /></VendorGuard></LazyPage>} />
        <Route path="/vendor/events" element={<LazyPage><VendorGuard><VendorEvents /></VendorGuard></LazyPage>} />
        <Route path="/vendor/education" element={<LazyPage><VendorGuard><VendorEducation /></VendorGuard></LazyPage>} />
        <Route path="/vendor/legal" element={<LazyPage><VendorGuard><VendorLegal /></VendorGuard></LazyPage>} />
        <Route path="/vendor/pets" element={<LazyPage><VendorGuard><VendorPets /></VendorGuard></LazyPage>} />
        <Route path="/vendor/cleaning" element={<LazyPage><VendorGuard><VendorCleaning /></VendorGuard></LazyPage>} />
        <Route path="/vendor/babysitters" element={<LazyPage><VendorGuard><VendorBabysitters /></VendorGuard></LazyPage>} />
        <Route path="/vendor/flowers" element={<LazyPage><VendorGuard><VendorFlowers /></VendorGuard></LazyPage>} />
        
        {/* Owner (Property Care) Routes - Protected */}
        <Route path="/owner" element={<LazyPage><OwnerGuard><OwnerDashboard /></OwnerGuard></LazyPage>} />
        <Route path="/owner/properties" element={<LazyPage><OwnerGuard><OwnerProperties /></OwnerGuard></LazyPage>} />
        <Route path="/owner/properties/new" element={<LazyPage><OwnerGuard><AddProperty /></OwnerGuard></LazyPage>} />
        <Route path="/owner/properties/:id" element={<LazyPage><OwnerGuard><OwnerPropertyDetail /></OwnerGuard></LazyPage>} />
        <Route path="/owner/properties/:id/terms" element={<LazyPage><OwnerGuard><OwnerRentalTerms /></OwnerGuard></LazyPage>} />
        <Route path="/owner/properties/:id/edit" element={<LazyPage><OwnerGuard><EditProperty /></OwnerGuard></LazyPage>} />
        <Route path="/owner/calendar" element={<LazyPage><OwnerGuard><OwnerCalendar /></OwnerGuard></LazyPage>} />
        <Route path="/owner/financials" element={<LazyPage><OwnerGuard><OwnerFinancials /></OwnerGuard></LazyPage>} />
        <Route path="/owner/financials/new" element={<LazyPage><OwnerGuard><OwnerFinancialForm /></OwnerGuard></LazyPage>} />
        <Route path="/owner/financials/:id" element={<LazyPage><OwnerGuard><OwnerFinancialForm /></OwnerGuard></LazyPage>} />
        <Route path="/owner/messages" element={<LazyPage><OwnerGuard><OwnerMessages /></OwnerGuard></LazyPage>} />
        <Route path="/owner/chat/:type/:id" element={<LazyPage><OwnerGuard><OwnerChatRoom /></OwnerGuard></LazyPage>} />
        <Route path="/owner/support-chat" element={<LazyPage><OwnerGuard><OwnerSupportChat /></OwnerGuard></LazyPage>} />
        <Route path="/owner/service-request" element={<LazyPage><OwnerGuard><ServiceRequest /></OwnerGuard></LazyPage>} />
        <Route path="/owner/inspection" element={<LazyPage><OwnerGuard><InspectionRequest /></OwnerGuard></LazyPage>} />
        <Route path="/owner/properties/:id/guidebook" element={<LazyPage><OwnerGuard><OwnerGuidebookEdit /></OwnerGuard></LazyPage>} />
        
        {/* Catch-all */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
    </>
  );
};
