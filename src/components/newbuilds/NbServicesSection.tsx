/**
 * NbServicesSection — Cross-module service links for project detail sidebar
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, Umbrella, Calculator, ClipboardCheck, Home, ArrowRight } from 'lucide-react';

const SERVICES = [
  { icon: FileText, label: 'Проверка контракта', desc: 'Юридический анализ договора', path: '/legal/contract-analysis' },
  { icon: Shield, label: 'Due Diligence', desc: 'Чек-лист безопасной покупки', path: '/newbuilds/due-diligence' },
  { icon: Calculator, label: 'ROI Калькулятор', desc: 'Рассчитать доходность', path: '/newbuilds/calculator' },
  { icon: Umbrella, label: 'Страхование', desc: 'Защита инвестиций', path: '/insurance' },
  { icon: Home, label: 'Управление', desc: 'Управляющие компании', path: '/mc' },
  { icon: ClipboardCheck, label: 'Виза и ВНЖ', desc: 'Планирование проживания', path: '/legal/visa' },
];

export function NbServicesSection() {
  return (
    <div className="space-y-3">
      <p className="nb-label">СЕРВИСЫ myUNO</p>
      {SERVICES.map(service => {
        const Icon = service.icon;
        return (
          <Link
            key={service.path}
            to={service.path}
            className="nb-glass p-3.5 flex items-center gap-3 group hover:border-[hsl(var(--nb-gold)/0.5)] transition-all block"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--nb-gold) / 0.1)' }}>
              <Icon className="w-4 h-4" style={{ color: 'hsl(var(--nb-gold))' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium" style={{ color: 'hsl(var(--nb-text))' }}>{service.label}</p>
              <p className="text-[10px]" style={{ color: 'hsl(var(--nb-muted))' }}>{service.desc}</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: 'hsl(var(--nb-gold))' }} />
          </Link>
        );
      })}
    </div>
  );
}
