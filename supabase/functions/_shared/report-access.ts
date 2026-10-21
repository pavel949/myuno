export interface ReportLookup {
  owner_id: string;
  property_id: string;
}

/** Internal distribution is owner-bound; user recipients are an existing explicit product input. */
export function assertInternalReportRecipient(emails: string[], trustedOwnerEmail: string | undefined) {
  if (!trustedOwnerEmail || emails.length !== 1 || emails[0].toLowerCase() !== trustedOwnerEmail.toLowerCase()) {
    throw new Error('Internal report recipient must be the verified owner');
  }
}