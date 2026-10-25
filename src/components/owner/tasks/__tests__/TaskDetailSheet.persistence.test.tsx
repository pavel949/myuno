import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TaskDetailSheet, type UnifiedTask } from '../TaskDetailSheet';

const mocks=vi.hoisted(()=>({success:vi.fn(),error:vi.fn(),notify:vi.fn()}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{id:'staff'}})}));
vi.mock('@/hooks/useTaskNotifications',()=>({useTaskNotifications:()=>({notifyAssignment:mocks.notify,notifyStatusRequest:mocks.notify})}));
vi.mock('sonner',()=>({toast:{success:mocks.success,error:mocks.error}}));
vi.mock('@/components/owner/tasks/TaskComments',()=>({TaskComments:()=>null}));
vi.mock('@/components/ui/responsive-modal',()=>({ResponsiveModal:({children,footer}:{children:React.ReactNode;footer:React.ReactNode})=><div>{children}{footer}</div>}));
const task:UnifiedTask={id:'task',source:'ops',title:'Inspection',description:null,status:'pending',priority:'normal',due_date:'2026-10-25',assigned_to:'staff',property_id:'property',task_type:'inspection',raw:{actual_cost:0}};
beforeEach(()=>{vi.clearAllMocks();});
describe('task detail persistence result',()=>{
 it.each([null,'09:00:00'])('does not invent or rewrite operational time %s while completing',async scheduled_time=>{
  const update=vi.fn().mockResolvedValue(undefined);
  render(<TaskDetailSheet task={{...task,raw:{scheduled_date:'2026-10-25',scheduled_time,actual_cost:0}}} open onOpenChange={vi.fn()} members={[]} properties={[]} onUpdate={update} onDelete={vi.fn()}/>);
  fireEvent.click(screen.getByRole('button',{name:/^Completed$/}));
  fireEvent.click(screen.getByRole('button',{name:'Save'}));
  await waitFor(()=>expect(update).toHaveBeenCalledOnce());
  const patch=update.mock.calls[0][2];
  expect(patch.status).toBe('completed');expect(patch).not.toHaveProperty('scheduled_date');expect(patch).not.toHaveProperty('scheduled_time');
 });
 it('retains the editor and reports backend rejection without success or assignment notification',async()=>{
  const close=vi.fn(),update=vi.fn().mockRejectedValue(Error('Task version changed'));
  render(<TaskDetailSheet task={task} open onOpenChange={close} members={[{user_id:'staff',name:'Employee'}]} properties={[]} onUpdate={update} onDelete={vi.fn()} />);
  fireEvent.click(screen.getByRole('button',{name:'Save'}));
  await waitFor(()=>expect(mocks.error).toHaveBeenCalledWith('Task version changed'));
  expect(close).not.toHaveBeenCalled();expect(mocks.success).not.toHaveBeenCalled();expect(mocks.notify).not.toHaveBeenCalled();
 });
 it('waits for the confirmed save before closing and blocks repeated submit while pending',async()=>{
  let resolve!:()=>void;
  const pending=new Promise<void>(done=>{resolve=done;}),close=vi.fn(),update=vi.fn().mockReturnValue(pending);
  render(<TaskDetailSheet task={task} open onOpenChange={close} members={[]} properties={[]} onUpdate={update} onDelete={vi.fn()} />);
  const save=screen.getByRole('button',{name:'Save'});fireEvent.click(save);
  await waitFor(()=>expect(save).toBeDisabled());fireEvent.click(save);
  expect(update).toHaveBeenCalledTimes(1);expect(close).not.toHaveBeenCalled();expect(mocks.success).not.toHaveBeenCalled();
  await act(async()=>{resolve();await pending;});
  expect(close).toHaveBeenCalledWith(false);expect(mocks.success).toHaveBeenCalledWith('Task updated');
 });
});
