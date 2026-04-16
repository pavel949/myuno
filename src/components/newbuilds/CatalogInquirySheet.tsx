/**
 * CatalogInquirySheet — Quick inquiry form saving to nb_leads
 */
import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useCreateNewbuildLead } from '@/hooks/useNewbuildLeads';
import type { OffplanProject } from '@/hooks/useOffplanProjects';

interface Props {
  project: OffplanProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CatalogInquirySheet({ project, open, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const createLead = useCreateNewbuildLead();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    createLead.mutate(
      {
        project_id: project?.id || null,
        full_name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        source: 'catalog_card',
        message: `Inquiry for ${project?.nameEn || 'Unknown project'}`,
        status: 'new',
        score: 0,
        transferred_to_developer: false,
      },
      {
        onSuccess: () => {
          setName('');
          setPhone('');
          setEmail('');
          onOpenChange(false);
        },
      },
    );
  };

  const inputStyle: React.CSSProperties = {
    background: 'hsl(var(--nb-bg))',
    border: '1px solid hsl(var(--nb-gold) / 0.2)',
    color: 'hsl(var(--nb-text))',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl"
        style={{ background: 'hsl(var(--nb-surface))', borderColor: 'hsl(var(--nb-gold) / 0.2)' }}
      >
        <SheetHeader>
          <SheetTitle className="text-left" style={{ color: 'hsl(var(--nb-text))', fontFamily: 'var(--font-heading-nb)' }}>
            Quick Inquiry
          </SheetTitle>
          <SheetDescription className="text-left text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
            {project?.nameEn || 'Project inquiry'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Your name *"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            maxLength={100}
            className="w-full px-3 py-2.5 rounded-lg text-sm"
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="Phone / WhatsApp *"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            maxLength={20}
            className="w-full px-3 py-2.5 rounded-lg text-sm"
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={e => setEmail(e.target.value)}
            maxLength={255}
            className="w-full px-3 py-2.5 rounded-lg text-sm"
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={createLead.isPending || !name.trim() || !phone.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'hsl(var(--nb-gold))', color: 'hsl(var(--nb-bg))' }}
          >
            <Send className="w-4 h-4" />
            {createLead.isPending ? 'Sending...' : 'Send Inquiry'}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
