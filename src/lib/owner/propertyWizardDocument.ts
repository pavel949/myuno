import { supabase } from '@/integrations/supabase/client';

type WizardDocument = {
  property_id: string;
  uploaded_by: string;
  document_type: 'power_of_attorney' | 'ownership_title';
  file_url: string;
  file_name: string;
  title: string;
  title_ru: string;
};

/** Immutable document identity survives retry/reload, including a lost insert response. */
export async function savePropertyWizardDocument(document: WizardDocument): Promise<void> {
  const identity = JSON.stringify(['owner-wizard-document-v1', document.uploaded_by,
    document.property_id, document.document_type, document.file_url]);
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity)));
  // UUIDv8: a custom SHA-256-derived identity, not a claim to UUIDv5 semantics.
  bytes[6] = (bytes[6] & 0x0f) | 0x80;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes.slice(0, 16)].map(value => value.toString(16).padStart(2, '0')).join('');
  const id = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  const columns = 'id, property_id, uploaded_by, document_type, file_url, is_sensitive';
  let result = await supabase.from('property_documents').insert({ id, ...document, is_sensitive: true }).select(columns).single();
  if (result.error?.code === '23505') {
    // Do not overwrite a collision or infer success from its constraint name.
    result = await supabase.from('property_documents').select(columns).eq('id', id).single();
  }
  if (result.error) throw new Error(result.error.message);
  const saved = result.data;
  if (!saved || saved.id !== id || saved.property_id !== document.property_id
    || saved.uploaded_by !== document.uploaded_by || saved.document_type !== document.document_type
    || saved.file_url !== document.file_url || saved.is_sensitive !== true) {
    throw new Error('Property document persistence was not confirmed. Retry this draft.');
  }
}
