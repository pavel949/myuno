/**
 * FET / Foreign-Quota Wizard — landing + free check
 *
 * Trust Stack v1.0 §3 A-5 closes the 404 on `/services/finance/fet`
 * referenced from clusterLandings + persona landings. P0 ships the
 * free magnet step; the paid ฿1,500 full report ships in a follow-up.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { APP_ROUTES } from "@/lib/config/routes";

type Verdict = "ok" | "warn" | "block";

interface CheckResult {
  verdict: Verdict;
  reason: { ru: string; en: string };
}

function evaluate(amountUsd: number, sourceCountry: string, hasFet: boolean): CheckResult {
  const country = sourceCountry.trim().toLowerCase();
  if (!amountUsd || amountUsd <= 0) {
    return {
      verdict: "warn",
      reason: {
        ru: "Укажите сумму перевода в USD.",
        en: "Please enter the transfer amount in USD.",
      },
    };
  }
  if (amountUsd >= 50000 && !hasFet) {
    return {
      verdict: "block",
      reason: {
        ru: "Сумма ≥ USD 50 000 — для иностранной квоты ОБЯЗАТЕЛЕН FET (Foreign Exchange Transaction). Без FET Land Office не оформит chanote на иностранца.",
        en: "Amount ≥ USD 50,000 — FET (Foreign Exchange Transaction) is MANDATORY for foreign quota registration. Without FET the Land Office won't issue a chanote in a foreigner's name.",
      },
    };
  }
  if (country === "russia" || country === "россия" || country === "ru") {
    return {
      verdict: "warn",
      reason: {
        ru: "Перевод из России: банк-получатель в Таиланде потребует расширенный compliance (sanctions screening). Заранее согласуйте маршрут.",
        en: "Transfer from Russia: the receiving Thai bank will require enhanced compliance (sanctions screening). Coordinate the route in advance.",
      },
    };
  }
  return {
    verdict: "ok",
    reason: {
      ru: "На уровне базовых параметров критических блокеров нет. Полный отчёт покажет ставки, документы и риски по конкретному банку.",
      en: "No critical blockers at the basic level. The full report will surface bank-specific fees, documents and risks.",
    },
  };
}

export default function FETPage() {
  const { language } = useLanguage();
  const isRu = language === "ru";
  const [amount, setAmount] = useState("");
  const [country, setCountry] = useState("");
  const [hasFet, setHasFet] = useState<"yes" | "no" | "">("");
  const [result, setResult] = useState<CheckResult | null>(null);

  const onCheck = () => {
    const amt = parseFloat(amount.replace(/[^0-9.]/g, "")) || 0;
    setResult(evaluate(amt, country, hasFet === "yes"));
  };

  const verdictIcon: Record<Verdict, JSX.Element> = {
    ok: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    warn: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    block: <AlertTriangle className="h-5 w-5 text-red-500" />,
  };

  return (
    <>
      <SEOHead
        title={
          isRu
            ? "FET и иностранная квота для покупки кондо в Таиланде — бесплатная проверка | myUNO"
            : "FET & foreign quota for buying a condo in Thailand — free check | myUNO"
        }
        description={
          isRu
            ? "Проверьте, нужен ли вам Foreign Exchange Transaction (FET) и попадаете ли вы в иностранную квоту кондоминиума. Бесплатная экспресс-проверка за 30 секунд."
            : "Check whether you need a Foreign Exchange Transaction (FET) and whether your condo purchase fits the foreign quota. Free 30-second express check."
        }
        keywords={["FET Thailand", "foreign quota condo", "FET форма ошибка", "иностранная квота кондоминиум"]}
      />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8 flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {isRu
                ? "FET и иностранная квота — бесплатная проверка"
                : "FET & foreign quota — free check"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isRu
                ? "30-секундный экспресс-чекер: определит, нужен ли FET и какие блокеры ждут в банке и Land Office."
                : "30-second express checker: tells you whether FET is required and which blockers wait at the bank and Land Office."}
            </p>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isRu ? "Параметры сделки" : "Deal parameters"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                {isRu ? "Сумма перевода (USD)" : "Transfer amount (USD)"}
              </Label>
              <Input
                id="amount"
                inputMode="numeric"
                placeholder="120000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">
                {isRu ? "Страна-источник средств" : "Source country of funds"}
              </Label>
              <Input
                id="country"
                placeholder={isRu ? "например: UAE, Russia, Cyprus" : "e.g. UAE, Russia, Cyprus"}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {isRu ? "У вас есть FET от тайского банка?" : "Do you have an FET from a Thai bank?"}
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={hasFet === "yes" ? "default" : "outline"}
                  onClick={() => setHasFet("yes")}
                >
                  {isRu ? "Да" : "Yes"}
                </Button>
                <Button
                  type="button"
                  variant={hasFet === "no" ? "default" : "outline"}
                  onClick={() => setHasFet("no")}
                >
                  {isRu ? "Нет / не знаю" : "No / not sure"}
                </Button>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={onCheck}>
              {isRu ? "Проверить" : "Run check"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="mt-6 border-2">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              {verdictIcon[result.verdict]}
              <CardTitle className="text-base">
                {result.verdict === "block"
                  ? isRu ? "Блокер — без FET сделка не пройдёт" : "Blocker — deal cannot proceed without FET"
                  : result.verdict === "warn"
                  ? isRu ? "Внимание — есть риски" : "Caution — risks identified"
                  : isRu ? "Базово всё в порядке" : "Looks OK at the basic level"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{isRu ? result.reason.ru : result.reason.en}</p>
              <div className="rounded-lg border bg-muted/40 p-4 text-foreground">
                <p className="text-sm font-medium">
                  {isRu
                    ? "Полный отчёт ฿1,500 — bank-by-bank, расчёт комиссий, шаблоны заявлений (готовится)"
                    : "Full report ฿1,500 — bank-by-bank, fee breakdown, application templates (coming soon)"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={APP_ROUTES.CONTRACT_ANALYSIS}>
                      {isRu ? "Проверить договор за ฿4,900" : "Check contract for ฿4,900"}
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={APP_ROUTES.LEGAL_CLUSTER}>
                      {isRu ? "К другим юр-сервисам" : "More legal services"}
                    </Link>
                  </Button>
                </div>
              </div>
              <p className="text-xs">
                {isRu
                  ? "Информационный сервис, не юридическая консультация. Для полного DD обратитесь к лицензированному юристу."
                  : "Informational service, not legal advice. For full DD consult a licensed lawyer."}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
