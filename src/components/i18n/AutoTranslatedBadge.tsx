// Small badge indicating that a localized field was auto-translated from another language.
import { Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Lang = "ru" | "en" | "th";

const sourceLabel: Record<Lang, { ru: string; en: string; th: string }> = {
  ru: { ru: "русского", en: "Russian", th: "ภาษารัสเซีย" },
  en: { ru: "английского", en: "English", th: "ภาษาอังกฤษ" },
  th: { ru: "тайского", en: "Thai", th: "ภาษาไทย" },
};

interface Props {
  sourceLang?: Lang;
  uiLang?: "ru" | "en" | "th";
  className?: string;
}

export function AutoTranslatedBadge({ sourceLang, uiLang = "en", className }: Props) {
  if (!sourceLang) return null;
  const from = sourceLabel[sourceLang]?.[uiLang] ?? sourceLabel[sourceLang]?.en ?? sourceLang.toUpperCase();
  const label = uiLang === "ru" ? "Автоперевод" : uiLang === "th" ? "แปลอัตโนมัติ" : "Auto-translated";
  const tip = uiLang === "ru"
    ? `Переведено с ${from} автоматически`
    : uiLang === "th"
      ? `แปลจาก${from}โดยอัตโนมัติ`
      : `Auto-translated from ${from}`;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={className}>
            <Languages className="mr-1 h-3 w-3" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
