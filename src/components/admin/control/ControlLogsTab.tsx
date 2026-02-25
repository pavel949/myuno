import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export function ControlLogsTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  // Mock log entries for demo
  const logs = [
    { id: 1, type: 'info', message: 'System started', time: '10:30:45' },
    { id: 2, type: 'success', message: 'Database backup completed', time: '10:28:12' },
    { id: 3, type: 'warning', message: 'High memory usage detected', time: '10:25:03' },
    { id: 4, type: 'info', message: 'User login: admin@uno.app', time: '10:20:00' },
    { id: 5, type: 'success', message: 'Cache cleared successfully', time: '10:15:22' },
  ];

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <FileText className="h-4 w-4 text-info" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isRussian ? 'Системные логи' : 'System Logs'}
            </CardTitle>
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                {getLogIcon(log.type)}
                <span className="flex-1 text-sm">{log.message}</span>
                <span className="text-xs text-muted-foreground font-mono">{log.time}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isRussian 
                ? 'Логи обновляются в реальном времени' 
                : 'Logs update in real-time'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
