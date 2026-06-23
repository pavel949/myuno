/**
 * Minimal iCalendar (.ics) generation for "Add to calendar" on bookings.
 * Pure string builder — no external dependency.
 */

function toIcsDate(d: Date): string {
  // UTC basic format: YYYYMMDDTHHMMSSZ
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildIcs(opts: {
  title: string;
  start: Date;
  durationMinutes?: number;
  location?: string;
  description?: string;
}): string {
  const end = new Date(opts.start.getTime() + (opts.durationMinutes ?? 60) * 60_000);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@myuno.app`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//myUNO//Thai Services//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(opts.start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcs(opts.title)}`,
    opts.location ? `LOCATION:${escapeIcs(opts.location)}` : '',
    opts.description ? `DESCRIPTION:${escapeIcs(opts.description)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

export function downloadIcs(ics: string, filename = 'booking.ics'): void {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
