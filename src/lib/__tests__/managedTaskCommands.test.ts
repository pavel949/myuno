import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BoundCompanyAccessOperation } from '../companyAccessOperation';
import type { OperationalTask } from '@/hooks/useOperationalTasks';
import { createManagedOperationalTask, editManagedOperationalTask } from '../managedTaskCommands';

const task={id:'task',property_id:'property',updated_at:'2026-10-25T04:00:00.123456Z',title:'Inspection',status:'pending',priority:'normal',assigned_to:'staff',notes:null,scheduled_date:'2026-10-25'} as OperationalTask;
const rpc=vi.fn(),assertCurrent=vi.fn();
const operation={actorId:'staff',assertCurrent,client:{rpc}} as unknown as BoundCompanyAccessOperation;
beforeEach(()=>{vi.resetAllMocks();rpc.mockResolvedValue({data:task,error:null});});
describe('checked managed task client commands',()=>{
 it('creates using a retained canonical task request ID and returns confirmed server row',async()=>{
  expect(await createManagedOperationalTask(operation,{property_id:'property',assigned_to:'staff',title:'Inspection',task_type:'inspection',scheduled_date:'2026-10-25'},'task')).toEqual(task);
  expect(rpc).toHaveBeenCalledExactlyOnceWith('create_managed_task_checked',{p_task_id:'task',p_property_id:'property',p_assigned_to:'staff',p_title:'Inspection',p_task_type:'inspection',p_scheduled_date:'2026-10-25',p_priority:'normal'});
 });
 it('saves optional details by exact opaque returned revision and retains ID on partial failure',async()=>{
  rpc.mockResolvedValueOnce({data:task,error:null}).mockResolvedValueOnce({data:null,error:{message:'Details denied'}});
  await expect(createManagedOperationalTask(operation,{property_id:'property',assigned_to:'staff',title:'Inspection',task_type:'inspection',scheduled_date:'2026-10-25',description:'Windows'},'task')).rejects.toThrow('Task task exists');
  expect(rpc.mock.calls[1]).toEqual(['edit_managed_task_checked',{p_task_id:'task',p_expected_updated_at:task.updated_at,p_patch:{description:'Windows'}}]);
 });
 it('never accepts browser-supplied completion actor/time and preserves server CAS',async()=>{
  rpc.mockResolvedValue({data:{...task,status:'completed',notes:'Checked',completed_by:'staff',completed_at:'2026-10-25T04:30:00.123456Z'},error:null});
  await editManagedOperationalTask(operation,task,{status:'completed',notes:'Checked',completed_by:'forged',completed_at:'forged'});
  expect(rpc).toHaveBeenCalledWith('edit_managed_task_checked',{p_task_id:'task',p_expected_updated_at:task.updated_at,p_patch:{status:'completed',notes:'Checked'}});
 });
 it('normalizes the existing operational priority label and excludes unchanged fields',async()=>{
  expect(await editManagedOperationalTask(operation,task,{title:'Inspection',priority:'medium',actual_cost:0})).toEqual(task);
  expect(rpc).not.toHaveBeenCalled();
 });
 it('rejects unsupported authority fields and positive financial input before dispatch',async()=>{
  await expect(editManagedOperationalTask(operation,task,{property_id:'other'})).rejects.toThrow('Unsupported managed task field');
  await expect(editManagedOperationalTask(operation,task,{actual_cost:100})).rejects.toThrow('financial workflow');
  expect(rpc).not.toHaveBeenCalled();
 });
 it('requires explicit assignee and excludes booking preparation from this zero-cost authoring path',async()=>{
  const input={property_id:'property',title:'Inspection',task_type:'inspection' as const,scheduled_date:'2026-10-25'};
  await expect(createManagedOperationalTask(operation,input,'task')).rejects.toThrow('Select an authorized employee');
  await expect(createManagedOperationalTask(operation,{...input,assigned_to:'staff',booking_id:'booking'},'task')).rejects.toThrow('separate checked workflow');
  expect(rpc).not.toHaveBeenCalled();
 });
 it('fails closed on missing RPC without attempting another writer',async()=>{
  rpc.mockResolvedValue({data:null,error:{message:'Function unavailable'}});
  await expect(editManagedOperationalTask(operation,task,{notes:'New'})).rejects.toThrow('Function unavailable');
  expect(rpc).toHaveBeenCalledTimes(1);
 });
 it('rejects actor lifetime invalidation before dispatch and after readback',async()=>{
  assertCurrent.mockImplementationOnce(()=>{throw Error('Actor changed');});
  await expect(editManagedOperationalTask(operation,task,{notes:'New'})).rejects.toThrow('Actor changed');
  expect(rpc).not.toHaveBeenCalled();
  assertCurrent.mockImplementationOnce(()=>{}).mockImplementationOnce(()=>{}).mockImplementationOnce(()=>{throw Error('Company changed');});
  await expect(editManagedOperationalTask(operation,task,{notes:'New'})).rejects.toThrow('Company changed');
 });
 it('does not report a stale no-op as saved',async()=>{
  assertCurrent.mockImplementation(()=>{throw Error('Actor changed');});
  await expect(editManagedOperationalTask(operation,task,{title:'Inspection',priority:'medium'})).rejects.toThrow('Actor changed');
  expect(rpc).not.toHaveBeenCalled();
 });
 it('requires requested status, assignment and server completion evidence in readback',async()=>{
  await expect(editManagedOperationalTask(operation,task,{status:'completed'})).rejects.toThrow('status was not confirmed');
  rpc.mockResolvedValue({data:{...task,status:'completed',completed_by:'other',completed_at:'2026-10-25T04:00:00Z'},error:null});
  await expect(editManagedOperationalTask(operation,task,{status:'completed'})).rejects.toThrow('completion evidence');
  rpc.mockResolvedValue({data:task,error:null});
  await expect(editManagedOperationalTask(operation,task,{assigned_to:'other'})).rejects.toThrow('assignment was not confirmed');
 });
 it('rejects a response from another property or task',async()=>{
  rpc.mockResolvedValue({data:{...task,property_id:'other'},error:null});
  await expect(editManagedOperationalTask(operation,task,{notes:'New'})).rejects.toThrow('does not match');
  rpc.mockResolvedValue({data:{...task,id:'other-task'},error:null});
  await expect(editManagedOperationalTask(operation,task,{notes:'New'})).rejects.toThrow('does not match');
 });
});
