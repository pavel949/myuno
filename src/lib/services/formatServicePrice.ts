/** Present the stored denomination without conversion or a fabricated price. */
export function formatServicePrice(price: number | null | undefined, currency: string | null | undefined, language: string): string {
  const ru = language === 'ru';
  if (price == null || !Number.isFinite(price)) return ru ? 'Цена по запросу' : language === 'th' ? 'ราคาตามคำขอ' : 'Price on request';
  const amount = price.toLocaleString(ru ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-GB');
  const code = currency?.trim().toUpperCase();
  return code ? `${amount} ${code}` : `${amount} (${ru ? 'валюта не указана' : 'currency unavailable'})`;
}
