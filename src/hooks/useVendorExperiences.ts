import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorExperience, ExperienceType, BookingModel } from '@/types/verticals';

export type { VendorExperience, ExperienceType, BookingModel };

export function useVendorExperiences(providerId?: string, experienceType?: ExperienceType | 'all') {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorExperience>('experience', providerId);

  const filteredItems = experienceType && experienceType !== 'all'
    ? items.filter(item => item.experience_type === experienceType)
    : items;

  return {
    experiences: filteredItems,
    isLoading,
    createExperience: async (data: Partial<VendorExperience>) => create({
      ...data,
      experience_type: data.experience_type || 'tour',
      is_active: data.is_active ?? true,
      approval_status: 'pending',
    }),
    updateExperience: update,
    deleteExperience: remove,
    refetch,
  };
}
