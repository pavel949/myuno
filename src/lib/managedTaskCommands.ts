import type { BoundCompanyAccessOperation } from '@/lib/companyAccessOperation';
import type { CreateTaskInput, OperationalTask } from '@/hooks/useOperationalTasks';

function taskRow(data: unknown, propertyId: string, taskId?: string): OperationalTask {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Task result was not confirmed');
  const row=data as Record<string,unknown>;
  if(typeof row.id!=='string'||row.property_id!==propertyId||typeof row.updated_at!=='string'||typeof row.status!=='string'||(taskId&&row.id!==taskId)) throw new Error('Task result does not match this workspace');
  return row as unknown as OperationalTask;
}
async function command(operation:BoundCompanyAccessOperation,name:string,args:Record<string,unknown>,propertyId:string,taskId?:string) {
  operation.assertCurrent();
  const {data,error}=await operation.client.rpc(name,args);
  operation.assertCurrent();
  if(error)throw new Error(error.message);
  return taskRow(data,propertyId,taskId);
}

export async function editManagedOperationalTask(operation:BoundCompanyAccessOperation,task:OperationalTask,updates:Record<string,unknown>) {
  operation.assertCurrent();
  const patch:Record<string,unknown>={};
  const allowed=new Set(['title','title_ru','description','notes','scheduled_date','scheduled_time','priority','status','assigned_to']);
  for(const [key,rawValue] of Object.entries(updates)) {
    const value=key==='priority'&&rawValue==='medium'?'normal':rawValue;
    if(key==='completed_by'||key==='completed_at')continue; // Server derives these fields.
    if(key==='actual_cost') {
      if(value!==null&&value!==0)throw new Error('Cost-bearing tasks require the reviewed financial workflow');
      continue;
    }
    if(!allowed.has(key))throw new Error(`Unsupported managed task field: ${key}`);
    if(value!==undefined&&JSON.stringify(value)!==JSON.stringify((task as unknown as Record<string,unknown>)[key]))patch[key]=value;
  }
  const saved=Object.keys(patch).length?await command(operation,'edit_managed_task_checked',{p_task_id:task.id,p_expected_updated_at:task.updated_at,p_patch:patch},task.property_id,task.id):task;
  operation.assertCurrent();
  if(typeof updates.status==='string'&&saved.status!==updates.status)throw new Error('Requested task status was not confirmed. Reload before retrying.');
  if(updates.status==='completed'&&(saved.completed_by!==operation.actorId||typeof saved.completed_at!=='string'))throw new Error('Server completion evidence was not confirmed. Reload before retrying.');
  if(Object.prototype.hasOwnProperty.call(patch,'assigned_to')&&saved.assigned_to!==patch.assigned_to)throw new Error('Task assignment was not confirmed. Reload before retrying.');
  return saved;
}

export async function createManagedOperationalTask(operation:BoundCompanyAccessOperation,input:CreateTaskInput,requestId:string) {
  if(!input.assigned_to)throw new Error('Select an authorized employee before creating this task');
  if(input.booking_id)throw new Error('Booking preparation requires its separate checked workflow');
  const task=await command(operation,'create_managed_task_checked',{
    p_task_id:requestId,p_property_id:input.property_id,p_assigned_to:input.assigned_to,p_title:input.title,
    p_task_type:input.task_type,p_scheduled_date:input.scheduled_date,p_priority:input.priority??'normal',
  },input.property_id,requestId);
  try {
    return await editManagedOperationalTask(operation,task,{
      ...(input.title_ru!==undefined?{title_ru:input.title_ru}:{}),
      ...(input.description!==undefined?{description:input.description}:{}),
      ...(input.notes!==undefined?{notes:input.notes}:{}),
      ...(input.scheduled_time!==undefined?{scheduled_time:input.scheduled_time}:{}),
    });
  }catch(error){throw new Error(`Task ${task.id} exists, but saving its details was not confirmed. Reload this task before retrying. ${error instanceof Error?error.message:''}`);}
}
