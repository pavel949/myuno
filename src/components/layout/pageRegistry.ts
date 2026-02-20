/**
 * Lazy Page Registry — P3 Consolidation
 * 
 * All lazy-loaded page imports centralized here.
 * AnimatedRoutes.tsx consumes these for route definitions.
 */
import { lazy } from 'react';

// ── Auth ──
export const AccountTypeSelection = lazy(() => import('@/pages/auth/AccountTypeSelection'));
export const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
export const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));

// ── Core ──
export const Discover = lazy(() => import('@/pages/Discover'));
export const PlatformCatalog = lazy(() => import('@/pages/PlatformCatalog'));
export const MapView = lazy(() => import('@/pages/MapView'));
export const Bookings = lazy(() => import('@/pages/Bookings'));
export const BookingDetail = lazy(() => import('@/pages/BookingDetail'));
export const Profile = lazy(() => import('@/pages/Profile'));
export const EditProfile = lazy(() => import('@/pages/profile/EditProfile'));
export const ProfileSettings = lazy(() => import('@/pages/profile/ProfileSettings'));
export const UserAccountDashboard = lazy(() => import('@/pages/account/UserAccountDashboard'));
export const ReferralPage = lazy(() => import('@/pages/profile/ReferralPage'));

// ── Beauty & Spa ──
export const BeautySpaIndex = lazy(() => import('@/pages/beauty/BeautySpaIndex'));
export const SalonDetail = lazy(() => import('@/pages/beauty/SalonDetail'));
export const BeautyBooking = lazy(() => import('@/pages/beauty/BeautyBooking'));
export const BeautyServices = lazy(() => import('@/pages/beauty/BeautyServices'));
export const BeautyMap = lazy(() => import('@/pages/beauty/BeautyMap'));

// ── Property ──
export const PropertyIndex = lazy(() => import('@/pages/property/PropertyIndex'));
export const PropertySearchPage = lazy(() => import('@/pages/property/PropertySearchPage'));
export const PropertyDetail = lazy(() => import('@/pages/property/PropertyDetail'));
export const PropertyInquiry = lazy(() => import('@/pages/property/PropertyInquiry'));
export const PropertyMap = lazy(() => import('@/pages/property/PropertyMap'));
export const PropertyDepositSuccess = lazy(() => import('@/pages/property/PropertyDepositSuccess'));
export const ProjectsIndex = lazy(() => import('@/pages/property/ProjectsIndex'));
export const ProjectDetail = lazy(() => import('@/pages/property/ProjectDetail'));
export const OffplanIndex = lazy(() => import('@/pages/property/OffplanIndex'));
export const OffplanDetail = lazy(() => import('@/pages/property/OffplanDetail'));
export const DevelopersIndex = lazy(() => import('@/pages/property/DevelopersIndex'));
export const DeveloperDetail = lazy(() => import('@/pages/property/DeveloperDetail'));
export const PropertyConsultation = lazy(() => import('@/pages/property/PropertyConsultation'));
export const PropertyMySection = lazy(() => import('@/pages/property/PropertyMySection'));
export const ManagementCompanyProfile = lazy(() => import('@/pages/property/ManagementCompanyProfile'));

// ── Investment ──
export const InvestmentIndex = lazy(() => import('@/pages/invest/InvestmentIndex'));
export const InvestmentDetail = lazy(() => import('@/pages/invest/InvestmentDetail'));
export const InvestorDashboard = lazy(() => import('@/pages/invest/InvestorDashboard'));
export const RaiseFunding = lazy(() => import('@/pages/invest/RaiseFunding'));

// ── Guest ──
export const GuestMessages = lazy(() => import('@/pages/guest/GuestMessages'));
export const GuestTripDetail = lazy(() => import('@/pages/guest/GuestTripDetail'));
export const MyStay = lazy(() => import('@/pages/guest/MyStay'));
export const GuestCheckIn = lazy(() => import('@/pages/guest/GuestCheckIn'));
export const GuestGuidebook = lazy(() => import('@/pages/guest/GuestGuidebook'));

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

// ── Events ──
export const EventsIndex = lazy(() => import('@/pages/events/EventsIndex'));
export const EventDetail = lazy(() => import('@/pages/events/EventDetail'));
export const EventBooking = lazy(() => import('@/pages/events/EventBooking'));
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
export const Support = lazy(() => import('@/pages/Support'));
export const OrderTracking = lazy(() => import('@/pages/orders/OrderTracking'));
export const AdvanceRequested = lazy(() => import('@/pages/booking/AdvanceRequested'));
export const Install = lazy(() => import('@/pages/Install'));
export const ListWithUsPage = lazy(() => import('@/pages/ListWithUsPage'));

// ── Knowledge Hub ──
export const KnowledgeHub = lazy(() => import('@/pages/knowledge/KnowledgeHub'));
export const KnowledgeSectionPage = lazy(() => import('@/pages/knowledge/KnowledgeSectionPage'));
export const KnowledgeArticlePage = lazy(() => import('@/pages/knowledge/KnowledgeArticlePage'));

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

export const AdminActivities = lazy(() => import('@/pages/admin/AdminActivities'));
export const AdminProperties = lazy(() => import('@/pages/admin/AdminProperties'));
export const AdminProjects = lazy(() => import('@/pages/admin/AdminProjects'));
export const AdminInvestments = lazy(() => import('@/pages/admin/AdminInvestments'));
export const AdminDevelopers = lazy(() => import('@/pages/admin/AdminDevelopers'));
export const AdminRestaurants = lazy(() => import('@/pages/admin/AdminRestaurants'));
export const AdminRestaurantDataQuality = lazy(() => import('@/pages/admin/AdminRestaurantDataQuality'));
export const AdminSalons = lazy(() => import('@/pages/admin/AdminSalons'));
export const AdminClinics = lazy(() => import('@/pages/admin/AdminClinics'));
export const AdminGyms = lazy(() => import('@/pages/admin/AdminGyms'));
export const AdminVehicles = lazy(() => import('@/pages/admin/AdminVehicles'));
export const AdminEvents = lazy(() => import('@/pages/admin/AdminEvents'));
export const AdminEducation = lazy(() => import('@/pages/admin/AdminEducation'));
export const AdminLegal = lazy(() => import('@/pages/admin/AdminLegal'));
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

export const AdminConsultations = lazy(() => import('@/pages/admin/AdminConsultations'));
export const AdminUnoTeam = lazy(() => import('@/pages/admin/AdminUnoTeam'));
export const AdminCities = lazy(() => import('@/pages/admin/AdminCities'));
export const AdminTranslations = lazy(() => import('@/pages/admin/AdminTranslations'));

export const AdminLocationKnowledge = lazy(() => import('@/pages/admin/AdminLocationKnowledge'));
export const AdminPMCompanies = lazy(() => import('@/pages/admin/AdminPMCompanies'));
export const AdminContracts = lazy(() => import('@/pages/admin/AdminContracts'));
export const AdminProviderDetail = lazy(() => import('@/pages/admin/AdminProviderDetail'));
export const AdminDataImport = lazy(() => import('@/pages/admin/AdminDataImport'));
export const AdminUnifiedCatalog = lazy(() => import('@/pages/admin/AdminUnifiedCatalog'));
export const AdminControlCenter = lazy(() => import('@/pages/admin/AdminControlCenter'));
export const AdminVendorContentCreator = lazy(() => import('@/pages/admin/AdminVendorContentCreator'));
export const AdminAIAgents = lazy(() => import('@/pages/admin/AdminAIAgents'));
export const AdminAIAgentEditor = lazy(() => import('@/pages/admin/AdminAIAgentEditor'));
export const AdminIntake = lazy(() => import('@/pages/admin/AdminIntake'));
export const AdminIntakeConfigs = lazy(() => import('@/pages/admin/AdminIntakeConfigs'));
export const AdminLeadConfigs = lazy(() => import('@/pages/admin/AdminLeadConfigs'));
export const AdminVendorProspects = lazy(() => import('@/pages/admin/AdminVendorProspects'));
export const AdminLifeOS = lazy(() => import('@/pages/admin/AdminLifeOS'));
export const MarketingDashboard = lazy(() => import('@/pages/admin/marketing/MarketingDashboard'));
export const ExperienceCategoriesPage = lazy(() => import('@/pages/admin/ExperienceCategoriesPage'));

// ── Provider ──
export const ProviderOnboarding = lazy(() => import('@/pages/provider/ProviderOnboarding'));

// ── Vendor ──
export const VendorDashboard = lazy(() => import('@/pages/vendor/VendorDashboard'));
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
export const OwnerPropertyDetail = lazy(() => import('@/pages/owner/OwnerPropertyDetail'));
export const OwnerCalendar = lazy(() => import('@/pages/owner/OwnerCalendar'));
export const OwnerFinancials = lazy(() => import('@/pages/owner/OwnerFinancials'));
export const OwnerFinancialForm = lazy(() => import('@/pages/owner/OwnerFinancialForm'));
export const OwnerMessages = lazy(() => import('@/pages/owner/OwnerMessages'));
export const OwnerChatRoom = lazy(() => import('@/pages/owner/OwnerChatRoom'));
export const OwnerSupportChat = lazy(() => import('@/pages/owner/OwnerSupportChat'));
export const AddProperty = lazy(() => import('@/pages/owner/AddProperty'));
export const ServiceRequest = lazy(() => import('@/pages/owner/ServiceRequest'));
export const InspectionRequest = lazy(() => import('@/pages/owner/InspectionRequest'));
export const OwnerRentalTerms = lazy(() => import('@/pages/owner/OwnerRentalTerms'));
export const EditProperty = lazy(() => import('@/pages/owner/EditProperty'));
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
export const OwnerPortfolio = lazy(() => import('@/pages/owner/OwnerPortfolio'));
export const OwnerSuperhost = lazy(() => import('@/pages/owner/OwnerSuperhost'));
export const OwnerOperations = lazy(() => import('@/pages/owner/OwnerOperations'));
export const OwnerGuidePage = lazy(() => import('@/pages/owner/OwnerGuidePage'));
export const OwnerPropertyImport = lazy(() => import('@/pages/owner/OwnerPropertyImport'));
export const TeamPage = lazy(() => import('@/pages/owner/TeamPage'));
export const ReportsPage = lazy(() => import('@/pages/owner/ReportsPage'));
export const ManagementPortfolio = lazy(() => import('@/pages/owner/ManagementPortfolio'));
export const StaffPage = lazy(() => import('@/pages/owner/StaffPage'));
export const SalesPipeline = lazy(() => import('@/pages/owner/SalesPipeline'));
export const SalesDealDetail = lazy(() => import('@/pages/owner/SalesDealDetail'));
export const OwnerGuidebookEdit = lazy(() => import('@/pages/owner/OwnerGuidebookEdit'));

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

// ── Manager (removed — redirects to /owner) ──
