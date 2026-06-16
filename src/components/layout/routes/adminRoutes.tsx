/**
 * Admin route definitions — extracted from AnimatedRoutes for readability.
 * 
 * Returns child <Route> elements rendered inside the AdminRouteLayout outlet.
 * All page lazy imports come from pageRegistry.
 */
import { Route, Navigate } from 'react-router-dom';
import * as Pages from '../pageRegistry';

export const adminRoutes = (
  <>
    <Route path="/admin" element={<Pages.AdminDashboard />} />
    <Route path="/admin/users" element={<Pages.AdminUsersAccess />} />
    <Route path="/admin/catalog" element={<Pages.AdminUnifiedCatalog />} />
    <Route path="/admin/master-catalog" element={<Pages.AdminMasterCatalog />} />
    <Route path="/admin/trash" element={<Pages.AdminTrash />} />
    <Route path="/admin/control" element={<Pages.AdminControlCenter />} />
    <Route path="/admin/vendor-content" element={<Pages.AdminVendorContentCreator />} />
    <Route path="/admin/analytics" element={<Navigate to="/admin/control" replace />} />
    <Route path="/admin/providers" element={<Pages.AdminProviders />} />
    <Route path="/admin/providers/:id" element={<Pages.AdminProviderDetail />} />
    <Route path="/admin/services" element={<Pages.AdminServices />} />
    <Route path="/admin/partner-applications" element={<Pages.PartnerApplicationsAdmin />} />
    <Route path="/admin/pitch-deck" element={<Navigate to="/admin" replace />} />
    <Route path="/admin/investor-demo" element={<Navigate to="/admin" replace />} />
    <Route path="/admin/operations" element={<Pages.AdminOperations />} />
    <Route path="/admin/yachts" element={<Pages.AdminYachts />} />
    <Route path="/admin/tours" element={<Navigate to="/admin/experiences" replace />} />
    <Route path="/admin/activities" element={<Pages.AdminActivities />} />
    <Route path="/admin/properties" element={<Pages.AdminProperties />} />
    <Route path="/admin/projects" element={<Pages.AdminProjects />} />
    <Route path="/admin/investments" element={<Pages.AdminInvestments />} />
    <Route path="/admin/developers" element={<Pages.AdminDevelopers />} />
    <Route path="/admin/newbuilds" element={<Pages.AdminNewbuildsConsole />} />
    <Route path="/admin/newbuilds/projects/:id/documents" element={<Pages.AdminProjectDocuments />} />
    <Route path="/admin/pm-companies" element={<Pages.AdminPMCompanies />} />
    <Route path="/admin/mc-dashboard" element={<Pages.AdminMCDashboard />} />
    <Route path="/admin/contracts" element={<Pages.AdminContracts />} />
    <Route path="/admin/restaurants" element={<Pages.AdminRestaurants />} />
    <Route path="/admin/restaurants/data-quality" element={<Pages.AdminRestaurantDataQuality />} />
    <Route path="/admin/salons" element={<Pages.AdminSalons />} />
    <Route path="/admin/clinics" element={<Pages.AdminClinics />} />
    <Route path="/admin/gyms" element={<Pages.AdminGyms />} />
    <Route path="/admin/vehicles" element={<Pages.AdminVehicles />} />
    <Route path="/admin/transfers" element={<Pages.AdminTransfers />} />
    <Route path="/admin/transfers/sla" element={<Pages.AdminTransferSLA />} />
    <Route path="/admin/transfer-operators" element={<Pages.AdminTransferOperators />} />
    <Route path="/admin/events" element={<Pages.AdminEvents />} />
    <Route path="/admin/education" element={<Pages.AdminEducation />} />
    <Route path="/admin/legal" element={<Pages.AdminLegal />} />
    <Route path="/admin/pets" element={<Pages.AdminPets />} />
    <Route path="/admin/cleaning" element={<Pages.AdminCleaning />} />
    <Route path="/admin/babysitters" element={<Pages.AdminBabysitters />} />
    <Route path="/admin/flowers" element={<Pages.AdminFlowers />} />
    <Route path="/admin/relocation-articles" element={<Pages.AdminRelocationArticles />} />
    <Route path="/admin/bouquets" element={<Navigate to="/admin/flowers" replace />} />
    <Route path="/admin/lookups" element={<Pages.AdminLookups />} />
    <Route path="/admin/taxonomy" element={<Pages.AdminTaxonomyManager />} />
    <Route path="/admin/acquisition-metrics" element={<Pages.AcquisitionMetrics />} />
    <Route path="/admin/tickets" element={<Pages.AdminTickets />} />
    <Route path="/admin/tickets/:ticketId" element={<Pages.AdminTicketDetail />} />
    <Route path="/admin/pharmacies" element={<Pages.AdminPharmacies />} />
    <Route path="/admin/stores" element={<Pages.AdminStores />} />
    <Route path="/admin/insurance" element={<Pages.AdminInsurance />} />
    <Route path="/admin/quick-listings" element={<Pages.AdminQuickListings />} />
    <Route path="/admin/water-activities" element={<Pages.AdminWaterActivities />} />
    <Route path="/admin/experiences" element={<Pages.AdminExperiences />} />
    <Route path="/admin/moderation" element={<Navigate to="/admin/operations?tab=moderation" replace />} />
    <Route path="/admin/bulk-publish" element={<Pages.AdminBulkPublish />} />
    <Route path="/admin/consultations" element={<Pages.AdminConsultations />} />
    <Route path="/admin/nb-leads" element={<Pages.AdminNbLeads />} />

    <Route path="/admin/uno-team" element={<Pages.AdminUnoTeam />} />
    <Route path="/admin/leads" element={<Navigate to="/admin/operations" replace />} />
    <Route path="/admin/finance" element={<Pages.AdminFinance />} />
    <Route path="/admin/disputes" element={<Pages.AdminDisputes />} />
    <Route path="/admin/investor-metrics" element={<Pages.AdminInvestorMetrics />} />
    <Route path="/admin/settings" element={<Pages.AdminSystemSettings />} />
    <Route path="/admin/cities" element={<Pages.AdminCities />} />
    <Route path="/admin/translations" element={<Pages.AdminTranslations />} />
    <Route path="/admin/location-knowledge" element={<Pages.AdminLocationKnowledge />} />
    <Route path="/admin/user-analytics" element={<Navigate to="/admin/control" replace />} />
    <Route path="/admin/marketplace/products" element={<Navigate to="/admin/catalog" replace />} />
    <Route path="/admin/marketplace/categories" element={<Navigate to="/admin/catalog" replace />} />
    <Route path="/admin/marketplace/subcategories" element={<Navigate to="/admin/catalog" replace />} />
    <Route path="/admin/marketplace/vendors" element={<Navigate to="/admin/catalog" replace />} />
    <Route path="/admin/data-import" element={<Pages.AdminDataImport />} />
    <Route path="/admin/ai-agents" element={<Pages.AdminAIAgents />} />
    <Route path="/admin/ai-ops" element={<Pages.AdminAIOps />} />
    <Route path="/admin/ai-knowledge" element={<Pages.AdminAIKnowledge />} />
    <Route path="/admin/ai-agents/:id" element={<Pages.AdminAIAgentEditor />} />
    <Route path="/admin/add" element={<Pages.AdminAddHub />} />
    <Route path="/admin/intake" element={<Pages.AdminIntake />} />
    <Route path="/admin/intake-configs" element={<Pages.AdminIntakeConfigs />} />
    <Route path="/admin/lead-configs" element={<Pages.AdminLeadConfigs />} />
    <Route path="/admin/vendor-prospects" element={<Pages.AdminVendorProspects />} />
    <Route path="/admin/crm" element={<Pages.AdminCRM />} />
    <Route path="/admin/marketing" element={<Pages.MarketingDashboard />} />
    <Route path="/admin/lifecycle-messaging" element={<Pages.LifecycleMessaging />} />
    <Route path="/admin/experience-categories" element={<Pages.ExperienceCategoriesPage />} />
    <Route path="/admin/life-situations" element={<Pages.AdminLifeOS />} />
    <Route path="/admin/lifeos" element={<Navigate to="/admin/life-situations" replace />} />
    <Route path="/admin/legal-documents" element={<Pages.AdminLegalDocuments />} />
    <Route path="/admin/qa-test-runner" element={<Pages.AdminQATestRunner />} />
    <Route path="/admin/api-keys" element={<Pages.AdminApiKeys />} />
    <Route path="/admin/official-news" element={<Pages.AdminOfficialNews />} />
  </>
);
