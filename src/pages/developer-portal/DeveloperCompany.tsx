/**
 * Developer Portal — Company Profile editor
 */
import React, { useEffect, useState } from 'react';
import { useDeveloperProfile, useUpdateDeveloperProfile } from '@/hooks/useDeveloperPortal';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Building2 } from 'lucide-react';

interface FormState {
  name_en: string;
  name_ru: string;
  logo_url: string;
  website: string;
  phone: string;
  email: string;
  founded_year: string;
  description_en: string;
  description_ru: string;
}

const EMPTY: FormState = {
  name_en: '',
  name_ru: '',
  logo_url: '',
  website: '',
  phone: '',
  email: '',
  founded_year: '',
  description_en: '',
  description_ru: '',
};

export default function DeveloperCompany() {
  const { data: developer, isLoading } = useDeveloperProfile();
  const update = useUpdateDeveloperProfile();

  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (!developer) return;
    setForm({
      name_en: developer.name_en ?? '',
      name_ru: developer.name_ru ?? '',
      logo_url: developer.logo_url ?? '',
      website: developer.website ?? '',
      phone: developer.phone ?? '',
      email: developer.email ?? '',
      founded_year: developer.founded_year != null ? String(developer.founded_year) : '',
      description_en: developer.description_en ?? '',
      description_ru: developer.description_ru ?? '',
    });
  }, [developer]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  function handleSave() {
    if (!developer) return;
    update.mutate({
      id: developer.id,
      name_en: form.name_en,
      name_ru: form.name_ru,
      logo_url: form.logo_url || null,
      website: form.website || null,
      phone: form.phone || null,
      email: form.email || null,
      founded_year: form.founded_year ? Number(form.founded_year) : null,
      description_en: form.description_en || null,
      description_ru: form.description_ru || null,
    });
  }

  if (isLoading || !developer) return null;

  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-[hsl(var(--nb-gold))]" />
          <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))]">Профиль компании</h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={update.isPending}
          className="nb-btn-gold gap-2 shrink-0"
        >
          <Save className="w-4 h-4" />
          {update.isPending ? 'Сохраняю...' : 'Сохранить'}
        </Button>
      </div>

      <div className="nb-glass p-8 space-y-6">
        {/* Logo */}
        <div>
          <Label className="nb-label mb-2 block">Логотип</Label>
          <ImageUpload
            value={form.logo_url}
            onChange={url => setForm(f => ({ ...f, logo_url: url }))}
            folder="developer-uploads/logos"
          />
        </div>

        {/* Names */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="nb-label mb-1 block">Название (EN) *</Label>
            <Input
              value={form.name_en}
              onChange={set('name_en')}
              placeholder="Acme Development"
              className="nb-input"
            />
          </div>
          <div>
            <Label className="nb-label mb-1 block">Название (RU)</Label>
            <Input
              value={form.name_ru}
              onChange={set('name_ru')}
              placeholder="Акме Девелопмент"
              className="nb-input"
            />
          </div>
        </div>

        {/* Contacts */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="nb-label mb-1 block">Website</Label>
            <Input
              value={form.website}
              onChange={set('website')}
              placeholder="https://example.com"
              className="nb-input"
            />
          </div>
          <div>
            <Label className="nb-label mb-1 block">Год основания</Label>
            <Input
              type="number"
              value={form.founded_year}
              onChange={set('founded_year')}
              placeholder="2010"
              className="nb-input"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="nb-label mb-1 block">Телефон</Label>
            <Input
              value={form.phone}
              onChange={set('phone')}
              placeholder="+66 76 000 0000"
              className="nb-input"
            />
          </div>
          <div>
            <Label className="nb-label mb-1 block">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="hello@company.com"
              className="nb-input"
            />
          </div>
        </div>

        {/* Descriptions */}
        <div>
          <Label className="nb-label mb-1 block">Описание (EN)</Label>
          <Textarea
            value={form.description_en}
            onChange={set('description_en')}
            rows={6}
            placeholder="About the company in English..."
            className="nb-input resize-none"
          />
        </div>
        <div>
          <Label className="nb-label mb-1 block">Описание (RU)</Label>
          <Textarea
            value={form.description_ru}
            onChange={set('description_ru')}
            rows={6}
            placeholder="О компании на русском..."
            className="nb-input resize-none"
          />
        </div>
      </div>
    </div>
  );
}
