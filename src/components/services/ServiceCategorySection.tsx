import type { ReactNode } from 'react';

export function ServiceCategorySection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section aria-labelledby={id} className="space-y-3">
    <h3 id={id} className="text-base font-medium">{title}</h3>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
  </section>;
}
