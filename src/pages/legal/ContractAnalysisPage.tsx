import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { APP_ROUTES } from '@/lib/config/routes';
import { supabase } from '@/integrations/supabase/client';
import { FileSearch, Upload, Loader2, AlertTriangle, CheckCircle2, Info, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/seo';

interface AnalysisResult {
  risk_score: number;
  summary: string;
  key_terms: string[];
  red_flags: string[];
  recommendations: string[];
}

export default function ContractAnalysisPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      const text = await file.text();
      const { data, error } = await supabase.functions.invoke('ai-agent', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are a legal contract analyst specializing in Thai real estate and business law. Analyze the provided contract text and return a JSON object with: risk_score (1-10), summary (2-3 sentences), key_terms (array of important terms), red_flags (array of concerning clauses), recommendations (array of action items). Respond in ${t ? 'Russian' : 'English'}. Return ONLY valid JSON.`
            },
            { role: 'user', content: `Analyze this contract:\n\n${text.slice(0, 15000)}` }
          ],
          model: 'google/gemini-2.5-pro',
        },
      });
      if (error) throw error;

      const responseText = data?.choices?.[0]?.message?.content || data?.result || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setResult(JSON.parse(jsonMatch[0]));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error(t ? 'Ошибка анализа' : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const riskColor = (score: number) => {
    if (score <= 3) return 'text-emerald-500';
    if (score <= 6) return 'text-amber-500';
    return 'text-destructive';
  };

  return (
    <AppLayout>
      <SEOHead
        title={t ? 'AI Анализ договоров' : 'AI Contract Analysis'}
        description={t ? 'Загрузите договор для AI-анализа рисков и ключевых условий' : 'Upload a contract for AI-powered risk analysis and key terms extraction'}
      />
      <div className="pb-24">
        <div className="relative bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 pt-16 pb-8">
          <BackButton fallbackPath={APP_ROUTES.LEGAL} variant="overlay" className="absolute top-4 left-4" />
          <div className="text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileSearch className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold mb-1">{t ? 'ContractAI' : 'ContractAI'}</h1>
            <p className="text-white/80 text-sm">{t ? 'AI-анализ договоров на риски' : 'AI-powered contract risk analysis'}</p>
          </div>
        </div>

        <div className="px-4 -mt-4 space-y-4">
          {/* Upload */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); }}
                />
                {file ? (
                  <div className="text-center">
                    <FileText className="w-8 h-8 mx-auto text-primary mb-2" />
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">{t ? 'Загрузите договор' : 'Upload your contract'}</p>
                    <p className="text-xs text-muted-foreground">{t ? 'TXT, PDF, DOC' : 'TXT, PDF, DOC'}</p>
                  </div>
                )}
              </label>

              <Button
                className="w-full gap-2"
                disabled={!file || isAnalyzing}
                onClick={handleAnalyze}
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{t ? 'Анализирую...' : 'Analyzing...'}</>
                ) : (
                  <><FileSearch className="w-4 h-4" />{t ? 'Анализировать' : 'Analyze Contract'}</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
              {/* Risk Score */}
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t ? 'Оценка риска' : 'Risk Score'}</p>
                  <p className={cn('text-4xl font-bold tabular-nums', riskColor(result.risk_score))}>
                    {result.risk_score}<span className="text-lg text-muted-foreground">/10</span>
                  </p>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    {t ? 'Резюме' : 'Summary'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </CardContent>
              </Card>

              {/* Red Flags */}
              {result.red_flags.length > 0 && (
                <Card className="border-destructive/30">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      {t ? 'Красные флаги' : 'Red Flags'}
                    </h3>
                    <ul className="space-y-1.5">
                      {result.red_flags.map((flag, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-destructive mt-1">•</span>{flag}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Key Terms */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {t ? 'Ключевые условия' : 'Key Terms'}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.key_terms.map((term, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground">{term}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-2">{t ? 'Рекомендации' : 'Recommendations'}</h3>
                    <ul className="space-y-1.5">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">{i + 1}.</span>{rec}
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
