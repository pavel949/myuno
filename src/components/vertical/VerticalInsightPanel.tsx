import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, BookOpen, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

interface InsightGuide {
  slugEn: string;
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
}

interface InsightFAQ {
  questionEn: string;
  questionRu: string;
  answerEn: string;
  answerRu: string;
}

interface InsightConfig {
  guides: InsightGuide[];
  faqs: InsightFAQ[];
}

const INSIGHT_CONFIG: Partial<Record<string, InsightConfig>> = {
  yacht: {
    guides: [
      { slugEn: 'phuket-yacht-routes', titleEn: 'Top Yacht Routes from Phuket', titleRu: 'Популярные маршруты на яхте', descEn: 'Phi Phi, Similan, Racha — which to choose', descRu: 'Phi Phi, Симилан, Рача — что выбрать' },
      { slugEn: 'yacht-charter-guide', titleEn: 'What to Bring on a Charter', titleRu: 'Что взять с собой', descEn: 'Checklist for a perfect day at sea', descRu: 'Чеклист для идеального дня на море' },
    ],
    faqs: [
      { questionEn: 'When is the optimal season for yacht charters?', questionRu: 'Когда оптимальный сезон для чартера?', answerEn: 'November to April: calm Andaman Sea, ideal visibility. May–Oct is possible but check weather.', answerRu: 'Ноябрь–Апрель: спокойное Андаманское море, хорошая видимость. Май–Октябрь — возможно, но следите за погодой.' },
      { questionEn: 'How many people fit on a speedboat vs catamaran?', questionRu: 'Сколько человек на спидботе и катамаране?', answerEn: 'Speedboats: 8–12 pax. Catamarans: 10–20 pax. Superyachts: 6–10 in luxury.', answerRu: 'Спидбот: 8–12 чел. Катамаран: 10–20 чел. Суперяхта: 6–10 в роскоши.' },
      { questionEn: 'Is fuel included in the charter price?', questionRu: 'Топливо включено в цену?', answerEn: 'Usually yes for day charters. Check the listing — some providers charge extra for long routes.', answerRu: 'Обычно да для дневных рейдов. Проверьте листинг — некоторые провайдеры берут доп. оплату за длинные маршруты.' },
    ],
  },
  property: {
    guides: [
      { slugEn: 'phuket-neighborhoods', titleEn: 'Phuket Neighborhoods Guide', titleRu: 'Районы Пхукета: гайд', descEn: 'Where to live based on your lifestyle', descRu: 'Где жить в зависимости от образа жизни' },
      { slugEn: 'rent-without-agent', titleEn: 'How to Rent Without an Agent', titleRu: 'Как снять жильё без агента', descEn: 'Direct landlord tips & red flags to avoid', descRu: 'Советы для прямой аренды и красные флаги' },
    ],
    faqs: [
      { questionEn: 'What is included in long-term rent?', questionRu: 'Что включено в долгосрочную аренду?', answerEn: 'Typically: furniture, pool, AC. Rarely: utilities, internet. Always clarify before signing.', answerRu: 'Обычно: мебель, бассейн, кондиционер. Редко: коммуналка, интернет. Всегда уточняйте до подписания.' },
      { questionEn: 'Can foreigners own property in Thailand?', questionRu: 'Могут ли иностранцы владеть недвижимостью?', answerEn: 'Condos: yes (up to 49% of building). Land & houses: via Thai company or long-term lease (30+30 years).', answerRu: 'Кондо: да (до 49% здания). Земля и дома: через тайскую компанию или долгосрочную аренду (30+30 лет).' },
      { questionEn: 'What\'s the average deposit?', questionRu: 'Какой стандартный депозит?', answerEn: '1–2 months rent, returned at end of lease minus any damage.', answerRu: '1–2 месяца аренды, возвращается в конце контракта за вычетом ущерба.' },
    ],
  },
  medical: {
    guides: [
      { slugEn: 'phuket-hospitals-guide', titleEn: 'Best Hospitals in Phuket', titleRu: 'Лучшие больницы Пхукета', descEn: 'Private vs public, costs & what to expect', descRu: 'Частные и гос., стоимость и что ожидать' },
      { slugEn: 'insurance-vs-cash', titleEn: 'Insurance or Cash Payment?', titleRu: 'Страховка или наличные?', descEn: 'When each makes sense in Thailand', descRu: 'Когда что выгоднее в Таиланде' },
    ],
    faqs: [
      { questionEn: 'Do hospitals speak English?', questionRu: 'Говорят ли в больницах по-английски?', answerEn: 'Private hospitals (Bangkok Hospital, Bangkok Phuket) have English-speaking staff. Public hospitals may not.', answerRu: 'Частные больницы (Bangkok Hospital) — да. Государственные — не всегда.' },
      { questionEn: 'How much does a GP consultation cost?', questionRu: 'Сколько стоит приём терапевта?', answerEn: 'Private clinic: ฿800–2,000. Bangkok Hospital: ฿1,500–3,500 incl. basic tests.', answerRu: 'Частная клиника: ฿800–2 000. Bangkok Hospital: ฿1 500–3 500 включая базовые анализы.' },
      { questionEn: 'Is travel insurance worth it in Phuket?', questionRu: 'Стоит ли брать страховку на Пхукет?', answerEn: 'Yes. Medical costs at private hospitals can be high. Scooter accidents are common.', answerRu: 'Да. Стоимость лечения в частных клиниках может быть высокой. Аварии на скутере — частое явление.' },
    ],
  },
  legal: {
    guides: [
      { slugEn: 'thailand-visa-types', titleEn: 'Thailand Visa Types for Expats', titleRu: 'Типы виз для иностранцев', descEn: 'TR, STV, LTR, Thailand Elite compared', descRu: 'TR, STV, LTR, Thailand Elite — сравнение' },
      { slugEn: 'open-company-thailand', titleEn: 'How to Open a Company in Thailand', titleRu: 'Как открыть компанию в Таиланде', descEn: 'BOI, Thai Ltd, and legal requirements', descRu: 'BOI, Thai Ltd и юридические требования' },
    ],
    faqs: [
      { questionEn: 'How long can I stay on a tourist visa?', questionRu: 'Сколько можно находиться по туристической визе?', answerEn: '60 days entry + 30 day extension at local immigration. After that: visa run or switch visa type.', answerRu: '60 дней въезд + 30 дней продление в иммиграции. Далее: визаран или смена типа визы.' },
      { questionEn: 'What is the LTR visa?', questionRu: 'Что такое виза LTR?', answerEn: 'Long-Term Resident visa: 10 years, multiple entry. For retirees, remote workers, wealthy pensioners. Min ฿800k income or assets.', answerRu: 'Виза LTR: 10 лет, мультивъезд. Для пенсионеров, удалёнщиков. Мин. доход или активы ฿800 тыс.' },
      { questionEn: 'Do I need a work permit to freelance?', questionRu: 'Нужен ли Work Permit для фриланса?', answerEn: 'Technically yes for any paid work in Thailand. In practice, SMART Visa or LTR (remote worker) covers most digital nomads legally.', answerRu: 'Технически да для любой оплачиваемой работы. На практике SMART Visa или LTR (удалённый работник) покрывают большинство диджитал-номадов.' },
    ],
  },
  experience: {
    guides: [
      { slugEn: 'phi-phi-day-trip', titleEn: 'Phi Phi Islands: Complete Guide', titleRu: 'Острова Пхи-Пхи: полный гайд', descEn: 'How to get there, what to see, hidden beaches', descRu: 'Как добраться, что посмотреть, тайные пляжи' },
      { slugEn: 'phuket-activities-calendar', titleEn: 'Phuket Activities Calendar', titleRu: 'Календарь активностей Пхукета', descEn: 'What\'s on each month — festivals, events, seasons', descRu: 'Что происходит каждый месяц — фестивали, события, сезоны' },
    ],
    faqs: [
      { questionEn: 'When should I book tours in advance?', questionRu: 'Когда нужно бронировать туры заранее?', answerEn: 'Similan Islands (Oct–May): 2+ weeks. Phi Phi day trips: 2–3 days. Always book sunrise trips early.', answerRu: 'Острова Симилан (окт–май): 2+ недели. Phi Phi: 2–3 дня. Рассветные туры — всегда заранее.' },
      { questionEn: 'Are tours cancelled during rainy season?', questionRu: 'Отменяются ли туры в сезон дождей?', answerEn: 'Some yes (Similan, James Bond in heavy swells). Most island tours run year-round — check with operator.', answerRu: 'Некоторые да (Симилан, Джеймс Бонд при сильном волнении). Большинство работают круглый год — уточняйте у оператора.' },
    ],
  },
};

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 py-3 text-left"
      >
        <span className="text-sm font-medium text-foreground">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && <p className="pb-3 text-sm text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  );
}

interface VerticalInsightPanelProps {
  verticalId: string;
  className?: string;
}

export function VerticalInsightPanel({ verticalId, className }: VerticalInsightPanelProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const config = INSIGHT_CONFIG[verticalId];
  if (!config) return null;

  return (
    <div className={cn('space-y-4 mt-8', className)}>
      {config.guides.length > 0 && (
        <div className="rounded-none border border-border/50 bg-card/50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {isRu ? 'Полезные гайды' : 'Helpful Guides'}
            </h3>
          </div>
          <div className="divide-y divide-border/50">
            {config.guides.map(guide => (
              <button
                key={guide.slugEn}
                onClick={() => navigate(`/knowledge/${guide.slugEn}`)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{isRu ? guide.titleRu : guide.titleEn}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{isRu ? guide.descRu : guide.descEn}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 -rotate-90 mt-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {config.faqs.length > 0 && (
        <div className="rounded-none border border-border/50 bg-card/50 px-4">
          <div className="flex items-center gap-2 pt-4 pb-1">
            <span className="text-sm">❓</span>
            <h3 className="text-sm font-semibold text-foreground">FAQ</h3>
          </div>
          {config.faqs.map((faq, i) => (
            <FAQItem
              key={i}
              q={isRu ? faq.questionRu : faq.questionEn}
              a={isRu ? faq.answerRu : faq.answerEn}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => navigate(APP_ROUTES.VIP_CONCIERGE)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-none border border-border/50 bg-card/50 text-sm text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/30 transition-colors"
      >
        <MessageCircle className="w-4 h-4 text-primary" />
        {isRu ? 'Нужна помощь? Свяжитесь с VIP Консьержем' : 'Need help? Contact VIP Concierge'}
      </button>
    </div>
  );
}
