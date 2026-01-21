import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WellnessContent {
  id: string;
  type: 'meditation' | 'breathing' | 'soundscape' | 'article' | 'program' | 'workout';
  title_en: string;
  title_ru: string;
  description_en: string | null;
  description_ru: string | null;
  duration_seconds: number | null;
  audio_url: string | null;
  image_url: string | null;
  category: string | null;
  difficulty: string | null;
  is_premium: boolean;
  is_featured: boolean;
  metadata: Record<string, any>;
}

export interface WellnessLog {
  id: string;
  user_id: string;
  log_type: 'mood' | 'breathing' | 'meditation' | 'gratitude' | 'goal' | 'checkin';
  mood_score: number | null;
  energy_level: number | null;
  stress_level: number | null;
  sleep_quality: number | null;
  content_id: string | null;
  duration_seconds: number | null;
  notes: string | null;
  gratitude_items: string[] | null;
  logged_at: string;
  created_at: string;
}

export interface WellnessStreak {
  current_streak: number;
  longest_streak: number;
  total_checkins: number;
  total_meditation_minutes: number;
  total_breathing_sessions: number;
  last_checkin_date: string | null;
}

export function useWellnessContent(type?: string, category?: string) {
  const [content, setContent] = useState<WellnessContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        let query = supabase
          .from('wellness_content')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (type) {
          query = query.eq('type', type);
        }
        if (category) {
          query = query.eq('category', category);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setContent((data || []) as WellnessContent[]);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [type, category]);

  return { content, isLoading, error };
}

export function useWellnessLogs(days = 7) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WellnessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLogs([]);
      setIsLoading(false);
      return;
    }

    async function fetchLogs() {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('user_wellness_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', startDate.toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLogs(data as WellnessLog[]);
      }
      setIsLoading(false);
    }

    fetchLogs();
  }, [user, days]);

  return { logs, isLoading };
}

export function useWellnessStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<WellnessStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStreak(null);
      setIsLoading(false);
      return;
    }

    async function fetchStreak() {
      const { data, error } = await supabase
        .from('user_wellness_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setStreak(data as WellnessStreak);
      }
      setIsLoading(false);
    }

    fetchStreak();
  }, [user]);

  return { streak, isLoading };
}

export function useLogWellness() {
  const { user } = useAuth();

  const logMood = async (
    moodScore: number,
    energyLevel?: number,
    stressLevel?: number,
    sleepQuality?: number,
    notes?: string
  ) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('user_wellness_logs')
      .insert({
        user_id: user.id,
        log_type: 'mood',
        mood_score: moodScore,
        energy_level: energyLevel,
        stress_level: stressLevel,
        sleep_quality: sleepQuality,
        notes,
      })
      .select()
      .single();

    if (!error) {
      await updateStreak(user.id);
    }

    return { data, error };
  };

  const logBreathing = async (contentId: string, durationSeconds: number) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('user_wellness_logs')
      .insert({
        user_id: user.id,
        log_type: 'breathing',
        content_id: contentId,
        duration_seconds: durationSeconds,
      })
      .select()
      .single();

    if (!error) {
      await updateBreathingSessions(user.id);
    }

    return { data, error };
  };

  const logGratitude = async (items: string[]) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('user_wellness_logs')
      .insert({
        user_id: user.id,
        log_type: 'gratitude',
        gratitude_items: items,
      })
      .select()
      .single();

    return { data, error };
  };

  return { logMood, logBreathing, logGratitude };
}

async function updateStreak(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // Get or create streak record
  const { data: existing } = await supabase
    .from('user_wellness_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const lastDate = existing.last_checkin_date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = existing.current_streak;
    if (lastDate === yesterdayStr) {
      newStreak += 1;
    } else if (lastDate !== today) {
      newStreak = 1;
    }

    await supabase
      .from('user_wellness_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, existing.longest_streak),
        total_checkins: existing.total_checkins + 1,
        last_checkin_date: today,
      })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('user_wellness_streaks')
      .insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        total_checkins: 1,
        last_checkin_date: today,
      });
  }
}

async function updateBreathingSessions(userId: string) {
  const { data: existing } = await supabase
    .from('user_wellness_streaks')
    .select('total_breathing_sessions')
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabase
      .from('user_wellness_streaks')
      .update({
        total_breathing_sessions: (existing.total_breathing_sessions || 0) + 1,
      })
      .eq('user_id', userId);
  }
}
