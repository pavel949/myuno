import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCapitalProjects, useCapitalTemplates, useCapitalCampaigns } from '@/hooks/capital';
import { useCapitalContactMatching } from '@/hooks/capital/useCapitalContactMatching';
import { useCapitalOutreach } from '@/hooks/capital/useCapitalOutreach';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Rocket, Users, FileText } from 'lucide-react';
import { WARMTH_LABELS, WARMTH_COLORS, BUYER_TYPE_LABELS, type Warmth, type BuyerType, type CapitalProject } from '@/types/capital';

type Step = 1 | 2 | 3 | 4;

export default function CapitalCampaignLaunch() {
  const navigate = useNavigate();
  const { projects } = useCapitalProjects(true);
  const { templates } = useCapitalTemplates();
  const { createCampaign } = useCapitalCampaigns();
  const { createBulkOutreach } = useCapitalOutreach();

  const [step, setStep] = useState<Step>(1);
  const [campaignName, setCampaignName] = useState('');
  const [selectedProject, setSelectedProject] = useState<CapitalProject | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [launching, setLaunching] = useState(false);

  const { data: matchedContacts, isLoading: matchLoading } = useCapitalContactMatching(selectedProject);

  const filteredTemplates = useMemo(() =>
    templates.filter((t) => t.channel === 'whatsapp' || t.channel === 'telegram'),
    [templates]
  );

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!matchedContacts) return;
    if (selectedContacts.size === matchedContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(matchedContacts.map((c) => c.id)));
    }
  };

  const messageText = selectedTemplate
    ? templates.find((t) => t.id === selectedTemplate)?.body || ''
    : customMessage;

  const handleLaunch = async () => {
    if (!selectedProject || selectedContacts.size === 0 || !messageText) {
      toast.error('Заполните все шаги');
      return;
    }
    setLaunching(true);
    try {
      const campaign = await createCampaign.mutateAsync({
        name: campaignName || `${selectedProject.name} — ${new Date().toLocaleDateString('ru-RU')}`,
        project_id: selectedProject.id,
        target_criteria: {
          buyer_types: selectedProject.target_buyer_types,
          price_from: selectedProject.price_from,
          price_to: selectedProject.price_to,
        },
        status: 'active',
        started_at: new Date().toISOString(),
        ended_at: null,
      });

      const outreachRecords = Array.from(selectedContacts).map((contact_id) => {
        const contact = matchedContacts?.find((c) => c.id === contact_id);
        return {
          campaign_id: campaign.id,
          contact_id,
          project_id: selectedProject.id,
          channel: contact?.preferred_channel || ('whatsapp' as const),
          message_text: messageText,
          sent_at: null,
          delivered: false,
          read: false,
          replied: false,
          response_type: null,
          follow_up_date: null,
          follow_up_done: false,
          notes: null,
        };
      });

      await createBulkOutreach.mutateAsync(outreachRecords);
      toast.success(`Кампания запущена! ${outreachRecords.length} касаний создано`);
      navigate('/capital/outreach');
    } catch {
      toast.error('Ошибка запуска кампании');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/capital/campaigns')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">Запуск кампании</h1>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2 items-center">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              s === step ? 'bg-success text-white' : s < step ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
            }`}>{s}</div>
            {s < 4 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Project */}
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="font-medium flex items-center gap-2"><Rocket className="w-4 h-4" /> Выберите проект</h2>
          <Input placeholder="Название кампании (опционально)" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`rounded-none border p-3 cursor-pointer transition-colors ${
                  selectedProject?.id === p.id ? 'border-success/40 bg-success/5' : 'border-border/50 hover:border-success/40'
                }`}
              >
                <h3 className="font-medium text-sm">{p.name}</h3>
                <p className="text-xs text-muted-foreground">{p.developer} &middot; {p.location_area}</p>
                <p className="text-xs mt-1">{p.price_from?.toLocaleString()}–{p.price_to?.toLocaleString()} {p.currency}</p>
              </div>
            ))}
          </div>
          <Button
            className="bg-success hover:bg-success"
            disabled={!selectedProject}
            onClick={() => setStep(2)}
          >
            Далее <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 2: Select Contacts */}
      {step === 2 && (
        <div className="space-y-3">
          <h2 className="font-medium flex items-center gap-2">
            <Users className="w-4 h-4" /> Подходящие контакты
            {matchedContacts && <Badge variant="secondary">{matchedContacts.length}</Badge>}
          </h2>
          <p className="text-sm text-muted-foreground">
            Автоматически подобраны по типу покупателя и бюджету проекта
          </p>

          {matchLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : !matchedContacts?.length ? (
            <p className="text-muted-foreground py-4">Подходящих контактов не найдено</p>
          ) : (
            <>
              <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                <Checkbox checked={selectedContacts.size === matchedContacts.length} onCheckedChange={toggleAll} />
                <span className="text-sm font-medium">Выбрать всех ({matchedContacts.length})</span>
                <Badge variant="outline" className="ml-auto">{selectedContacts.size} выбрано</Badge>
              </div>
              <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                {matchedContacts.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-none hover:bg-muted/20">
                    <Checkbox checked={selectedContacts.has(c.id)} onCheckedChange={() => toggleContact(c.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone || c.email}</p>
                    </div>
                    <Badge className={WARMTH_COLORS[c.warmth as Warmth] + ' text-xs'}>{WARMTH_LABELS[c.warmth as Warmth]}</Badge>
                    {c.buyer_type && <Badge variant="outline" className="text-xs hidden sm:inline-flex">{BUYER_TYPE_LABELS[c.buyer_type as BuyerType]}</Badge>}
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Назад</Button>
            <Button className="bg-success hover:bg-success" disabled={selectedContacts.size === 0} onClick={() => setStep(3)}>
              Далее <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Message Template */}
      {step === 3 && (
        <div className="space-y-3">
          <h2 className="font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> Сообщение</h2>
          <div>
            <Label>Выберите шаблон</Label>
            <Select value={selectedTemplate || 'custom'} onValueChange={(v) => { setSelectedTemplate(v === 'custom' ? null : v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Написать своё</SelectItem>
                {filteredTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate ? (
            <div className="rounded-none border border-border/50 p-3 bg-muted/20">
              <p className="text-sm whitespace-pre-wrap">{templates.find((t) => t.id === selectedTemplate)?.body}</p>
            </div>
          ) : (
            <div>
              <Label>Текст сообщения</Label>
              <textarea
                className="w-full rounded-none border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Введите текст сообщения..."
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Назад</Button>
            <Button className="bg-success hover:bg-success" disabled={!messageText} onClick={() => setStep(4)}>
              Далее <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm & Launch */}
      {step === 4 && (
        <div className="space-y-3">
          <h2 className="font-medium">Подтверждение запуска</h2>
          <div className="rounded-none border border-border/50 p-4 space-y-2">
            <p className="text-sm"><span className="text-muted-foreground">Проект:</span> {selectedProject?.name}</p>
            <p className="text-sm"><span className="text-muted-foreground">Контактов:</span> {selectedContacts.size}</p>
            <p className="text-sm"><span className="text-muted-foreground">Сообщение:</span></p>
            <p className="text-sm bg-muted/20 rounded-none p-2 whitespace-pre-wrap line-clamp-4">{messageText}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(3)}>Назад</Button>
            <Button
              className="bg-success hover:bg-success"
              onClick={handleLaunch}
              disabled={launching}
            >
              <Rocket className="w-4 h-4 mr-1" />
              {launching ? 'Запуск...' : `Запустить (${selectedContacts.size} касаний)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
