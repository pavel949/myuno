import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChannelStatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
}

export function ChannelStatsCard({ icon, label, value, color, onClick }: ChannelStatsCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(onClick && 'cursor-pointer hover:bg-muted/50 transition-colors')}
    >
      <CardContent className="pt-4 pb-3">
        <div className={cn("w-10 h-10 rounded-none flex items-center justify-center mb-2", color)}>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
