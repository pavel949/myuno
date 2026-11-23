import { pageFrameClass } from '@/design-system/ecosystemLayout';

/** Public vehicle and yacht detail geometry; applies the established detail frame once. */
export const PUBLIC_LISTING_DETAIL_FRAME = pageFrameClass('detail');

/** Desktop balances a useful commercial rail with readable, shrinkable details. */
export const PUBLIC_LISTING_DETAIL_GRID = 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,29%)] lg:gap-8 xl:gap-12';
export const PUBLIC_LISTING_DETAIL_RAIL = 'lg:sticky lg:top-[calc(var(--consumer-header-height,0px)+1rem)] lg:self-start lg:z-10';
export const PUBLIC_LISTING_DETAIL_MEDIA = 'lg:aspect-auto lg:h-[clamp(26rem,38vw,35rem)]';
