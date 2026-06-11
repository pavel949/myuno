/**
 * DepositVaultPage — Trust Stack §3 A-3 (free magnet)
 *
 * Lets a tenant create rental "vaults": store landlord info, deposit
 * amount, check-in / check-out dates, and upload timestamped photos
 * (with optional geolocation) as evidence. Vault data is the input
 * for the paid Dispute Pack (`/legal/deposit-vault/dispute/new`).
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { BackButton } from "@/components/uno/BackButton";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldCheck,
  Plus,
  Upload,
  MapPin,
  Camera,
  Loader2,
  FileWarning,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthSheet } from "@/contexts/AuthSheetContext";
import { supabase } from "@/integrations/supabase/client";
import { APP_ROUTES } from "@/lib/config/routes";

interface Vault {
  id: string;
  property_address: string;
  landlord_name: string | null;
  deposit_amount_thb: number | null;
  checkin_at: string | null;
  checkout_at: string | null;
  status: string;
  created_at: string;
}

interface VaultPhoto {
  id: string;
  vault_id: string;
  phase: string;
  label: string | null;
  storage_path: string;
  taken_at: string;
  lat: number | null;
  lng: number | null;
}

export default function DepositVaultPage() {
  const { language } = useLanguage();
  const t = language === "ru";
  const { user } = useAuth();
  const { openAuthSheet } = useAuthSheet();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [photos, setPhotos] = useState<Record<string, VaultPhoto[]>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploadingVaultId, setUploadingVaultId] = useState<string | null>(null);

  const [form, setForm] = useState({
    property_address: "",
    landlord_name: "",
    landlord_contact: "",
    deposit_amount_thb: "",
    checkin_at: "",
  });

  useEffect(() => {
    if (searchParams.get("status") === "dispute_cancelled") {
      toast.info(t ? "Платёж отменён" : "Payment cancelled");
    }
  }, [searchParams, t]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    void loadVaults();
  }, [user]);

  async function loadVaults() {
    setLoading(true);
    const { data: vaultsData, error } = await supabase
      .from("deposit_vaults")
      .select("id, property_address, landlord_name, deposit_amount_thb, checkin_at, checkout_at, status, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error(t ? "Не удалось загрузить хранилища" : "Failed to load vaults");
      setLoading(false);
      return;
    }
    setVaults((vaultsData ?? []) as Vault[]);

    if (vaultsData && vaultsData.length > 0) {
      const { data: photosData } = await supabase
        .from("deposit_vault_photos")
        .select("id, vault_id, phase, label, storage_path, taken_at, lat, lng")
        .in("vault_id", vaultsData.map((v) => v.id))
        .order("taken_at", { ascending: false });
      const grouped: Record<string, VaultPhoto[]> = {};
      (photosData ?? []).forEach((p) => {
        (grouped[p.vault_id] ||= []).push(p as VaultPhoto);
      });
      setPhotos(grouped);
    }
    setLoading(false);
  }

  function ensureAuthed(): boolean {
    if (user) return true;
    openAuthSheet({ intent: "deposit-vault" });
    return false;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!ensureAuthed()) return;
    if (!form.property_address.trim()) {
      toast.error(t ? "Укажите адрес" : "Address required");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("deposit_vaults").insert({
      user_id: user!.id,
      property_address: form.property_address.trim(),
      landlord_name: form.landlord_name.trim() || null,
      landlord_contact: form.landlord_contact.trim() || null,
      deposit_amount_thb: form.deposit_amount_thb ? Number(form.deposit_amount_thb) : null,
      checkin_at: form.checkin_at || null,
    });
    setCreating(false);
    if (error) {
      toast.error(t ? "Ошибка сохранения" : "Save failed");
      return;
    }
    toast.success(t ? "Хранилище создано" : "Vault created");
    setForm({ property_address: "", landlord_name: "", landlord_contact: "", deposit_amount_thb: "", checkin_at: "" });
    void loadVaults();
  }

  async function getGeo(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 4000 },
      );
    });
  }

  async function handleUpload(vaultId: string, file: File, phase: "checkin" | "checkout" | "issue") {
    if (!ensureAuthed()) return;
    setUploadingVaultId(vaultId);
    try {
      const geo = await getGeo();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user!.id}/${vaultId}/${Date.now()}-${phase}.${ext}`;
      const { error: upErr } = await supabase.storage.from("deposit-vault").upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { error: rowErr } = await supabase.from("deposit_vault_photos").insert({
        vault_id: vaultId,
        user_id: user!.id,
        storage_path: path,
        phase,
        label: file.name,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
      });
      if (rowErr) throw rowErr;
      toast.success(t ? "Фото добавлено" : "Photo added");
      void loadVaults();
    } catch (err) {
      console.error(err);
      toast.error(t ? "Не удалось загрузить" : "Upload failed");
    } finally {
      setUploadingVaultId(null);
    }
  }

  return (
    <AppLayout>
      <SEOHead
        title={t ? "Deposit Vault — защитите свой депозит" : "Deposit Vault — protect your rental deposit"}
        description={
          t
            ? "Бесплатное хранилище фото и данных о ваших арендах. Если депозит удержат — за 1 клик соберём пакет в OCPB."
            : "Free evidence vault for your rental deposit. If it gets withheld, generate an OCPB complaint pack in one click."
        }
        canonical="/legal/deposit-vault"
      />
      <div className="pb-24">
        <div className="relative bg-gradient-to-br from-primary to-primary/90 p-6 pt-16 pb-8">
          <BackButton fallbackPath={APP_ROUTES.LEGAL} variant="overlay" className="absolute top-4 left-4" />
          <div className="text-primary-foreground text-center">
            <div className="w-14 h-14 bg-primary-foreground/15 rounded-none flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold mb-1">{t ? "Deposit Vault" : "Deposit Vault"}</h1>
            <p className="text-primary-foreground/80 text-sm">
              {t ? "Защитите депозит. Бесплатно." : "Protect your rental deposit. Free."}
            </p>
          </div>
        </div>

        <div className="px-4 -mt-4 space-y-4">
          {/* Create form */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                {t ? "Добавить аренду" : "Add a rental"}
              </h2>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <Label htmlFor="address" className="text-xs">{t ? "Адрес объекта" : "Property address"}</Label>
                  <Input
                    id="address"
                    required
                    value={form.property_address}
                    onChange={(e) => setForm({ ...form, property_address: e.target.value })}
                    placeholder={t ? "Например, Rawai, Soi 5" : "e.g. Rawai, Soi 5"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="landlord" className="text-xs">{t ? "Арендодатель" : "Landlord"}</Label>
                    <Input
                      id="landlord"
                      value={form.landlord_name}
                      onChange={(e) => setForm({ ...form, landlord_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact" className="text-xs">{t ? "Контакт" : "Contact"}</Label>
                    <Input
                      id="contact"
                      value={form.landlord_contact}
                      onChange={(e) => setForm({ ...form, landlord_contact: e.target.value })}
                      placeholder="+66 …"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="deposit" className="text-xs">{t ? "Депозит ฿" : "Deposit ฿"}</Label>
                    <Input
                      id="deposit"
                      type="number"
                      inputMode="numeric"
                      value={form.deposit_amount_thb}
                      onChange={(e) => setForm({ ...form, deposit_amount_thb: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkin" className="text-xs">{t ? "Дата въезда" : "Check-in"}</Label>
                    <Input
                      id="checkin"
                      type="date"
                      value={form.checkin_at}
                      onChange={(e) => setForm({ ...form, checkin_at: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : (t ? "Создать хранилище" : "Create vault")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            </div>
          ) : !user ? (
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                {t ? "Войдите, чтобы увидеть и сохранить свои хранилища." : "Sign in to view and save your vaults."}
              </CardContent>
            </Card>
          ) : vaults.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                {t ? "Пока нет хранилищ. Создайте первое выше." : "No vaults yet. Create your first above."}
              </CardContent>
            </Card>
          ) : (
            vaults.map((vault) => {
              const vaultPhotos = photos[vault.id] ?? [];
              return (
                <Card key={vault.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{vault.property_address}</p>
                        <p className="text-xs text-muted-foreground">
                          {vault.landlord_name ?? (t ? "Арендодатель не указан" : "Landlord not set")}
                          {vault.deposit_amount_thb ? ` · ฿${vault.deposit_amount_thb.toLocaleString()}` : ""}
                        </p>
                      </div>
                      <span className="text-[10px] uppercase px-2 py-1 bg-muted rounded-none">
                        {vault.status}
                      </span>
                    </div>

                    {/* Photos */}
                    <div className="flex flex-wrap gap-1.5">
                      {vaultPhotos.slice(0, 8).map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-muted rounded-none"
                          title={p.label ?? ""}
                        >
                          <Camera className="w-3 h-3" />
                          {p.phase}
                          {p.lat && p.lng ? <MapPin className="w-3 h-3 text-primary" /> : null}
                        </span>
                      ))}
                      {vaultPhotos.length === 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {t ? "Нет фото-доказательств" : "No evidence photos yet"}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center justify-center gap-1.5 h-9 text-xs border border-dashed border-border rounded-none cursor-pointer hover:border-primary/40">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleUpload(vault.id, e.target.files[0], "checkin")}
                        />
                        {uploadingVaultId === vault.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3" />
                        )}
                        {t ? "Фото въезда" : "Check-in photo"}
                      </label>
                      <label className="flex items-center justify-center gap-1.5 h-9 text-xs border border-dashed border-border rounded-none cursor-pointer hover:border-primary/40">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleUpload(vault.id, e.target.files[0], "checkout")}
                        />
                        {uploadingVaultId === vault.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3" />
                        )}
                        {t ? "Фото выезда" : "Check-out photo"}
                      </label>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => navigate(`/legal/deposit-vault/dispute/new?vault=${vault.id}`)}
                    >
                      <FileWarning className="w-3.5 h-3.5" />
                      {t ? "Депозит не вернули → Dispute Pack ฿1,490" : "Deposit withheld → Dispute Pack ฿1,490"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}

          <p className="text-[11px] text-muted-foreground px-2">
            {t
              ? "Disclaimer: хранилище и черновики писем не заменяют юриста. Перед подачей рекомендуем проверить документы у партнёрской юрфирмы."
              : "Disclaimer: vault and draft letters do not replace legal advice. Please have documents reviewed by a partner law firm before filing."}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
