/**
 * Admin route definitions — extracted from AnimatedRoutes for readability.
 *
 * Returns child <Route> elements rendered inside the AdminRouteLayout outlet.
 * Consolidated workspaces keep legacy URLs as query-preserving redirects.
 */
import { Route, Navigate, useLocation } from 'react-router-dom';
import * as Pages from '../pageRegistry';

function AdminTabRedirect({ to, tab }: { to: string; tab: string }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set('tab', tab);
  return <Navigate to={`${to}?${params.toString()}`} replace />;
}

export const adminRoutes = (
  <>
    <Route path="/admin" element={<Pages.AdminDashboard />} />
    <Route path="/admin/inbox" element={<Pages.AdminInbox />} />
    <Route path="/admin/review" element={<Pages.AdminReview />} />
    <Route path="/admin/users" element={<Pages.AdminUsersAccess />} />
    <Route path="/admin/catalog" element={<Pages.AdminCatalogWorkspace />} />
    <Route path="/admin/master-catalog" element={<AdminTabRedirect to="/admin/catalog" tab="categories" />} />
    <Route path="/admin/trash" element={<Pages.AdminTrash />} />
    <Route path="/admin/control" element={<Navigate to="/admin" replace />} />
    <Route path="/admin/vendor-content" element={<Pages.AdminVendorContentCreator />} />
    <Route path="/admin/analytics" element={<Pages.AdminAnalytics />} />
    <Route path="/admin/analytics/events" element={<AdminTabRedirect to="/admin/analytics" tab="visits" />} />
    <Route path="/admin/providers" element={<Pages.AdminProviders />} />
    <Route path="/admin/providers/:id" element={<Pages.AdminProviderDetail />} />
    <Route path="/admin/services" element={<AdminTabRedirect to="/admin/catalog" tab="services" />} />
    <Route path="/admin/partner-applications" element={<Pages.PartnerApplicationsAdmin />} />
    <Route path="/admin/claims" element={<Pages.AdminPoiClaims />} />
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
    <Route path="/admin/newbuilds" element={<Pages.AdminNewbuilds />} />
    <Route path="/admin/newbuilds/console" element={<Navigate to="/admin/newbuilds" replace />} />
    <Route path="/admin/newbuilds/projects/:id/documents" element={<Pages.AdminProjectDocuments />} />
    <Route path="/admin/pm-companies" element={<Pages.AdminPMCompanies />} />
    <Route path="/admin/mc-dashboard" element={<Pages.AdminMCDashboard />} />
    <Route path="/admin/contracts" element={<Pages.AdminContracts />} />
    <Route path="/admin/restaurants" element={<Pages.AdminRestaurants />} />
    <Route path="/admin/restaurants/data-quality" element={<Pages.AdminRestaurantDataQuality />} />
    <Route path="/admin/salons" element={<Pages.AdminSalons />} />
    <Route path="/admin/clinics" element={<Pages.AdminClinics />} />
    <Route path="/admin/gyms" element={<Pages.AdminGyms />} />
    <Route path="/admin/vehicles" element={<AdminTabRedirect to="/admin/transfers" tab="vehicles" />} />
    <Route path="/admin/transfers" element={<Pages.AdminTransfersWorkspace />} />
    <Route path="/admin/transfers/sla" element={<AdminTabRedirect to="/admin/transfers" tab="sla" />} />
    <Route path="/admin/transfer-operators" element={<AdminTabRedirect to="/admin/transfers" tab="operators" />} />
    <Route path="/admin/events" element={<Pages.AdminEvents />} />
    <Route path="/admin/education" element={<Pages.AdminEducation />} />
    <Route path="/admin/legal" element={<Pages.AdminLegal />} />
    <Route path="/admin/pets" element={<Pages.AdminPets />} />
    <Route path="/admin/cleaning" element={<Pages.AdminCleaning />} />
    <Route path="/admin/thai-business" element={<Pages.AdminThaiBusiness />} />
    <Route path="/admin/babysitters" element={<Pages.AdminBabysitters />} />
    <Route path="/admin/flowers" element={<Pages.AdminFlowers />} />
    <Route path="/admin/relocation-articles" element={<Pages.AdminRelocationArticles />} />
    <Route path="/admin/bouquets" element={<Navigate to="/admin/flowers" replace />} />
    <Route path="/admin/lookups" element={<AdminTabRedirect to="/admin/catalog" tab="lookups" />} />
    <Route path="/admin/taxonomy" element={<AdminTabRedirect to="/admin/catalog" tab="taxonomy" />} />
    <Route path="/admin/acquisition-metrics" element={<AdminTabRedirect to="/admin/analytics" tab="acquisition" />} />
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
    <Route path="/admin/investor-metrics" element={<AdminTabRedirect to="/admin/analytics" tab="revenue" />} />
    <Route path="/admin/settings" element={<Pages.AdminSystemSettings />} />
    <Route path="/admin/settings/forms" element={<Pages.AdminFormSettings />} />
    <Route path="/admin/cities" element={<Pages.AdminCities />} />
    <Route path="/admin/translations" element={<Pages.AdminTranslations />} />
    <Route path="/admin/location-knowledge" element={<Pages.AdminLocationKnowledge />} />
    <Route path="/admin/user-analytics" element={<AdminTabRedirect to="/admin/analytics" tab="visits" />} />
    <Route path="/admin/marketplace/products" element={<Navigate to="/admin/catalog" replace />} />
    <Route path="/admin/marketplace/categories" element={<AdminTabRedirect to="/admin/catalog" tab="categories" />} />
    <Route path="/admin/marketplace/subcategories" element={<AdminTabRedirect to="/admin/catalog" tab="categories" />} />
    <Route path="/admin/marketplace/vendors" element={<Navigate to="/admin/catalog" replace />} />
    <Route path="/admin/data-import" element={<Pages.AdminDataImport />} />
    <Route path="/admin/ai-agents" element={<Pages.AdminAIAgents />} />
    <Route path="/admin/ai-ops" element={<Pages.AdminAIOps />} />
    <Route path="/admin/ai-knowledge" element={<Pages.AdminAIKnowledge />} />
    <Route path="/admin/ai-agents/:id" element={<Pages.AdminAIAgentEditor />} />
    <Route path="/admin/add" element={<Pages.AdminAddHub />} />
    <Route path="/admin/intake" element={<Pages.AdminIntake />} />
    <Route path="/admin/intake-configs" element={<AdminTabRedirect to="/admin/settings/forms" tab="intake" />} />
    <Route path="/admin/lead-configs" element={<AdminTabRedirect to="/admin/settings/forms" tab="leads" />} />
    <Route path="/admin/vendor-prospects" element={<Pages.AdminVendorProspects />} />
    <Route path="/admin/crm" element={<Pages.AdminCRM />} />
    <Route path="/admin/marketing" element={<AdminTabRedirect to="/admin/analytics" tab="marketing" />} />
    <Route path="/admin/lifecycle-messaging" element={<Pages.LifecycleMessaging />} />
    <Route path="/admin/experience-categories" element={<Pages.ExperienceCategoriesPage />} />
    <Route path="/admin/life-situations" element={<Pages.AdminLifeOS />} />
    <Route path="/admin/lifeos" element={<Navigate to="/admin/life-situations" replace />} />
    <Route path="/admin/legal-documents" element={<Pages.AdminLegalDocuments />} />
    <Route path="/admin/qa-test-runner" element={<Pages.AdminQATestRunner />} />
    <Route path="/admin/api-keys" element={<Pages.AdminApiKeys />} />
    <Route path="/admin/diagnostics/google-maps" element={<AdminTabRedirect to="/admin/settings/google-maps" tab="diagnostics" />} />
    <Route path="/admin/settings/google-maps" element={<Pages.AdminGoogleMaps />} />
    <Route path="/admin/official-news" element={<Pages.AdminOfficialNews />} />
  </>
);
