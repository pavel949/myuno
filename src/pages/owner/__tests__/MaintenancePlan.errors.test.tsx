import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MaintenancePlan from '../MaintenancePlan';
const state=vi.hoisted(()=>({refetch:vi.fn(),error:new Error('restricted query')}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/hooks/usePropertyCare',()=>({useOwnerProperties:()=>({data:[]})}));
vi.mock('@/hooks/useMaintenanceSchedules',()=>({useMaintenanceSchedules:()=>({data:[],isLoading:false,error:state.error,refetch:state.refetch,addSchedule:{},markCompleted:{},updateSchedule:{},deleteSchedule:{}})}));
vi.mock('@/components/owner/maintenance/AddScheduleDialog',()=>({AddScheduleDialog:()=>null}));
vi.mock('@/components/owner/maintenance/EditScheduleDialog',()=>({EditScheduleDialog:()=>null}));
describe('maintenance query error state',()=>{
 beforeEach(()=>vi.clearAllMocks());
 it('shows failed read rather than healthy empty state and permits retry',()=>{
  render(<MaintenancePlan/>);
  expect(screen.getByRole('alert')).toHaveTextContent('Unable to load maintenance schedules');
  expect(screen.queryByText('100%')).not.toBeInTheDocument();
  expect(screen.queryByText('No schedules yet')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Retry'}));expect(state.refetch).toHaveBeenCalledOnce();
 });
});
