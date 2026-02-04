import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface SocialProofBadgeProps {
  count: number;
  suffix?: { en: string; ru: string };
  className?: string;
  animate?: boolean;
}

export function SocialProofBadge({ 
  count, 
  suffix = { en: 'deals', ru: 'сделок' },
  className,
  animate = true,
}: SocialProofBadgeProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [displayCount, setDisplayCount] = useState(animate ? 0 : count);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!animate || !isVisible) return;

    const duration = 1500;
    const steps = 30;
    const increment = count / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= count) {
        setDisplayCount(count);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [count, animate, isVisible]);

  return (
    <div 
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
        "bg-primary/10 text-primary text-[10px] font-medium",
        className
      )}
    >
      <span>{displayCount}+</span>
      <span>{isRu ? suffix.ru : suffix.en}</span>
    </div>
  );
}
