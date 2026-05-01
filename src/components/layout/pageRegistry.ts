/**
 * Lazy Page Registry — P3 Consolidation
 * 
 * All lazy-loaded page imports centralized here.
 * AnimatedRoutes.tsx consumes these for route definitions.
 */
import { lazyWithRetry as lazy } from '@/lib/lazyWithRetry';

// ── Auth ──
export const AccountTypeSelection = lazy(() => import('@/pages/auth/AccountTypeSelection'));
export const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
export const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));

// ── Core ──
export const ForManagementCompanies = lazy(() => import('@/pages/ForManagementCompanies'));
export const ForDevelopers = lazy(() => import('@/pages/ForDevelopers'));
export const ForLocalServiceProviders = lazy(() => import('@/pages/ForLocalServices'));
export const Discover = lazy(() => import('@/components/navigation/NavigatorPage'));
export const PlatformCatalog = lazy(() => import('@/pages/PlatformCatalog'));
export const MapView = lazy(() => import('@/pages/MapView'));
export const Bookings = lazy(() => import('@/pages/Bookings'));
export const BookingDetail = lazy(() => import('@/pages/BookingDetail'));
export const Profile = lazy(() => import('@/pages/Profile'));
export const EditProfile = lazy(() => import('@/pages/profile/EditProfile'));
export const ProfileSettings = lazy(() => import('@/pages/profile/ProfileSettings'));
export const PersonalDetails = lazy(() => import('@/pages/profile/PersonalDetails'));

// PEYLAA premium sales landing
export const PeylaaLanding = lazy(() => import('@/pages/peylaa/PeylaaLanding'));
export const ReferralPage = lazy(() => import('@/pages/profile/ReferralPage'));
export const ReferralLanding = lazy(() => import('@/pages/ReferralLanding'));

// ── Beauty & Spa ──
export const BeautySpaIndex = lazy(() => import('@/pages/beauty/BeautySpaIndex'));
export const SalonDetail = lazy(() => import('@/pages/beauty/SalonDetail'));
export const BeautyBooking = lazy(() => import('@/pages/beauty/BeautyBooking'));
export const BeautyServices = lazy(() => import('@/pages/beauty/BeautyServices'));
export const BeautyMap = lazy(() => import('@/pages/beauty/BeautyMap'));

// ── Property ──
export const PropertyLanding = lazy(() => import('@/pages/property/PropertyLanding'));
export const PropertyIndex = lazy(() => import('@/pages/property/PropertyIndex'));
export const PropertySearchPage = lazy(() => import('@/pages/property/PropertySearchPage'));
export const StaysSearchPage = lazy(() => import('@/pages/stays/StaysSearchPage'));
export const PropertyDetail = lazy(() => import('@/pages/property/PropertyDetail'));
export const PropertyInquiry = lazy(() => import('@/pages/property/PropertyInquiry'));
export const ManualPaymentPending = lazy(() => import('@/pages/property/ManualPaymentPending'));
export const PropertyMap = lazy(() => import('@/pages/property/PropertyMap'));
export const PropertyDepositSuccess = lazy(() => import('@/pages/property/PropertyDepositSuccess'));
// ProjectsIndex/ProjectDetail removed — canonical catalog is OffplanIndex/OffplanDetail at /property/offplan
export const OffplanIndex = lazy(() => import('@/pages/property/OffplanIndex'));
export const OffplanDetail = lazy(() => import('@/pages/property/OffplanDetail'));
export const DevelopersIndex = lazy(() => import('@/pages/property/DevelopersIndex'));
export const DeveloperDetail = lazy(() => import('@/pages/property/DeveloperDetail'));
export const PropertyConsultation = lazy(() => import('@/pages/property/PropertyConsultation'));
export const PropertyMySection = lazy(() => import('@/pages/property/PropertyMySection'));
export const ManagementCompanyProfile = lazy(() => import('@/pages/property/ManagementCompanyProfile'));
export const ResaleIndex = lazy(() => import('@/pages/property/ResaleIndex'));
export const PricingPage = lazy(() => import('@/pages/PricingPage'));
export const WhyMyUno = lazy(() => import('@/pages/property/WhyMyUno'));
export const ClearViewLanding = lazy(() => import('@/pages/clearview/ClearViewLanding'));
export const ClearViewApplyPage = lazy(() => import('@/pages/clearview/ClearViewApplyPage'));
export const CapitalDealIntake = lazy(() => import('@/pages/invest/CapitalDealIntake'));
export const CapitalAdvisoryLanding = lazy(() => import('@/pages/invest/CapitalAdvisoryLanding'));
export const ResaleAssignmentLanding = lazy(() => import('@/pages/property/ResaleAssignmentLanding'));
export const OwnerManagementLanding = lazy(() => import('@/pages/owner/OwnerManagementLanding'));
export const TaxStructuringLanding = lazy(() => import('@/pages/legal/TaxStructuringLanding'));
export const ResaleDetail = lazy(() => import('@/pages/property/ResaleDetail'));
export const CommercialIndex = lazy(() => import('@/pages/property/CommercialIndex'));
export const CommercialDetail = lazy(() => import('@/pages/property/CommercialDetail'));
export const LandIndex = lazy(() => import('@/pages/property/LandIndex'));
export const LandDetail = lazy(() => import('@/pages/property/LandDetail'));
export const HotelsIndex = lazy(() => import('@/pages/property/HotelsIndex'));

// ── Project Microsite (standalone, no app shell) ──
export const ProjectMicrosite = lazy(() => import('@/pages/microsite/ProjectMicrosite'));

// ── Newbuilds (Premium Section) ──
export const NewbuildsLanding = lazy(() => import('@/pages/newbuilds/NewbuildsLanding'));
export const NewbuildsMap = lazy(() => import('@/pages/newbuilds/NewbuildsMap'));
export const NewbuildsCalculator = lazy(() => import('@/pages/newbuilds/NewbuildsCalculator'));
export const NewbuildsCompare = lazy(() => import('@/pages/newbuilds/NewbuildsCompare'));
export const NewbuildsAreaGuides = lazy(() => import('@/pages/newbuilds/NewbuildsAreaGuides'));
export const NewbuildsAreaDetail = lazy(() => import('@/pages/newbuilds/NewbuildsAreaDetail'));
export const NewbuildsDueDiligence = lazy(() => import('@/pages/newbuilds/NewbuildsDueDiligence'));

// ── Area landings (public, /area, /area/:slug) ──
export const AreaIndexPage = lazy(() => import('@/pages/area/AreaIndexPage'));
export const AreaLandingPage = lazy(() => import('@/pages/area/AreaLandingPage'));

// ── Developer Portal ──
export const DeveloperPortalLayout = lazy(() => import('@/components/newbuilds/DeveloperPortalLayout'));
export const DeveloperApply = lazy(() => import('@/pages/developer-portal/DeveloperApply'));
export const DeveloperOverview = lazy(() => import('@/pages/developer-portal/DeveloperOverview'));
export const DeveloperProjects = lazy(() => import('@/pages/developer-portal/DeveloperProjects'));
export const DeveloperProjectEditor = lazy(() => import('@/pages/developer-portal/DeveloperProjectEditor'));
export const DeveloperCompany = lazy(() => import('@/pages/developer-portal/DeveloperCompany'));
export const DeveloperLeads = lazy(() => import('@/pages/developer-portal/DeveloperLeads'));
export const DeveloperLeadDetail = lazy(() => import('@/pages/developer-portal/DeveloperLeadDetail'));
export const DeveloperAnalytics = lazy(() => import('@/pages/developer-portal/DeveloperAnalytics'));
export const DeveloperOnboarding = lazy(() => import('@/pages/developer-portal/DeveloperOnboarding'));
export const DeveloperPending = lazy(() => import('@/pages/developer-portal/DeveloperPending'));
export const DeveloperTeam = lazy(() => import('@/pages/developer-portal/DeveloperTeam'));
export const DeveloperAcceptInvite = lazy(() => import('@/pages/developer-portal/DeveloperAcceptInvite'));
export const DeveloperAcceptClaim = lazy(() => import('@/pages/developer-portal/DeveloperAcceptClaim'));
export const DeveloperStripeReturn = lazy(() => import('@/pages/developer-portal/DeveloperStripeReturn'));

// ── Admin Newbuilds ──
export const AdminNewbuilds = lazy(() => import('@/pages/admin/AdminNewbuilds'));

// ── Investment ──
export const InvestmentIndex = lazy(() => import('@/pages/invest/InvestmentIndex'));
export const InvestmentHubShell = lazy(() => import('@/pages/invest/InvestmentHubShell'));
export const InvestmentDetail = lazy(() => import('@/pages/invest/InvestmentDetail'));
export const InvestorDashboard = lazy(() => import('@/pages/invest/InvestorDashboard'));
export const RaiseFunding = lazy(() => import('@/pages/invest/RaiseFunding'));
export const InvestmentHubLanding = lazy(() => import('@/pages/invest/InvestmentHubLanding'));
export const InvestmentRealEstateZone = lazy(() => import('@/pages/invest/InvestmentRealEstateZone'));
export const InvestmentBusinessZone = lazy(() => import('@/pages/invest/InvestmentBusinessZone'));
export const InvestmentKnowledgeZone = lazy(() => import('@/pages/invest/InvestmentKnowledgeZone'));
export const InvestmentServicesZone = lazy(() => import('@/pages/invest/InvestmentServicesZone'));
export const InvestmentOpsConsole = lazy(() => import('@/pages/invest/InvestmentOpsConsole'));
export const InvestmentBusinessDetail = lazy(() => import('@/pages/invest/InvestmentBusinessDetail'));
export const InvestmentPitch = lazy(() => import('@/pages/invest/InvestmentPitch'));
export const InvestInThailand = lazy(() => import('@/pages/invest/InvestInThailand'));
export const InvestmentSubmit = lazy(() => import('@/pages/invest/InvestmentSubmit'));
export const InvestmentDeals = lazy(() => import('@/pages/invest/InvestmentDeals'));
export const InvestmentDealPublicDetail = lazy(() => import('@/pages/invest/InvestmentDealPublicDetail'));
export const InvestmentArticles = lazy(() => import('@/pages/invest/InvestmentArticles'));
export const InvestmentArticleDetail = lazy(() => import('@/pages/invest/InvestmentArticleDetail'));
export const CapitalInvestmentDeals = lazy(() => import('@/pages/capital/CapitalInvestmentDeals'));
export const CapitalInvestmentDealDetail = lazy(() => import('@/pages/capital/CapitalInvestmentDealDetail'));

// ── Guest ──
export const GuestMessages = lazy(() => import('@/pages/guest/GuestMessages'));
export const GuestTripDetail = lazy(() => import('@/pages/guest/GuestTripDetail'));
export const MyStay = lazy(() => import('@/pages/guest/MyStay'));
export const GuestCheckIn = lazy(() => import('@/pages/guest/GuestCheckIn'));
export const GuestGuidebook = lazy(() => import('@/pages/guest/GuestGuidebook'));
export const PublicGuidebook = lazy(() => import('@/pages/guest/PublicGuidebook'));
export const WelcomeFlow = lazy(() => import('@/pages/guest/WelcomeFlow'));
export const GuestProfile = lazy(() => import('@/pages/guest/GuestProfile'));

// ── Restaurants ──
export const RestaurantsIndex = lazy(() => import('@/pages/restaurants/RestaurantsIndex'));
export const RestaurantDetail = lazy(() => import('@/pages/restaurants/RestaurantDetail'));
export const TableReservation = lazy(() => import('@/pages/restaurants/TableReservation'));
export const DeliveryCheckout = lazy(() => import('@/pages/restaurants/DeliveryCheckout'));
export const SetMenuBooking = lazy(() => import('@/pages/restaurants/SetMenuBooking'));
export const RestaurantMap = lazy(() => import('@/pages/restaurants/RestaurantMap'));

// ── Transport ──
export const TransportIndex = lazy(() => import('@/pages/transport/TransportIndex'));
export const VehicleDetail = lazy(() => import('@/pages/transport/VehicleDetail'));
export const TransportBooking = lazy(() => import('@/pages/transport/TransportBooking'));
export const AirportTransferBooking = lazy(() => import('@/pages/transport/AirportTransferBooking'));
export const TaxiBooking = lazy(() => import('@/pages/transport/TaxiBooking'));
export const TransferSuccess = lazy(() => import('@/pages/transport/TransferSuccess'));
export const AirportFastTrackPage = lazy(() => import('@/pages/transport/AirportFastTrackPage'));

// ── Landing Pages ──
export const AirportTransferLanding = lazy(() => import('@/pages/landing/AirportTransferLanding'));
export const FlowerDeliveryLanding = lazy(() => import('@/pages/landing/FlowerDeliveryLanding'));
export const RentalLanding = lazy(() => import('@/pages/landing/RentalLanding'));
export const NewDevelopmentsLanding = lazy(() => import('@/pages/landing/NewDevelopmentsLanding'));

// ── Fitness ──
export const FitnessIndex = lazy(() => import('@/pages/fitness/FitnessIndex'));
export const GymDetail = lazy(() => import('@/pages/fitness/GymDetail'));
export const FitnessBooking = lazy(() => import('@/pages/fitness/FitnessBooking'));

// ── Medical ──
export const MedicalIndex = lazy(() => import('@/pages/medical/MedicalIndex'));
export const ClinicDetail = lazy(() => import('@/pages/medical/ClinicDetail'));
export const MedicalAppointment = lazy(() => import('@/pages/medical/MedicalAppointment'));

// ── Wellness (shared) ──
export const WellnessOrderSuccess = lazy(() => import('@/pages/wellness/WellnessOrderSuccess'));

// ── Events ──
export const EventsIndex = lazy(() => import('@/pages/events/EventsIndex'));
export const EventDetail = lazy(() => import('@/pages/events/EventDetail'));
export const EventBooking = lazy(() => import('@/pages/events/EventBooking'));
export const EventSuccess = lazy(() => import('@/pages/events/EventSuccess'));
export const VenueDetail = lazy(() => import('@/pages/events/VenueDetail'));

// ── Education ──
export const EducationIndex = lazy(() => import('@/pages/education/EducationIndex'));
export const CourseDetail = lazy(() => import('@/pages/education/CourseDetail'));
export const TutorDetail = lazy(() => import('@/pages/education/TutorDetail'));
export const EducationBooking = lazy(() => import('@/pages/education/EducationBooking'));

// ── Flowers ──
export const FlowersIndex = lazy(() => import('@/pages/flowers/FlowersIndex'));
export const FlowerShopDetail = lazy(() => import('@/pages/flowers/FlowerShopDetail'));
export const FlowersOrder = lazy(() => import('@/pages/flowers/FlowersOrder'));
export const BouquetDetail = lazy(() => import('@/pages/flowers/BouquetDetail'));
export const FlowersSuccess = lazy(() => import('@/pages/flowers/FlowersSuccess'));

// ── Home Services ──
export const ServicesIndex = lazy(() => import('@/pages/services/ServicesIndex'));
export const ServiceProviderDetail = lazy(() => import('@/pages/services/ServiceProviderDetail'));
export const ServiceBooking = lazy(() => import('@/pages/services/ServiceBooking'));
export const ServicesMap = lazy(() => import('@/pages/services/ServicesMap'));
export const ServiceFunctionOrder = lazy(() => import('@/pages/services/ServiceFunctionOrder'));
export const ServiceOrderSuccess = lazy(() => import('@/pages/services/ServiceOrderSuccess'));

// ── Legal ──
export const LegalServicesIndex = lazy(() => import('@/pages/legal/LegalServicesIndex'));
export const LegalProviderDetail = lazy(() => import('@/pages/legal/LegalProviderDetail'));
export const LegalBooking = lazy(() => import('@/pages/legal/LegalBooking'));
export const VisaServiceDetail = lazy(() => import('@/pages/legal/VisaServiceDetail'));
export const VisaImmigrationPage = lazy(() => import('@/pages/legal/VisaImmigrationPage'));

// ── Insurance ──
export const InsuranceIndex = lazy(() => import('@/pages/insurance/InsuranceIndex'));
export const InsuranceDetail = lazy(() => import('@/pages/insurance/InsuranceDetail'));
export const InsuranceQuote = lazy(() => import('@/pages/insurance/InsuranceQuote'));
export const InsurancePlanDetail = lazy(() => import('@/pages/insurance/InsurancePlanDetail'));
export const TravelInsurance = lazy(() => import('@/pages/insurance/TravelInsurance'));

// ── Expat ──
export const BankingPage = lazy(() => import('@/pages/expat/BankingPage'));
export const VeterinaryPage = lazy(() => import('@/pages/expat/VeterinaryPage'));

// ── ARRIVE Cluster ──
export const ArriveClusterPage = lazy(() => import('@/pages/arrive/ArriveClusterPage'));
export const SIMStartPage = lazy(() => import('@/pages/arrive/SIMStartPage'));
export const ExchangeBotPage = lazy(() => import('@/pages/arrive/ExchangeBotPage'));

// ── Utility Micro-apps ──
export const VisaQuizPage = lazy(() => import('@/pages/legal/VisaQuizPage'));
export const SchoolFinderPage = lazy(() => import('@/pages/education/SchoolFinderPage'));
export const CostOfLivingPage = lazy(() => import('@/pages/tools/CostOfLivingPage'));

// ── LEGAL Cluster ──
export const LegalClusterPage = lazy(() => import('@/pages/legal/LegalClusterPage'));
export const ContractAnalysisPage = lazy(() => import('@/pages/legal/ContractAnalysisPage'));
export const TaxNavPage = lazy(() => import('@/pages/legal/TaxNavPage'));

// ── INVEST Cluster (legacy alias → InvestmentHubLanding) ──
export const InvestClusterPage = lazy(() => import('@/pages/invest/InvestmentHubLanding'));

// ── Experiences ──
export const ExperiencesIndex = lazy(() => import('@/pages/experiences/ExperiencesIndex'));
export const ExperienceDetail = lazy(() => import('@/pages/experiences/ExperienceDetail'));
export const ExperienceBooking = lazy(() => import('@/pages/experiences/ExperienceBooking'));

// ── Pharmacy ──
export const PharmacyIndex = lazy(() => import('@/pages/pharmacy/PharmacyIndex'));
export const PharmacyDetail = lazy(() => import('@/pages/pharmacy/PharmacyDetail'));

// ── Pets ──
export const PetsIndex = lazy(() => import('@/pages/pets/PetsIndex'));
export const PetServiceDetail = lazy(() => import('@/pages/pets/PetServiceDetail'));
export const PetServiceBooking = lazy(() => import('@/pages/pets/PetServiceBooking'));
export const PetTransport = lazy(() => import('@/pages/pets/PetTransport'));

// ── Yachts ──
export const YachtsIndex = lazy(() => import('@/pages/yachts/YachtsIndex'));
export const YachtDetail = lazy(() => import('@/pages/yachts/YachtDetail'));
export const YachtBooking = lazy(() => import('@/pages/yachts/YachtBooking'));

// ── Cleaning ──
export const CleaningIndex = lazy(() => import('@/pages/cleaning/CleaningIndex'));
export const CleaningDetail = lazy(() => import('@/pages/cleaning/CleaningDetail'));
export const CleaningBooking = lazy(() => import('@/pages/cleaning/CleaningBooking'));

// ── Babysitter ──
export const BabysitterIndex = lazy(() => import('@/pages/babysitter/BabysitterIndex'));
export const BabysitterDetail = lazy(() => import('@/pages/babysitter/BabysitterDetail'));
export const BabysitterBooking = lazy(() => import('@/pages/babysitter/BabysitterBooking'));

// ── Delivery ──
export const DeliveryIndex = lazy(() => import('@/pages/delivery/DeliveryIndex'));

// ── Market ──
export const MarketIndex = lazy(() => import('@/pages/market/MarketIndex'));
export const MarketCatalogPage = lazy(() => import('@/pages/market/MarketCatalogPage'));
export const MarketCategoryPage = lazy(() => import('@/pages/market/MarketCategoryPage'));
export const ProductDetailPage = lazy(() => import('@/pages/market/ProductDetailPage'));
export const VendorPage = lazy(() => import('@/pages/market/VendorPage'));
export const WishlistPage = lazy(() => import('@/pages/market/WishlistPage'));
export const StoreDetail = lazy(() => import('@/pages/market/StoreDetail'));
export const MarketCheckout = lazy(() => import('@/pages/market/MarketCheckout'));
export const MarketSuccess = lazy(() => import('@/pages/market/MarketSuccess'));
export const SellItemPage = lazy(() => import('@/pages/market/SellItemPage'));

// ── Classifieds (Барахолка) ──
export const ClassifiedsIndex = lazy(() => import('@/pages/classifieds/ClassifiedsIndex'));
export const ClassifiedDetailPage = lazy(() => import('@/pages/classifieds/ClassifiedDetailPage'));
export const ClassifiedsSellPage = lazy(() => import('@/pages/classifieds/ClassifiedsSellPage'));

// ── Other ──
export const Favorites = lazy(() => import('@/pages/Favorites'));
export const Search = lazy(() => import('@/pages/Search'));
export const Notifications = lazy(() => import('@/pages/Notifications'));
export const NotificationSettingsEnhanced = lazy(() => import('@/pages/profile/NotificationSettingsEnhanced'));
export const ViewHistory = lazy(() => import('@/pages/ViewHistory'));
export const Cart = lazy(() => import('@/pages/Cart'));
export const Wallet = lazy(() => import('@/pages/Wallet'));
export const TransactionHistory = lazy(() => import('@/pages/wallet/TransactionHistory'));
export const WalletCards = lazy(() => import('@/pages/wallet/WalletCards'));
export const SOS = lazy(() => import('@/pages/SOS'));
export const VipConcierge = lazy(() => import('@/pages/VipConcierge'));
export const StartOnboarding = lazy(() => import('@/pages/StartOnboarding'));
export const StartOnboardingV2 = lazy(() => import('@/pages/StartOnboardingV2'));
export const Support = lazy(() => import('@/pages/Support'));
export const OrderTracking = lazy(() => import('@/pages/orders/OrderTracking'));
export const AdvanceRequested = lazy(() => import('@/pages/booking/AdvanceRequested'));
export const Install = lazy(() => import('@/pages/Install'));
export const ListWithUsPage = lazy(() => import('@/pages/ListWithUsPage'));

// ── Knowledge Hub ──
export const KnowledgeHub = lazy(() => import('@/pages/knowledge/KnowledgeHub'));
export const KnowledgeSectionPage = lazy(() => import('@/pages/knowledge/KnowledgeSectionPage'));
export const KnowledgeArticlePage = lazy(() => import('@/pages/knowledge/KnowledgeArticlePage'));
export const KnowledgePillarsIndex = lazy(() => import('@/pages/knowledge/KnowledgePillarsIndex'));
export const KnowledgePillarPage = lazy(() => import('@/pages/knowledge/KnowledgePillarPage'));

// ── Info Pages ──
export const AboutPage = lazy(() => import('@/pages/info/AboutPage'));
export const HowItWorksPage = lazy(() => import('@/pages/HowItWorks'));
export const FAQPage = lazy(() => import('@/pages/info/FAQPage'));
export const PartnersPage = lazy(() => import('@/pages/info/PartnersPage'));
export const PrivacyPage = lazy(() => import('@/pages/info/PrivacyPage'));
export const TermsPage = lazy(() => import('@/pages/info/TermsPage'));
export const BecomePartnerPage = lazy(() => import('@/pages/info/BecomePartnerPage'));
export const CookiePolicyPage = lazy(() => import('@/pages/info/CookiePolicyPage'));
export const RefundPolicyPage = lazy(() => import('@/pages/info/RefundPolicyPage'));
export const ContactPage = lazy(() => import('@/pages/info/ContactPage'));
export const GTrustPage = lazy(() => import('@/pages/info/GTrustPage'));
export const IPPolicyPage = lazy(() => import('@/pages/info/IPPolicyPage'));
export const PartnerAgreementPage = lazy(() => import('@/pages/info/PartnerAgreementPage'));
export const DisputeResolutionPage = lazy(() => import('@/pages/info/DisputeResolutionPage'));

// ── Life Flow ──
export const LifeFlowPage = lazy(() => import('@/pages/LifeFlowPage'));
export const TripPlannerPage = lazy(() => import('@/pages/TripPlannerPage'));

// ── Support ──
export const NewTicket = lazy(() => import('@/pages/support/NewTicket'));
export const MyTickets = lazy(() => import('@/pages/support/MyTickets'));
export const TicketDetail = lazy(() => import('@/pages/support/TicketDetail'));

// ── Admin ──
export const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
export const PartnerApplicationsAdmin = lazy(() => import('@/pages/admin/PartnerApplicationsAdmin'));
export const AdminProviders = lazy(() => import('@/pages/admin/AdminProviders'));
export const AdminServices = lazy(() => import('@/pages/admin/AdminServices'));
export const AdminOperations = lazy(() => import('@/pages/admin/AdminOperations'));
export const AdminYachts = lazy(() => import('@/pages/admin/AdminYachts'));
export const AdminTransfers = lazy(() => import('@/pages/admin/AdminTransfers'));

export const AdminActivities = lazy(() => import('@/pages/admin/AdminActivities'));
export const AdminProperties = lazy(() => import('@/pages/admin/AdminProperties'));
export const AdminProjects = lazy(() => import('@/pages/admin/AdminProjects'));
export const AdminInvestments = lazy(() => import('@/pages/admin/AdminInvestments'));
export const AdminDevelopers = lazy(() => import('@/pages/admin/AdminDevelopers'));
export const AdminNewbuildsConsole = lazy(() => import('@/pages/admin/AdminNewbuildsConsole'));
export const AdminProjectDocuments = lazy(() => import('@/pages/admin/AdminProjectDocuments'));
export const AdminRestaurants = lazy(() => import('@/pages/admin/AdminRestaurants'));
export const AdminRestaurantDataQuality = lazy(() => import('@/pages/admin/AdminRestaurantDataQuality'));
export const AdminSalons = lazy(() => import('@/pages/admin/AdminSalons'));
export const AdminClinics = lazy(() => import('@/pages/admin/AdminClinics'));
export const AdminGyms = lazy(() => import('@/pages/admin/AdminGyms'));
export const AdminVehicles = lazy(() => import('@/pages/admin/AdminVehicles'));
export const AdminEvents = lazy(() => import('@/pages/admin/AdminEvents'));
export const AdminEducation = lazy(() => import('@/pages/admin/AdminEducation'));
export const AdminLegal = lazy(() => import('@/pages/admin/AdminLegal'));
export const AdminLegalDocuments = lazy(() => import('@/pages/admin/AdminLegalDocuments'));
export const AdminQATestRunner = lazy(() => import('@/pages/admin/AdminQATestRunner'));
export const StorefrontPage = lazy(() => import('@/pages/StorefrontPage'));
export const AdminPets = lazy(() => import('@/pages/admin/AdminPets'));
export const AdminCleaning = lazy(() => import('@/pages/admin/AdminCleaning'));
export const AdminBabysitters = lazy(() => import('@/pages/admin/AdminBabysitters'));
export const AdminFlowers = lazy(() => import('@/pages/admin/AdminFlowers'));

export const AdminLookups = lazy(() => import('@/pages/admin/AdminLookups'));
export const AdminTaxonomyManager = lazy(() => import('@/pages/admin/AdminTaxonomyManager'));
export const AcquisitionMetrics = lazy(() => import('@/pages/admin/AcquisitionMetrics'));
export const AdminTickets = lazy(() => import('@/pages/admin/AdminTickets'));
export const AdminTicketDetail = lazy(() => import('@/pages/admin/AdminTicketDetail'));
export const AdminPharmacies = lazy(() => import('@/pages/admin/AdminPharmacies'));
export const AdminStores = lazy(() => import('@/pages/admin/AdminStores'));
export const AdminInsurance = lazy(() => import('@/pages/admin/AdminInsurance'));
export const AdminQuickListings = lazy(() => import('@/pages/admin/AdminQuickListings'));
export const AdminWaterActivities = lazy(() => import('@/pages/admin/AdminWaterActivities'));
export const AdminExperiences = lazy(() => import('@/pages/admin/AdminExperiences'));

export const AdminDisputes = lazy(() => import('@/pages/admin/AdminDisputes'));
export const AdminInvestorMetrics = lazy(() => import('@/pages/admin/AdminInvestorMetrics'));

export const AdminConsultations = lazy(() => import('@/pages/admin/AdminConsultations'));
export const AdminUnoTeam = lazy(() => import('@/pages/admin/AdminUnoTeam'));
export const AdminCities = lazy(() => import('@/pages/admin/AdminCities'));
export const AdminTranslations = lazy(() => import('@/pages/admin/AdminTranslations'));

export const AdminLocationKnowledge = lazy(() => import('@/pages/admin/AdminLocationKnowledge'));
export const AdminPMCompanies = lazy(() => import('@/pages/admin/AdminPMCompanies'));
export const AdminMCDashboard = lazy(() => import('@/pages/admin/AdminMCDashboard'));
export const AdminContracts = lazy(() => import('@/pages/admin/AdminContracts'));
export const AdminProviderDetail = lazy(() => import('@/pages/admin/AdminProviderDetail'));
export const AdminDataImport = lazy(() => import('@/pages/admin/AdminDataImport'));
export const AdminUnifiedCatalog = lazy(() => import('@/pages/admin/AdminUnifiedCatalog'));
export const AdminMasterCatalog = lazy(() => import('@/pages/admin/AdminMasterCatalog'));
export const AdminTrash = lazy(() => import('@/pages/admin/AdminTrash'));
export const AdminControlCenter = lazy(() => import('@/pages/admin/AdminControlCenter'));
export const AdminVendorContentCreator = lazy(() => import('@/pages/admin/AdminVendorContentCreator'));
export const AdminAIAgents = lazy(() => import('@/pages/admin/AdminAIAgents'));
export const AdminAIOps = lazy(() => import('@/pages/admin/AdminAIOps'));
export const AdminAIAgentEditor = lazy(() => import('@/pages/admin/AdminAIAgentEditor'));
export const AdminIntake = lazy(() => import('@/pages/admin/AdminIntake'));
export const AdminAddHub = lazy(() => import('@/pages/admin/AdminAddHub'));
export const AdminIntakeConfigs = lazy(() => import('@/pages/admin/AdminIntakeConfigs'));
export const AdminLeadConfigs = lazy(() => import('@/pages/admin/AdminLeadConfigs'));
export const AdminVendorProspects = lazy(() => import('@/pages/admin/AdminVendorProspects'));
export const AdminCRM = lazy(() => import('@/pages/admin/AdminCRM'));
export const AdminLifeOS = lazy(() => import('@/pages/admin/AdminLifeOS'));
export const MarketingDashboard = lazy(() => import('@/pages/admin/marketing/MarketingDashboard'));
export const LifecycleMessaging = lazy(() => import('@/pages/admin/LifecycleMessaging'));
export const ExperienceCategoriesPage = lazy(() => import('@/pages/admin/ExperienceCategoriesPage'));
export const AdminUsersAccess = lazy(() => import('@/pages/admin/AdminUsersAccess'));
export const AdminFinance = lazy(() => import('@/pages/admin/AdminFinance'));
export const AdminSystemSettings = lazy(() => import('@/pages/admin/AdminSystemSettings'));
export const AdminApiKeys = lazy(() => import('@/pages/admin/AdminApiKeys'));

// ── Provider ──
export const ProviderOnboarding = lazy(() => import('@/pages/provider/ProviderOnboarding'));

// ── Vendor ──
export const VendorDashboard = lazy(() => import('@/pages/vendor/VendorDashboard'));
export const VendorLanding = lazy(() => import('@/pages/vendor/VendorLanding'));
export const VendorOnboarding = lazy(() => import('@/pages/vendor/VendorOnboarding'));
export const VendorBookings = lazy(() => import('@/pages/vendor/VendorBookings'));
export const VendorServices = lazy(() => import('@/pages/vendor/VendorServices'));
export const VendorAnalytics = lazy(() => import('@/pages/vendor/VendorAnalytics'));
export const VendorPayouts = lazy(() => import('@/pages/vendor/VendorPayouts'));
export const VendorProperties = lazy(() => import('@/pages/vendor/VendorProperties'));

export const VendorActivities = lazy(() => import('@/pages/vendor/VendorActivities'));
export const VendorExperiences = lazy(() => import('@/pages/vendor/VendorExperiences'));
export const VendorYachts = lazy(() => import('@/pages/vendor/VendorYachts'));
export const VendorYachtCalendar = lazy(() => import('@/pages/vendor/VendorYachtCalendar'));
export const VendorTransport = lazy(() => import('@/pages/vendor/VendorTransport'));
export const VendorBeauty = lazy(() => import('@/pages/vendor/VendorBeauty'));
export const VendorFitness = lazy(() => import('@/pages/vendor/VendorFitness'));
export const VendorClinics = lazy(() => import('@/pages/vendor/VendorClinics'));
export const VendorSubscription = lazy(() => import('@/pages/vendor/VendorSubscription'));
export const VendorRestaurants = lazy(() => import('@/pages/vendor/VendorRestaurants'));
export const VendorEvents = lazy(() => import('@/pages/vendor/VendorEvents'));
export const VendorEducation = lazy(() => import('@/pages/vendor/VendorEducation'));
export const VendorLegal = lazy(() => import('@/pages/vendor/VendorLegal'));
export const VendorPets = lazy(() => import('@/pages/vendor/VendorPets'));
export const VendorCleaning = lazy(() => import('@/pages/vendor/VendorCleaning'));
export const VendorBabysitters = lazy(() => import('@/pages/vendor/VendorBabysitters'));
export const VendorFlowers = lazy(() => import('@/pages/vendor/VendorFlowers'));
export const VendorLocations = lazy(() => import('@/pages/vendor/VendorLocations'));
export const VendorProducts = lazy(() => import('@/pages/vendor/VendorProducts'));
export const VendorMessages = lazy(() => import('@/pages/vendor/VendorMessages'));
export const VendorSettingsPage = lazy(() => import('@/pages/vendor/VendorSettings'));

// ── Owner ──
export const OwnerDashboard = lazy(() => import('@/pages/owner/OwnerDashboard'));
export const OwnerProperties = lazy(() => import('@/pages/owner/OwnerProperties'));
export const ComplexesPage = lazy(() => import('@/pages/owner/ComplexesPage'));
export const MCProjectsPage = lazy(() => import('@/pages/owner/MCProjectsPage'));
export const OwnerPropertyDetail = lazy(() => import('@/pages/owner/OwnerPropertyDetail'));
export const OwnerCalendar = lazy(() => import('@/pages/owner/OwnerCalendar'));
export const OwnerFinancials = lazy(() => import('@/pages/owner/OwnerFinancials'));
export const OwnerFinancialForm = lazy(() => import('@/pages/owner/OwnerFinancialForm'));
export const BudgetPage = lazy(() => import('@/pages/owner/BudgetPage'));
export const FinancialPlanning = lazy(() => import('@/pages/owner/FinancialPlanning'));
export const OwnerMessages = lazy(() => import('@/pages/owner/OwnerMessages'));
export const OwnerChatRoom = lazy(() => import('@/pages/owner/OwnerChatRoom'));
export const OwnerSupportChat = lazy(() => import('@/pages/owner/OwnerSupportChat'));
export const AddProperty = lazy(() => import('@/pages/owner/AddProperty'));
export const ServiceRequest = lazy(() => import('@/pages/owner/ServiceRequest'));
export const InspectionRequest = lazy(() => import('@/pages/owner/InspectionRequest'));
export const OwnerRentalTerms = lazy(() => import('@/pages/owner/OwnerRentalTerms'));
// EditProperty removed — use PropertyEditor instead
export const PropertyEditor = lazy(() => import('@/pages/owner/PropertyEditor'));
export const PropertyManage = lazy(() => import('@/pages/owner/PropertyManage'));
export const FullManagement = lazy(() => import('@/pages/owner/FullManagement'));
export const ChannelManager = lazy(() => import('@/pages/owner/ChannelManager'));

export const JuristicRequestsPage = lazy(() => import('@/pages/owner/JuristicRequestsPage'));
export const MessageTemplates = lazy(() => import('@/pages/owner/MessageTemplates'));
export const QuickExpense = lazy(() => import('@/pages/owner/QuickExpense'));
export const QuickIncome = lazy(() => import('@/pages/owner/QuickIncome'));
export const OwnerReviews = lazy(() => import('@/pages/owner/OwnerReviews'));
export const PropertyQuickSetup = lazy(() => import('@/pages/owner/PropertyQuickSetup'));
export const OwnerSetupWizard = lazy(() => import('@/pages/owner/OwnerSetupWizard'));
export const OwnerPortfolio = lazy(() => import('@/pages/owner/OwnerPortfolio'));
export const OwnerRevenueDashboard = lazy(() => import('@/pages/owner/OwnerRevenueDashboard'));

export const MCBookingsPage = lazy(() => import('@/pages/owner/MCBookingsPage'));
export const OwnerPerformance = lazy(() => import('@/pages/owner/OwnerPerformance'));
export const OwnerSuperhost = lazy(() => import('@/pages/owner/OwnerSuperhost'));
export const OwnerTrendsAndTips = lazy(() => import('@/pages/owner/OwnerTrendsAndTips'));
export const OwnerAccountSettings = lazy(() => import('@/pages/owner/OwnerAccountSettings'));

export const OwnerOperations = lazy(() => import('@/pages/owner/OwnerOperations'));
export const OwnerGuidePage = lazy(() => import('@/pages/owner/OwnerGuidePage'));
export const OwnerPropertyImport = lazy(() => import('@/pages/owner/OwnerPropertyImport'));
export const OwnerTransparencyDashboard = lazy(() => import('@/pages/owner/OwnerTransparencyDashboard'));
export const MaintenancePlan = lazy(() => import('@/pages/owner/MaintenancePlan'));
export const TeamPage = lazy(() => import('@/pages/owner/TeamPage'));
export const ReportsPage = lazy(() => import('@/pages/owner/ReportsPage'));
export const ManagementPortfolio = lazy(() => import('@/pages/owner/ManagementPortfolio'));
export const StaffPage = lazy(() => import('@/pages/owner/StaffPage'));
export const MCSubscriptionPage = lazy(() => import('@/pages/owner/MCSubscriptionPage'));
export const PipelinesIndex = lazy(() => import('@/pages/owner/PipelinesIndex'));
export const SalesPipeline = lazy(() => import('@/pages/owner/SalesPipeline'));
export const SalesDealDetail = lazy(() => import('@/pages/owner/SalesDealDetail'));
export const SalesAnalytics = lazy(() => import('@/pages/owner/SalesAnalytics'));
export const OwnerGuidebookEdit = lazy(() => import('@/pages/owner/OwnerGuidebookEdit'));
export const OwnerAutoMessaging = lazy(() => import('@/pages/owner/OwnerAutoMessaging'));
export const ContactsList = lazy(() => import('@/pages/owner/ContactsList'));
export const ContactDetail = lazy(() => import('@/pages/owner/ContactDetail'));
export const InvoicesPage = lazy(() => import('@/pages/owner/InvoicesPage'));
export const CrmTasksPage = lazy(() => import('@/pages/owner/CrmTasksPage'));
export const VendorDirectoryPage = lazy(() => import('@/pages/owner/VendorDirectoryPage'));
export const InventoryPage = lazy(() => import('@/pages/owner/InventoryPage'));
export const DocumentTemplatesPage = lazy(() => import('@/pages/owner/DocumentTemplatesPage'));
export const MarketingHubPage = lazy(() => import('@/pages/owner/MarketingHubPage'));
export const OwnerVaultPage = lazy(() => import('@/pages/owner/OwnerVaultPage'));
export const ContactImportPage = lazy(() => import('@/pages/owner/ContactImportPage'));
export const ImportOdooContactsPage = lazy(() => import('@/pages/owner/ImportOdooContactsPage'));
export const NewDealPage = lazy(() => import('@/pages/owner/NewDealPage'));
export const PipelineSettingsPage = lazy(() => import('@/pages/owner/PipelineSettingsPage'));
export const MCSettingsPage = lazy(() => import('@/pages/mc/MCSettingsPage'));
export const RateManagementPage = lazy(() => import('@/pages/owner/RateManagementPage'));
export const ReviewsManagementPage = lazy(() => import('@/pages/owner/ReviewsManagementPage'));
export const DocumentsInsurancePage = lazy(() => import('@/pages/owner/DocumentsInsurancePage'));
// OwnerReportsPage removed — functionality merged into ReportsPage
export const AnalyticsPage = lazy(() => import('@/pages/owner/AnalyticsPage'));
export const FinanceOverview = lazy(() => import('@/pages/owner/FinanceOverview'));
export const OwnerPayoutsPage = lazy(() => import('@/pages/mc/finance/OwnerPayoutsPage'));
export const ArAgingPage = lazy(() => import('@/pages/mc/finance/ArAgingPage'));
export const TrustAccountsPage = lazy(() => import('@/pages/mc/finance/TrustAccountsPage'));
export const TaxCenterPage = lazy(() => import('@/pages/mc/finance/TaxCenterPage'));
export const StatementApprovalsPage = lazy(() => import('@/pages/mc/finance/StatementApprovalsPage'));
export const SignatureRequestsPage = lazy(() => import('@/pages/mc/documents/SignatureRequestsPage'));
export const ApprovalsPage = lazy(() => import('@/pages/mc/operations/ApprovalsPage'));
export const TeamShiftsPage = lazy(() => import('@/pages/mc/team/TeamShiftsPage'));
export const ProcurementPage = lazy(() => import('@/pages/mc/operations/ProcurementPage'));
export const OwnerAnalyticsPage = lazy(() => import('@/pages/mc/insights/OwnerAnalyticsPage'));
export const ApiKeysPage = lazy(() => import('@/pages/mc/developer/ApiKeysPage'));
export const WebhooksPage = lazy(() => import('@/pages/mc/developer/WebhooksPage'));
export const McOnboardingWizardPage = lazy(() => import('@/pages/mc/onboarding/McOnboardingWizardPage'));
export const OwnerStatementsInbox = lazy(() => import('@/pages/owner-portal/OwnerStatementsInbox'));
export const OwnerSignaturesInbox = lazy(() => import('@/pages/owner-portal/OwnerSignaturesInbox'));
export const OwnerOwnersPage = lazy(() => import('@/pages/owner/OwnerOwnersPage'));
export const OwnerDetailPage = lazy(() => import('@/pages/owner/OwnerDetailPage'));
export const CrmDashboardPage = lazy(() => import('@/pages/owner/CrmDashboardPage'));
export const CrmSequencesPage = lazy(() => import('@/pages/owner/CrmSequencesPage'));
export const CrmQuotesPage = lazy(() => import('@/pages/owner/CrmQuotesPage'));
export const CrmMeetingsPage = lazy(() => import('@/pages/owner/CrmMeetingsPage'));
export const CrmEmailsPage = lazy(() => import('@/pages/owner/CrmEmailsPage'));
export const CrmWorkflowsPage = lazy(() => import('@/pages/owner/CrmWorkflowsPage'));
export const CrmTemplatesPage = lazy(() => import('@/pages/owner/CrmTemplatesPage'));
export const CrmDuplicatesPage = lazy(() => import('@/pages/owner/CrmDuplicatesPage'));
export const CrmCompaniesPage = lazy(() => import('@/pages/owner/CrmCompaniesPage'));
export const CrmWebFormsPage = lazy(() => import('@/pages/owner/CrmWebFormsPage'));
export const CrmAssignmentRulesPage = lazy(() => import('@/pages/owner/CrmAssignmentRulesPage'));
export const OwnerModulesPage = lazy(() => import('@/pages/owner/OwnerModulesPage'));
export const OwnerPortalSettingsPage = lazy(() => import('@/pages/owner/OwnerPortalSettingsPage'));

// ── Owner Portal (property owner side) ──
export const OwnerPortalDashboard = lazy(() => import('@/pages/owner-portal/OwnerPortalDashboard'));
export const OwnerPortalPropertyView = lazy(() => import('@/pages/owner-portal/OwnerPortalPropertyView'));

// ── Staff ──
export const StaffDashboard = lazy(() => import('@/pages/staff/StaffDashboard'));

// ── Team (UNO) ──
export const TeamDashboard = lazy(() => import('@/pages/team/TeamDashboard'));
export const TeamContentHub = lazy(() => import('@/pages/team/TeamContentHub'));
export const TeamChatPage = lazy(() => import('@/pages/team/TeamChatPage'));
export const TeamLeaderboardPage = lazy(() => import('@/pages/team/TeamLeaderboardPage'));
export const TeamProfilePage = lazy(() => import('@/pages/team/TeamProfilePage'));
export const TeamInboxPage = lazy(() => import('@/pages/team/TeamInboxPage'));
export const TeamSupportPage = lazy(() => import('@/pages/team/TeamSupportPage'));
export const TeamLeadsPage = lazy(() => import('@/pages/team/TeamLeadsPage'));
export const TeamModerationPage = lazy(() => import('@/pages/team/TeamModerationPage'));

// ── MC Onboarding & Help ──
export const MCOnboarding = lazy(() => import('@/pages/mc/MCOnboarding'));
export const MCHelpPage = lazy(() => import('@/pages/mc/MCHelpPage'));
export const MCRegistrationPage = lazy(() => import('@/pages/mc/MCRegistrationPage'));

// ── Manager (removed — redirects to /owner) ──

// ── Landing Pages (Monetization) ──
export const RelocateLandingPage = lazy(() => import('@/pages/relocate/RelocateLandingPage'));
export const WeddingLandingPage = lazy(() => import('@/pages/wedding/WeddingLandingPage'));
export const KidsLandingPage = lazy(() => import('@/pages/kids/KidsLandingPage'));
export const NomadGuidePage = lazy(() => import('@/pages/nomad/NomadGuidePage'));

// ── Capital CRM ──
export const CapitalNewbuildsDeals = lazy(() => import('@/pages/capital/CapitalNewbuildsDeals'));
export const CapitalDevelopersPending = lazy(() => import('@/pages/capital/CapitalDevelopersPending'));
export const CapitalDashboard = lazy(() => import('@/pages/capital/CapitalDashboard'));
export const CapitalContacts = lazy(() => import('@/pages/capital/CapitalContacts'));
export const CapitalContactDetail = lazy(() => import('@/pages/capital/CapitalContactDetail'));
export const CapitalProjects = lazy(() => import('@/pages/capital/CapitalProjects'));
export const CapitalCampaigns = lazy(() => import('@/pages/capital/CapitalCampaigns'));
export const CapitalCampaignLaunch = lazy(() => import('@/pages/capital/CapitalCampaignLaunch'));
export const CapitalOutreach = lazy(() => import('@/pages/capital/CapitalOutreach'));
export const CapitalPipeline = lazy(() => import('@/pages/capital/CapitalPipeline'));
export const CapitalTemplates = lazy(() => import('@/pages/capital/CapitalTemplates'));

// ── /me Universal Hub (Phase A5 — Gosuslugi-style B2C shell) ──
export const MeFeed = lazy(() => import('@/pages/me/MeFeed'));
export const MeServices = lazy(() => import('@/pages/me/MeServices'));
export const MeDocuments = lazy(() => import('@/pages/me/MeDocuments'));
export const MePayments = lazy(() => import('@/pages/me/MePayments'));
export const MeRequests = lazy(() => import('@/pages/me/MeRequests'));
export const MeProfile = lazy(() => import('@/pages/me/MeProfile'));
export const MeBookings = lazy(() => import('@/pages/me/MeBookings'));

// ── Unified Outreach Hub (Stage 4) ──
export const OutreachHub = lazy(() => import('@/pages/outreach/OutreachHub'));

// ── Investor Quiz (real funnel, replaces /invest redirect stub) ──
export const InvestorQuiz = lazy(() => import('@/pages/invest/InvestorQuiz'));
