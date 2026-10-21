import { pickLang } from '@/lib/i18n/pickLang';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  CheckCircle, 
  Clock, 
  Eye, 
  Bell, 
  CalendarCheck,
  Home,
  ArrowRight
} from 'lucide-react';

interface PropertySubmissionSuccessProps {
  propertyId?: string;
  propertyTitle?: string;
  approvalStatus?: 'draft' | 'pending';
  onAddAnother?: () => void;
}

export function PropertySubmissionSuccess({ 
  propertyId, 
  propertyTitle,
  approvalStatus = 'draft',
  onAddAnother,
}: PropertySubmissionSuccessProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const copy = (en: string, ru: string, th: string) => pickLang(language, { en, ru, th });
  const submitted = approvalStatus === 'pending';

  const steps = [
    { icon: Eye, title: submitted ? copy('Submitted for review', 'Отправлен на проверку', 'ส่งตรวจสอบแล้ว') : copy('Saved as draft', 'Сохранён как черновик', 'บันทึกเป็นฉบับร่างแล้ว'), description: copy('The listing is not published in the catalogue', 'Объявление пока не опубликовано в каталоге', 'ประกาศยังไม่เผยแพร่ในแค็ตตาล็อก') },
    { icon: Bell, title: copy('Review and approval', 'Модерация и одобрение', 'ตรวจสอบและอนุมัติ'), description: submitted ? copy('Check the property list for the review result', 'Результат проверки появится в списке объектов', 'ดูผลการตรวจสอบในรายการอสังหาริมทรัพย์') : copy('Submit a completed draft for review', 'Отправьте готовый черновик на проверку', 'ส่งฉบับร่างที่พร้อมแล้วเพื่อตรวจสอบ') },
    { icon: CalendarCheck, title: copy('Publication after review', 'Публикация после проверки', 'เผยแพร่หลังตรวจสอบ'), description: copy('Publication requires approval and publication authority', 'Для публикации нужны одобрение и право публикации', 'การเผยแพร่ต้องได้รับอนุมัติและมีสิทธิ์เผยแพร่') },
  ];

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-md w-full flex flex-col items-center">
        {/* Animated success icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1
          }}
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="absolute inset-0 bg-success/20 rounded-full blur-xl"
            />
            <CheckCircle className="h-24 w-24 text-success relative z-10" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1 
          className="text-2xl font-bold mt-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {copy('Property saved!', 'Объект сохранён!', 'บันทึกอสังหาริมทรัพย์แล้ว!')}
        </motion.h1>

        <motion.p 
          className="text-center text-muted-foreground mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {submitted ? copy('Property submitted for administrator review', 'Объект отправлен на проверку администратору', 'ส่งอสังหาริมทรัพย์ให้ผู้ดูแลตรวจสอบแล้ว') : copy('Draft saved. It has not been submitted for review.', 'Черновик сохранён. Проверка ещё не запрошена.', 'บันทึกฉบับร่างแล้ว ยังไม่ได้ส่งตรวจสอบ')}
        </motion.p>

        {/* Property name if available */}
        {propertyTitle && (
          <motion.p 
            className="text-sm text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            "{propertyTitle}"
          </motion.p>
        )}

        {/* Time indicator card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full mt-6"
        >
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {submitted ? copy('Awaiting review', 'Ожидает проверки', 'รอการตรวจสอบ') : copy('Continue editing', 'Продолжите редактирование', 'แก้ไขต่อ')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {copy('Check the property list for the current status', 'Статус доступен в списке объектов', 'ดูสถานะปัจจุบันในรายการอสังหาริมทรัพย์')}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Steps */}
        <motion.div 
          className="w-full mt-6 space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm font-medium text-muted-foreground">
            {copy('What happens next:', 'Что будет дальше:', 'ขั้นตอนต่อไป:')}
          </p>
          
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <Card className="p-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <step.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {index + 1}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Protection period info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="w-full mt-4"
        >
          <Card className="p-3 bg-muted/50">
            <p className="text-xs text-muted-foreground text-center">
              {copy('The listing appears in the catalogue only after approval and publication.', 'Объявление появляется в каталоге только после одобрения и публикации.', 'ประกาศจะแสดงในแค็ตตาล็อกหลังได้รับอนุมัติและเผยแพร่แล้วเท่านั้น')}
            </p>
          </Card>
        </motion.div>

        {/* Action buttons */}
        <motion.div 
          className="w-full mt-8 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          {propertyId && (
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate(`/mc/properties/${propertyId}/editor`)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {copy('Open property', 'Открыть объект', 'เปิดอสังหาริมทรัพย์')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          <Button 
            variant={propertyId ? 'outline' : 'default'}
            className="w-full" 
            size="lg"
            onClick={() => navigate('/mc/properties')}
          >
            <Home className="h-4 w-4 mr-2" />
            {copy('My properties', 'Мои объекты', 'อสังหาริมทรัพย์ของฉัน')}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              if (onAddAnother) {
                onAddAnother();
              } else {
                navigate('/mc/properties/new');
              }
            }}
          >
            {copy('Add another property', 'Добавить ещё объект', 'เพิ่มอสังหาริมทรัพย์อีกแห่ง')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
