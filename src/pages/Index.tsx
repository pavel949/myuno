/**
 * Index — myUNO Home.
 *
 * Wave-1 IA cleanup (2026-06): IndexLegacy убран из критического пути.
 * Главная теперь рендерит только IndexSimplified (5-зонный layout).
 * История 15-блочного варианта живёт в git до коммита Wave-1.
 */
import React, { Suspense, lazy } from 'react';
import { LoadingState } from '@/components/uno/LoadingSpinner';

const IndexSimplified = lazy(() => import('./IndexSimplified'));

const Index: React.FC = () => (
  <Suspense fallback={<LoadingState />}>
    <IndexSimplified />
  </Suspense>
);

export default Index;
