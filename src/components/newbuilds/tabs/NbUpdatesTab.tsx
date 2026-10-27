/**
 * NbUpdatesTab — Construction timeline with progress milestones
 */
import React, { useState } from 'react';
import { Clock, Camera, TrendingUp, Bell } from 'lucide-react';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';
import { NbConstructionProgress } from '../NbConstructionProgress';
import { NbLightbox } from '../NbLightbox';
import { NbLeadForm } from '../NbLeadForm';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  projectId: string;
  currentProgress?: number;
  completionDate?: string | null;
}

export function NbUpdatesTab({ projectId, currentProgress = 0, completionDate }: Props) {
  const { data: updates, isLoading } = useProjectUpdates(projectId);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [showSubscribe, setShowSubscribe] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40 rounded-none" style={{ background: 'hsl(var(--nb-surface))' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current progress summary */}
      <div className="nb-glass p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="nb-label">ТЕКУЩИЙ ПРОГРЕСС</p>
          <button
            onClick={() => setShowSubscribe(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-none transition-all"
            style={{ background: 'hsl(var(--nb-gold) / 0.15)', color: 'hsl(var(--nb-gold))', border: '1px solid hsl(var(--nb-gold) / 0.3)' }}
          >
            <Bell className="w-3.5 h-3.5" /> Подписаться
          </button>
        </div>
        <NbConstructionProgress progress={currentProgress} completionDate={completionDate} size="md" />
      </div>

      {/* Timeline */}
      {(!updates || updates.length === 0) ? (
        <div className="text-center py-12">
          <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--nb-muted))' }} />
          <p className="nb-display text-xl" style={{ color: 'hsl(var(--nb-muted))' }}>Обновлений пока нет</p>
          <p className="text-sm mt-2" style={{ color: 'hsl(var(--nb-muted))' }}>
            Подпишитесь, чтобы получать уведомления о ходе строительства
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-[19px] top-0 bottom-0 w-px"
            style={{ background: 'linear-gradient(to bottom, hsl(var(--nb-gold) / 0.4), hsl(var(--nb-gold) / 0.1))' }}
          />

          <div className="space-y-6">
            {updates.map((update, idx) => {
              const date = update.published_at
                ? new Date(update.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
                : null;
              const photos = update.photo_urls || [];

              return (
                <div key={update.id} className="relative pl-12">
                  {/* Timeline dot */}
                  <div
                    className="absolute left-[12px] top-1.5 w-[15px] h-[15px] rounded-full border-2"
                    style={{
                      borderColor: idx === 0 ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-gold) / 0.4)',
                      background: idx === 0 ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-bg))',
                    }}
                  />

                  <div className="nb-glass p-5 space-y-3">
                    {/* Date + progress */}
                    <div className="flex items-center justify-between">
                      {date && (
                        <span className="nb-mono text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>{date}</span>
                      )}
                      {update.progress_at_time !== null && (
                        <span className="flex items-center gap-1 nb-mono text-xs px-2 py-0.5 rounded-none" style={{ background: 'hsl(var(--nb-gold) / 0.12)', color: 'hsl(var(--nb-gold))' }}>
                          <TrendingUp className="w-3 h-3" /> {update.progress_at_time}%
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="nb-display text-lg" style={{ color: 'hsl(var(--nb-text))' }}>
                      {update.title}
                    </h3>

                    {/* Content */}
                    {update.content && (
                      <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--nb-text-secondary))' }}>
                        {update.content}
                      </p>
                    )}

                    {/* Photos */}
                    {photos.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {photos.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setLightbox({ images: photos, index: i })}
                            className="flex-shrink-0 w-28 h-20 rounded-none overflow-hidden group relative"
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-4 h-4" style={{ color: 'hsl(var(--nb-gold))' }} />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Mini progress bar */}
                    {update.progress_at_time !== null && (
                      <div className="nb-progress-track h-1">
                        <div className="nb-progress-fill" style={{ width: `${Math.min(update.progress_at_time, 100)}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <NbLightbox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}

      {/* Subscribe modal */}
      {showSubscribe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setShowSubscribe(false)}>
          <div className="max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="nb-glass p-5 mb-3 text-center">
              <p className="nb-display text-lg" style={{ color: 'hsl(var(--nb-gold))' }}>Подписка на обновления</p>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--nb-muted))' }}>
                Получайте фото и отчёты со стройплощадки в WhatsApp или Telegram
              </p>
            </div>
            <NbLeadForm projectId={projectId} source="updates_subscription" compact />
          </div>
        </div>
      )}
    </div>
  );
}
