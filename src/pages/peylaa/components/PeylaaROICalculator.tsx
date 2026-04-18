/**
 * PEYLAA ROI Calculator — thin wrapper around the reusable <ProjectROICalculator>.
 * Keeps the same default presets so the existing /peylaa landing UX is unchanged.
 */
import React from 'react';
import { ProjectROICalculator, type RoiPreset } from '@/components/newbuilds/ProjectROICalculator';

interface Props {
  onGetConsultation: () => void;
}

const PEYLAA_PRESETS: RoiPreset[] = [
  { label: '1BR (45м²)', price: 8_000_000, area: 45.57, rent: 45_000 },
  { label: '2BR Corner (83м²)', price: 14_500_000, area: 83.5, rent: 75_000 },
  { label: '2BR Middle (83м²)', price: 14_000_000, area: 83.5, rent: 72_000 },
];

export function PeylaaROICalculator({ onGetConsultation }: Props) {
  return (
    <ProjectROICalculator
      presets={PEYLAA_PRESETS}
      camFeePerSqmMonthly={120}
      currencySymbol="฿"
      disclaimer="Расчёт носит ознакомительный характер. Фактическая доходность зависит от рыночных условий. Данные CBRE: средняя доходность branded residences Пхукета — 6–8% gross."
      onGetConsultation={onGetConsultation}
    />
  );
}
