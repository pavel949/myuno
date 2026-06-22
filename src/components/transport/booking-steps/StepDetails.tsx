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
          {language === 'ru' ? 'Номер рейса' : language === 'th' ? 'หมายเลขเที่ยวบิน' : 'Flight Number'}
          <span className="text-accent">*</span>
        </Label>
        <Input
          value={formData.flightNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, flightNumber: e.target.value.toUpperCase() }))}
          placeholder={language === 'ru' ? 'например, TG 925' : language === 'th' ? 'เช่น TG 925' : 'e.g. TG 925'}
          className="h-11"
        />
        <p className="text-[11px] text-muted-foreground">
          {language === 'ru'
            ? 'Обязательное поле — водитель отслеживает рейс по номеру'
            : language === 'th'
            ? 'จำเป็นต้องกรอก — คนขับจะติดตามเที่ยวบินของคุณจากหมายเลขนี้'
            : 'Required — the driver tracks your flight by number'}
        </p>
      </div>


      {/* Date / Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {language === 'ru' ? 'Дата' : language === 'th' ? 'วันที่' : 'Date'}
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
            {language === 'ru' ? 'Время' : language === 'th' ? 'เวลา' : 'Time'}
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
            {language === 'ru' ? 'Пассажиры' : language === 'th' ? 'ผู้โดยสาร' : 'Passengers'}
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
            {language === 'ru' ? 'Багаж' : language === 'th' ? 'สัมภาระ' : 'Luggage'}
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
          {language === 'ru' ? 'Контакты' : language === 'th' ? 'ข้อมูลติดต่อ' : 'Contact Info'}
        </Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={language === 'ru' ? 'Ваше имя' : language === 'th' ? 'ชื่อของคุณ' : 'Your name'}
          className="h-11"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder={language === 'ru' ? 'Телефон' : language === 'th' ? 'โทรศัพท์' : 'Phone'}
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
            {language === 'ru' ? 'Имя на табличке' : language === 'th' ? 'ชื่อบนป้ายต้อนรับ' : 'Name on sign'}
          </Label>
          <Input
            value={formData.meetingSignName}
            onChange={(e) => {
              meetingSignManuallyEditedRef.current = true;
              setFormData(prev => ({ ...prev, meetingSignName: e.target.value }));
            }}
            placeholder={language === 'ru' ? 'Латиницей, как в паспорте' : language === 'th' ? 'เป็นอักษรละติน ตามหนังสือเดินทาง' : 'In Latin letters'}
            className="h-11"
          />
          {!formData.meetingSignName && formData.name && (
            <p className="text-[11px] text-muted-foreground">
              {language === 'ru' ? 'Подставится автоматически: ' : language === 'th' ? 'จะกรอกให้อัตโนมัติเป็น: ' : 'Will auto-fill as: '}
              <span className="font-mono">{transliterate(formData.name)}</span>
            </p>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          {language === 'ru' ? 'Примечания' : language === 'th' ? 'หมายเหตุ' : 'Notes'}
        </Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder={language === 'ru' ? 'Детские кресла, особые пожелания...' : language === 'th' ? 'เบาะนั่งเด็ก ความต้องการพิเศษ...' : 'Child seats, special requests...'}
          className="resize-none"
          rows={2}
        />
      </div>
    </motion.div>
  );
}
