import { CANCELLATION_POLICY_DETAILS } from '@/lib/constants';

/** Display the stored policy consistently; unknown policy text remains explicit. */
export function propertyCancellationDescription(policy: string, language: 'ru' | 'en'): string {
  if (!Object.prototype.hasOwnProperty.call(CANCELLATION_POLICY_DETAILS, policy)) return policy;
  const details = CANCELLATION_POLICY_DETAILS[policy as keyof typeof CANCELLATION_POLICY_DETAILS];
  return language === 'ru' ? details.descRu : details.descEn;
}
