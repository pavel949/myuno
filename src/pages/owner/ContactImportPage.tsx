import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, Contact, UserPlus, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';
import Papa from 'papaparse';

interface ParsedContact {
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  telegram?: string;
  source?: string;
  notes?: string;
  valid: boolean;
  error?: string;
}

export default function ContactImportPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;

  const [parsed, setParsed] = useState<ParsedContact[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawText, setRawText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Manual entry state
  const [manual, setManual] = useState({ first_name: '', last_name: '', phone: '', email: '', whatsapp: '', telegram: '', source: 'manual', notes: '' });

  const FIELDS = [
    { key: 'first_name', label: isRu ? 'Имя' : 'First Name', required: true },
    { key: 'last_name', label: isRu ? 'Фамилия' : 'Last Name', required: true },
    { key: 'phone', label: isRu ? 'Телефон' : 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'telegram', label: 'Telegram' },
    { key: 'notes', label: isRu ? 'Заметки' : 'Notes' },
  ];

  // CSV / Excel parsing
  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const headers = res.meta.fields || [];
        setCsvHeaders(headers);
        // Auto-map columns
        const autoMap: Record<string, string> = {};
        for (const f of FIELDS) {
          const match = headers.find((h) =>
            h.toLowerCase().replace(/[_\s]/g, '').includes(f.key.replace('_', ''))
          );
          if (match) autoMap[f.key] = match;
        }
        setColumnMapping(autoMap);
        // Parse with auto-mapping
        applyMapping(res.data as Record<string, string>[], autoMap);
      },
    });
  };

  const applyMapping = (rows: Record<string, string>[], mapping: Record<string, string>) => {
    const contacts: ParsedContact[] = rows.map((row) => {
      const c: ParsedContact = {
        first_name: (row[mapping.first_name || ''] || '').trim(),
        last_name: (row[mapping.last_name || ''] || '').trim(),
        phone: (row[mapping.phone || ''] || '').trim(),
        email: (row[mapping.email || ''] || '').trim(),
        whatsapp: (row[mapping.whatsapp || ''] || '').trim(),
        telegram: (row[mapping.telegram || ''] || '').trim(),
        notes: (row[mapping.notes || ''] || '').trim(),
        source: 'csv_import',
        valid: true,
      };
      if (!c.first_name) { c.valid = false; c.error = isRu ? 'Нет имени' : 'Missing name'; }
      return c;
    });
    setParsed(contacts);
  };

  // vCard parsing
  const handleVCard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const cards = text.split('BEGIN:VCARD').filter(Boolean);
      const contacts: ParsedContact[] = cards.map((card) => {
        const getField = (name: string) => {
          const match = card.match(new RegExp(`${name}[^:]*:(.+)`, 'i'));
          return match ? match[1].trim() : '';
        };
        const fn = getField('FN');
        const nameParts = getField('N').split(';');
        const tel = getField('TEL');
        const email = getField('EMAIL');
        return {
          first_name: nameParts[1] || fn.split(' ')[0] || fn,
          last_name: nameParts[0] || fn.split(' ').slice(1).join(' ') || '',
          phone: tel,
          email,
          source: 'vcard_import',
          valid: !!(nameParts[1] || fn),
          error: !(nameParts[1] || fn) ? (isRu ? 'Нет имени' : 'Missing name') : undefined,
        };
      });
      setParsed(contacts.filter((c) => c.first_name || c.last_name));
    };
    reader.readAsText(file);
  };

  // WhatsApp/Telegram text parsing
  const parseMessengerText = () => {
    const lines = rawText.split('\n').filter(Boolean);
    const contacts: ParsedContact[] = [];
    for (const line of lines) {
      // Try patterns: "Name - Phone" or "Name, Phone" or just phone
      const parts = line.split(/[-,\t]/).map((s) => s.trim());
      if (parts.length >= 2) {
        const namePart = parts[0];
        const phonePart = parts.slice(1).join(' ').trim();
        const nameWords = namePart.split(' ');
        contacts.push({
          first_name: nameWords[0] || '',
          last_name: nameWords.slice(1).join(' ') || '',
          phone: phonePart.replace(/[^\d+]/g, '') || undefined,
          whatsapp: phonePart.replace(/[^\d+]/g, '') || undefined,
          source: 'messenger_import',
          valid: !!nameWords[0],
          error: !nameWords[0] ? (isRu ? 'Нет имени' : 'Missing name') : undefined,
        });
      } else {
        const phone = line.replace(/[^\d+]/g, '');
        if (phone.length >= 7) {
          contacts.push({
            first_name: phone,
            last_name: '',
            phone,
            whatsapp: phone,
            source: 'messenger_import',
            valid: true,
          });
        }
      }
    }
    setParsed(contacts);
  };

  // Import to DB
  const handleImport = async () => {
    if (!companyId || !user) {
      toast.error(isRu ? 'Компания не найдена' : 'Company not found');
      return;
    }
    const valid = parsed.filter((c) => c.valid);
    if (!valid.length) return;

    setImporting(true);
    let success = 0;
    let failed = 0;

    // Batch insert in chunks of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < valid.length; i += BATCH_SIZE) {
      const batch = valid.slice(i, i + BATCH_SIZE).map(c => ({
        company_id: companyId,
        first_name: c.first_name.slice(0, 100),
        last_name: c.last_name.slice(0, 100) || '-',
        phone: c.phone?.slice(0, 20) || null,
        email: c.email?.slice(0, 255) || null,
        whatsapp: c.whatsapp?.slice(0, 20) || null,
        telegram: c.telegram?.slice(0, 50) || null,
        source: c.source || 'import',
        notes: c.notes?.slice(0, 500) || null,
        created_by: user.id,
      }));
      const { data, error } = await supabase.from('crm_contacts').insert(batch as any).select('id');
      if (error) {
        failed += batch.length;
      } else {
        success += data?.length || 0;
        failed += batch.length - (data?.length || 0);
      }
    }

    setImportResult({ success, failed });
    setImporting(false);
    toast.success(isRu ? `Импортировано: ${success}` : `Imported: ${success}`);
  };

  // Manual add
  const handleManualAdd = async () => {
    if (!companyId || !user) return;
    if (!manual.first_name.trim()) {
      toast.error(isRu ? 'Введите имя' : 'Enter name');
      return;
    }
    const { error } = await supabase.from('crm_contacts').insert({
      company_id: companyId,
      first_name: manual.first_name.trim().slice(0, 100),
      last_name: manual.last_name.trim().slice(0, 100) || '-',
      phone: manual.phone?.slice(0, 20) || null,
      email: manual.email?.slice(0, 255) || null,
      whatsapp: manual.whatsapp?.slice(0, 20) || null,
      telegram: manual.telegram?.slice(0, 50) || null,
      source: manual.source,
      notes: manual.notes?.slice(0, 500) || null,
      created_by: user.id,
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success(isRu ? 'Контакт добавлен' : 'Contact added');
      setManual({ first_name: '', last_name: '', phone: '', email: '', whatsapp: '', telegram: '', source: 'manual', notes: '' });
    }
  };

  const validCount = parsed.filter((c) => c.valid).length;
  const invalidCount = parsed.length - validCount;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">{isRu ? 'Импорт контактов' : 'Import Contacts'}</h2>
        <p className="text-sm text-muted-foreground">
          {isRu ? 'CSV, vCard, WhatsApp или ручной ввод' : 'CSV, vCard, WhatsApp or manual entry'}
        </p>
      </div>

      <Tabs defaultValue="csv">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="csv" className="gap-1 text-xs"><FileSpreadsheet className="h-3.5 w-3.5" /> CSV</TabsTrigger>
          <TabsTrigger value="vcard" className="gap-1 text-xs"><Contact className="h-3.5 w-3.5" /> vCard</TabsTrigger>
          <TabsTrigger value="messenger" className="gap-1 text-xs"><MessageCircle className="h-3.5 w-3.5" /> Chat</TabsTrigger>
          <TabsTrigger value="manual" className="gap-1 text-xs"><UserPlus className="h-3.5 w-3.5" /> {isRu ? 'Вручную' : 'Manual'}</TabsTrigger>
        </TabsList>

        {/* CSV Tab */}
        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <Label>{isRu ? 'CSV / Excel файл' : 'CSV / Excel file'}</Label>
              <Input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.tsv" onChange={handleCSV} className="mt-2" />
            </CardContent>
          </Card>

          {csvHeaders.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{isRu ? 'Маппинг колонок' : 'Column Mapping'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {FIELDS.map((f) => (
                  <div key={f.key} className="flex items-center gap-2">
                    <span className="text-sm w-24">{f.label}{f.required && ' *'}</span>
                    <Select
                      value={columnMapping[f.key] || ''}
                      onValueChange={(v) => setColumnMapping((prev) => ({ ...prev, [f.key]: v }))}
                    >
                      <SelectTrigger className="flex-1"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">—</SelectItem>
                        {csvHeaders.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* vCard Tab */}
        <TabsContent value="vcard">
          <Card>
            <CardContent className="pt-4">
              <Label>{isRu ? '.vcf файл' : '.vcf file'}</Label>
              <Input type="file" accept=".vcf" onChange={handleVCard} className="mt-2" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messenger Tab */}
        <TabsContent value="messenger" className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <Label>{isRu ? 'Вставьте текст из чата' : 'Paste chat text'}</Label>
              <Textarea
                rows={6}
                placeholder={isRu ? 'Имя - Телефон\nИмя Фамилия, +66123456789\n...' : 'Name - Phone\nFirst Last, +66123456789\n...'}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <Button onClick={parseMessengerText} variant="outline" size="sm">
                {isRu ? 'Разобрать' : 'Parse'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Tab */}
        <TabsContent value="manual">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRu ? 'Имя *' : 'First Name *'}</Label>
                  <Input value={manual.first_name} onChange={(e) => setManual((m) => ({ ...m, first_name: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>{isRu ? 'Фамилия' : 'Last Name'}</Label>
                  <Input value={manual.last_name} onChange={(e) => setManual((m) => ({ ...m, last_name: e.target.value }))} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRu ? 'Телефон' : 'Phone'}</Label>
                  <Input value={manual.phone} onChange={(e) => setManual((m) => ({ ...m, phone: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={manual.email} onChange={(e) => setManual((m) => ({ ...m, email: e.target.value }))} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>WhatsApp</Label>
                  <Input value={manual.whatsapp} onChange={(e) => setManual((m) => ({ ...m, whatsapp: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Telegram</Label>
                  <Input value={manual.telegram} onChange={(e) => setManual((m) => ({ ...m, telegram: e.target.value }))} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>{isRu ? 'Заметки' : 'Notes'}</Label>
                <Textarea value={manual.notes} onChange={(e) => setManual((m) => ({ ...m, notes: e.target.value }))} className="mt-1" rows={2} />
              </div>
              <Button onClick={handleManualAdd} className="w-full gap-2">
                <UserPlus className="h-4 w-4" />
                {isRu ? 'Добавить контакт' : 'Add Contact'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview parsed contacts */}
      {parsed.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {isRu ? 'Предпросмотр' : 'Preview'} ({parsed.length})
              </CardTitle>
              <div className="flex gap-2">
                {validCount > 0 && <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" /> {validCount}</Badge>}
                {invalidCount > 0 && <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> {invalidCount}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1">
                {parsed.slice(0, 50).map((c, i) => (
                  <div key={i} className={`flex items-center gap-2 text-sm py-1.5 px-2 rounded ${!c.valid ? 'bg-destructive/5' : ''}`}>
                    {c.valid ? <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
                    <span className="font-medium">{c.first_name} {c.last_name}</span>
                    {c.phone && <span className="text-muted-foreground">{c.phone}</span>}
                    {c.email && <span className="text-muted-foreground truncate">{c.email}</span>}
                    {c.error && <span className="text-destructive text-xs ml-auto">{c.error}</span>}
                  </div>
                ))}
                {parsed.length > 50 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    +{parsed.length - 50} {isRu ? 'ещё' : 'more'}...
                  </p>
                )}
              </div>
            </ScrollArea>
            <Button
              onClick={handleImport}
              disabled={importing || !validCount}
              className="w-full mt-4 gap-2"
            >
              <Upload className="h-4 w-4" />
              {importing
                ? (isRu ? 'Импорт...' : 'Importing...')
                : (isRu ? `Импортировать ${validCount} контактов` : `Import ${validCount} contacts`)
              }
            </Button>
            {importResult && (
              <p className="text-sm text-center mt-2 text-muted-foreground">
                ✅ {importResult.success} {isRu ? 'успешно' : 'success'}{importResult.failed > 0 && ` · ❌ ${importResult.failed} ${isRu ? 'ошибок' : 'failed'}`}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
