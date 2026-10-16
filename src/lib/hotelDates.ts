/** Today's date (YYYY-MM-DD) in the Asia/Bangkok calendar. */
export function bangkokTodayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now);
}
