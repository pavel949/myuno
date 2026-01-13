import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
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
  { key: 'yachts', label: 'Yachts', labelRu: 'Яхты' },
  { key: 'insurance', label: 'Insurance', labelRu: 'Страхование' },
];

export function CompetitorSlide({ isRussian }: CompetitorSlideProps) {
  return (
    <PitchSlide>
      <SlideTitle>
        {isRussian ? 'Конкурентный анализ' : 'Competitive Analysis'}
      </SlideTitle>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-lg text-slate-300 text-center mb-8"
      >
        {isRussian 
          ? 'UNO — единственное полноценное решение'
          : 'UNO is the only full-stack solution'}
      </motion.p>

      <SlideContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="overflow-x-auto"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">
                  {isRussian ? 'Платформа' : 'Platform'}
                </th>
                {columns.map((col) => (
                  <th key={col.key} className="py-3 px-2 text-slate-400 font-medium text-center">
                    {isRussian ? col.labelRu : col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map((competitor, rowIndex) => (
                <motion.tr
                  key={competitor.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + rowIndex * 0.1 }}
                  className={`border-b border-white/5 ${
                    competitor.isMain ? 'bg-primary/10' : ''
                  }`}
                >
                  <td className={`py-3 px-4 font-medium ${
                    competitor.isMain ? 'text-primary' : 'text-white'
                  }`}>
                    {competitor.name}
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 px-2 text-center">
                      {(competitor as any)[col.key] ? (
                        <Check className={`w-5 h-5 mx-auto ${
                          competitor.isMain ? 'text-primary' : 'text-green-400'
                        }`} />
                      ) : (
                        <X className="w-5 h-5 mx-auto text-slate-600" />
                      )}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Key differentiators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <span className="px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium border border-primary/30">
            {isRussian ? 'Первый на рынке юридических услуг' : 'First-mover in Legal/Visa'}
          </span>
          <span className="px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium border border-primary/30">
            {isRussian ? 'Единственный со страхованием' : 'Only platform with Insurance'}
          </span>
          <span className="px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium border border-primary/30">
            {isRussian ? 'Полный охват вертикалей' : 'Complete vertical coverage'}
          </span>
        </motion.div>
      </SlideContent>
    </PitchSlide>
  );
}
