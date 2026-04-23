import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChannelStatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

export function ChannelStatsCard({ icon, label, value, color }: ChannelStatsCardProps) {
  return (
    <Card>
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
