/**
 * Centralized Approval Status Constants
 * Single Source of Truth for moderation/approval status across the platform
 */

export const APPROVAL_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DRAFT: 'draft',
} as const;

export type ApprovalStatus = typeof APPROVAL_STATUSES[keyof typeof APPROVAL_STATUSES];

// Map moderation_status (user_listings) to approval_status (vendor tables)
export const MODERATION_TO_APPROVAL_MAP: Record<string, ApprovalStatus> = {
  'pending': APPROVAL_STATUSES.PENDING,
  'approved': APPROVAL_STATUSES.APPROVED,
  'rejected': APPROVAL_STATUSES.REJECTED,
};

// Map approval_status to moderation_status
export const APPROVAL_TO_MODERATION_MAP: Record<string, string> = {
  [APPROVAL_STATUSES.PENDING]: 'pending',
  [APPROVAL_STATUSES.APPROVED]: 'approved',
  [APPROVAL_STATUSES.REJECTED]: 'rejected',
};

// Status labels for UI
export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, { en: string; ru: string }> = {
  [APPROVAL_STATUSES.PENDING]: { en: 'Pending Review', ru: 'На модерации' },
  [APPROVAL_STATUSES.APPROVED]: { en: 'Approved', ru: 'Одобрено' },
  [APPROVAL_STATUSES.REJECTED]: { en: 'Rejected', ru: 'Отклонено' },
  [APPROVAL_STATUSES.DRAFT]: { en: 'Draft', ru: 'Черновик' },
};

// Status colors for badges
export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
  [APPROVAL_STATUSES.PENDING]: 'bg-warning/20 text-warning',
  [APPROVAL_STATUSES.APPROVED]: 'bg-success/20 text-success',
  [APPROVAL_STATUSES.REJECTED]: 'bg-destructive/20 text-destructive',
  [APPROVAL_STATUSES.DRAFT]: 'bg-muted text-muted-foreground',
};

// Helper to normalize any status string to ApprovalStatus
export function normalizeApprovalStatus(status?: string | null): ApprovalStatus {
  if (!status) return APPROVAL_STATUSES.PENDING;
  
  const normalized = status.toLowerCase().trim();
  
  // Check direct match
  if (Object.values(APPROVAL_STATUSES).includes(normalized as ApprovalStatus)) {
    return normalized as ApprovalStatus;
  }
  
  // Check moderation status mapping
  if (MODERATION_TO_APPROVAL_MAP[normalized]) {
    return MODERATION_TO_APPROVAL_MAP[normalized];
  }
  
  // Legacy mappings
  if (normalized === 'active' || normalized === 'published') {
    return APPROVAL_STATUSES.APPROVED;
  }
  
  return APPROVAL_STATUSES.PENDING;
}

// Helper to check if content is visible to public
export function isContentPublished(status?: string | null, isVerified?: boolean | null): boolean {
  const normalized = normalizeApprovalStatus(status);
  return normalized === APPROVAL_STATUSES.APPROVED || isVerified === true;
}
