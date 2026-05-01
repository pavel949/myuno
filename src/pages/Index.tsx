/**
 * Index — myUNO Home router.
 *
 * Тонкий switch по feature_flag:home_simplified_v1:
 *  - ON  → IndexSimplified (5 зон, дефолт)
 *  - OFF → IndexLegacy (15 блоков, regression-safe)
 *
 * Каждый layout вынесен в отдельный lazy-чанк, поэтому в основной бандл
 * попадает только тот, что реально рендерится. См. .lovable/plan.md, Шаг 1.
 */
import React, { Suspense, lazy } from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { LoadingState } from '@/components/uno/LoadingSpinner';

const IndexSimplified = lazy(() => import('./IndexSimplified'));
const IndexLegacy = lazy(() => import('./IndexLegacy'));

const Index: React.FC = () => {
  const simplifiedOn = useFeatureFlag('home_simplified_v1', true);
  const Body = simplifiedOn ? IndexSimplified : IndexLegacy;

  return (
    <Suspense fallback={<LoadingState />}>
      <Body />
    </Suspense>
  );
};

export default Index;
