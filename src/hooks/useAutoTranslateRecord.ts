// Client wrapper around the `auto-translate-record` edge function.
// Triggers translation of a vendor-saved record into the 2 missing languages.
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Lang = "ru" | "en" | "th";
type Table = "listings" | "providers" | "marketplace_products" | "services" | "bouquets";

export interface AutoTranslateInput {
  table: Table;
  id: string;
  sourceLang: Lang;
  fields: Record<string, string>;
}

export function useAutoTranslateRecord() {
  const [isTranslating, setIsTranslating] = useState(false);

  async function translate(input: AutoTranslateInput): Promise<boolean> {
    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-translate-record", {
        body: {
          table: input.table,
          id: input.id,
          source_lang: input.sourceLang,
          fields: input.fields,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(String(data.error));
      toast.success("Переводы сгенерированы / Translations generated");
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      if (msg.includes("429") || msg === "rate_limited") {
        toast.error("Слишком много запросов перевода. Попробуйте позже.");
      } else if (msg.includes("402") || msg === "credits_exhausted") {
        toast.error("Закончились AI-кредиты — пополните рабочее пространство.");
      } else {
        toast.error("Не удалось сгенерировать переводы");
      }
      console.error("[useAutoTranslateRecord]", err);
      return false;
    } finally {
      setIsTranslating(false);
    }
  }

  return { translate, isTranslating };
}
