/** Search intent labels only; owner features and structured pool_type retain their own vocabulary. */
export function propertySearchFeatureLabels(feature: { id: string; labelEn: string; labelRu: string }) {
  return feature.id === 'pool'
    ? { labelEn: 'Pool', labelRu: 'Бассейн' }
    : { labelEn: feature.labelEn, labelRu: feature.labelRu };
}
