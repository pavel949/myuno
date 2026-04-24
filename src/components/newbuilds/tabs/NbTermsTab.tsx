/**
 * NbTermsTab — Payment plans, special offers, and promotions
 */
import React from 'react';
import { CreditCard, Tag, Calendar, Percent, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProjectTerms, useProjectPromotions } from '@/hooks/useProjectTerms';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  projectId: string;
}

export function NbTermsTab({ projectId }: Props) {
  const { data: terms, isLoading: termsLoading } = useProjectTerms(projectId);
  const { data: promotions, isLoading: promosLoading } = useProjectPromotions(projectId);

  const isLoading = termsLoading || promosLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 rounded-none" style={{ background: 'hsl(var(--nb-surface))' }} />
        ))}
      </div>
    );
  }

  const hasTerms = terms && terms.length > 0;
  const hasPromos = promotions && promotions.length > 0;

  if (!hasTerms && !hasPromos) {
    return (
      <div className="text-center py-16">
        <CreditCard className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--nb-muted))' }} />
        <p className="nb-display text-xl" style={{ color: 'hsl(var(--nb-muted))' }}>Условия покупки пока не опубликованы</p>
        <p className="text-sm mt-2" style={{ color: 'hsl(var(--nb-muted))' }}>Запросите информацию о планах оплаты у девелопера</p>
      </div>
    );
  }

  const daysUntil = (dateStr: string | null) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  };

  return (
    <div className="space-y-8">
      {/* Payment Plans */}
      {hasTerms && (
        <div>
          <p className="nb-label mb-4">ПЛАНЫ ОПЛАТЫ</p>
          <div className="space-y-4">
            {terms!.map(term => {
              const remaining = daysUntil(term.valid_until);
              return (
                <div key={term.id} className="nb-glass p-5 space-y-3">
                  {/* Promo label + discount */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {term.promo_label && (
                        <span className="nb-badge" style={{ background: 'hsl(var(--nb-gold) / 0.15)', color: 'hsl(var(--nb-gold))', border: '1px solid hsl(var(--nb-gold) / 0.3)' }}>
                          <Tag className="w-3 h-3 inline mr-1" />{term.promo_label}
                        </span>
                      )}
                      {term.discount_percent && term.discount_percent > 0 && (
                        <span className="nb-badge" style={{ background: 'hsl(142 70% 45% / 0.15)', color: 'hsl(142 70% 55%)', border: '1px solid hsl(142 70% 45% / 0.3)' }}>
                          <Percent className="w-3 h-3 inline mr-1" />-{term.discount_percent}%
                        </span>
                      )}
                    </div>
                    {remaining && (
                      <span className="nb-mono text-xs px-2 py-1 rounded-none" style={{ background: 'hsl(38 92% 50% / 0.12)', color: 'hsl(38 92% 60%)' }}>
                        {remaining} дн. осталось
                      </span>
                    )}
                  </div>

                  {/* Payment plan name */}
                  {term.payment_plan && (
                    <h3 className="nb-display text-lg" style={{ color: 'hsl(var(--nb-text))' }}>
                      {term.payment_plan}
                    </h3>
                  )}

                  {/* Discount description */}
                  {term.discount_description && (
                    <p className="text-sm" style={{ color: 'hsl(var(--nb-text-secondary))' }}>
                      {term.discount_description}
                    </p>
                  )}

                  {/* Payment details */}
                  {term.payment_details && (
                    <div className="p-4 rounded-none" style={{ background: 'hsl(var(--nb-bg))' }}>
                      <p className="nb-label text-[10px] mb-2">ДЕТАЛИ ОПЛАТЫ</p>
                      <p className="text-sm whitespace-pre-line" style={{ color: 'hsl(var(--nb-text))' }}>
                        {term.payment_details}
                      </p>
                    </div>
                  )}

                  {/* Valid until */}
                  {term.valid_until && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Действует до {new Date(term.valid_until).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Promotions */}
      {hasPromos && (
        <div>
          <p className="nb-label mb-4">АКЦИИ</p>
          <div className="space-y-3">
            {promotions!.map(promo => (
              <div key={promo.id} className="nb-glass p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-none flex items-center justify-center" style={{ background: 'hsl(var(--nb-gold) / 0.15)' }}>
                  <Tag className="w-5 h-5" style={{ color: 'hsl(var(--nb-gold))' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'hsl(var(--nb-text))' }}>
                    {promo.type || 'Специальное предложение'}
                  </p>
                  {promo.ends_at && (
                    <p className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
                      до {new Date(promo.ends_at).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
                {promo.status && (
                  <span className="nb-badge text-[10px]" style={{ background: 'hsl(142 70% 45% / 0.15)', color: 'hsl(142 70% 55%)', border: '1px solid hsl(142 70% 45% / 0.3)' }}>
                    Активна
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legal CTA */}
      <div className="nb-separator" />
      <Link
        to="/legal/contract-analysis"
        className="nb-glass p-5 flex items-center gap-4 group hover:border-[hsl(var(--nb-gold)/0.5)] transition-all"
      >
        <div className="w-10 h-10 rounded-none flex items-center justify-center" style={{ background: 'hsl(215 80% 55% / 0.15)' }}>
          <FileText className="w-5 h-5" style={{ color: 'hsl(215 80% 65%)' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: 'hsl(var(--nb-text))' }}>Нужна проверка контракта?</p>
          <p className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>Юристы myUNO проверят договор купли-продажи</p>
        </div>
        <ArrowRight className="w-5 h-5 transition-transform" style={{ color: 'hsl(var(--nb-gold))' }} />
      </Link>
    </div>
  );
}
