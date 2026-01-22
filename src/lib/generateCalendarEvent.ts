// ICS Calendar Event Generator for Property Bookings

interface CalendarEventData {
  title: string;
  location: string;
  checkIn: Date;
  checkOut: Date;
  checkInTime?: string;  // "14:00"
  checkOutTime?: string; // "11:00"
  description: string;
  hostContact?: string;
  bookingId?: string;
}

function formatICSDate(date: Date, time?: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (time) {
    const [hours, minutes] = time.split(':');
    return `${year}${month}${day}T${hours}${minutes}00`;
  }
  
  return `${year}${month}${day}`;
}

function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@myuno.ae`;
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generatePropertyBookingICS(data: CalendarEventData): string {
  const now = new Date();
  const dtstamp = formatICSDate(now, `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
  
  const checkInDateTime = formatICSDate(data.checkIn, data.checkInTime || '14:00');
  const checkOutDateTime = formatICSDate(data.checkOut, data.checkOutTime || '11:00');
  
  // Reminder 1 day before check-in
  const reminderDate = new Date(data.checkIn);
  reminderDate.setDate(reminderDate.getDate() - 1);
  
  const descriptionLines = [
    data.description,
    '',
    data.hostContact ? `Host: ${data.hostContact}` : '',
    data.bookingId ? `Booking: ${data.bookingId}` : '',
    '',
    'Powered by myUNO - uno.ae',
  ].filter(Boolean).join('\\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//myUNO//Property Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:myUNO Booking',
    
    // Check-in Event
    'BEGIN:VEVENT',
    `UID:checkin-${generateUID()}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${checkInDateTime}`,
    `DTEND:${checkInDateTime}`,
    `SUMMARY:🏠 Check-in: ${escapeICS(data.title)}`,
    `LOCATION:${escapeICS(data.location)}`,
    `DESCRIPTION:${escapeICS(descriptionLines)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Check-in tomorrow!',
    'END:VALARM',
    'END:VEVENT',
    
    // Check-out Event
    'BEGIN:VEVENT',
    `UID:checkout-${generateUID()}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${checkOutDateTime}`,
    `DTEND:${checkOutDateTime}`,
    `SUMMARY:🚪 Check-out: ${escapeICS(data.title)}`,
    `LOCATION:${escapeICS(data.location)}`,
    `DESCRIPTION:Remember to check out by ${data.checkOutTime || '11:00'}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Check-out in 2 hours!',
    'END:VALARM',
    'END:VEVENT',
    
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
}

export function downloadICSFile(icsContent: string, filename: string = 'booking.ics'): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
