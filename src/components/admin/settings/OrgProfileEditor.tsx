import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { normalizeWhatsapp } from "@/lib/seo/normalizeWhatsapp";

const ISO2 = /^[A-Z]{2}$/;
const OPENING_HOURS = /^[A-Za-z,\- 0-9:;]*$/;

const whatsappField = (message: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || normalizeWhatsapp(v) !== null, message);

const schema = z.object({
  org_telephone: whatsappField(
    "Use E.164 phone (+66922407355) or wa.me URL",
  ),
  admin_whatsapp: whatsappField(
    "Use E.164 phone (+66922407355) or wa.me URL",
  ),
  org_email: z
    .string()
    .trim()
    .email("Invalid email")
    .max(255)
    .or(z.literal("")),
  org_street_address: z.string().trim().max(255).or(z.literal("")),
  org_postal_code: z.string().trim().max(20).or(z.literal("")),
  org_locality: z.string().trim().max(100),
  org_region: z.string().trim().max(100),
  org_country: z
    .string()
    .trim()
    .regex(ISO2, "Use ISO-3166-1 alpha-2 (e.g. TH)"),
  org_latitude: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (!Number.isNaN(Number(v)) && Math.abs(Number(v)) <= 90),
      "Latitude must be a number between -90 and 90",
    ),
  org_longitude: z
    .string()
    .trim()
    .refine(
      (v) =>
        v === "" || (!Number.isNaN(Number(v)) && Math.abs(Number(v)) <= 180),
      "Longitude must be a number between -180 and 180",
    ),
  org_opening_hours: z
    .string()
    .trim()
    .max(200)
    .regex(OPENING_HOURS, "Use schema.org format, e.g. Mo-Fr 09:00-18:00")
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const FIELD_KEYS = [
  "org_telephone",
  "admin_whatsapp",
  "org_email",
  "org_street_address",
  "org_postal_code",
  "org_locality",
  "org_region",
  "org_country",
  "org_latitude",
  "org_longitude",
  "org_opening_hours",
] as const;

const EMPTY: FormValues = {
  org_telephone: "",
  admin_whatsapp: "",
  org_email: "",
  org_street_address: "",
  org_postal_code: "",
  org_locality: "Phuket",
  org_region: "Phuket",
  org_country: "TH",
  org_latitude: "",
  org_longitude: "",
  org_opening_hours: "",
};

const valueToString = (raw: unknown): string => {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  return "";
};

const stringToJson = (
  key: keyof FormValues,
  value: string,
): string | number | null => {
  if (key === "org_latitude" || key === "org_longitude") {
    return value === "" ? null : Number(value);
  }
  if (key === "org_telephone" || key === "admin_whatsapp") {
    const normalized = normalizeWhatsapp(value);
    return normalized ? normalized.e164 : "";
  }
  return value;
};

const DESCRIPTIONS: Record<keyof FormValues, string> = {
  org_telephone:
    "myUNO primary telephone (E.164 or wa.me URL). Stored as E.164. Used in Organization JSON-LD telephone.",
  admin_whatsapp:
    "WhatsApp contact (E.164 or wa.me URL). Stored as E.164. Emitted as https://wa.me/<digits> in sameAs.",
  org_email:
    "myUNO primary contact email. Used in Organization JSON-LD email.",
  org_street_address: "myUNO street address line.",
  org_postal_code: "myUNO postal code.",
  org_locality: "City / locality for Organization JSON-LD address.",
  org_region: "Region / province for Organization JSON-LD address.",
  org_country: "ISO-3166-1 alpha-2 country code (e.g. TH).",
  org_latitude: "Geo latitude for LocalBusiness JSON-LD.",
  org_longitude: "Geo longitude for LocalBusiness JSON-LD.",
  org_opening_hours:
    'schema.org openingHours string (e.g. "Mo-Fr 09:00-18:00").',
};

export function OrgProfileEditor() {
  const { language } = useLanguage();
  const isRu = language === "ru";

  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", FIELD_KEYS as unknown as string[]);

      if (cancelled) return;
      if (error) {
        toast.error(
          isRu
            ? `Не удалось загрузить настройки: ${error.message}`
            : `Failed to load: ${error.message}`,
        );
        setLoading(false);
        return;
      }

      const next: FormValues = { ...EMPTY };
      for (const row of data ?? []) {
        const key = row.key as keyof FormValues;
        if (key in EMPTY) {
          const str = valueToString(row.value);
          if (str !== "") next[key] = str;
        }
      }
      setValues(next);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isRu]);

  const update = (key: keyof FormValues, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSave = async () => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormValues;
        if (!fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error(
        isRu ? "Проверьте поля формы" : "Please fix validation errors",
      );
      return;
    }

    setSaving(true);
    try {
      const rows = FIELD_KEYS.map((key) => ({
        key,
        value: stringToJson(key, parsed.data[key]),
        description: DESCRIPTIONS[key],
      }));

      const { error } = await supabase
        .from("system_settings")
        .upsert(rows, { onConflict: "key" });

      if (error) throw error;
      toast.success(
        isRu ? "Профиль организации сохранён" : "Organization profile saved",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(
        isRu ? `Ошибка сохранения: ${message}` : `Save failed: ${message}`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Surface variant="card" padding="md" radius="lg">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isRu ? "Загрузка…" : "Loading…"}
        </div>
      </Surface>
    );
  }

  const field = (
    key: keyof FormValues,
    labelRu: string,
    labelEn: string,
    placeholder?: string,
    type: "text" | "email" = "text",
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{isRu ? labelRu : labelEn}</Label>
      <Input
        id={key}
        type={type}
        value={values[key]}
        placeholder={placeholder}
        onChange={(e) => update(key, e.target.value)}
        aria-invalid={errors[key] ? "true" : "false"}
        autoComplete="off"
      />
      {errors[key] ? (
        <p className="text-xs text-destructive">{errors[key]}</p>
      ) : (
        <p className="text-xs text-muted-foreground">{DESCRIPTIONS[key]}</p>
      )}
    </div>
  );

  return (
    <Surface variant="card" padding="md" radius="lg" className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <div>
          <h3 className="text-base font-semibold">
            {isRu ? "Профиль организации" : "Organization profile"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isRu
              ? "Используется в JSON-LD на всех страницах (Organization + LocalBusiness). Пустые поля игнорируются."
              : "Used in sitewide JSON-LD (Organization + LocalBusiness). Empty fields are omitted."}
          </p>
        </div>
      </div>

      <Separator />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field("org_telephone", "Телефон", "Telephone", "+66922407355")}
        {field(
          "admin_whatsapp",
          "WhatsApp",
          "WhatsApp",
          "+66922407355 or https://wa.me/66922407355",
        )}
        {field("org_email", "Email", "Email", "pi@myuno.app", "email")}
      </section>

      <Separator />

      <section className="space-y-4">
        <h4 className="text-sm font-medium">
          {isRu ? "Адрес" : "Address"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field(
            "org_street_address",
            "Улица, дом",
            "Street address",
            "123/45 Moo 4, Cherng Talay",
          )}
          {field("org_postal_code", "Индекс", "Postal code", "83110")}
          {field("org_locality", "Город", "City / locality", "Phuket")}
          {field("org_region", "Регион", "Region / province", "Phuket")}
          {field("org_country", "Страна (ISO-2)", "Country (ISO-2)", "TH")}
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h4 className="text-sm font-medium">
          {isRu ? "География и часы" : "Geo & opening hours"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field("org_latitude", "Широта", "Latitude", "7.9519")}
          {field("org_longitude", "Долгота", "Longitude", "98.3381")}
          <div className="md:col-span-2">
            {field(
              "org_opening_hours",
              "Часы работы (schema.org)",
              "Opening hours (schema.org)",
              "Mo-Fr 09:00-18:00",
            )}
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isRu ? "Сохранить" : "Save"}
        </Button>
      </div>
    </Surface>
  );
}

export default OrgProfileEditor;
