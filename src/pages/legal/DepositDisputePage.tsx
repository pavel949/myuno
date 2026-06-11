/**
 * DepositDisputePage — Trust Stack §3 A-3 paid step (฿1,490)
 *
 * Two modes:
 *   /legal/deposit-vault/dispute/new?vault=<vaultId>  — form + Order-First
 *     checkout (create-dispute-pack-checkout).
 *   /legal/deposit-vault/dispute/:packId             — paid pack view +
 *     AI-generated OCPB letter (generate-ocpb-letter).
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { BackButton } from "@/components/uno/BackButton";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileWarning, Loader2, FileText, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthSheet } from "@/contexts/AuthSheetContext";
import { supabase } from "@/integrations/supabase/client";
import { APP_ROUTES } from "@/lib/config/routes";

const PRICE_THB = 1490;

interface DisputePack {
  id: string;
  vault_id: string | null;
  status: string;
  language: string;
  letter_text: string | null;
  deposit_amount_thb: number | null;
  landlord_name: string | null;
  complaint_summary: string | null;
  created_at: string;
}

export default function DepositDisputePage() {
  const { packId } = useParams<{ packId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = language === "ru";
  const { user } = useAuth();
  const { openAuthSheet } = useAuthSheet();

  const isNew = !packId || packId === "new";
  const vaultId = searchParams.get("vault");
  const paidFromUrl = searchParams.get("status") === "paid";

  const [pack, setPack] = useState<DisputePack | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [form, setForm] = useState({
    landlord_name: "",
    landlord_contact: "",
    deposit_amount_thb: "",
    complaint_summary: "",
    language: t ? "ru" : "en",
  });

  useEffect(() => {
    if (isNew || !packId) return;
    void loadPack(packId);
  }, [packId, isNew]);

  async function loadPack(id: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("dispute_packs")
      .select("id, vault_id, status, language, letter_text, deposit_amount_thb, landlord_name, complaint_summary, created_at")
      .eq("id", id)
      .maybeSingle();
    setLoading(false);
    if (error || !data) {
      toast.error(t ? "Пакет не найден" : "Pack not found");
      return;
    }
    setPack(data as DisputePack);

    // Auto-generate letter if paid and no letter yet
    if (paidFromUrl && data.status !== "pending" && !data.letter_text) {
      void handleGenerate(id);
    }
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      openAuthSheet({ intent: "dispute-pack" });
      return;
    }
    if (!vaultId) {
      toast.error(t ? "Не указано хранилище" : "Vault missing");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("create-dispute-pack-checkout", {
      body: {
        vaultId,
        language: form.language,
        depositAmountThb: form.deposit_amount_thb ? Number(form.deposit_amount_thb) : undefined,
        landlordName: form.landlord_name || undefined,
        landlordContact: form.landlord_contact || undefined,
        complaintSummary: form.complaint_summary || undefined,
      },
    });
    setSubmitting(false);
    if (error || !data?.url) {
      console.error(error);
      toast.error(t ? "Не удалось открыть оплату" : "Checkout failed");
      return;
    }
    window.location.href = data.url;
  }

  async function handleGenerate(id: string) {
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("generate-ocpb-letter", {
      body: { disputePackId: id },
    });
    setGenerating(false);
    if (error || !data?.letter) {
      console.error(error);
      toast.error(t ? "AI-генерация не удалась" : "AI generation failed");
      return;
    }
    setPack((prev) => prev ? { ...prev, letter_text: data.letter, status: "generated" } : prev);
    toast.success(t ? "Письмо готово" : "Letter ready");
  }

  function downloadLetter() {
    if (!pack?.letter_text) return;
    const blob = new Blob([pack.letter_text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ocpb-letter-${pack.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppLayout>
      <SEOHead
        title={t ? "Dispute Pack — возврат депозита" : "Dispute Pack — get your deposit back"}
        description={
          t
            ? "Платный пакет ฿1,490: AI-черновик жалобы в OCPB + индекс доказательств."
            : "฿1,490 paid pack: AI-drafted OCPB complaint + evidence index."
        }
        canonical="/legal/deposit-vault/dispute"
      />
      <div className="pb-24">
        <div className="relative bg-gradient-to-br from-primary to-primary/90 p-6 pt-16 pb-8">
          <BackButton fallbackPath="/legal/deposit-vault" variant="overlay" className="absolute top-4 left-4" />
          <div className="text-primary-foreground text-center">
            <div className="w-14 h-14 bg-primary-foreground/15 rounded-none flex items-center justify-center mx-auto mb-3">
              <FileWarning className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold mb-1">{t ? "Dispute Pack" : "Dispute Pack"}</h1>
            <p className="text-primary-foreground/80 text-sm">
              {t ? `AI-черновик жалобы в OCPB · ฿${PRICE_THB.toLocaleString()}` : `AI-drafted OCPB complaint · ฿${PRICE_THB.toLocaleString()}`}
            </p>
          </div>
        </div>

        <div className="px-4 -mt-4 space-y-4">
          {isNew && (
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleCheckout} className="space-y-3">
                  <div>
                    <Label htmlFor="landlord" className="text-xs">
                      {t ? "Имя арендодателя" : "Landlord name"}
                    </Label>
                    <Input
                      id="landlord"
                      value={form.landlord_name}
                      onChange={(e) => setForm({ ...form, landlord_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact" className="text-xs">
                      {t ? "Контакт арендодателя" : "Landlord contact"}
                    </Label>
                    <Input
                      id="contact"
                      value={form.landlord_contact}
                      onChange={(e) => setForm({ ...form, landlord_contact: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount" className="text-xs">
                      {t ? "Сумма депозита, ฿" : "Deposit amount, ฿"}
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={form.deposit_amount_thb}
                      onChange={(e) => setForm({ ...form, deposit_amount_thb: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="summary" className="text-xs">
                      {t ? "Что произошло (кратко)" : "What happened (briefly)"}
                    </Label>
                    <Textarea
                      id="summary"
                      rows={4}
                      value={form.complaint_summary}
                      onChange={(e) => setForm({ ...form, complaint_summary: e.target.value })}
                      placeholder={
                        t
                          ? "Например: арендодатель удержал 30 000 ฿ за «царапины», которые были при въезде…"
                          : "e.g. landlord withheld 30,000 ฿ for 'scratches' that were already there on check-in…"
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t ? "Язык письма" : "Letter language"}</Label>
                    <div className="flex gap-2 mt-1">
                      {(["ru", "en"] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setForm({ ...form, language: lang })}
                          className={`flex-1 h-8 text-xs border rounded-none ${
                            form.language === lang
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border"
                          }`}
                        >
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" disabled={submitting || !vaultId} className="w-full gap-2">
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        {t ? `Купить пакет · ฿${PRICE_THB.toLocaleString()}` : `Buy pack · ฿${PRICE_THB.toLocaleString()}`}
                      </>
                    )}
                  </Button>
                  {!vaultId && (
                    <p className="text-xs text-destructive">
                      {t ? "Сначала создайте хранилище аренды." : "Create a rental vault first."}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {!isNew && loading && (
            <div className="text-center py-8">
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            </div>
          )}

          {!isNew && pack && (
            <>
              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {t ? "Статус" : "Status"}:{" "}
                    <span className="font-medium text-foreground uppercase">{pack.status}</span>
                  </p>
                  {pack.status === "pending" && (
                    <p className="text-xs text-muted-foreground">
                      {t ? "Ожидаем подтверждение платежа…" : "Awaiting payment confirmation…"}
                    </p>
                  )}
                  {pack.status !== "pending" && !pack.letter_text && (
                    <Button
                      onClick={() => handleGenerate(pack.id)}
                      disabled={generating}
                      className="w-full gap-2"
                    >
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {t ? "Сгенерировать письмо" : "Generate letter"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {pack.letter_text && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        {t ? "Черновик жалобы" : "Draft complaint"}
                      </h3>
                      <Button size="sm" variant="ghost" onClick={downloadLetter} className="gap-1">
                        <Download className="w-3.5 h-3.5" />
                        TXT
                      </Button>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs bg-muted p-3 rounded-none border border-border max-h-96 overflow-auto">
                      {pack.letter_text}
                    </pre>
                    <p className="text-[11px] text-muted-foreground">
                      {t
                        ? "Disclaimer: автоматически сгенерированный черновик. Перед подачей проверьте у юриста (партнёрская юрфирма myUNO)."
                        : "Disclaimer: auto-generated draft. Please have it reviewed by a lawyer (myUNO partner firm) before filing."}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Button variant="outline" className="w-full" onClick={() => navigate("/legal/deposit-vault")}>
                {t ? "← Вернуться к Vault" : "← Back to Vault"}
              </Button>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
