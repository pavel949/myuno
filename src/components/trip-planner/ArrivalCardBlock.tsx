import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { FileText, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const OFFICIAL_ARRIVAL_CARD_URL = 'https://tm6.immigration.go.th/';

interface ArrivalCardBlockProps {
  onAssisted?: () => void;
}

export function ArrivalCardBlock({ onAssisted }: ArrivalCardBlockProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-accent-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">
            {isRu ? 'Arrival Card (TM6)' : 'Arrival Card (TM6)'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {isRu
              ? 'Электронная карточка прибытия в Таиланд. Заполняется онлайн до или после прилёта. Без неё не пропустят на паспортном контроле.'
              : 'Electronic Thailand arrival card. Fill it online before or after landing. Required at immigration control.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="sm"
          className="h-auto py-3 flex-col gap-1.5"
          onClick={() => window.open(OFFICIAL_ARRIVAL_CARD_URL, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
          <span className="text-xs font-medium">
            {isRu ? 'Заполню сам' : 'Fill myself'}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {isRu ? 'Бесплатно' : 'Free'}
          </span>
        </Button>

        <Button
          variant="default"
          size="sm"
          className="h-auto py-3 flex-col gap-1.5"
          onClick={onAssisted}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-medium">
            {isRu ? 'Поможет myUNO' : 'myUNO Assistance'}
          </span>
          <span className="text-[10px] opacity-80">
            ฿300 / {isRu ? 'чел.' : 'person'}
          </span>
        </Button>
      </div>
    </motion.div>
  );
}
