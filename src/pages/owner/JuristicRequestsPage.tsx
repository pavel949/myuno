import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useJuristicRequests, requestStatusLabels, requestTypeLabels } from '@/hooks/useJuristicRequests';
import { JuristicRequestForm } from '@/components/owner/JuristicRequestForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { format } from 'date-fns';

export default function JuristicRequestsPage() {
  const { id: propertyId } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { requests, stats, isLoading } = useJuristicRequests(propertyId);

  if (isLoading) {
    return <div className="p-6 animate-pulse"><div className="h-48 bg-muted rounded-lg" /></div>;
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton fallbackPath={APP_ROUTES.OWNER} variant="ghost" />
          <h1 className="text-xl font-bold">
            {isRu ? 'Запросы к УК' : 'Building Requests'}
          </h1>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isRu ? 'Новый запрос' : 'New Request'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isRu ? 'Создать запрос' : 'Create Request'}</DialogTitle>
            </DialogHeader>
            <JuristicRequestForm 
              propertyId={propertyId!} 
              onSuccess={() => setIsCreateOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">{isRu ? 'Всего' : 'Total'}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">{isRu ? 'Ожидают' : 'Pending'}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-info">{stats.inProgress}</div>
          <div className="text-xs text-muted-foreground">{isRu ? 'В работе' : 'In Progress'}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-success">{stats.completed}</div>
          <div className="text-xs text-muted-foreground">{isRu ? 'Выполнено' : 'Done'}</div>
        </Card>
      </div>

      {/* Request List */}
      {requests && requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((req) => {
            const statusLabel = requestStatusLabels[req.status];
            const typeLabel = requestTypeLabels[req.request_type];
            
            return (
              <Card key={req.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-mono">
                          {req.request_number}
                        </span>
                        <Badge 
                          variant={req.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {isRu ? statusLabel.ru : statusLabel.en}
                        </Badge>
                        {req.requires_payment && req.total_amount && (
                          <Badge variant="outline" className="text-xs text-success">
                            ฿{req.total_amount.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium line-clamp-1">{req.subject}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {isRu ? typeLabel.ru : typeLabel.en}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {format(new Date(req.created_at), 'dd.MM.yyyy')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>{isRu ? 'Нет запросов' : 'No requests yet'}</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {isRu ? 'Создать первый запрос' : 'Create first request'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
