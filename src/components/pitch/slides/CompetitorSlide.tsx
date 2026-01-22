import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Crown } from 'lucide-react';
import { PitchSlide, SlideTitle, SlideContent } from '../PitchSlide';
import { COMPETITORS } from '@/hooks/useInvestorMetrics';

interface CompetitorSlideProps {
  isRussian: boolean;
}

const columns = [
  { key: 'transport', label: 'Transport', labelRu: 'Транспорт' },
  { key: 'food', label: 'Food', labelRu: 'Еда' },
  { key: 'tours', label: 'Tours', labelRu: 'Туры' },
  { key: 'property', label: 'Property', labelRu: 'Недвижимость' },
  { key: 'medical', label: 'Medical', labelRu: 'Медицина' },
  { key: 'legal', label: 'Legal', labelRu: 'Юридические' },
  { key: 'offline', label: 'Offline Team', labelRu: 'Офлайн команда' },
];

export function CompetitorSlide({ isRussian }: CompetitorSlideProps) {
  return (
    <PitchSlide>
      <SlideTitle>
        {isRussian ? 'Конкурентный ландшафт' : 'Competitive Landscape'}
      </SlideTitle>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center text-slate-400 mb-8 max-w-2xl mx-auto"
      >
        {isRussian 
          ? 'Никто не предлагает единую платформу с офлайн-поддержкой для экспатов и туристов'
          : 'No one offers a unified platform with offline support for expats and tourists'}
      </motion.p>

      <SlideContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="overflow-x-auto"
        >
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-3 text-slate-400 font-medium text-sm">
                  {isRussian ? 'Платформа' : 'Platform'}
                </th>
                {columns.map((col) => (
                  <th key={col.key} className="py-4 px-2 text-center text-slate-400 font-medium text-xs">
                    {isRussian ? col.labelRu : col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map((competitor, index) => (
                <motion.tr
                  key={competitor.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.08 }}
                  className={`border-b border-white/5 ${
                    competitor.isMain 
                      ? 'bg-gradient-to-r from-primary/20 via-primary/10 to-transparent' 
                      : 'hover:bg-white/5'
                  }`}
                >
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-2">
                      {competitor.isMain && (
                        <Crown className="w-4 h-4 text-primary" />
                      )}
                      <span className={`font-semibold ${competitor.isMain ? 'text-primary text-lg' : 'text-white'}`}>
                        {competitor.name}
                      </span>
                    </div>
                  </td>
                  {columns.map((col) => {
                    const hasFeature = competitor[col.key as keyof typeof competitor];
                    return (
                      <td key={col.key} className="py-4 px-2 text-center">
                        {hasFeature ? (
                          <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
                            competitor.isMain ? 'bg-primary/30' : 'bg-green-500/20'
                          }`}>
                            <Check className={`w-4 h-4 ${competitor.isMain ? 'text-primary' : 'text-green-400'}`} />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/5">
                            <X className="w-4 h-4 text-slate-600" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Key differentiators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            {
              title: isRussian ? 'Единая платформа' : 'One Platform',
              desc: isRussian ? '15+ вертикалей вместо 7+ приложений' : '15+ verticals instead of 7+ apps',
              color: 'border-blue-500/50 bg-blue-500/10',
            },
            {
              title: isRussian ? 'UNO Team 24/7' : 'UNO Team 24/7',
              desc: isRussian ? 'Реальные люди на месте для любых задач' : 'Real humans on ground for any task',
              color: 'border-purple-500/50 bg-purple-500/10',
            },
            {
              title: isRussian ? 'RU + EN + TH' : 'RU + EN + TH',
              desc: isRussian ? 'Локализация для русскоязычных экспатов' : 'Localized for Russian-speaking expats',
              color: 'border-green-500/50 bg-green-500/10',
            },
          ].map((diff, index) => (
            <motion.div
              key={diff.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1 }}
              className={`p-4 rounded-xl border ${diff.color}`}
            >
              <h4 className="font-semibold text-white mb-1">{diff.title}</h4>
              <p className="text-sm text-slate-400">{diff.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </SlideContent>
    </PitchSlide>
  );
}
