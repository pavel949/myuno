import type { MutableRefObject } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookingField } from '@/components/booking/BookingField';
import { bangkokTodayISO } from '@/lib/hotelDates';
import { PHUKET_TIME_ZONE } from '@/lib/services/airportRequestValidation';
import type { BaseStepProps, TransferFormData } from './types';

interface StepDetailsProps extends BaseStepProps {
  meetingSignManuallyEditedRef: MutableRefObject<boolean>;
  maxPassengers: number;
  errors: Partial<Record<keyof TransferFormData, string>>;
}

export function StepDetails({ formData, setFormData, language, meetingSignManuallyEditedRef, maxPassengers, errors }: StepDetailsProps) {
  const tr = (en: string, ru: string, th: string) => language === 'ru' ? ru : language === 'th' ? th : en;
  const fromAirport = formData.direction === 'from-airport';

  function field(
    key: keyof TransferFormData,
    label: string,
    options: { type?: string; min?: string | number; max?: number; autoComplete?: string; placeholder?: string } = {},
  ) {
    const id = `transfer-${key}`;
    const error = errors[key];
    return (
      <BookingField id={id} label={label} error={error}>
        <Input id={id} {...options} className="h-11"
          value={formData[key]}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={event => {
            const value = key === 'flightNumber' ? event.target.value.toUpperCase() : event.target.value;
            if (key === 'meetingSignName') meetingSignManuallyEditedRef.current = true;
            setFormData(previous => ({ ...previous, [key]: value }));
          }}
        />
      </BookingField>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
      {field('flightNumber', tr('Flight number', 'Номер рейса', 'หมายเลขเที่ยวบิน'), { placeholder: 'TG925' })}
      <div>
        <p className="mb-2 text-sm text-muted-foreground">{tr('Phuket local time', 'Местное время Пхукета', 'เวลาท้องถิ่นภูเก็ต')} ({PHUKET_TIME_ZONE})</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field('arrivalDate', fromAirport ? tr('Arrival date', 'Дата прилёта', 'วันที่เดินทางถึง') : tr('Pickup date', 'Дата подачи машины', 'วันที่รับผู้โดยสาร'), { type: 'date', min: bangkokTodayISO() })}
          {field('arrivalTime', fromAirport ? tr('Arrival time', 'Время прилёта', 'เวลาที่เดินทางถึง') : tr('Pickup time', 'Время подачи машины', 'เวลารับผู้โดยสาร'), { type: 'time' })}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {field('passengers', tr('Passengers', 'Пассажиры', 'จำนวนผู้โดยสาร'), { type: 'number', min: 1, max: maxPassengers })}
        {field('luggage', tr('Number of bags', 'Количество мест багажа', 'จำนวนสัมภาระ'), { type: 'number', min: 0, max: 10 })}
      </div>
      {field('name', tr('Full name', 'Имя и фамилия', 'ชื่อและนามสกุล'), { autoComplete: 'name' })}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {field('phone', tr('Phone with country code', 'Телефон с кодом страны', 'โทรศัพท์พร้อมรหัสประเทศ'), { type: 'tel', autoComplete: 'tel' })}
        {field('email', tr('Email (optional)', 'Email (необязательно)', 'อีเมล (ไม่บังคับ)'), { type: 'email', autoComplete: 'email' })}
      </div>
      {fromAirport && field('meetingSignName', tr('Name on sign (optional)', 'Имя на табличке (необязательно)', 'ชื่อบนป้าย (ไม่บังคับ)'))}
      <BookingField id="transfer-notes" label={tr('Notes (optional)', 'Примечания (необязательно)', 'หมายเหตุ (ไม่บังคับ)')}>
        <Textarea id="transfer-notes" value={formData.notes} rows={2}
          onChange={event => setFormData(previous => ({ ...previous, notes: event.target.value }))}
          placeholder={tr('Child seats, special requests…', 'Детские кресла, особые пожелания…', 'เบาะนั่งเด็กหรือคำขอพิเศษ…')}
        />
      </BookingField>
    </motion.div>
  );
}
