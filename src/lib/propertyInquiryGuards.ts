export interface PropertyInquiryIdentity {
  userId: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

/**
 * Stable client correlation key for one inquiry attempt. This is only a
 * duplicate-retry hint; it is not a server transaction or inventory hold.
 */
export function buildPropertyInquiryKey(identity: PropertyInquiryIdentity): string {
  return [
    'property-inquiry',
    identity.userId,
    identity.propertyId,
    identity.checkIn,
    identity.checkOut,
    String(identity.guests),
  ].map(encodeURIComponent).join(':');
}

export function shouldBlockPropertyInquirySubmission(datePricesLoading: boolean, datePricesError: boolean): boolean {
  return datePricesLoading || datePricesError;
}
