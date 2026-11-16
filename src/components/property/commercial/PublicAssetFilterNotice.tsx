import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { Button } from '@/components/ui/button';

export function PublicAssetFilterNotice({ issue, onReset }: { issue: 'invalid' | 'unsupported'; onReset: () => void }) {
  const { language } = useLanguage();
  return <div role="alert" className="space-y-3 border border-border p-4">
    <p>{pickLang(language, issue === 'invalid' ? {
      ru: 'Проверьте параметры поиска: значения должны быть допустимыми, а нижняя граница не должна превышать верхнюю.',
      en: 'Check your search: values must be valid and minimums cannot exceed maximums.',
      th: 'ตรวจสอบตัวกรอง ค่าต้องถูกต้องและค่าต่ำสุดต้องไม่เกินค่าสูงสุด',
    } : {
      ru: 'Эти условия уточняются по запросу. Сбросьте параметры, чтобы искать по опубликованным сведениям.',
      en: 'These terms require an enquiry. Reset the filters to search published information.',
      th: 'เงื่อนไขนี้ต้องสอบถามเพิ่มเติม รีเซ็ตตัวกรองเพื่อค้นหาข้อมูลที่เผยแพร่',
    })}</p>
    <Button variant="outline" onClick={onReset}>{pickLang(language, { ru: 'Сбросить параметры', en: 'Reset filters', th: 'รีเซ็ตตัวกรอง' })}</Button>
  </div>;
}
