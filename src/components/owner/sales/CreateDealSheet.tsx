import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DealRecoveryBlockedError, canDiscardUnsubmittedDeal, discardUnsubmittedDeal, dealAttemptKey, readDealAttempt, saveDealAttempt, recoverDealCreation, type DealCreationAttempt } from '@/lib/crm/dealCreationRecovery';
import { fireCrmWorkflowTrigger } from '@/lib/crmWorkflowTrigger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Crown, Handshake, Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDuplicateCheck, CLIENT_SOURCES, PHUKET_DISTRICTS, PROPERTY_TYPES, CURRENCIES, DEAL_TYPES, DEAL_TYPE_LABELS } from '@/hooks/useAgentDeals';
import type { CrmContact } from '@/hooks/useCrmContacts';
import { ContactSearchInput } from '@/components/owner/contacts/ContactSearchInput';
import { PropertySearchInput, PropertySearchResult } from '@/components/owner/sales/PropertySearchInput';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { APP_ROUTES } from '@/lib/config/routes';
import { normalizePhone, isLikelyPhone } from '@/lib/phone';
import { isValidEmail } from '@/lib/crm/validation';

import { toast } from 'sonner';
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  prefilledContact?: CrmContact | null;
  prefilledStage?: string;
  /**
   * If set, the new deal is created in this pipeline. Pass the currently
   * selected pipeline from the CRM dashboard so buy/sell-side flows route
   * the deal into the right stage set.
   */
  pipelineId?: string | null;
}

const CONTACT_TYPE_BY_DEAL_TYPE: Record<string, string> = {
  sale: 'buyer',
  rent_short: 'tenant',
  rent_long: 'tenant',
  investment: 'investor',
  management: 'landlord',
  club_deal: 'investor',
  resale: 'buyer',
  offplan: 'buyer',
};

function CreateDealSheetContent({ open, onOpenChange, companyId, prefilledContact, prefilledStage = 'new', pipelineId = null }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const current = useRef({ actorId: user?.id, companyId, mounted: true });
  current.current.actorId = user?.id;
  current.current.companyId = companyId;
  useLayoutEffect(() => { const context = current.current; context.mounted = true; return () => { context.mounted = false; }; }, []);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [attempt, setAttempt] = useState<DealCreationAttempt | null>(() => {
    try { return user?.id ? readDealAttempt(user.id, companyId) : null; }
    catch { return null; }
  });
  const attemptRef = useRef(attempt);
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(prefilledContact || null);
  const [selectedProperty, setSelectedProperty] = useState<PropertySearchResult | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [syncBackToContact, setSyncBackToContact] = useState(false);

  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    client_source: 'website',
    deal_type: 'sale',
    notes: '',
    budget_min: '',
    budget_max: '',
    currency: 'THB',
    bedrooms_min: '',
    preferred_types: [] as string[],
    preferred_districts: [] as string[],
    is_vip: false,
    also_mark_contact_vip: false,
  });
  const [errors, setErrors] = useState<{
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    budget?: string;
  }>({});

  // Initialize form from prefilledContact ONCE per open cycle (no longer overwrites user edits).
  useEffect(() => {
    if (!open) {
      setHasInitialized(false);
      return;
    }
    if (hasInitialized) return;
    if (prefilledContact) {
      setSelectedContact(prefilledContact);
      const contactIsVip = prefilledContact.is_vip || (prefilledContact.tags?.some(tag => tag.toLowerCase() === 'vip') ?? false);
      setForm(f => ({
        ...f,
        client_name: `${prefilledContact.first_name} ${prefilledContact.last_name}`.trim(),
        client_phone: prefilledContact.phone || '',
        client_email: prefilledContact.email || '',
        client_source: prefilledContact.source || 'website',
        budget_min: prefilledContact.budget_min ? String(prefilledContact.budget_min) : '',
        budget_max: prefilledContact.budget_max ? String(prefilledContact.budget_max) : '',
        currency: prefilledContact.currency || 'THB',
        bedrooms_min: prefilledContact.bedrooms_min ? String(prefilledContact.bedrooms_min) : '',
        preferred_types: prefilledContact.preferred_types || [],
        preferred_districts: prefilledContact.preferred_districts || [],
        is_vip: contactIsVip,
      }));
    }
    setHasInitialized(true);
  }, [open, prefilledContact, hasInitialized]);

  const { data: duplicates = [] } = useDuplicateCheck(companyId, form.client_phone, form.client_email);

  const contactLocked = !!selectedContact;

  const toggleType = (t: string) => {
    setForm(f => ({
      ...f,
      preferred_types: f.preferred_types.includes(t)
        ? f.preferred_types.filter(x => x !== t)
        : [...f.preferred_types, t],
    }));
  };

  const toggleDistrict = (d: string) => {
    setForm(f => ({
      ...f,
      preferred_districts: f.preferred_districts.includes(d)
        ? f.preferred_districts.filter(x => x !== d)
        : [...f.preferred_districts, d],
    }));
  };

  const validateForm = () => {
    const nextErrors: typeof errors = {};
    if (!selectedContact && !form.client_name.trim()) {
      nextErrors.client_name = isRu ? 'Введите имя клиента или выберите контакт' : 'Enter client name or select a contact';
    }
    if (!selectedContact && form.client_email && !isValidEmail(form.client_email)) {
      nextErrors.client_email = isRu ? 'Неверный формат email' : 'Invalid email format';
    }
    if (!selectedContact && form.client_phone && !isLikelyPhone(form.client_phone)) {
      nextErrors.client_phone = isRu ? 'Телефон должен содержать ≥7 цифр' : 'Phone must contain ≥7 digits';
    }
    const bMin = form.budget_min ? Number(form.budget_min) : null;
    const bMax = form.budget_max ? Number(form.budget_max) : null;
    if (bMin !== null && bMax !== null && bMin > bMax) {
      nextErrors.budget = isRu ? 'Бюджет "от" не может быть больше "до"' : 'Budget min cannot be greater than max';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setSelectedContact(null);
    setSelectedProperty(null);
    setErrors({});
    setHasInitialized(false);
    setSyncBackToContact(false);
    setForm({
      client_name: '', client_phone: '', client_email: '', client_source: 'website',
      deal_type: 'sale', notes: '', budget_min: '', budget_max: '', currency: 'THB',
      bedrooms_min: '', preferred_types: [], preferred_districts: [],
      is_vip: false, also_mark_contact_vip: false,
    });
  };

  const handleSubmit = async () => {
    // Ref latch covers the contact stage and two activations before React rerenders.
    if (inFlight.current || !user?.id) return;
    if (!attemptRef.current && !validateForm()) {
      toast.error(isRu ? 'Проверьте обязательные поля' : 'Please fix required fields');
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setRecoveryError('');
    const actorId = user.id;
    const isCurrent = () => current.current.mounted && current.current.actorId === actorId && current.current.companyId === companyId;
    try {
      let saved = attemptRef.current;
      if (!saved) {
        // Never overwrite an unreadable/corrupt journal with a fresh operation.
        saved = readDealAttempt(actorId, companyId);
      }
      if (!saved) {
        const contactId = selectedContact?.id || crypto.randomUUID();
        const normalizedPhone = selectedContact ? selectedContact.phone : normalizePhone(form.client_phone);
        const normalizedEmail = selectedContact ? selectedContact.email : (form.client_email.trim().toLowerCase() || null);
        const clientName = selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}`.trim() : form.client_name.trim();
        const nameParts = form.client_name.trim().split(' ');
        saved = {
          version: 1, actorId, companyId, contactId, dealId: crypto.randomUUID(), dealWriteState: 'not_started',
          contact: selectedContact ? null : {
            company_id: companyId,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            phone: normalizedPhone,
            phone2: null,
            email: normalizedEmail,
            whatsapp: null, telegram: null, line_id: null,
            nationality: null, language: 'en',
            source: form.client_source,
            contact_type: CONTACT_TYPE_BY_DEAL_TYPE[form.deal_type as keyof typeof CONTACT_TYPE_BY_DEAL_TYPE],
            company_name: null,
            budget_min: form.budget_min ? Number(form.budget_min) : null,
            budget_max: form.budget_max ? Number(form.budget_max) : null,
            currency: form.currency,
            preferred_districts: form.preferred_districts.length ? form.preferred_districts : null,
            preferred_types: form.preferred_types.length ? form.preferred_types : null,
            bedrooms_min: form.bedrooms_min ? Number(form.bedrooms_min) : null,
            notes: null,
            tags: form.also_mark_contact_vip || form.is_vip ? ['VIP'] : [],
            avatar_url: null,
            is_archived: false,
            is_vip: form.also_mark_contact_vip,
            created_by: user?.id || null,
          },
          contactPatch: selectedContact && syncBackToContact ? {
            budget_min: form.budget_min ? Number(form.budget_min) : null,
            budget_max: form.budget_max ? Number(form.budget_max) : null,
            currency: form.currency,
            preferred_districts: form.preferred_districts.length ? form.preferred_districts : null,
            preferred_types: form.preferred_types.length ? form.preferred_types : null,
            bedrooms_min: form.bedrooms_min ? Number(form.bedrooms_min) : null,
            ...(form.also_mark_contact_vip ? { is_vip: true } : {}),
          } : null,
          deal: {
        company_id: companyId,
        agent_id: user!.id,
        property_id: selectedProperty && !selectedProperty.is_project ? selectedProperty.id : null,
        property_project_id: selectedProperty?.is_project ? selectedProperty.id : null,
        client_name: clientName,
        client_phone: normalizedPhone,
        client_email: normalizedEmail,
        client_source: form.client_source,
        stage: prefilledStage as any,
        pipeline_id: pipelineId,
        deal_type: form.deal_type,
        deal_status: 'active',
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        currency: form.currency,
        preferred_districts: form.preferred_districts.length ? form.preferred_districts : null,
        preferred_types: form.preferred_types.length ? form.preferred_types : null,
        bedrooms_min: form.bedrooms_min ? Number(form.bedrooms_min) : null,
        notes: form.notes || null,
        is_vip: form.is_vip,
        next_action: null, next_action_date: null, deal_value: null,
        commission_percent: null, commission_amount: null,
        closed_at: null, lost_reason: null, won_reason: null,
        ...(contactId ? { contact_id: contactId } : {}),
      },
        };
        saveDealAttempt(saved); // Storage failure stops before any business write.
      }
      attemptRef.current = saved;
      setAttempt(saved);
      const result = await recoverDealCreation(saved, isCurrent, saveDealAttempt, kind => {
        if (isCurrent()) {
          qc.invalidateQueries({ queryKey: ['crm-contacts'] });
          qc.invalidateQueries({ queryKey: ['crm-contact', saved.contactId] });
          fireCrmWorkflowTrigger({ trigger_type: kind === 'created' ? 'contact_created' : 'contact_updated',
            company_id: companyId, entity_id: saved.contactId, entity_type: 'contact',
            metadata: { contact_type: saved.contact?.contact_type, source: saved.contact?.source } });
        }
      });
      if (!isCurrent()) return;
      qc.invalidateQueries({ queryKey: ['crm-contacts'] });
      qc.invalidateQueries({ queryKey: ['agent-deals'] });
      qc.setQueryData(['agent-deal', result.deal.id], result.deal);
      // Replays never repeat non-transactional workflow dispatch. A lost acknowledgement
      // does not prove whether an external workflow ran; it needs separate reconciliation.
      if (result.createdDeal) fireCrmWorkflowTrigger({ trigger_type: 'deal_created', company_id: companyId,
        entity_id: saved.dealId, entity_type: 'deal', metadata: { deal_type: saved.deal.deal_type, stage: saved.deal.stage } });
      sessionStorage.removeItem(dealAttemptKey(actorId, companyId));
      attemptRef.current = null;
      setAttempt(null);
      toast(isRu ? 'Сделка создана' : 'Deal created', {
        description: isRu ? 'Запись сохранена и открыта в CRM.' : 'The record was saved and opened in CRM.',
      });
      onOpenChange(false);
      resetForm();
      navigate(`${APP_ROUTES.MC_SALES}/${saved.dealId}`);
    } catch (error) {
      const diagnosis = error instanceof DealRecoveryBlockedError ? error.reason : attemptRef.current?.terminalReason;
      if (isCurrent() && diagnosis) setRecoveryError([
        diagnosis === 'contact_unavailable'
          ? (isRu ? 'Связанный контакт недоступен.' : 'The linked contact is unavailable.')
          : (isRu ? 'Обновление контакта отклонено.' : 'The contact update was rejected.'),
        attemptRef.current && canDiscardUnsubmittedDeal(attemptRef.current)
          ? (isRu ? 'Отправка сделки не начиналась.' : 'No deal submission was started.')
          : (isRu ? 'Статус предыдущей отправки не подтверждён. Сохраните попытку для сверки.' : 'Previous submission status is unconfirmed. Keep this attempt for reconciliation.'),
      ].join(' '));
      else if (isCurrent()) setRecoveryError(isRu
        ? 'Сохранение сделки не подтверждено. Повторите ту же попытку: контакт и сделка не будут созданы заново. Если контакт уже сохранён, он останется в CRM.'
        : 'Deal saving was not confirmed. Retry this same attempt using its saved IDs. A contact already saved remains in CRM.');
    } finally {
      inFlight.current = false;
      if (isCurrent()) setBusy(false);
    }
  };

  const handleDiscard = async () => {
    const saved = attemptRef.current;
    if (!saved || inFlight.current || !user?.id) return;
    inFlight.current = true;
    setBusy(true);
    const actorId = user.id;
    const isCurrent = () => current.current.mounted && current.current.actorId === actorId && current.current.companyId === companyId;
    try {
      await discardUnsubmittedDeal(saved, isCurrent);
      if (!isCurrent()) return;
      attemptRef.current = null;
      setAttempt(null);
      setRecoveryError('');
      resetForm();
    } catch {
      if (isCurrent()) setRecoveryError(isRu ? 'Не удалось проверить попытку. Она сохранена для сверки.' : 'Could not reconcile this attempt. It remains saved for recovery.');
    } finally {
      inFlight.current = false;
      if (isCurrent()) setBusy(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(next) => { if (!busy) onOpenChange(next); }}
      title={isRu ? 'Новая сделка' : 'New Deal'}
      icon={<Handshake className="w-5 h-5 text-primary" />}
      size="2xl"
      mobileHeight="max-h-[92vh]"
      footer={
        <div className="flex flex-wrap gap-2">
        {attempt && canDiscardUnsubmittedDeal(attempt) && <Button variant="outline" disabled={busy} onClick={handleDiscard}>
          {isRu ? 'Удалить неотправленную попытку' : 'Discard unsubmitted attempt'}
        </Button>}
        <Button onClick={handleSubmit} disabled={busy || !user} className="w-full sm:w-auto min-w-[200px]">
          {busy ? '...' : attempt ? (isRu ? 'Повторить сохранённую попытку' : 'Retry saved attempt') : (isRu ? 'Создать сделку' : 'Create Deal')}
        </Button>
        </div>
      }
    >
      {recoveryError && <p role="alert" className="text-sm text-destructive">{recoveryError}</p>}
      {attempt && <section aria-label={isRu ? 'Данные сохранённой попытки' : 'Saved attempt details'} className="space-y-3 text-sm">
        <p role="status">{isRu ? 'Повтор будет отправлен с этими сохранёнными данными. Новые предзаполненные данные не используются.' : 'Retry uses this saved snapshot. New prefilled values are not used.'}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 break-words">
          {[
            [isRu ? 'Клиент' : 'Client', attempt.deal.client_name],
            ['ID', attempt.dealId],
            [isRu ? 'Компания' : 'Company', attempt.companyId],
            [isRu ? 'Контакт' : 'Contact', attempt.contactId],
            [isRu ? 'Телефон / email' : 'Phone / email', [attempt.deal.client_phone, attempt.deal.client_email].filter(Boolean).join(' · ')],
            [isRu ? 'Тип сделки' : 'Deal type', attempt.deal.deal_type],
            [isRu ? 'Источник' : 'Source', attempt.deal.client_source],
            [isRu ? 'Создание контакта' : 'Contact creation', attempt.contact ? `${attempt.contact.first_name ?? ''} ${attempt.contact.last_name ?? ''} · VIP: ${Boolean(attempt.contact.is_vip)}` : (isRu ? 'Существующий контакт' : 'Existing contact')],
            [isRu ? 'Валюта' : 'Currency', attempt.deal.currency],
            [isRu ? 'Бюджет' : 'Budget', `${attempt.deal.budget_min ?? '—'} – ${attempt.deal.budget_max ?? '—'}`],
            [isRu ? 'Объект / проект' : 'Property / project', attempt.deal.property_id || attempt.deal.property_project_id],
            [isRu ? 'Этап / воронка' : 'Stage / pipeline', [attempt.deal.stage, attempt.deal.pipeline_id].filter(Boolean).join(' · ')],
            [isRu ? 'Предпочтения' : 'Preferences', [attempt.deal.bedrooms_min, ...(attempt.deal.preferred_districts as string[] || []), ...(attempt.deal.preferred_types as string[] || [])].filter(v => v != null).join(' · ')],
            ['VIP', attempt.deal.is_vip ? (isRu ? 'Да' : 'Yes') : (isRu ? 'Нет' : 'No')],
            [isRu ? 'Заметки' : 'Notes', attempt.deal.notes],
            [isRu ? 'Обновление контакта' : 'Contact update', attempt.contactPatch ? Object.entries(attempt.contactPatch).map(([key, value]) => `${({ budget_min: isRu ? 'Бюджет от' : 'Budget min', budget_max: isRu ? 'Бюджет до' : 'Budget max', currency: isRu ? 'Валюта' : 'Currency', preferred_districts: isRu ? 'Районы' : 'Districts', preferred_types: isRu ? 'Типы' : 'Types', bedrooms_min: isRu ? 'Спальни от' : 'Bedrooms min', is_vip: 'VIP' } as Record<string, string>)[key] || key}: ${Array.isArray(value) ? value.join(', ') : value == null ? '—' : String(value)}`).join('; ') : '—'],
          ].map(([label, value]) => <div key={String(label)} className="contents"><dt className="text-muted-foreground">{String(label)}</dt><dd className="min-w-0 whitespace-pre-wrap">{value == null || value === '' ? '—' : String(value)}</dd></div>)}
        </dl>
        {canDiscardUnsubmittedDeal(attempt) && <p>{isRu ? 'Эта попытка не создавала контакт и не отправляла запись сделки. Можно удалить только попытку; контакты и изменения предпочтений сохранятся. Это не откат изменений.' : 'This attempt did not create a contact or submit a deal. Discard removes only this intent; existing contacts and preference changes remain. This is not a rollback.'}</p>}
      </section>}
      {!attempt && <fieldset disabled={busy} className="space-y-4 pr-1">
        {/* Duplicate warning */}
        {duplicates.length > 0 && (
          <div className="p-3 rounded-none border border-warning/50 bg-warning/10 text-sm">
            <div className="flex items-center gap-2 text-warning font-medium mb-1">
              <AlertCircle className="h-4 w-4" />
              {isRu ? 'Возможный дубликат!' : 'Possible duplicate!'}
            </div>
            {duplicates.map(d => (
              <button
                key={d.id}
                onClick={() => { onOpenChange(false); navigate(`${APP_ROUTES.MC_SALES}/${d.id}`); }}
                className="block text-xs text-primary hover:underline"
              >
                {d.client_name} — {d.client_phone || d.client_email} ({isRu ? DEAL_STAGE_LABELS_LOOKUP[d.stage]?.ru : DEAL_STAGE_LABELS_LOOKUP[d.stage]?.en})
              </button>
            ))}
          </div>
        )}

        {/* Contact search */}
        <div>
          <Label>{isRu ? 'Привязать контакт' : 'Link Contact'}</Label>
          <ContactSearchInput
            companyId={companyId}
            selectedContact={selectedContact}
            onSelect={(c) => {
              const contactIsVip = c.is_vip || (c.tags?.some(tag => tag.toLowerCase() === 'vip') || false);
              setSelectedContact(c);
              setErrors({});
              setForm(f => ({
                ...f,
                client_name: `${c.first_name} ${c.last_name}`.trim(),
                client_phone: c.phone || '',
                client_email: c.email || '',
                client_source: c.source || f.client_source,
                budget_min: c.budget_min ? String(c.budget_min) : f.budget_min,
                budget_max: c.budget_max ? String(c.budget_max) : f.budget_max,
                currency: c.currency || f.currency,
                bedrooms_min: c.bedrooms_min ? String(c.bedrooms_min) : f.bedrooms_min,
                preferred_types: c.preferred_types?.length ? c.preferred_types : f.preferred_types,
                preferred_districts: c.preferred_districts?.length ? c.preferred_districts : f.preferred_districts,
                is_vip: contactIsVip,
              }));
            }}
            onClear={() => setSelectedContact(null)}
            isRu={isRu}
          />
          {contactLocked && (
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" />
              {isRu
                ? 'Контактные данные взяты из карточки. Чтобы изменить — откройте контакт.'
                : 'Contact data is read-only. Edit the contact card to change it.'}
            </p>
          )}
        </div>

        {/* VIP — single source of truth + optional contact-VIP propagation */}
        <div className="rounded-none border border-warning/30 bg-warning/5 p-3 space-y-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="flex items-center gap-2 text-sm">
              <Crown className="h-4 w-4 text-warning" />
              {isRu ? 'VIP сделка' : 'VIP deal'}
            </span>
            <Checkbox
              checked={form.is_vip}
              onCheckedChange={(checked) => setForm(f => ({ ...f, is_vip: Boolean(checked) }))}
            />
          </label>
          {!contactLocked && (
            <label className="flex items-center justify-between cursor-pointer pl-6">
              <span className="text-xs text-muted-foreground">
                {isRu ? 'Также пометить контакт как VIP' : 'Also mark the contact as VIP'}
              </span>
              <Checkbox
                checked={form.also_mark_contact_vip}
                onCheckedChange={(checked) => setForm(f => ({ ...f, also_mark_contact_vip: Boolean(checked) }))}
              />
            </label>
          )}
        </div>

        {/* Deal Type — wraps on mobile */}
        <div>
          <Label>{isRu ? 'Тип сделки' : 'Deal Type'}</Label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {DEAL_TYPES.map(dt => (
              <button
                key={dt}
                type="button"
                onClick={() => setForm(f => ({ ...f, deal_type: dt }))}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap',
                  form.deal_type === dt
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/50',
                )}
              >
                {isRu ? DEAL_TYPE_LABELS[dt].ru : DEAL_TYPE_LABELS[dt].en}
              </button>
            ))}
          </div>
        </div>

        {/* Property / project search (handles both real estate AND offplan projects) */}
        <div>
          <Label>{isRu ? 'Привязать объект / проект' : 'Link Property / Project'}</Label>
          <PropertySearchInput
            companyId={companyId}
            selectedProperty={selectedProperty}
            onSelect={(p) => {
              setSelectedProperty(p);
              setForm(f => ({
                ...f,
                preferred_districts: p.district ? [p.district] : f.preferred_districts,
                preferred_types: p.property_type ? [p.property_type] : f.preferred_types,
                budget_min: p.price ? String(p.price) : f.budget_min,
                budget_max: p.price ? String(p.price) : f.budget_max,
                bedrooms_min: p.bedrooms ? String(p.bedrooms) : f.bedrooms_min,
              }));
            }}
            onClear={() => setSelectedProperty(null)}
            isRu={isRu}
            includeProjects
          />
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Поиск работает по готовым объектам и проектам (offplan / новостройки).' : 'Searches both built properties and projects (offplan / newbuild).'}
          </p>
        </div>

        {/* Client name (read-only when contact linked) */}
        <div>
          <Label>{isRu ? 'Имя клиента *' : 'Client Name *'}</Label>
          <Input
            value={form.client_name}
            disabled={contactLocked}
            onChange={e => { setForm(f => ({ ...f, client_name: e.target.value })); setErrors(prev => ({ ...prev, client_name: undefined })); }}
          />
          {errors.client_name && <p className="text-xs text-destructive mt-1">{errors.client_name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>{isRu ? 'Телефон' : 'Phone'}</Label>
            <Input
              value={form.client_phone}
              disabled={contactLocked}
              inputMode="tel"
              placeholder="+66 81 234 5678"
              onChange={e => { setForm(f => ({ ...f, client_phone: e.target.value })); setErrors(prev => ({ ...prev, client_phone: undefined })); }}
            />
            {errors.client_phone && <p className="text-xs text-destructive mt-1">{errors.client_phone}</p>}
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.client_email}
              disabled={contactLocked}
              onChange={e => { setForm(f => ({ ...f, client_email: e.target.value })); setErrors(prev => ({ ...prev, client_email: undefined })); }}
            />
            {errors.client_email && <p className="text-xs text-destructive mt-1">{errors.client_email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>{isRu ? 'Источник' : 'Source'}</Label>
            <Select value={form.client_source} onValueChange={v => setForm(f => ({ ...f, client_source: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CLIENT_SOURCES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{isRu ? 'Валюта' : 'Currency'}</Label>
            <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label>{isRu ? 'Бюджет от' : 'Budget Min'}</Label>
            <Input type="number" value={form.budget_min} onChange={e => setForm(f => ({ ...f, budget_min: e.target.value }))} />
          </div>
          <div>
            <Label>{isRu ? 'Бюджет до' : 'Budget Max'}</Label>
            <Input type="number" value={form.budget_max} onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))} />
          </div>
          <div>
            <Label>{isRu ? 'Спален от' : 'Beds Min'}</Label>
            <Input type="number" value={form.bedrooms_min} onChange={e => setForm(f => ({ ...f, bedrooms_min: e.target.value }))} placeholder="1" />
          </div>
        </div>
        {errors.budget && <p className="text-xs text-destructive -mt-1">{errors.budget}</p>}

        {/* Property Types */}
        <div>
          <Label className="mb-1.5 block">{isRu ? 'Типы недвижимости' : 'Property Types'}</Label>
          <div className="flex flex-wrap gap-1.5">
            {PROPERTY_TYPES.map(t => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs border transition-colors',
                  form.preferred_types.includes(t)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/50',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Districts */}
        <div>
          <Label className="mb-1.5 block">{isRu ? 'Районы' : 'Districts'}</Label>
          <div className="flex flex-wrap gap-1.5">
            {PHUKET_DISTRICTS.map(d => (
              <button
                key={d}
                onClick={() => toggleDistrict(d)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs border transition-colors',
                  form.preferred_districts.includes(d)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/50',
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>{isRu ? 'Заметки' : 'Notes'}</Label>
          <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
        </div>

        {/* Sync-back toggle (only when editing on top of an existing contact) */}
        {contactLocked && (
          <label className="flex items-center justify-between rounded-none border border-info/30 bg-info/5 p-3 cursor-pointer">
            <span className="text-xs text-muted-foreground pr-3">
              {isRu
                ? 'Обновить бюджет / районы / типы и в карточке контакта'
                : 'Also update budget / districts / types on the contact card'}
            </span>
            <Checkbox
              checked={syncBackToContact}
              onCheckedChange={(checked) => setSyncBackToContact(Boolean(checked))}
            />
          </label>
        )}
      </fieldset>}
    </ResponsiveModal>
  );
}

const DEAL_STAGE_LABELS_LOOKUP: Record<string, { en: string; ru: string }> = {
  new: { en: 'New', ru: 'Новый' },
  contacted: { en: 'Contacted', ru: 'Контакт' },
  showing: { en: 'Showing', ru: 'Показ' },
  negotiation: { en: 'Negotiation', ru: 'Торг' },
  contract: { en: 'Contract', ru: 'Договор' },
  closed_won: { en: 'Won', ru: 'Успех' },
  closed_lost: { en: 'Lost', ru: 'Проигрыш' },
};

/** Actor/company transitions remount private form state; old async work cannot advance. */
export function CreateDealSheet(props: Props) {
  const { user } = useAuth();
  const prefilledContact = props.prefilledContact?.company_id === props.companyId ? props.prefilledContact : null;
  return <CreateDealSheetContent key={`${user?.id || 'signed-out'}:${props.companyId}`} {...props} prefilledContact={prefilledContact} />;
}
