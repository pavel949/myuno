// Reference HTTP adapters. NOT deployed, no fallback sender or recipient.
// Supplied config is protected server configuration, never request-body input.
const clean=(value,max=200)=>String(value??'').replace(/[\r\n\u0000-\u001f]/g,' ').slice(0,max);
export function leadText(lead) {
 const m=lead.vertical_metadata||{};
 return ['MyUNO: новая заявка (не бронирование)',`ID: ${clean(lead.id)}`,
 `Клиент: ${clean(lead.name)}`,`Телефон: ${clean(lead.phone)}`,`Почта: ${clean(lead.email)}`,
 `Запрос: ${clean(lead.request_type)}`,`Источник: ${clean(lead.entry_point)}`,
 `Проект: ${clean(lead.development_project_id||m.project_id)}`,`Юнит: ${clean(m.unit_id)}`,`Объект: ${clean(m.property_id)}`,
 `Намерение: ${clean(m.intent)}`,`Бюджет клиента (не цена): ${clean(lead.budget_min)} — ${clean(lead.budget_max)} ${clean(lead.currency)}`,
 `Комментарий: ${clean(lead.notes,1600)}`,'https://myuno.app/admin/operations'].join('\n').slice(0,4000);
}
export function providerAdapters({resendKey,emailFrom,ultraInstance,ultraToken},fetchApi=fetch) {
 const send={};
 if(resendKey && typeof emailFrom==='string' && emailFrom.includes('@') && !/[\r\n]/.test(emailFrom)) send.email=async({lead,target,signal,idempotencyKey})=>{
  const response=await fetchApi('https://api.resend.com/emails',{method:'POST',signal,redirect:'error',headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json','Idempotency-Key':idempotencyKey},body:JSON.stringify({from:emailFrom,to:target,subject:`MyUNO: заявка ${clean(lead.id,36)}`,text:leadText(lead)})});
  const result=await response.json();
  return response.ok && result && !result.error && typeof result.id==='string' && result.id.trim() ? {accepted:true,reference:result.id} : {};
 };
 if(typeof ultraInstance==='string' && /^instance\d+$/.test(ultraInstance) && ultraToken) send.whatsapp=async({lead,target,signal})=>{
  if(typeof target!=='string' || !/^\+?[1-9]\d{6,14}$/.test(target))return {}; // strict platform phone, not arbitrary chat/group ID
  const response=await fetchApi(`https://api.ultramsg.com/${ultraInstance}/messages/chat`,{method:'POST',signal,redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:ultraToken,to:target.startsWith('+')?target:`+${target}`,body:leadText(lead)})});
  const result=await response.json();
  const reference=(result && (typeof result.id==='string'||typeof result.id==='number'))?String(result.id):'';
  return response.ok && result && !result.error && (result.sent===true || result.sent==='true') && reference && reference!=='0' ? {accepted:true,reference} : {};
 };
 // Conservative: non-2xx and malformed responses remain uncertain, no automatic replay.
 return send;
}
