import { useNavigate } from 'react-router-dom';
import { Anchor, ArrowLeft, Bell } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function YachtsIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">
            {isRu ? 'Аренда яхт' : 'Boat Charters'}
          </h1>
        </div>

        {/* Coming Soon */}
        <div className="flex flex-col items-center justify-center px-6 pt-16 pb-24 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="relative mb-8"
          >
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg">
              <Anchor className="w-12 h-12 text-primary" />
            </div>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg"
            >
              <Bell className="w-4 h-4 text-primary-foreground" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="text-2xl font-bold mb-3">
              {isRu ? 'Скоро открытие' : 'Coming Soon'}
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed mb-8">
              {isRu
                ? 'Мы готовим для вас лучшие яхты и катера Пхукета. Следите за обновлениями!'
                : "We're curating the best boat charters in Phuket. Stay tuned!"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-3 w-full max-w-xs"
          >
            <Button onClick={() => navigate('/')} className="w-full">
              {isRu ? 'На главную' : 'Go Home'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/discover')} className="w-full">
              {isRu ? 'Другие сервисы' : 'Browse Services'}
            </Button>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
