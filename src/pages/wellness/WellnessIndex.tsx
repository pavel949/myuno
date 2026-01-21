import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWellnessContent, useWellnessStreak, WellnessContent } from '@/hooks/useWellness';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/uno/PageHeader';
import { SEOHead } from '@/components/seo/SEOHead';
import { MoodCheckin } from '@/components/wellness/MoodCheckin';
import { BreathingExercise } from '@/components/wellness/BreathingExercise';
import { SoundscapePlayer } from '@/components/wellness/SoundscapePlayer';
import { WellnessCard } from '@/components/wellness/WellnessCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Wind, 
  Headphones, 
  BookOpen, 
  Flame, 
  Target,
  Sparkles 
} from 'lucide-react';

export default function WellnessIndex() {
  const { language } = useLanguage();
  const { streak, isLoading: streakLoading } = useWellnessStreak();
  const { content: breathing, isLoading: breathingLoading } = useWellnessContent('breathing');
  const { content: soundscapes, isLoading: soundscapesLoading } = useWellnessContent('soundscape');
  const { content: articles, isLoading: articlesLoading } = useWellnessContent('article');
  
  const [selectedExercise, setSelectedExercise] = useState<WellnessContent | null>(null);
  const [activeTab, setActiveTab] = useState('breathing');
  const [activeSoundscape, setActiveSoundscape] = useState<string | null>(null);

  const isLoading = breathingLoading || soundscapesLoading || articlesLoading;

  return (
    <AppLayout>
      <SEOHead 
        title={language === 'ru' ? 'Гармония — Время для себя' : 'Wellness — Time for Yourself'}
        description={language === 'ru' 
          ? 'Медитации, дыхательные практики и звуки природы Пхукета' 
          : 'Meditation, breathing exercises and Phuket nature sounds'}
      />
      
      <PageHeader 
        title={language === 'ru' ? 'Гармония' : 'Wellness'}
        subtitle={language === 'ru' ? 'Время для себя' : 'Time for yourself'}
        showBack
        fallbackPath="/"
      />
      
      <div className="p-4 space-y-6 pb-24">
        {/* Stats Card */}
        {streak && streak.total_checkins > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold">{streak.current_streak}</p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'ru' ? 'дней подряд' : 'day streak'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-px h-10 bg-border" />
                    
                    <div className="flex items-center gap-2">
                      <Wind className="w-5 h-5 text-sky-500" />
                      <div>
                        <p className="text-2xl font-bold">{streak.total_breathing_sessions}</p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'ru' ? 'сессий дыхания' : 'breathing sessions'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="outline" className="gap-1">
                      <Target className="w-3 h-3" />
                      {language === 'ru' ? 'Рекорд' : 'Best'}: {streak.longest_streak}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Daily Check-in */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                {language === 'ru' ? 'Как вы сегодня?' : 'How are you today?'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MoodCheckin />
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="breathing" className="gap-1">
              <Wind className="w-4 h-4" />
              <span className="hidden sm:inline">
                {language === 'ru' ? 'Дыхание' : 'Breathing'}
              </span>
            </TabsTrigger>
            <TabsTrigger value="sounds" className="gap-1">
              <Headphones className="w-4 h-4" />
              <span className="hidden sm:inline">
                {language === 'ru' ? 'Звуки' : 'Sounds'}
              </span>
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-1">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">
                {language === 'ru' ? 'Статьи' : 'Articles'}
              </span>
            </TabsTrigger>
          </TabsList>
          
          {/* Breathing Tab */}
          <TabsContent value="breathing" className="mt-4 space-y-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))
            ) : breathing.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {language === 'ru' ? 'Упражнения скоро появятся' : 'Exercises coming soon'}
              </p>
            ) : (
              breathing.map((exercise) => (
                <WellnessCard
                  key={exercise.id}
                  content={exercise}
                  onClick={() => setSelectedExercise(exercise)}
                />
              ))
            )}
          </TabsContent>
          
          {/* Sounds Tab */}
          <TabsContent value="sounds" className="mt-4 space-y-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))
            ) : soundscapes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {language === 'ru' ? 'Звуки скоро появятся' : 'Sounds coming soon'}
              </p>
            ) : (
              soundscapes.map((soundscape) => (
                <SoundscapePlayer
                  key={soundscape.id}
                  soundscape={soundscape}
                  isActive={activeSoundscape === soundscape.id}
                  onPlay={() => setActiveSoundscape(soundscape.id)}
                />
              ))
            )}
          </TabsContent>
          
          {/* Articles Tab */}
          <TabsContent value="articles" className="mt-4 space-y-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))
            ) : articles.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {language === 'ru' ? 'Статьи скоро появятся' : 'Articles coming soon'}
              </p>
            ) : (
              articles.map((article) => (
                <WellnessCard
                  key={article.id}
                  content={article}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
        
        {/* Featured Section */}
        {breathing.filter(b => b.is_featured).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">
                {language === 'ru' ? 'Рекомендуем попробовать' : 'Try This'}
              </h2>
            </div>
            <div className="grid gap-3">
              {breathing.filter(b => b.is_featured).slice(0, 2).map((content) => (
                <WellnessCard
                  key={content.id}
                  content={content}
                  variant="featured"
                  onClick={() => setSelectedExercise(content)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Breathing Exercise Sheet */}
      <Sheet 
        open={!!selectedExercise} 
        onOpenChange={(open) => !open && setSelectedExercise(null)}
      >
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>
              {selectedExercise && (
                language === 'ru' ? selectedExercise.title_ru : selectedExercise.title_en
              )}
            </SheetTitle>
          </SheetHeader>
          
          {selectedExercise && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground text-center mb-6">
                {language === 'ru' 
                  ? selectedExercise.description_ru 
                  : selectedExercise.description_en}
              </p>
              <BreathingExercise 
                exercise={selectedExercise}
                onComplete={() => setSelectedExercise(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
