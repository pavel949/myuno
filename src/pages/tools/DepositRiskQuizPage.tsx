/**
 * DepositRiskQuizPage — Trust Stack §3 A-3 magnet tool (`/tools/deposit-risk`)
 *
 * Free 5-question quiz → instant verdict + CTA to Deposit Vault.
 * No auth required. No backend. Pure SEO magnet.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { BackButton } from "@/components/uno/BackButton";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, AlertOctagon, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { APP_ROUTES } from "@/lib/config/routes";

type Choice = "yes" | "no";

interface Question {
  id: keyof Answers;
  ru: string;
  en: string;
  /** weight added when answer = "no" (i.e. risk goes up) */
  weight: number;
}

interface Answers {
  hasContract: Choice | null;
  contractInRu: Choice | null;
  hasCheckinPhotos: Choice | null;
  landlordIsCompany: Choice | null;
  depositInWriting: Choice | null;
}

const QUESTIONS: Question[] = [
  { id: "hasContract", ru: "У вас есть письменный договор аренды?", en: "Do you have a written rental contract?", weight: 30 },
  { id: "contractInRu", ru: "Договор переведён на понятный вам язык?", en: "Is the contract translated into a language you understand?", weight: 15 },
  { id: "hasCheckinPhotos", ru: "Вы сделали фото состояния квартиры при въезде?", en: "Did you take photos of the apartment at check-in?", weight: 25 },
  { id: "landlordIsCompany", ru: "Арендодатель — компания / юрлицо?", en: "Is the landlord a company / legal entity?", weight: 10 },
  { id: "depositInWriting", ru: "Сумма депозита и условия возврата прописаны?", en: "Is the deposit amount and refund rule written down?", weight: 20 },
];

export default function DepositRiskQuizPage() {
  const { language } = useLanguage();
  const t = language === "ru";
  const [answers, setAnswers] = useState<Answers>({
    hasContract: null,
    contractInRu: null,
    hasCheckinPhotos: null,
    landlordIsCompany: null,
    depositInWriting: null,
  });

  const allAnswered = Object.values(answers).every((v) => v !== null);
  const riskScore = QUESTIONS.reduce((sum, q) => sum + (answers[q.id] === "no" ? q.weight : 0), 0);

  const verdict = !allAnswered
    ? null
    : riskScore >= 50
    ? "high"
    : riskScore >= 25
    ? "medium"
    : "low";

  return (
    <AppLayout>
      <SEOHead
        title={t ? "Тест: вернут ли вам депозит в Таиланде?" : "Quiz: will you get your Thailand rental deposit back?"}
        description={
          t
            ? "5 вопросов — мгновенный вердикт. Бесплатный чекер риска удержания депозита от myUNO."
            : "5 questions — instant verdict. Free deposit-withholding risk check by myUNO."
        }
        canonical="/tools/deposit-risk"
      />
      <div className="pb-24">
        <div className="relative bg-gradient-to-br from-primary to-primary/90 p-6 pt-16 pb-8">
          <BackButton fallbackPath={APP_ROUTES.HOME} variant="overlay" className="absolute top-4 left-4" />
          <div className="text-primary-foreground text-center">
            <div className="w-14 h-14 bg-primary-foreground/15 rounded-none flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold mb-1">
              {t ? "Риск удержания депозита" : "Deposit withholding risk"}
            </h1>
            <p className="text-primary-foreground/80 text-sm">
              {t ? "5 вопросов · 1 минута · бесплатно" : "5 questions · 1 minute · free"}
            </p>
          </div>
        </div>

        <div className="px-4 -mt-4 space-y-4">
          {QUESTIONS.map((q, idx) => (
            <Card key={q.id}>
              <CardContent className="p-4">
                <p className="text-sm mb-3">
                  <span className="text-muted-foreground text-xs mr-1">{idx + 1}.</span>
                  {t ? q.ru : q.en}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["yes", "no"] as Choice[]).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: choice })}
                      className={`h-9 text-xs border rounded-none transition-colors ${
                        answers[q.id] === choice
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {choice === "yes" ? (t ? "Да" : "Yes") : (t ? "Нет" : "No")}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {verdict && (
            <Card
              className={
                verdict === "high"
                  ? "border-destructive/40"
                  : verdict === "medium"
                  ? "border-accent/40"
                  : "border-emerald-500/40"
              }
            >
              <CardContent className="p-4 text-center space-y-3">
                {verdict === "high" ? (
                  <AlertOctagon className="w-10 h-10 mx-auto text-destructive" />
                ) : verdict === "medium" ? (
                  <AlertTriangle className="w-10 h-10 mx-auto text-accent" />
                ) : (
                  <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500" />
                )}
                <p className="text-3xl font-bold tabular-nums">
                  {riskScore}<span className="text-base text-muted-foreground">/100</span>
                </p>
                <p className="text-sm font-semibold">
                  {verdict === "high"
                    ? (t ? "Высокий риск" : "High risk")
                    : verdict === "medium"
                    ? (t ? "Средний риск" : "Medium risk")
                    : (t ? "Низкий риск" : "Low risk")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {verdict === "high"
                    ? t
                      ? "Соберите доказательства уже сегодня. Без них шансов вернуть депозит почти нет."
                      : "Collect evidence today. Without it, getting the deposit back is unlikely."
                    : verdict === "medium"
                    ? t
                      ? "Есть пробелы. Закройте их в Deposit Vault — это бесплатно."
                      : "There are gaps. Close them in Deposit Vault — it's free."
                    : t
                    ? "Вы хорошо защищены. На всякий случай сохраните доказательства в Deposit Vault."
                    : "You're well protected. Still, save your evidence in Deposit Vault."}
                </p>
                <Link to="/legal/deposit-vault" className="block">
                  <Button className="w-full gap-2">
                    {t ? "Открыть Deposit Vault — бесплатно" : "Open Deposit Vault — free"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <p className="text-[11px] text-muted-foreground px-2 text-center">
            {t
              ? "Результат — оценка, не юридическая консультация. Для сложных случаев привлекайте партнёрскую юрфирму."
              : "The result is an estimate, not legal advice. For complex cases, use a partner law firm."}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
