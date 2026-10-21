import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { APP_ROUTES } from '@/lib/config/routes';
import { supabase } from '@/integrations/supabase/client';
import {
  FileSearch,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  FileText,
  Lock,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/seo';

interface PreviewResult {
  risk_score: number;
  summary: string;
  top_red_flag: string;
}

interface FullReport {
  risk_score: number;
  contract_type?: string;
  parties?: { role: string; name: string }[];
  summary: string;
  key_terms?: { label: string; value: string }[];
  red_flags?: { severity: 'high' | 'medium' | 'low'; clause: string; issue: string; fix: string }[];
  missing_clauses?: string[];
  recommendations?: string[];
  next_steps?: string[];
}

const PRICE_THB = 4900;
const CONTRACT_TYPES = [
  { id: 'sale', ru: 'Купля-продажа', en: 'Sale & Purchase' },
  { id: 'lease', ru: 'Аренда', en: 'Lease / Rental' },
  { id: 'pms', ru: 'Управление (PMS)', en: 'Property management' },
  { id: 'partnership', ru: 'Партнёрство / SPA', en: 'Partnership / SPA' },
  { id: 'other', ru: 'Другое', en: 'Other' },
];

export default function ContractAnalysisPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const [searchParams, setSearchParams] = useSearchParams();

  const [file, setFile] = useState<File | null>(null);
  const [contractType, setContractType] = useState('other');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [fullReport, setFullReport] = useState<FullReport | null>(null);

  const loadFullReport = useCallback(async (id: string) => {
    setIsLoadingFull(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-contract', {
        body: { mode: 'full', analysisId: id, language },
      });
      if (error) throw error;
      if (data?.report) setFullReport(data.report as FullReport);
    } catch (err) {
      console.error('Full report error:', err);
      toast.error(t ? 'Не удалось загрузить полный отчёт' : 'Failed to load full report');
    } finally {
      setIsLoadingFull(false);
    }
  }, [language, t]);

  // Detect return from Stripe checkout
  useEffect(() => {
    const status = searchParams.get('status');
    const id = searchParams.get('analysisId');
    if (status === 'paid' && id) {
      setAnalysisId(id);
      toast.success(t ? 'Оплата получена. Генерирую полный отчёт…' : 'Payment received. Generating full report…');
      loadFullReport(id);
      searchParams.delete('status');
      searchParams.delete('session_id');
      setSearchParams(searchParams, { replace: true });
    } else if (status === 'cancelled') {
      toast.info(t ? 'Оплата отменена' : 'Payment cancelled');
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, t, loadFullReport]);

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setPreview(null);
    setFullReport(null);
    setAnalysisId(null);
    try {
      const text = await file.text();
      const { data, error } = await supabase.functions.invoke('analyze-contract', {
        body: {
          mode: 'preview',
          fileName: file.name,
          fileText: text,
          contractType,
          language,
        },
      });
      if (error) throw error;
      if (data?.analysisId) {
        setAnalysisId(data.analysisId);
        setPreview(data.preview as PreviewResult);
      }
    } catch (err) {
      console.error('Preview error:', err);
      const msg = err instanceof Error ? err.message : (t ? 'Ошибка анализа' : 'Analysis failed');
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUnlock = async () => {
    if (!analysisId) return;
    setIsPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-contract-checkout', {
        body: { analysisId },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(t ? 'Не удалось открыть оплату. Войдите в аккаунт.' : 'Failed to open checkout. Please sign in.');
      setIsPaying(false);
    }
  };

  const riskColor = (score: number) => {
    if (score <= 3) return 'text-success';
    if (score <= 6) return 'text-accent';
    return 'text-destructive';
  };

  const severityClass = (sev: string) => {
    if (sev === 'high') return 'text-destructive border-destructive/30';
    if (sev === 'medium') return 'text-accent border-accent/30';
    return 'text-muted-foreground border-border';
  };

  return (
    <AppLayout>
      <SEOHead
        title={t ? 'ContractAI — проверка договора за ฿4,900' : 'ContractAI — contract review for ฿4,900'}
        description={t
          ? 'AI-анализ sale/lease/PMS-договоров. Бесплатное превью риска, полный отчёт за ฿4,900 — 24 часа.'
          : 'AI risk review for Thai sale, lease and PMS contracts. Free risk preview, full report for ฿4,900 within 24h.'}
      />
      <div className="pb-24">
        <div className="relative bg-primary p-6 pt-16 pb-8">
          <BackButton fallbackPath={APP_ROUTES.LEGAL} variant="overlay" className="absolute top-4 left-4" />
          <div className="text-primary-foreground text-center">
            <div className="w-14 h-14 bg-primary-foreground/10 flex items-center justify-center mx-auto mb-3">
              <FileSearch className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold mb-1">ContractAI</h1>
            <p className="text-primary-foreground/80 text-sm">
              {t ? 'AI-проверка договора · ฿4,900 за полный отчёт' : 'AI contract review · ฿4,900 full report'}
            </p>
          </div>
        </div>

        <div className="px-4 -mt-4 space-y-4">
          {/* Upload */}
          {!preview && !fullReport && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {t ? 'Тип договора' : 'Contract type'}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CONTRACT_TYPES.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setContractType(c.id)}
                        className={cn(
                          'text-xs px-2 py-2 border transition-colors',
                          contractType === c.id
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-foreground',
                        )}
                      >
                        {t ? c.ru : c.en}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept=".txt,.md,.html"
                    className="hidden"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <div className="text-center">
                      <FileText className="w-8 h-8 mx-auto text-primary mb-2" />
                      <p className="text-sm font-medium truncate max-w-[240px]">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {t ? 'Загрузите договор (TXT/HTML)' : 'Upload contract (TXT/HTML)'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t ? 'PDF/DOC — конвертируйте в текст' : 'PDF/DOC — convert to text first'}
                      </p>
                    </div>
                  )}
                </label>

                <Button className="w-full gap-2" disabled={!file || isAnalyzing} onClick={handleAnalyze}>
                  {isAnalyzing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />{t ? 'Анализирую…' : 'Analyzing…'}</>
                  ) : (
                    <><FileSearch className="w-4 h-4" />{t ? 'Бесплатное превью' : 'Free preview'}</>
                  )}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  {t
                    ? 'Превью бесплатно. Полный отчёт — ฿4,900 (оплата картой).'
                    : 'Preview is free. Full report — ฿4,900 (card payment).'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Preview + Paywall */}
          {preview && !fullReport && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t ? 'Оценка риска' : 'Risk score'}</p>
                  <p className={cn('text-4xl font-bold tabular-nums', riskColor(preview.risk_score))}>
                    {preview.risk_score}<span className="text-lg text-muted-foreground">/10</span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    {t ? 'Резюме' : 'Summary'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{preview.summary}</p>
                </CardContent>
              </Card>

              {preview.top_red_flag && (
                <Card className="border-destructive/30">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      {t ? 'Главный риск' : 'Top red flag'}
                    </h3>
                    <p className="text-sm text-muted-foreground">{preview.top_red_flag}</p>
                  </CardContent>
                </Card>
              )}

              {/* Paywall */}
              <Card className="border-primary/40">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">
                        {t ? 'Полный отчёт за ฿4,900' : `Full report for ฿${PRICE_THB.toLocaleString()}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t
                          ? 'Все красные флаги, отсутствующие пункты, рекомендации и шаги (1-я редакция за 24 ч).'
                          : 'All red flags, missing clauses, recommendations and action items (first draft in 24h).'}
                      </p>
                    </div>
                  </div>
                  <Button className="w-full gap-2" disabled={isPaying} onClick={handleUnlock}>
                    {isPaying ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />{t ? 'Открываю оплату…' : 'Opening checkout…'}</>
                    ) : (
                      <><Shield className="w-4 h-4" />{t ? `Открыть отчёт · ฿${PRICE_THB.toLocaleString()}` : `Unlock report · ฿${PRICE_THB.toLocaleString()}`}</>
                    )}
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    {t ? 'Платёж через Stripe. Возврат в течение 7 дней, если AI не справился.' : 'Stripe payment. Refund within 7 days if AI fails.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Loading full report */}
          {isLoadingFull && (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t ? 'Готовлю полный отчёт (15–30 с)…' : 'Generating full report (15-30s)…'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Full Report */}
          {fullReport && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t ? 'Оценка риска' : 'Risk score'}</p>
                  <p className={cn('text-4xl font-bold tabular-nums', riskColor(fullReport.risk_score))}>
                    {fullReport.risk_score}<span className="text-lg text-muted-foreground">/10</span>
                  </p>
                  {fullReport.contract_type && (
                    <p className="text-xs text-muted-foreground mt-2">{fullReport.contract_type}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    {t ? 'Резюме' : 'Summary'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{fullReport.summary}</p>
                </CardContent>
              </Card>

              {fullReport.parties && fullReport.parties.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-2">{t ? 'Стороны' : 'Parties'}</h3>
                    <ul className="space-y-1">
                      {fullReport.parties.map((p, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          <span className="text-foreground font-medium">{p.role}:</span> {p.name}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {fullReport.red_flags && fullReport.red_flags.length > 0 && (
                <Card className="border-destructive/30">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      {t ? 'Красные флаги' : 'Red flags'} ({fullReport.red_flags.length})
                    </h3>
                    <ul className="space-y-3">
                      {fullReport.red_flags.map((f, i) => (
                        <li key={i} className={cn('text-sm border-l-2 pl-3', severityClass(f.severity))}>
                          <p className="font-medium text-foreground">{f.clause}</p>
                          <p className="text-muted-foreground mt-1">{f.issue}</p>
                          <p className="text-xs text-foreground mt-1.5">
                            <span className="font-semibold">{t ? 'Исправить:' : 'Fix:'}</span> {f.fix}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {fullReport.missing_clauses && fullReport.missing_clauses.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-2">
                      {t ? 'Отсутствующие пункты' : 'Missing clauses'}
                    </h3>
                    <ul className="space-y-1.5">
                      {fullReport.missing_clauses.map((c, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>{c}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {fullReport.key_terms && fullReport.key_terms.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      {t ? 'Ключевые условия' : 'Key terms'}
                    </h3>
                    <dl className="space-y-2">
                      {fullReport.key_terms.map((k, i) => (
                        <div key={i} className="text-sm">
                          <dt className="text-xs text-muted-foreground">{k.label}</dt>
                          <dd className="text-foreground">{k.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              )}

              {fullReport.recommendations && fullReport.recommendations.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-2">{t ? 'Рекомендации' : 'Recommendations'}</h3>
                    <ul className="space-y-1.5">
                      {fullReport.recommendations.map((r, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">{i + 1}.</span>{r}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {fullReport.next_steps && fullReport.next_steps.length > 0 && (
                <Card className="border-primary/30">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-2">{t ? 'Следующие шаги' : 'Next steps'}</h3>
                    <ul className="space-y-1.5">
                      {fullReport.next_steps.map((s, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">→</span>{s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
