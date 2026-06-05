/**
 * MC (Management Company) workspace child routes — extracted from AnimatedRoutes.
 * Rendered inside the MC parent <Route> with MCGuard + MCLayout.
 */
import { Route, Navigate } from 'react-router-dom';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { Suspense } from 'react';
import * as Pages from '../pageRegistry';
import { PageTransition } from '../PageTransition';

// Local LazyPage helper — kept private to avoid leaking layout helpers across files
const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <PageTransition>
    <Suspense fallback={<LoadingState />}>{children}</Suspense>
  </PageTransition>
);

export const mcRoutes = (
  <>
    <Route index element={<LazyPage><Pages.OwnerDashboard /></LazyPage>} />
    <Route path="modules" element={<LazyPage><Pages.OwnerModulesPage /></LazyPage>} />
    <Route path="properties" element={<LazyPage><Pages.OwnerProperties /></LazyPage>} />
    <Route path="complexes" element={<LazyPage><Pages.ComplexesPage /></LazyPage>} />
    <Route path="projects" element={<LazyPage><Pages.MCProjectsPage /></LazyPage>} />
    <Route path="properties/new" element={<LazyPage><Pages.AddProperty /></LazyPage>} />
    <Route path="properties/import" element={<LazyPage><Pages.OwnerPropertyImport /></LazyPage>} />
    <Route path="properties/:id" element={<LazyPage><Pages.OwnerPropertyDetail /></LazyPage>} />
    <Route path="properties/:id/terms" element={<LazyPage><Pages.OwnerRentalTerms /></LazyPage>} />
    <Route path="properties/:id/setup" element={<LazyPage><Pages.PropertyQuickSetup /></LazyPage>} />
    <Route path="properties/:id/guidebook" element={<LazyPage><Pages.OwnerGuidebookEdit /></LazyPage>} />
    <Route path="properties/:id/editor" element={<LazyPage><Pages.PropertyEditor /></LazyPage>} />
    <Route path="properties/:id/manage" element={<LazyPage><Pages.PropertyManage /></LazyPage>} />
    <Route path="properties/:id/inventory" element={<LazyPage><Pages.InventoryPage /></LazyPage>} />
    <Route path="properties/:id/juristic-requests" element={<LazyPage><Pages.JuristicRequestsPage /></LazyPage>} />
    <Route path="properties/:id/portal-settings" element={<LazyPage><Pages.OwnerPortalSettingsPage /></LazyPage>} />
    <Route path="calendar" element={<LazyPage><Pages.OwnerCalendar /></LazyPage>} />
    <Route path="bookings" element={<Navigate to="/mc/bookings-list" replace />} />
    <Route path="operations" element={<LazyPage><Pages.OwnerOperations /></LazyPage>} />
    <Route path="finance" element={<LazyPage><Pages.FinanceOverview /></LazyPage>} />
    <Route path="financials" element={<LazyPage><Pages.OwnerFinancials /></LazyPage>} />
    <Route path="financials/new" element={<LazyPage><Pages.OwnerFinancialForm /></LazyPage>} />
    <Route path="financials/:id" element={<LazyPage><Pages.OwnerFinancialForm /></LazyPage>} />
    <Route path="budget" element={<LazyPage><Pages.BudgetPage /></LazyPage>} />
    <Route path="finance/planning" element={<LazyPage><Pages.FinancialPlanning /></LazyPage>} />
    <Route path="quick-expense" element={<LazyPage><Pages.QuickExpense /></LazyPage>} />
    <Route path="expenses/quick" element={<LazyPage><Pages.QuickExpense /></LazyPage>} />
    <Route path="income/quick" element={<LazyPage><Pages.QuickIncome /></LazyPage>} />
    <Route path="messages" element={<LazyPage><Pages.OwnerMessages /></LazyPage>} />
    <Route path="auto-messaging" element={<LazyPage><Pages.OwnerAutoMessaging /></LazyPage>} />
    <Route path="chat/:type/:id" element={<LazyPage><Pages.OwnerChatRoom /></LazyPage>} />
    <Route path="support-chat" element={<LazyPage><Pages.OwnerSupportChat /></LazyPage>} />
    <Route path="message-templates" element={<LazyPage><Pages.MessageTemplates /></LazyPage>} />
    <Route path="channels" element={<LazyPage><Pages.ChannelManager /></LazyPage>} />
    <Route path="team" element={<Navigate to="/mc/staff" replace />} />
    <Route path="reports" element={<LazyPage><Pages.ReportsPage /></LazyPage>} />
    <Route path="transparency/:propertyId" element={<LazyPage><Pages.OwnerTransparencyDashboard /></LazyPage>} />
    <Route path="maintenance-plan" element={<LazyPage><Pages.MaintenancePlan /></LazyPage>} />
    <Route path="management-terms" element={<LazyPage><Pages.ManagementPortfolio /></LazyPage>} />
    <Route path="staff" element={<LazyPage><Pages.StaffPage /></LazyPage>} />
    <Route path="subscription" element={<LazyPage><Pages.MCSubscriptionPage /></LazyPage>} />
    <Route path="pipelines" element={<LazyPage><Pages.PipelinesIndex /></LazyPage>} />
    <Route path="sales" element={<LazyPage><Pages.SalesPipeline /></LazyPage>} />
    <Route path="sales/new" element={<LazyPage><Pages.NewDealPage /></LazyPage>} />
    <Route path="sales/analytics" element={<LazyPage><Pages.SalesAnalytics /></LazyPage>} />
    <Route path="sales/settings" element={<Navigate to="/mc/settings?tab=crm" replace />} />
    <Route path="settings" element={<LazyPage><Pages.MCSettingsPage /></LazyPage>} />
    <Route path="help" element={<LazyPage><Pages.MCHelpPage /></LazyPage>} />
    <Route path="sales/:id" element={<LazyPage><Pages.SalesDealDetail /></LazyPage>} />
    <Route path="contacts" element={<LazyPage><Pages.ContactsList /></LazyPage>} />
    <Route path="contacts/:id" element={<LazyPage><Pages.ContactDetail /></LazyPage>} />
    <Route path="contacts/import" element={<LazyPage><Pages.ContactImportPage /></LazyPage>} />
    <Route path="contacts/import-odoo" element={<LazyPage><Pages.ImportOdooContactsPage /></LazyPage>} />
    <Route path="invoices" element={<LazyPage><Pages.InvoicesPage /></LazyPage>} />
    <Route path="finance/owner-payouts" element={<LazyPage><Pages.OwnerPayoutsPage /></LazyPage>} />
    <Route path="finance/ar-aging" element={<LazyPage><Pages.ArAgingPage /></LazyPage>} />
    {/* finance/trust-accounts removed 2026-06-05 (Y1 scope cut) */}
    <Route path="finance/tax-center" element={<LazyPage><Pages.TaxCenterPage /></LazyPage>} />
    <Route path="finance/statement-approvals" element={<LazyPage><Pages.StatementApprovalsPage /></LazyPage>} />
    <Route path="documents/signatures" element={<LazyPage><Pages.SignatureRequestsPage /></LazyPage>} />
    {/* approvals removed 2026-06-05 (Y1 scope cut) */}
    <Route path="team/shifts" element={<LazyPage><Pages.TeamShiftsPage /></LazyPage>} />
    <Route path="procurement" element={<LazyPage><Pages.ProcurementPage /></LazyPage>} />
    <Route path="insights/owner-analytics" element={<LazyPage><Pages.OwnerAnalyticsPage /></LazyPage>} />
    <Route path="developer/api-keys" element={<LazyPage><Pages.ApiKeysPage /></LazyPage>} />
    <Route path="developer/webhooks" element={<LazyPage><Pages.WebhooksPage /></LazyPage>} />
    <Route path="onboarding/wizard" element={<LazyPage><Pages.McOnboardingWizardPage /></LazyPage>} />
    <Route path="tasks" element={<LazyPage><Pages.CrmTasksPage /></LazyPage>} />
    <Route path="crm-dashboard" element={<LazyPage><Pages.CrmDashboardPage /></LazyPage>} />
    <Route path="sequences" element={<LazyPage><Pages.CrmSequencesPage /></LazyPage>} />
    <Route path="quotes" element={<LazyPage><Pages.CrmQuotesPage /></LazyPage>} />
    <Route path="meetings" element={<LazyPage><Pages.CrmMeetingsPage /></LazyPage>} />
    <Route path="crm-emails" element={<LazyPage><Pages.CrmEmailsPage /></LazyPage>} />
    <Route path="crm-emails/settings" element={<LazyPage><Pages.CrmEmailSettingsPage /></LazyPage>} />
    <Route path="automations" element={<LazyPage><Pages.CrmWorkflowsPage /></LazyPage>} />
    <Route path="crm-templates" element={<LazyPage><Pages.CrmTemplatesPage /></LazyPage>} />
    <Route path="duplicates" element={<LazyPage><Pages.CrmDuplicatesPage /></LazyPage>} />
    <Route path="companies" element={<LazyPage><Pages.CrmCompaniesPage /></LazyPage>} />
    <Route path="forms" element={<LazyPage><Pages.CrmWebFormsPage /></LazyPage>} />
    <Route path="assignment" element={<LazyPage><Pages.CrmAssignmentRulesPage /></LazyPage>} />
    <Route path="vendors" element={<LazyPage><Pages.VendorDirectoryPage /></LazyPage>} />
    <Route path="inventory" element={<LazyPage><Pages.InventoryPage /></LazyPage>} />
    <Route path="documents" element={<LazyPage><Pages.DocumentTemplatesPage /></LazyPage>} />
    <Route path="marketing" element={<LazyPage><Pages.MarketingHubPage /></LazyPage>} />
    <Route path="vendor-acquisition" element={<LazyPage><Pages.AdminVendorProspects /></LazyPage>} />
    <Route path="vault" element={<LazyPage><Pages.OwnerVaultPage /></LazyPage>} />
    <Route path="rates" element={<LazyPage><Pages.RateManagementPage /></LazyPage>} />
    <Route path="reviews-management" element={<LazyPage><Pages.ReviewsManagementPage /></LazyPage>} />
    <Route path="insurance" element={<LazyPage><Pages.DocumentsInsurancePage /></LazyPage>} />
    <Route path="owners" element={<LazyPage><Pages.OwnerOwnersPage /></LazyPage>} />
    <Route path="owners/:id" element={<LazyPage><Pages.OwnerDetailPage /></LazyPage>} />
    <Route path="bookings-list" element={<LazyPage><Pages.MCBookingsPage /></LazyPage>} />
    <Route path="performance" element={<LazyPage><Pages.OwnerPerformance /></LazyPage>} />
    <Route path="trends" element={<LazyPage><Pages.OwnerTrendsAndTips /></LazyPage>} />
    <Route path="account-settings" element={<LazyPage><Pages.OwnerAccountSettings /></LazyPage>} />
    <Route path="superhost" element={<LazyPage><Pages.OwnerSuperhost /></LazyPage>} />
    {/* Pages moved from /owner */}
    <Route path="portfolio" element={<LazyPage><Pages.OwnerPortfolio /></LazyPage>} />
    <Route path="guide" element={<LazyPage><Pages.OwnerGuidePage /></LazyPage>} />
    <Route path="setup" element={<LazyPage><Pages.OwnerSetupWizard /></LazyPage>} />
    <Route path="service-request" element={<LazyPage><Pages.ServiceRequest /></LazyPage>} />
    <Route path="inspection" element={<LazyPage><Pages.InspectionRequest /></LazyPage>} />
    <Route path="full-management" element={<LazyPage><Pages.FullManagement /></LazyPage>} />
  </>
);
