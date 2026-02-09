import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './PageTransition';
import { ScrollToTop } from './ScrollToTop';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { AdminGuard, VendorGuard, OwnerGuard, TeamGuard, AuthGuard, ManagerGuard } from '@/components/auth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdaptiveBottomNav } from './AdaptiveBottomNav';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { VendorLayout } from '@/components/vendor/VendorLayout';
import { GuestLayout } from '@/components/guest/GuestLayout';
import { ManagerLayout } from '@/components/manager/ManagerLayout';
import { useNavigationDirection } from '@/hooks/useNavigationDirection';
import { RequireLifeSituation } from '@/components/life-os/RequireLifeSituation';

// Core pages - load eagerly for fast initial navigation
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';

// Auth pages
const AccountTypeSelection = lazy(() => import('@/pages/auth/AccountTypeSelection'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));

// Lazy load all other pages for code splitting
const Discover = lazy(() => import('@/pages/Discover'));
const MapView = lazy(() => import('@/pages/MapView'));
const Bookings = lazy(() => import('@/pages/Bookings'));
const BookingDetail = lazy(() => import('@/pages/BookingDetail'));
const Profile = lazy(() => import('@/pages/Profile'));
const EditProfile = lazy(() => import('@/pages/profile/EditProfile'));
const ProfileSettings = lazy(() => import('@/pages/profile/ProfileSettings'));
const UserAccountDashboard = lazy(() => import('@/pages/account/UserAccountDashboard'));

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
const PropertyDepositSuccess = lazy(() => import('@/pages/property/PropertyDepositSuccess'));
const ProjectsIndex = lazy(() => import('@/pages/property/ProjectsIndex'));
const ProjectDetail = lazy(() => import('@/pages/property/ProjectDetail'));
const OffplanIndex = lazy(() => import('@/pages/property/OffplanIndex'));
const OffplanDetail = lazy(() => import('@/pages/property/OffplanDetail'));
const DevelopersIndex = lazy(() => import('@/pages/property/DevelopersIndex'));
const DeveloperDetail = lazy(() => import('@/pages/property/DeveloperDetail'));

// Investment Mini-App
const InvestmentIndex = lazy(() => import('@/pages/invest/InvestmentIndex'));
const InvestmentDetail = lazy(() => import('@/pages/invest/InvestmentDetail'));
const InvestorDashboard = lazy(() => import('@/pages/invest/InvestorDashboard'));
const RaiseFunding = lazy(() => import('@/pages/invest/RaiseFunding'));

// Guest pages
const GuestMessages = lazy(() => import('@/pages/guest/GuestMessages'));
const GuestTripDetail = lazy(() => import('@/pages/guest/GuestTripDetail'));

// Food & Delivery Mini-App (legacy - removed, redirects only)

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
const TransferSuccess = lazy(() => import('@/pages/transport/TransferSuccess'));
const AirportFastTrackPage = lazy(() => import('@/pages/transport/AirportFastTrackPage'));
const AirportTransferLanding = lazy(() => import('@/pages/landing/AirportTransferLanding'));
const FlowerDeliveryLanding = lazy(() => import('@/pages/landing/FlowerDeliveryLanding'));
const RentalLanding = lazy(() => import('@/pages/landing/RentalLanding'));
const NewDevelopmentsLanding = lazy(() => import('@/pages/landing/NewDevelopmentsLanding'));

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
const FlowersSuccess = lazy(() => import('@/pages/flowers/FlowersSuccess'));

// Home Services Mini-App
const ServicesIndex = lazy(() => import('@/pages/services/ServicesIndex'));
const ServiceProviderDetail = lazy(() => import('@/pages/services/ServiceProviderDetail'));
const ServiceBooking = lazy(() => import('@/pages/services/ServiceBooking'));
const ServicesMap = lazy(() => import('@/pages/services/ServicesMap'));
const ServiceFunctionOrder = lazy(() => import('@/pages/services/ServiceFunctionOrder'));
const ServiceOrderSuccess = lazy(() => import('@/pages/services/ServiceOrderSuccess'));

// Legal & Business Services Mini-App
const LegalServicesIndex = lazy(() => import('@/pages/legal/LegalServicesIndex'));
const LegalProviderDetail = lazy(() => import('@/pages/legal/LegalProviderDetail'));
const LegalBooking = lazy(() => import('@/pages/legal/LegalBooking'));
const VisaServiceDetail = lazy(() => import('@/pages/legal/VisaServiceDetail'));
const VisaImmigrationPage = lazy(() => import('@/pages/legal/VisaImmigrationPage'));

// Insurance Mini-App
const InsuranceIndex = lazy(() => import('@/pages/insurance/InsuranceIndex'));
const InsuranceDetail = lazy(() => import('@/pages/insurance/InsuranceDetail'));
const InsuranceQuote = lazy(() => import('@/pages/insurance/InsuranceQuote'));
const InsurancePlanDetail = lazy(() => import('@/pages/insurance/InsurancePlanDetail'));
const TravelInsurance = lazy(() => import('@/pages/insurance/TravelInsurance'));

// Expat Services
const BankingPage = lazy(() => import('@/pages/expat/BankingPage'));
const VeterinaryPage = lazy(() => import('@/pages/expat/VeterinaryPage'));

// Install Page
const Install = lazy(() => import('@/pages/Install'));

// List With Us (Become a Host/Vendor)
const ListWithUsPage = lazy(() => import('@/pages/ListWithUsPage'));

// Transport catch-all redirect: /transport/:id -> /transport/vehicle/:id
const TransportIdRedirect = () => {
  const { id } = useParams();
  // Skip known sub-paths
  if (id === 'vehicle' || id === 'booking' || id === 'airport-transfer' || id === 'transfer-success' || id === 'airport' || id === 'taxi' || id === 'fast-track') {
    return null;
  }
  return <Navigate to={`/transport/vehicle/${id}`} replace />;
};

// Tours & Water Activities Mini-Apps (LEGACY - all redirect to /experiences)
// Redirect helpers for legacy routes
const TourRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/experiences/${id}`} replace />;
};
const TourBookRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/experiences/${id}/book`} replace />;
};
const WaterDetailRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/experiences/${id}`} replace />;
};
const WaterBookRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/experiences/${id}/book`} replace />;
};

// Experiences Mini-App (unified tours + activities)
const ExperiencesIndex = lazy(() => import('@/pages/experiences/ExperiencesIndex'));
const ExperienceDetail = lazy(() => import('@/pages/experiences/ExperienceDetail'));
const ExperienceBooking = lazy(() => import('@/pages/experiences/ExperienceBooking'));
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
const MarketCatalogPage = lazy(() => import('@/pages/market/MarketCatalogPage'));
const MarketCategoryPage = lazy(() => import('@/pages/market/MarketCategoryPage'));
const ProductDetailPage = lazy(() => import('@/pages/market/ProductDetailPage'));
const VendorPage = lazy(() => import('@/pages/market/VendorPage'));
const WishlistPage = lazy(() => import('@/pages/market/WishlistPage'));
const StoreDetail = lazy(() => import('@/pages/market/StoreDetail'));
const MarketCheckout = lazy(() => import('@/pages/market/MarketCheckout'));

// C2C Sell Item Wizard
const SellItemPage = lazy(() => import('@/pages/market/SellItemPage'));

// Other pages

// Other pages
const Favorites = lazy(() => import('@/pages/Favorites'));
const Search = lazy(() => import('@/pages/Search'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const NotificationSettingsEnhanced = lazy(() => import('@/pages/profile/NotificationSettingsEnhanced'));
const ViewHistory = lazy(() => import('@/pages/ViewHistory'));
const Cart = lazy(() => import('@/pages/Cart'));
const Wallet = lazy(() => import('@/pages/Wallet'));
const TransactionHistory = lazy(() => import('@/pages/wallet/TransactionHistory'));
const WalletCards = lazy(() => import('@/pages/wallet/WalletCards'));
const SOS = lazy(() => import('@/pages/SOS'));
const VipConcierge = lazy(() => import('@/pages/VipConcierge'));
const Support = lazy(() => import('@/pages/Support'));
const OrderTracking = lazy(() => import('@/pages/orders/OrderTracking'));
const AdvanceRequested = lazy(() => import('@/pages/booking/AdvanceRequested'));

// Knowledge Hub pages
const KnowledgeHub = lazy(() => import('@/pages/knowledge/KnowledgeHub'));
const KnowledgeSectionPage = lazy(() => import('@/pages/knowledge/KnowledgeSectionPage'));
const KnowledgeArticlePage = lazy(() => import('@/pages/knowledge/KnowledgeArticlePage'));

const AboutPage = lazy(() => import('@/pages/info/AboutPage'));
const HowItWorksPage = lazy(() => import('@/pages/HowItWorks'));
const FAQPage = lazy(() => import('@/pages/info/FAQPage'));
const PartnersPage = lazy(() => import('@/pages/info/PartnersPage'));
const PrivacyPage = lazy(() => import('@/pages/info/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/info/TermsPage'));
const BecomePartnerPage = lazy(() => import('@/pages/info/BecomePartnerPage'));
const CookiePolicyPage = lazy(() => import('@/pages/info/CookiePolicyPage'));
const RefundPolicyPage = lazy(() => import('@/pages/info/RefundPolicyPage'));
const ContactPage = lazy(() => import('@/pages/info/ContactPage'));
const GTrustPage = lazy(() => import('@/pages/info/GTrustPage'));
const IPPolicyPage = lazy(() => import('@/pages/info/IPPolicyPage'));
const PartnerAgreementPage = lazy(() => import('@/pages/info/PartnerAgreementPage'));
const DisputeResolutionPage = lazy(() => import('@/pages/info/DisputeResolutionPage'));

// Admin pages
const PartnerApplicationsAdmin = lazy(() => import('@/pages/admin/PartnerApplicationsAdmin'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminProviders = lazy(() => import('@/pages/admin/AdminProviders'));
const AdminServices = lazy(() => import('@/pages/admin/AdminServices'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));
const InvestorPitchDeck = lazy(() => import('@/pages/admin/InvestorPitchDeck'));
const InvestorDemo = lazy(() => import('@/pages/admin/InvestorDemo'));
const AdminOperations = lazy(() => import('@/pages/admin/AdminOperations'));
const AdminYachts = lazy(() => import('@/pages/admin/AdminYachts'));
const AdminTours = lazy(() => import('@/pages/admin/AdminTours'));
const AdminActivities = lazy(() => import('@/pages/admin/AdminActivities'));
const AdminProperties = lazy(() => import('@/pages/admin/AdminProperties'));
const AdminProjects = lazy(() => import('@/pages/admin/AdminProjects'));
const AdminInvestments = lazy(() => import('@/pages/admin/AdminInvestments'));
const AdminDevelopers = lazy(() => import('@/pages/admin/AdminDevelopers'));
const AdminRestaurants = lazy(() => import('@/pages/admin/AdminRestaurants'));
const AdminRestaurantDataQuality = lazy(() => import('@/pages/admin/AdminRestaurantDataQuality'));
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
const AdminBouquets = lazy(() => import('@/pages/admin/AdminBouquets'));
const AdminLookups = lazy(() => import('@/pages/admin/AdminLookups'));
const AdminTaxonomyManager = lazy(() => import('@/pages/admin/AdminTaxonomyManager'));
const AcquisitionMetrics = lazy(() => import('@/pages/admin/AcquisitionMetrics'));
const AdminTickets = lazy(() => import('@/pages/admin/AdminTickets'));
const AdminTicketDetail = lazy(() => import('@/pages/admin/AdminTicketDetail'));
const AdminPharmacies = lazy(() => import('@/pages/admin/AdminPharmacies'));
const AdminStores = lazy(() => import('@/pages/admin/AdminStores'));
const AdminInsurance = lazy(() => import('@/pages/admin/AdminInsurance'));
const AdminQuickListings = lazy(() => import('@/pages/admin/AdminQuickListings'));
const AdminWaterActivities = lazy(() => import('@/pages/admin/AdminWaterActivities'));
const AdminExperiences = lazy(() => import('@/pages/admin/AdminExperiences'));
const AdminContentModeration = lazy(() => import('@/pages/admin/AdminContentModeration'));
const AdminConsultations = lazy(() => import('@/pages/admin/AdminConsultations'));
const AdminUnoTeam = lazy(() => import('@/pages/admin/AdminUnoTeam'));
const AdminLeadsDashboard = lazy(() => import('@/pages/admin/AdminLeadsDashboard'));
const AdminFinance = lazy(() => import('@/pages/admin/AdminFinance'));
const AdminCities = lazy(() => import('@/pages/admin/AdminCities'));
const AdminTranslations = lazy(() => import('@/pages/admin/AdminTranslations'));
const UserAnalyticsDashboard = lazy(() => import('@/pages/admin/UserAnalyticsDashboard'));
const AdminLocationKnowledge = lazy(() => import('@/pages/admin/AdminLocationKnowledge'));
const AdminPMCompanies = lazy(() => import('@/pages/admin/AdminPMCompanies'));
const AdminContracts = lazy(() => import('@/pages/admin/AdminContracts'));
const AdminProviderDetail = lazy(() => import('@/pages/admin/AdminProviderDetail'));

// Admin Marketplace pages
const AdminMarketplaceProducts = lazy(() => import('@/pages/admin/AdminMarketplaceProducts'));
const AdminMarketplaceCategories = lazy(() => import('@/pages/admin/AdminMarketplaceCategories'));
const AdminMarketplaceSubcategories = lazy(() => import('@/pages/admin/AdminMarketplaceSubcategories'));
const AdminMarketplaceVendors = lazy(() => import('@/pages/admin/AdminMarketplaceVendors'));

// Admin Data Import
const AdminDataImport = lazy(() => import('@/pages/admin/AdminDataImport'));

// Unified Admin pages
const AdminUnifiedCatalog = lazy(() => import('@/pages/admin/AdminUnifiedCatalog'));
const AdminControlCenter = lazy(() => import('@/pages/admin/AdminControlCenter'));
const AdminVendorContentCreator = lazy(() => import('@/pages/admin/AdminVendorContentCreator'));

// AI Agents pages
const AdminAIAgents = lazy(() => import('@/pages/admin/AdminAIAgents'));
const AdminAIAgentEditor = lazy(() => import('@/pages/admin/AdminAIAgentEditor'));

// AI Intake page
const AdminIntake = lazy(() => import('@/pages/admin/AdminIntake'));
const AdminIntakeConfigs = lazy(() => import('@/pages/admin/AdminIntakeConfigs'));
const AdminLeadConfigs = lazy(() => import('@/pages/admin/AdminLeadConfigs'));
const AdminVendorProspects = lazy(() => import('@/pages/admin/AdminVendorProspects'));
const AdminLifeSituations = lazy(() => import('@/pages/admin/AdminLifeSituations'));
const AdminLifeOS = lazy(() => import('@/pages/admin/AdminLifeOS'));

// Life Flow public page
const LifeFlowPage = lazy(() => import('@/pages/LifeFlowPage'));
const TripPlannerPage = lazy(() => import('@/pages/TripPlannerPage'));
const MarketingDashboard = lazy(() => import('@/pages/admin/marketing/MarketingDashboard'));

// Experience Categories Management
const ExperienceCategoriesPage = lazy(() => import('@/pages/admin/ExperienceCategoriesPage'));

// Admin route wrapper with layout
const AdminRouteLayout = () => (
  <AdminGuard>
    <AdminLayout>
      <Suspense fallback={<LoadingState />}>
        <Outlet />
      </Suspense>
    </AdminLayout>
  </AdminGuard>
);

// Vendor route wrapper with layout
const VendorRouteLayout = () => (
  <VendorGuard>
    <VendorLayout>
      <Suspense fallback={<LoadingState />}>
        <Outlet />
      </Suspense>
    </VendorLayout>
  </VendorGuard>
);

// Manager route wrapper with layout
const ManagerRouteLayout = () => (
  <ManagerGuard>
    <ManagerLayout />
  </ManagerGuard>
);

// Guest route wrapper with layout
const GuestRouteLayout = () => (
  <AuthGuard>
    <GuestLayout>
      <Suspense fallback={<LoadingState />}>
        <Outlet />
      </Suspense>
    </GuestLayout>
  </AuthGuard>
);

// Support pages (user tickets)
const NewTicket = lazy(() => import('@/pages/support/NewTicket'));
const MyTickets = lazy(() => import('@/pages/support/MyTickets'));
const TicketDetail = lazy(() => import('@/pages/support/TicketDetail'));

// Provider onboarding (public)
const ProviderOnboarding = lazy(() => import('@/pages/provider/ProviderOnboarding'));

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
const VendorExperiences = lazy(() => import('@/pages/vendor/VendorExperiences'));
const VendorYachts = lazy(() => import('@/pages/vendor/VendorYachts'));
const VendorYachtCalendar = lazy(() => import('@/pages/vendor/VendorYachtCalendar'));
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
const VendorLocations = lazy(() => import('@/pages/vendor/VendorLocations'));
const VendorProducts = lazy(() => import('@/pages/vendor/VendorProducts'));
const VendorMessages = lazy(() => import('@/pages/vendor/VendorMessages'));
const VendorSettings = lazy(() => import('@/pages/vendor/VendorSettings'));

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
const PropertyEditor = lazy(() => import('@/pages/owner/PropertyEditor'));
const PropertyManage = lazy(() => import('@/pages/owner/PropertyManage'));
const FullManagement = lazy(() => import('@/pages/owner/FullManagement'));
const ChannelManager = lazy(() => import('@/pages/owner/ChannelManager'));
const OwnerLanding = lazy(() => import('@/pages/owner/OwnerLanding'));
const JuristicRequestsPage = lazy(() => import('@/pages/owner/JuristicRequestsPage'));
const MessageTemplates = lazy(() => import('@/pages/owner/MessageTemplates'));
const QuickExpense = lazy(() => import('@/pages/owner/QuickExpense'));
const OwnerReviews = lazy(() => import('@/pages/owner/OwnerReviews'));
const PropertyQuickSetup = lazy(() => import('@/pages/owner/PropertyQuickSetup'));
const OwnerPortfolio = lazy(() => import('@/pages/owner/OwnerPortfolio'));
const OwnerSuperhost = lazy(() => import('@/pages/owner/OwnerSuperhost'));
const OwnerOperations = lazy(() => import('@/pages/owner/OwnerOperations'));
const OwnerGuidePage = lazy(() => import('@/pages/owner/OwnerGuidePage'));
const OwnerPropertyImport = lazy(() => import('@/pages/owner/OwnerPropertyImport'));
const TeamPage = lazy(() => import('@/pages/owner/TeamPage'));
const ReportsPage = lazy(() => import('@/pages/owner/ReportsPage'));

// Property Consultation
const PropertyConsultation = lazy(() => import('@/pages/property/PropertyConsultation'));

// Guest pages
const MyStay = lazy(() => import('@/pages/guest/MyStay'));
const GuestCheckIn = lazy(() => import('@/pages/guest/GuestCheckIn'));
const GuestGuidebook = lazy(() => import('@/pages/guest/GuestGuidebook'));

// Owner Guidebook
const OwnerGuidebookEdit = lazy(() => import('@/pages/owner/OwnerGuidebookEdit'));

// Staff pages
const StaffDashboard = lazy(() => import('@/pages/staff/StaffDashboard'));

// Team (UNO Team) pages
const TeamDashboard = lazy(() => import('@/pages/team/TeamDashboard'));
const TeamContentHub = lazy(() => import('@/pages/team/TeamContentHub'));
const TeamChatPage = lazy(() => import('@/pages/team/TeamChatPage'));
const TeamLeaderboardPage = lazy(() => import('@/pages/team/TeamLeaderboardPage'));
const TeamProfilePage = lazy(() => import('@/pages/team/TeamProfilePage'));
const TeamInboxPage = lazy(() => import('@/pages/team/TeamInboxPage'));
const TeamSupportPage = lazy(() => import('@/pages/team/TeamSupportPage'));
const TeamLeadsPage = lazy(() => import('@/pages/team/TeamLeadsPage'));
const TeamModerationPage = lazy(() => import('@/pages/team/TeamModerationPage'));

// Property Manager pages
const ManagerDashboard = lazy(() => import('@/pages/manager/ManagerDashboard'));
const ManagerProperties = lazy(() => import('@/pages/manager/ManagerProperties'));

// Demo pages
const DemoIndex = lazy(() => import('@/pages/demo/DemoIndex'));
const DemoHome = lazy(() => import('@/pages/demo/DemoHome'));
const VendorDemo = lazy(() => import('@/pages/demo/VendorDemo'));

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
      import('@/pages/experiences/ExperiencesIndex');
      import('@/pages/beauty/BeautySpaIndex');
    });
  }
};

export const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  
  // Track navigation direction for tab animations
  useNavigationDirection();

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
        <Route path="/auth/account-type" element={<LazyPage><AccountTypeSelection /></LazyPage>} />
        <Route path="/auth/forgot-password" element={<LazyPage><ForgotPassword /></LazyPage>} />
        <Route path="/auth/reset-password" element={<LazyPage><ResetPassword /></LazyPage>} />
        
        {/* Lazy loaded routes */}
        <Route path="/discover" element={<LazyPage><RequireLifeSituation><Discover /></RequireLifeSituation></LazyPage>} />
        <Route path="/categories" element={<Navigate to="/discover" replace />} />
        <Route path="/map" element={<LazyPage><MapView /></LazyPage>} />
        <Route path="/bookings" element={<LazyPage><Bookings /></LazyPage>} />
        <Route path="/bookings/:id" element={<LazyPage><BookingDetail /></LazyPage>} />
        <Route path="/orders/:id/tracking" element={<LazyPage><OrderTracking /></LazyPage>} />
        <Route path="/profile" element={<LazyPage><Profile /></LazyPage>} />
        <Route path="/profile/edit" element={<LazyPage><EditProfile /></LazyPage>} />
        <Route path="/profile/settings" element={<LazyPage><ProfileSettings /></LazyPage>} />
        <Route path="/account" element={<LazyPage><UserAccountDashboard /></LazyPage>} />
        <Route path="/favorites" element={<LazyPage><Favorites /></LazyPage>} />
        <Route path="/search" element={<LazyPage><Search /></LazyPage>} />
        <Route path="/notifications" element={<LazyPage><Notifications /></LazyPage>} />
        <Route path="/profile/notifications" element={<LazyPage><NotificationSettingsEnhanced /></LazyPage>} />
        <Route path="/messages" element={<LazyPage><GuestMessages /></LazyPage>} />
        <Route path="/trip/:id" element={<LazyPage><GuestTripDetail /></LazyPage>} />
        <Route path="/history" element={<LazyPage><ViewHistory /></LazyPage>} />
        <Route path="/cart" element={<LazyPage><Cart /></LazyPage>} />
        <Route path="/wallet" element={<LazyPage><Wallet /></LazyPage>} />
        <Route path="/wallet/history" element={<LazyPage><TransactionHistory /></LazyPage>} />
        <Route path="/wallet/cards" element={<LazyPage><WalletCards /></LazyPage>} />
        <Route path="/sos" element={<LazyPage><SOS /></LazyPage>} />
        <Route path="/vip-concierge" element={<LazyPage><VipConcierge /></LazyPage>} />
        <Route path="/support" element={<LazyPage><Support /></LazyPage>} />
        <Route path="/support/new-ticket" element={<LazyPage><NewTicket /></LazyPage>} />
        <Route path="/support/tickets" element={<LazyPage><MyTickets /></LazyPage>} />
        <Route path="/support/tickets/:ticketId" element={<LazyPage><TicketDetail /></LazyPage>} />
        <Route path="/install" element={<LazyPage><Install /></LazyPage>} />
        <Route path="/booking/advance-requested" element={<LazyPage><AdvanceRequested /></LazyPage>} />
        
        {/* Life Flow - Contextual navigation by life situation */}
        <Route path="/life-flow/:code" element={<LazyPage><LifeFlowPage /></LazyPage>} />
        <Route path="/trip-planner" element={<LazyPage><TripPlannerPage /></LazyPage>} />
        
        {/* List With Us - Become a Host/Vendor */}
        <Route path="/list-with-us" element={<ListWithUsPage />} />
        
        {/* Beauty & Spa Mini-App Routes */}
        <Route path="/beauty" element={<LazyPage><RequireLifeSituation><BeautySpaIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/beauty/salon/:id" element={<LazyPage><SalonDetail /></LazyPage>} />
        <Route path="/beauty/booking/:id" element={<LazyPage><BeautyBooking /></LazyPage>} />
        <Route path="/beauty/services" element={<LazyPage><BeautyServices /></LazyPage>} />
        <Route path="/beauty/map" element={<LazyPage><BeautyMap /></LazyPage>} />
        {/* Legacy redirects */}
        <Route path="/salons" element={<Navigate to="/beauty" replace />} />
        <Route path="/spa" element={<Navigate to="/beauty" replace />} />
        
        {/* Property Mini-App Routes */}
        <Route path="/property" element={<LazyPage><RequireLifeSituation><PropertyIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/property/consultation" element={<LazyPage><PropertyConsultation /></LazyPage>} />
        <Route path="/property/deposit-success" element={<LazyPage><PropertyDepositSuccess /></LazyPage>} />
        <Route path="/property/project/:id" element={<LazyPage><ProjectDetail /></LazyPage>} />
        <Route path="/property/:id" element={<LazyPage><PropertyDetail /></LazyPage>} />
        <Route path="/property/:id/inquiry" element={<LazyPage><PropertyInquiry /></LazyPage>} />
        <Route path="/property/map" element={<LazyPage><PropertyMap /></LazyPage>} />
        <Route path="/complexes" element={<LazyPage><ProjectsIndex /></LazyPage>} />
        
        {/* Offplan & Developers Routes */}
        <Route path="/offplan" element={<LazyPage><OffplanIndex /></LazyPage>} />
        <Route path="/offplan/:id" element={<LazyPage><OffplanDetail /></LazyPage>} />
        <Route path="/developers" element={<LazyPage><DevelopersIndex /></LazyPage>} />
        <Route path="/developers/:id" element={<LazyPage><DeveloperDetail /></LazyPage>} />
        
        {/* Investment Mini-App Routes */}
        <Route path="/invest" element={<LazyPage><InvestmentIndex /></LazyPage>} />
        <Route path="/invest/dashboard" element={<LazyPage><InvestorDashboard /></LazyPage>} />
        <Route path="/invest/raise" element={<LazyPage><RaiseFunding /></LazyPage>} />
        <Route path="/invest/:id" element={<LazyPage><InvestmentDetail /></LazyPage>} />
        
        {/* Food & Delivery Mini-App Routes (legacy - all redirect to restaurants) */}
        <Route path="/food" element={<Navigate to="/restaurants" replace />} />
        <Route path="/food/restaurant/:id" element={<Navigate to="/restaurants" replace />} />
        <Route path="/food/checkout" element={<Navigate to="/restaurants" replace />} />
        
        {/* Restaurants Mini-App Routes */}
        <Route path="/restaurants" element={<LazyPage><RequireLifeSituation><RestaurantsIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/restaurants/map" element={<LazyPage><RestaurantMap /></LazyPage>} />
        <Route path="/restaurants/:id" element={<LazyPage><RestaurantDetail /></LazyPage>} />
        <Route path="/restaurants/:id/reserve" element={<LazyPage><TableReservation /></LazyPage>} />
        <Route path="/restaurants/:id/delivery" element={<LazyPage><DeliveryCheckout /></LazyPage>} />
        <Route path="/restaurants/:id/experience/:setId" element={<LazyPage><SetMenuBooking /></LazyPage>} />
        
        {/* Transport Mini-App Routes */}
        <Route path="/transport" element={<LazyPage><RequireLifeSituation><TransportIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/transport/vehicle/:id" element={<LazyPage><VehicleDetail /></LazyPage>} />
        <Route path="/transport/booking/:id" element={<LazyPage><TransportBooking /></LazyPage>} />
        <Route path="/transport/airport-transfer" element={<LazyPage><AirportTransferBooking /></LazyPage>} />
        <Route path="/transport/transfer-success" element={<LazyPage><TransferSuccess /></LazyPage>} />
        <Route path="/transport/fast-track" element={<LazyPage><AirportFastTrackPage /></LazyPage>} />
        <Route path="/transport/airport" element={<Navigate to="/transport/airport-transfer" replace />} />
        <Route path="/airport-transfer" element={<Navigate to="/transport/airport-transfer" replace />} />
        <Route path="/transfer" element={<LazyPage><AirportTransferLanding /></LazyPage>} />
        <Route path="/flower-delivery" element={<LazyPage><FlowerDeliveryLanding /></LazyPage>} />
        <Route path="/rent-phuket" element={<LazyPage><RentalLanding /></LazyPage>} />
        <Route path="/new-developments" element={<LazyPage><NewDevelopmentsLanding /></LazyPage>} />
        <Route path="/transport/taxi" element={<LazyPage><TaxiBooking /></LazyPage>} />
        <Route path="/taxi-booking" element={<Navigate to="/transport/taxi" replace />} />
        <Route path="/transfers" element={<Navigate to="/transfer" replace />} />
        <Route path="/life" element={<Navigate to="/experiences" replace />} />
        {/* Catch /transport/:id and redirect to /transport/vehicle/:id */}
        <Route path="/transport/:id" element={<TransportIdRedirect />} />
        
        {/* Fitness Mini-App Routes */}
        <Route path="/fitness" element={<LazyPage><RequireLifeSituation><FitnessIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/fitness/gym/:id" element={<LazyPage><GymDetail /></LazyPage>} />
        <Route path="/fitness/booking/:id" element={<LazyPage><FitnessBooking /></LazyPage>} />
        
        {/* Medical Mini-App Routes */}
        <Route path="/medical" element={<LazyPage><RequireLifeSituation><MedicalIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/medical/clinic/:id" element={<LazyPage><ClinicDetail /></LazyPage>} />
        <Route path="/medical/appointment/:id" element={<LazyPage><MedicalAppointment /></LazyPage>} />
        
        {/* Events Mini-App Routes */}
        <Route path="/events" element={<LazyPage><RequireLifeSituation><EventsIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/events/:id" element={<LazyPage><EventDetail /></LazyPage>} />
        <Route path="/events/booking/:id" element={<LazyPage><EventBooking /></LazyPage>} />
        <Route path="/venues/:id" element={<LazyPage><VenueDetail /></LazyPage>} />
        
        {/* Education Mini-App Routes */}
        <Route path="/education" element={<LazyPage><RequireLifeSituation><EducationIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/education/course/:id" element={<LazyPage><CourseDetail /></LazyPage>} />
        <Route path="/education/tutor/:id" element={<LazyPage><TutorDetail /></LazyPage>} />
        <Route path="/education/booking/:id" element={<LazyPage><EducationBooking /></LazyPage>} />
        
        {/* Flowers Mini-App Routes */}
        <Route path="/flowers" element={<LazyPage><RequireLifeSituation><FlowersIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/flowers/bouquet/:id" element={<LazyPage><BouquetDetail /></LazyPage>} />
        <Route path="/flowers/shop" element={<Navigate to="/flowers" replace />} />
        <Route path="/flowers/shop/:id" element={<LazyPage><FlowerShopDetail /></LazyPage>} />
        <Route path="/flowers/order" element={<LazyPage><FlowersOrder /></LazyPage>} />
        <Route path="/flowers/order/:id" element={<LazyPage><FlowersOrder /></LazyPage>} />
        <Route path="/flowers/success" element={<LazyPage><FlowersSuccess /></LazyPage>} />
        
        {/* Home Services Mini-App Routes */}
        <Route path="/services" element={<LazyPage><RequireLifeSituation><ServicesIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/services/provider/:id" element={<LazyPage><ServiceProviderDetail /></LazyPage>} />
        <Route path="/services/booking/:id" element={<LazyPage><ServiceBooking /></LazyPage>} />
        <Route path="/services/map" element={<LazyPage><ServicesMap /></LazyPage>} />
        <Route path="/services/order/:functionId" element={<LazyPage><ServiceFunctionOrder /></LazyPage>} />
        <Route path="/services/order/success" element={<LazyPage><ServiceOrderSuccess /></LazyPage>} />
        
        {/* Legal & Business Services Mini-App Routes */}
        <Route path="/legal" element={<LazyPage><RequireLifeSituation><LegalServicesIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/legal/provider/:id" element={<LazyPage><LegalProviderDetail /></LazyPage>} />
        <Route path="/legal/visa/:id" element={<LazyPage><VisaServiceDetail /></LazyPage>} />
        <Route path="/legal/booking/:id" element={<LazyPage><LegalBooking /></LazyPage>} />
        <Route path="/visa" element={<LazyPage><VisaImmigrationPage /></LazyPage>} />
        
        {/* Insurance Mini-App Routes */}
        <Route path="/insurance" element={<LazyPage><RequireLifeSituation><InsuranceIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/insurance/travel" element={<LazyPage><TravelInsurance /></LazyPage>} />
        <Route path="/insurance/plan/:planId" element={<LazyPage><InsurancePlanDetail /></LazyPage>} />
        <Route path="/insurance/:id" element={<LazyPage><InsuranceDetail /></LazyPage>} />
        <Route path="/insurance/:id/quote" element={<LazyPage><InsuranceQuote /></LazyPage>} />
        
        {/* Expat Services Routes */}
        <Route path="/banking" element={<LazyPage><RequireLifeSituation><BankingPage /></RequireLifeSituation></LazyPage>} />
        <Route path="/veterinary" element={<LazyPage><VeterinaryPage /></LazyPage>} />
        
        {/* Knowledge Hub Routes */}
        <Route path="/knowledge" element={<LazyPage><KnowledgeHub /></LazyPage>} />
        <Route path="/knowledge/:section" element={<LazyPage><KnowledgeSectionPage /></LazyPage>} />
        <Route path="/knowledge/:section/:slug" element={<LazyPage><KnowledgeArticlePage /></LazyPage>} />
        
        {/* Experiences Mini-App Routes (unified tours + activities) */}
        <Route path="/experiences" element={<LazyPage><RequireLifeSituation><ExperiencesIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/experiences/:id" element={<LazyPage><ExperienceDetail /></LazyPage>} />
        <Route path="/experiences/:id/book" element={<LazyPage><ExperienceBooking /></LazyPage>} />
        
        {/* Tours Mini-App Routes (legacy - redirect to unified experiences) */}
        <Route path="/tours" element={<Navigate to="/experiences?type=tour" replace />} />
        <Route path="/tours/:id" element={<TourRedirect />} />
        <Route path="/tours/:id/book" element={<TourBookRedirect />} />
        
        {/* Water Activities Mini-App Routes (legacy - redirect to experiences) */}
        <Route path="/water" element={<Navigate to="/experiences?type=activity" replace />} />
        <Route path="/water/:id" element={<WaterDetailRedirect />} />
        <Route path="/water/:id/book" element={<WaterBookRedirect />} />
        
        {/* Pharmacy Mini-App Routes */}
        <Route path="/pharmacy" element={<LazyPage><RequireLifeSituation><PharmacyIndex /></RequireLifeSituation></LazyPage>} />
        
        {/* Pets Mini-App Routes */}
        <Route path="/pets" element={<LazyPage><RequireLifeSituation><PetsIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/pets/transport" element={<LazyPage><PetTransport /></LazyPage>} />
        <Route path="/pets/:id" element={<LazyPage><PetServiceDetail /></LazyPage>} />
        <Route path="/pets/:id/booking" element={<LazyPage><PetServiceBooking /></LazyPage>} />
        <Route path="/pharmacy/:id" element={<LazyPage><PharmacyDetail /></LazyPage>} />
        
        
        {/* Yachts Mini-App Routes */}
        <Route path="/yachts" element={<LazyPage><RequireLifeSituation><YachtsIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/yachts/:id" element={<LazyPage><YachtDetail /></LazyPage>} />
        <Route path="/yachts/:id/booking" element={<LazyPage><YachtBooking /></LazyPage>} />
        
        {/* Cleaning Mini-App Routes */}
        <Route path="/cleaning" element={<LazyPage><RequireLifeSituation><CleaningIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/cleaning/:id" element={<LazyPage><CleaningDetail /></LazyPage>} />
        <Route path="/cleaning/:id/book" element={<LazyPage><CleaningBooking /></LazyPage>} />
        
        {/* Babysitter Mini-App Routes */}
        <Route path="/babysitter" element={<LazyPage><RequireLifeSituation><BabysitterIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/babysitter/:id" element={<LazyPage><BabysitterDetail /></LazyPage>} />
        <Route path="/babysitter/:id/book" element={<LazyPage><BabysitterBooking /></LazyPage>} />
        
        {/* Delivery Mini-App Routes */}
        <Route path="/delivery" element={<LazyPage><RequireLifeSituation><DeliveryIndex /></RequireLifeSituation></LazyPage>} />
        
        {/* Market Mini-App Routes */}
        <Route path="/market" element={<LazyPage><RequireLifeSituation><MarketIndex /></RequireLifeSituation></LazyPage>} />
        <Route path="/market/categories" element={<LazyPage><MarketCatalogPage /></LazyPage>} />
        <Route path="/market/category/:categoryId" element={<LazyPage><MarketCategoryPage /></LazyPage>} />
        <Route path="/market/product/:productId" element={<LazyPage><ProductDetailPage /></LazyPage>} />
        <Route path="/market/vendor/:slug" element={<LazyPage><VendorPage /></LazyPage>} />
        <Route path="/market/wishlist" element={<LazyPage><WishlistPage /></LazyPage>} />
        <Route path="/market/store/:id" element={<LazyPage><StoreDetail /></LazyPage>} />
        <Route path="/market/checkout" element={<LazyPage><MarketCheckout /></LazyPage>} />
        
        {/* C2C Sell Item Wizard */}
        <Route path="/sell" element={<AuthGuard><LazyPage><SellItemPage /></LazyPage></AuthGuard>} />
        
        {/* Info Pages */}
        <Route path="/about" element={<LazyPage><AboutPage /></LazyPage>} />
        <Route path="/how-it-works" element={<LazyPage><HowItWorksPage /></LazyPage>} />
        <Route path="/faq" element={<LazyPage><FAQPage /></LazyPage>} />
        <Route path="/partners" element={<LazyPage><PartnersPage /></LazyPage>} />
        <Route path="/privacy" element={<LazyPage><PrivacyPage /></LazyPage>} />
        <Route path="/terms" element={<LazyPage><TermsPage /></LazyPage>} />
        <Route path="/become-partner" element={<LazyPage><BecomePartnerPage /></LazyPage>} />
        <Route path="/cookies" element={<LazyPage><CookiePolicyPage /></LazyPage>} />
        <Route path="/refund-policy" element={<LazyPage><RefundPolicyPage /></LazyPage>} />
        <Route path="/contact" element={<LazyPage><ContactPage /></LazyPage>} />
        <Route path="/g-trust" element={<LazyPage><GTrustPage /></LazyPage>} />
        <Route path="/ip-policy" element={<LazyPage><IPPolicyPage /></LazyPage>} />
        <Route path="/partner-agreement" element={<LazyPage><PartnerAgreementPage /></LazyPage>} />
        <Route path="/partner-terms" element={<LazyPage><PartnerAgreementPage /></LazyPage>} />
        <Route path="/dispute-resolution" element={<LazyPage><DisputeResolutionPage /></LazyPage>} />
        <Route path="/view-history" element={<Navigate to="/history" replace />} />
        
        {/* Admin Routes - Protected with AdminLayout */}
        <Route element={<AdminRouteLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          {/* New unified pages */}
          <Route path="/admin/catalog" element={<AdminUnifiedCatalog />} />
          <Route path="/admin/control" element={<AdminControlCenter />} />
          <Route path="/admin/vendor-content" element={<AdminVendorContentCreator />} />
          {/* Legacy routes - kept for backward compatibility */}
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/providers" element={<AdminProviders />} />
          <Route path="/admin/providers/:id" element={<AdminProviderDetail />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/admin/partner-applications" element={<PartnerApplicationsAdmin />} />
          <Route path="/admin/pitch-deck" element={<InvestorPitchDeck />} />
          <Route path="/admin/investor-demo" element={<InvestorDemo />} />
          <Route path="/admin/operations" element={<AdminOperations />} />
          <Route path="/admin/yachts" element={<AdminYachts />} />
          <Route path="/admin/tours" element={<AdminTours />} />
          <Route path="/admin/activities" element={<AdminActivities />} />
          <Route path="/admin/properties" element={<AdminProperties />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/investments" element={<AdminInvestments />} />
          <Route path="/admin/developers" element={<AdminDevelopers />} />
          <Route path="/admin/pm-companies" element={<AdminPMCompanies />} />
          <Route path="/admin/contracts" element={<AdminContracts />} />
          <Route path="/admin/restaurants" element={<AdminRestaurants />} />
          <Route path="/admin/restaurants/data-quality" element={<AdminRestaurantDataQuality />} />
          <Route path="/admin/salons" element={<AdminSalons />} />
          <Route path="/admin/clinics" element={<AdminClinics />} />
          <Route path="/admin/gyms" element={<AdminGyms />} />
          <Route path="/admin/vehicles" element={<AdminVehicles />} />
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="/admin/education" element={<AdminEducation />} />
          <Route path="/admin/legal" element={<AdminLegal />} />
          <Route path="/admin/pets" element={<AdminPets />} />
          <Route path="/admin/cleaning" element={<AdminCleaning />} />
          <Route path="/admin/babysitters" element={<AdminBabysitters />} />
          <Route path="/admin/flowers" element={<AdminFlowers />} />
          <Route path="/admin/bouquets" element={<AdminBouquets />} />
          <Route path="/admin/lookups" element={<AdminLookups />} />
          <Route path="/admin/taxonomy" element={<AdminTaxonomyManager />} />
          <Route path="/admin/acquisition-metrics" element={<AcquisitionMetrics />} />
          <Route path="/admin/tickets" element={<AdminTickets />} />
          <Route path="/admin/tickets/:ticketId" element={<AdminTicketDetail />} />
          <Route path="/admin/pharmacies" element={<AdminPharmacies />} />
          <Route path="/admin/stores" element={<AdminStores />} />
          <Route path="/admin/insurance" element={<AdminInsurance />} />
          <Route path="/admin/water-activities" element={<AdminWaterActivities />} />
          <Route path="/admin/experiences" element={<AdminExperiences />} />
          <Route path="/admin/moderation" element={<AdminContentModeration />} />
          <Route path="/admin/consultations" element={<AdminConsultations />} />
          <Route path="/admin/uno-team" element={<AdminUnoTeam />} />
          <Route path="/admin/leads" element={<AdminLeadsDashboard />} />
          <Route path="/admin/finance" element={<AdminFinance />} />
          <Route path="/admin/cities" element={<AdminCities />} />
          <Route path="/admin/translations" element={<AdminTranslations />} />
          <Route path="/admin/location-knowledge" element={<AdminLocationKnowledge />} />
          <Route path="/admin/quick-listings" element={<AdminQuickListings />} />
          <Route path="/admin/user-analytics" element={<UserAnalyticsDashboard />} />
          {/* Marketplace Management */}
          <Route path="/admin/marketplace/products" element={<AdminMarketplaceProducts />} />
          <Route path="/admin/marketplace/categories" element={<AdminMarketplaceCategories />} />
          <Route path="/admin/marketplace/subcategories" element={<AdminMarketplaceSubcategories />} />
          <Route path="/admin/marketplace/vendors" element={<AdminMarketplaceVendors />} />
          {/* Data Import Hub */}
          <Route path="/admin/data-import" element={<AdminDataImport />} />
          {/* AI Agents */}
          <Route path="/admin/ai-agents" element={<AdminAIAgents />} />
          <Route path="/admin/ai-agents/:id" element={<AdminAIAgentEditor />} />
          {/* AI Intake */}
          <Route path="/admin/intake" element={<AdminIntake />} />
          <Route path="/admin/intake-configs" element={<AdminIntakeConfigs />} />
          <Route path="/admin/lead-configs" element={<AdminLeadConfigs />} />
          {/* Vendor Acquisition */}
          <Route path="/admin/vendor-prospects" element={<AdminVendorProspects />} />
          {/* Marketing Command Center */}
          <Route path="/admin/marketing" element={<MarketingDashboard />} />
          {/* Experience Categories */}
          <Route path="/admin/experience-categories" element={<ExperienceCategoriesPage />} />
          {/* LifeOS Control Center */}
          <Route path="/admin/life-situations" element={<AdminLifeOS />} />
          <Route path="/admin/lifeos" element={<AdminLifeOS />} />
        </Route>
        
        {/* Staff Routes - Protected */}
        <Route path="/staff" element={<LazyPage><AdminGuard><StaffDashboard /></AdminGuard></LazyPage>} />
        
        {/* UNO Team Routes - Protected */}
        <Route path="/team" element={<LazyPage><TeamGuard><TeamDashboard /></TeamGuard></LazyPage>} />
        <Route path="/team/content" element={<LazyPage><TeamGuard><TeamContentHub /></TeamGuard></LazyPage>} />
        <Route path="/team/chat" element={<LazyPage><TeamGuard><TeamChatPage /></TeamGuard></LazyPage>} />
        <Route path="/team/leaderboard" element={<LazyPage><TeamGuard><TeamLeaderboardPage /></TeamGuard></LazyPage>} />
        <Route path="/team/my-profile" element={<LazyPage><TeamGuard><TeamProfilePage /></TeamGuard></LazyPage>} />
        <Route path="/team/inbox" element={<LazyPage><TeamGuard><TeamInboxPage /></TeamGuard></LazyPage>} />
        <Route path="/team/support" element={<LazyPage><TeamGuard><TeamSupportPage /></TeamGuard></LazyPage>} />
        <Route path="/team/leads" element={<LazyPage><TeamGuard><TeamLeadsPage /></TeamGuard></LazyPage>} />
        <Route path="/team/moderation" element={<LazyPage><TeamGuard><TeamModerationPage /></TeamGuard></LazyPage>} />
        
        {/* Property Manager Routes - Protected with ManagerLayout */}
        <Route element={<ManagerRouteLayout />}>
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/properties" element={<ManagerProperties />} />
          <Route path="/manager/properties/:id" element={<ManagerProperties />} />
          <Route path="/manager/calendar" element={<ManagerDashboard />} />
          <Route path="/manager/bookings" element={<ManagerDashboard />} />
          <Route path="/manager/guests" element={<ManagerDashboard />} />
          <Route path="/manager/messages" element={<ManagerDashboard />} />
          <Route path="/manager/pricing" element={<ManagerDashboard />} />
          <Route path="/manager/settings" element={<ManagerDashboard />} />
          <Route path="/manager/help" element={<ManagerDashboard />} />
        </Route>
        
        {/* Guest Routes - Protected with GuestLayout */}
        <Route element={<GuestRouteLayout />}>
          <Route path="/my-stay" element={<MyStay />} />
          <Route path="/guest/check-in/:bookingId" element={<GuestCheckIn />} />
          <Route path="/guest/guidebook/:propertyId" element={<GuestGuidebook />} />
        </Route>
        
        {/* Provider Onboarding - Public */}
        <Route path="/provider/onboarding" element={<LazyPage><ProviderOnboarding /></LazyPage>} />

        {/* Vendor Onboarding - Public */}
        <Route path="/vendor/onboarding" element={<LazyPage><VendorOnboarding /></LazyPage>} />
        
        {/* Vendor Routes - Protected with VendorLayout */}
        <Route element={<VendorRouteLayout />}>
          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/vendor/bookings" element={<VendorBookings />} />
          <Route path="/vendor/services" element={<VendorServices />} />
          <Route path="/vendor/analytics" element={<VendorAnalytics />} />
          <Route path="/vendor/payouts" element={<VendorPayouts />} />
          <Route path="/vendor/properties" element={<VendorProperties />} />
          <Route path="/vendor/tours" element={<VendorTours />} />
          <Route path="/vendor/activities" element={<VendorActivities />} />
          <Route path="/vendor/experiences" element={<VendorExperiences />} />
          <Route path="/vendor/yachts" element={<VendorYachts />} />
          <Route path="/vendor/yachts/:id/calendar" element={<VendorYachtCalendar />} />
          <Route path="/vendor/transport" element={<VendorTransport />} />
          <Route path="/vendor/beauty" element={<VendorBeauty />} />
          <Route path="/vendor/fitness" element={<VendorFitness />} />
          <Route path="/vendor/clinics" element={<VendorClinics />} />
          <Route path="/vendor/subscription" element={<VendorSubscription />} />
          <Route path="/vendor/restaurants" element={<VendorRestaurants />} />
          <Route path="/vendor/events" element={<VendorEvents />} />
          <Route path="/vendor/education" element={<VendorEducation />} />
          <Route path="/vendor/legal" element={<VendorLegal />} />
          <Route path="/vendor/pets" element={<VendorPets />} />
          <Route path="/vendor/cleaning" element={<VendorCleaning />} />
          <Route path="/vendor/babysitters" element={<VendorBabysitters />} />
          <Route path="/vendor/flowers" element={<VendorFlowers />} />
          <Route path="/vendor/locations" element={<VendorLocations />} />
          <Route path="/vendor/products" element={<VendorProducts />} />
          <Route path="/vendor/orders" element={<VendorBookings />} />
          <Route path="/vendor/messages" element={<VendorMessages />} />
          <Route path="/vendor/settings" element={<VendorSettings />} />
        </Route>
        
        {/* Owner Landing - Public */}
        <Route path="/owner/landing" element={<LazyPage><OwnerLanding /></LazyPage>} />
        <Route path="/owner/guide" element={<LazyPage><OwnerGuidePage /></LazyPage>} />
        
        {/* Owner (Property Care) Routes - Protected with OwnerLayout */}
        <Route path="/owner" element={<OwnerGuard><OwnerLayout /></OwnerGuard>}>
          <Route index element={<LazyPage><OwnerDashboard /></LazyPage>} />
          <Route path="portfolio" element={<LazyPage><OwnerPortfolio /></LazyPage>} />
          <Route path="superhost" element={<LazyPage><OwnerSuperhost /></LazyPage>} />
          <Route path="properties" element={<LazyPage><OwnerProperties /></LazyPage>} />
          <Route path="properties/new" element={<LazyPage><AddProperty /></LazyPage>} />
          <Route path="properties/import" element={<LazyPage><OwnerPropertyImport /></LazyPage>} />
          <Route path="properties/:id" element={<LazyPage><OwnerPropertyDetail /></LazyPage>} />
          <Route path="properties/:id/terms" element={<LazyPage><OwnerRentalTerms /></LazyPage>} />
          <Route path="properties/:id/setup" element={<LazyPage><PropertyQuickSetup /></LazyPage>} />
          <Route path="properties/:id/edit" element={<LazyPage><EditProperty /></LazyPage>} />
          <Route path="properties/:id/guidebook" element={<LazyPage><OwnerGuidebookEdit /></LazyPage>} />
          <Route path="properties/:id/editor" element={<LazyPage><PropertyEditor /></LazyPage>} />
          <Route path="properties/:id/manage" element={<LazyPage><PropertyManage /></LazyPage>} />
          <Route path="properties/:id/juristic-requests" element={<LazyPage><JuristicRequestsPage /></LazyPage>} />
          <Route path="calendar" element={<LazyPage><OwnerCalendar /></LazyPage>} />
          <Route path="operations" element={<LazyPage><OwnerOperations /></LazyPage>} />
          <Route path="financials" element={<LazyPage><OwnerFinancials /></LazyPage>} />
          <Route path="financials/new" element={<LazyPage><OwnerFinancialForm /></LazyPage>} />
          <Route path="financials/:id" element={<LazyPage><OwnerFinancialForm /></LazyPage>} />
          <Route path="quick-expense" element={<LazyPage><QuickExpense /></LazyPage>} />
          <Route path="messages" element={<LazyPage><OwnerMessages /></LazyPage>} />
          <Route path="chat/:type/:id" element={<LazyPage><OwnerChatRoom /></LazyPage>} />
          <Route path="support-chat" element={<LazyPage><OwnerSupportChat /></LazyPage>} />
          <Route path="message-templates" element={<LazyPage><MessageTemplates /></LazyPage>} />
          <Route path="reviews" element={<LazyPage><OwnerReviews /></LazyPage>} />
          <Route path="service-request" element={<LazyPage><ServiceRequest /></LazyPage>} />
          <Route path="inspection" element={<LazyPage><InspectionRequest /></LazyPage>} />
          <Route path="full-management" element={<LazyPage><FullManagement /></LazyPage>} />
          <Route path="channels" element={<LazyPage><ChannelManager /></LazyPage>} />
          <Route path="team" element={<LazyPage><TeamPage /></LazyPage>} />
          <Route path="reports" element={<LazyPage><ReportsPage /></LazyPage>} />
        </Route>
        
        {/* Demo Routes - No Auth Required */}
        <Route path="/demo" element={<LazyPage><DemoIndex /></LazyPage>} />
        <Route path="/demo/home" element={<LazyPage><DemoHome /></LazyPage>} />
        <Route path="/demo/vendor" element={<LazyPage><VendorDemo /></LazyPage>} />
        
        {/* Admin Quick Listings */}
        <Route path="/admin/quick-listings" element={<LazyPage><AdminGuard><AdminQuickListings /></AdminGuard></LazyPage>} />
        
        {/* Catch-all */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
    
    {/* Global Bottom Navigation for Mobile */}
    <AdaptiveBottomNav />
    </>
  );
};
