import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Calendar, Clock, Users, Briefcase, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { transliterate } from '@/lib/utils';
import type { BaseStepProps } from './types';

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

interface StepDetailsProps extends BaseStepProps {
  meetingSignManuallyEditedRef: React.MutableRefObject<boolean>;
}

export function StepDetails({ formData, setFormData, language, meetingSignManuallyEditedRef }: StepDetailsProps) {
  return (
    <motion.div
      key="step-details"
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Flight */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Plane className="w-4 h-4" />
          {language === 'ru' ? 'Номер рейса' : 'Flight Number'}
        </Label>
        <Input
          value={formData.flightNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, flightNumber: e.target.value.toUpperCase() }))}
          placeholder="TG 925"
          className="h-11"
        />
      </div>

      {/* Date / Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {language === 'ru' ? 'Дата' : 'Date'}
          </Label>
          <Input
            type="date"
            value={formData.arrivalDate}
            onChange={(e) => setFormData(prev => ({ ...prev, arrivalDate: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {language === 'ru' ? 'Время' : 'Time'}
          </Label>
          <Input
            type="time"
            value={formData.arrivalTime}
            onChange={(e) => setFormData(prev => ({ ...prev, arrivalTime: e.target.value }))}
            className="h-11"
          />
        </div>
      </div>

      {/* Pax / Luggage */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            {language === 'ru' ? 'Пассажиры' : 'Passengers'}
          </Label>
          <Input
            type="number"
            min="1"
            max="8"
            value={formData.passengers}
            onChange={(e) => setFormData(prev => ({ ...prev, passengers: e.target.value }))}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            {language === 'ru' ? 'Багаж' : 'Luggage'}
          </Label>
          <Input
            type="number"
            min="0"
            max="10"
            value={formData.luggage}
            onChange={(e) => setFormData(prev => ({ ...prev, luggage: e.target.value }))}
            className="h-11"
          />
        </div>
      </div>

      {/* Contacts */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <User className="w-4 h-4" />
          {language === 'ru' ? 'Контакты' : 'Contact Info'}
        </Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={language === 'ru' ? 'Ваше имя' : 'Your name'}
          className="h-11"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder={language === 'ru' ? 'Телефон' : 'Phone'}
            className="h-11"
          />
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
            className="h-11"
          />
        </div>
      </div>

      {/* Meeting sign — only when arriving */}
      {formData.direction === 'from-airport' && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">
            {language === 'ru' ? 'Имя на табличке' : 'Name on sign'}
          </Label>
          <Input
            value={formData.meetingSignName}
            onChange={(e) => {
              meetingSignManuallyEditedRef.current = true;
              setFormData(prev => ({ ...prev, meetingSignName: e.target.value }));
            }}
            placeholder={language === 'ru' ? 'Латиницей, как в паспорте' : 'In Latin letters'}
            className="h-11"
          />
          {!formData.meetingSignName && formData.name && (
            <p className="text-[11px] text-muted-foreground">
              {language === 'ru' ? 'Подставится автоматически: ' : 'Will auto-fill as: '}
              <span className="font-mono">{transliterate(formData.name)}</span>
            </p>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          {language === 'ru' ? 'Примечания' : 'Notes'}
        </Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder={language === 'ru' ? 'Детские кресла, особые пожелания...' : 'Child seats, special requests...'}
          className="resize-none"
          rows={2}
        />
      </div>
    </motion.div>
  );
}
