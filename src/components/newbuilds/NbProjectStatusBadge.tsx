import React from 'react';

type Status = 'under_construction' | 'completed' | 'upcoming' | 'offplan' | string;

const statusMap: Record<string, { label: string; className: string }> = {
  under_construction: { label: 'Строится', className: 'nb-badge nb-badge-construction' },
  offplan: { label: 'Новостройка', className: 'nb-badge nb-badge-offplan' },
  completed: { label: 'Сдан', className: 'nb-badge nb-badge-completed' },
  upcoming: { label: 'Скоро', className: 'nb-badge nb-badge-upcoming' },
};

export function NbProjectStatusBadge({ status }: { status: Status }) {
  const s = statusMap[status] || statusMap.under_construction;
  return <span className={s.className}>{s.label}</span>;
}
