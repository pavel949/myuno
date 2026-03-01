/**
 * OwnerStaysTab — Book zero-price owner stays and manage them.
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerStays } from '@/hooks/useOwnerStays';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus, X, Home } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
  propertyId: string;
}

export function OwnerStaysTab({ propertyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { stays, isLoading, createStay, isCreating, cancelStay, isCancelling } = useOwnerStays(propertyId);
  const [showForm, setShowForm] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [notes, setNotes] = useState('');

  const handleCreate = async () => {
    if (!checkIn || !checkOut) return;
    try {
      await createStay({ checkIn, checkOut, notes: notes || undefined });
      setShowForm(false);
      setCheckIn('');
      setCheckOut('');
      setNotes('');
    } catch {
      // handled by hook
    }
  };

  const upcoming = stays.filter(s => !isPast(parseISO(s.check_out)));
  const past = stays.filter(s => isPast(parseISO(s.check_out)));

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground text-sm">{isRu ? 'Загрузка...' : 'Loading...'}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add stay button */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          {isRu ? 'Забронировать визит' : 'Book a Stay'}
        </Button>
      )}

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Home className="w-4 h-4" />
              {isRu ? 'Новый визит' : 'New Stay'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isRu ? 'Заезд' : 'Check-in'}</Label>
                <Input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isRu ? 'Выезд' : 'Check-out'}</Label>
                <Input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || format(new Date(), 'yyyy-MM-dd')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isRu ? 'Заметки' : 'Notes'}</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={isRu ? 'Необязательно...' : 'Optional...'} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!checkIn || !checkOut || isCreating} size="sm">
                {isRu ? 'Подтвердить' : 'Confirm'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming stays */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{isRu ? 'Предстоящие' : 'Upcoming'}</h3>
          {upcoming.map(stay => (
            <Card key={stay.id}>
              <CardContent className="py-3 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {format(parseISO(stay.check_in), 'dd MMM')} — {format(parseISO(stay.check_out), 'dd MMM yyyy')}
                  </p>
                  {stay.notes && <p className="text-xs text-muted-foreground truncate">{stay.notes}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => cancelStay(stay.id)}
                  disabled={isCancelling}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Past stays */}
      {past.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{isRu ? 'Прошлые' : 'Past'}</h3>
          {past.map(stay => (
            <Card key={stay.id} className="opacity-60">
              <CardContent className="py-3 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    {format(parseISO(stay.check_in), 'dd MMM')} — {format(parseISO(stay.check_out), 'dd MMM yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {stays.length === 0 && !showForm && (
        <div className="py-8 text-center text-muted-foreground text-sm">
          <Home className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>{isRu ? 'У вас нет забронированных визитов' : 'No stays booked yet'}</p>
        </div>
      )}
    </div>
  );
}
