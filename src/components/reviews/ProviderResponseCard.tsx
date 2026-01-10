import { MessageCircle, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ProviderResponseCardProps {
  response: string;
  responseAt: string;
  providerName?: string;
  providerAvatar?: string;
}

export const ProviderResponseCard = ({
  response,
  responseAt,
  providerName,
  providerAvatar,
}: ProviderResponseCardProps) => {
  const { language } = useLanguage();

  return (
    <div className="ml-8 mt-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-2">
          {providerAvatar ? (
            <img 
              src={providerAvatar} 
              alt="" 
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-primary" />
            </div>
          )}
          <span className="text-sm font-medium">
            {providerName || (language === 'ru' ? 'Ответ провайдера' : 'Provider Response')}
          </span>
          <CheckCircle className="w-4 h-4 text-primary" />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {format(new Date(responseAt), 'dd MMM yyyy', {
            locale: language === 'ru' ? ru : undefined
          })}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{response}</p>
    </div>
  );
};
