/**
 * LandingLayout — Unified wrapper for landing/promo pages.
 * 
 * Used by: Relocate, Wedding, Kids, Nomad Guide
 * 
 * Provides:
 * - Gradient hero section with back button, icon, title, subtitle
 * - Optional CTA in hero
 * - max-w-lg content area
 * - Optional WhatsApp floating CTA
 */

import React, { ReactNode } from 'react';
import { LucideIcon, MessageCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LandingLayoutProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  gradient: string; // e.g. "from-indigo-700 via-indigo-600 to-violet-700"
  fallbackPath?: string;
  heroCta?: { label: string; onClick: () => void };
  whatsappUrl?: string;
  whatsappLabel?: string;
  children: ReactNode;
  className?: string;
}

export function LandingLayout({
  icon: Icon,
  title,
  subtitle,
  gradient,
  fallbackPath = '/',
  heroCta,
  whatsappUrl,
  whatsappLabel,
  children,
  className,
}: LandingLayoutProps) {
  return (
    <AppLayout>
      <div className={cn("pb-24", className)}>
        {/* Hero */}
        <div className={cn("relative bg-gradient-to-br p-6 pt-16 pb-12", gradient)}>
          <BackButton fallbackPath={fallbackPath} variant="overlay" className="absolute top-4 left-4" />
          <div className="text-white text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold font-display mb-2">{title}</h1>
            <p className="text-white/80 text-sm mb-6">{subtitle}</p>
            {heroCta && (
              <Button
                onClick={heroCta.onClick}
                className="bg-white text-foreground hover:bg-white/90 font-semibold gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                {heroCta.label}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {children}

        {/* Bottom CTA */}
        {whatsappUrl && (
          <div className="px-4 py-8 text-center">
            <Button
              size="lg"
              onClick={() => window.open(whatsappUrl, '_blank')}
              className="gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              {whatsappLabel || 'WhatsApp'}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
