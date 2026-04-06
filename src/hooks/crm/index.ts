/**
 * CRM hooks barrel export
 * 
 * Usage: import { useCrmContacts, useDealActivities } from '@/hooks/crm';
 */
export { useDealActivities, useAddDealActivity } from '../useAgentDealActivities';
export { useAgentDeals } from '../useAgentDeals';
export { useContactProperties } from '../useContactProperties';
export { useContactRelationships } from '../useContactRelationships';
export { useContactTags } from '../useContactTags';
export { useCrmActivities } from '../useCrmActivities';
export { useCrmAiAssistant } from '../useCrmAiAssistant';
export { useCrmAssignmentRules } from '../useCrmAssignmentRules';
export { useCrmCompanies } from '../useCrmCompanies';
export { useContactNotes, useAddContactNote } from '../useCrmContactNotes';
export { useCrmContacts } from '../useCrmContacts';
export { useCrmCustomFields } from '../useCrmCustomFields';
export { useCrmDocuments } from '../useCrmDocuments';
export { useDetectDuplicates, useDuplicatesQuery } from '../useCrmDuplicates';
export { useCrmEmails } from '../useCrmEmails';
export { useCrmScoringRules } from '../useCrmLeadScoring';
export { useCrmMeetings } from '../useCrmMeetings';
export { useCrmPipelines } from '../useCrmPipelines';
export { useCrmQuotes } from '../useCrmQuotes';
export { useContactReminders, useCreateContactReminder, useDismissContactReminder } from '../useCrmReminders';
export { useCrmSequences } from '../useCrmSequences';
export * from '../useCrmSettings';
export { useCrmTasks } from '../useCrmTasks';
export { useCrmTemplates } from '../useCrmTemplates';
export { useCrmWebForms } from '../useCrmWebForms';
export { useCrmWorkflows } from '../useCrmWorkflows';
export { useLogActivity, useMemberActivityLog } from '../useTeamActivityLog';
export { useTeamChannels } from '../useTeamChat';
export type { TeamChannel, TeamMessage } from '../useTeamChat';
export * from '../useTeamGamification';
export { useTeamLeads } from '../useTeamLeads';
export { useTeamMember } from '../useTeamMember';
export { useTeamPermissions } from '../useTeamPermissions';
