/**
 * Shared types for AirportTransferBooking step components.
 * Keep state & validation in the parent — steps are presentation only.
 */
import type { Dispatch, SetStateAction } from 'react';

export type TransferDirection = 'from-airport' | 'to-airport';
export type TransferPaymentMethod = 'stripe' | 'cash' | 'concierge_advance';

export interface TransferFormData {
  direction: TransferDirection;
  terminal: string;
  destinationAddress: string;
  selectedDestinationId: string;
  flightNumber: string;
  arrivalDate: string;
  arrivalTime: string;
  passengers: string;
  luggage: string;
  vehicleType: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  meetingSignName: string;
  paymentMethod: TransferPaymentMethod;
}

export interface BaseStepProps {
  formData: TransferFormData;
  setFormData: Dispatch<SetStateAction<TransferFormData>>;
  language: 'ru' | 'en' | string;
}
