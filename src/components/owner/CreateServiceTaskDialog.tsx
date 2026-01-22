import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOperationalTasks, CreateTaskInput } from '@/hooks/useOperationalTasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  CalendarIcon, 
  LogIn, 
  LogOut, 
  Sparkles, 
  Wrench, 
  Search, 
  Gauge,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface OwnerProperty {
  id: string;
  title: string;
  title_ru?: string | null;
}

interface CreateServiceTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: OwnerProperty[];
  defaultPropertyId?: string;
  defaultDate?: Date;
}

const TASK_TYPES = [
  { value: 'cleaning', icon: Sparkles, label: 'Cleaning', labelRu: 'Уборка', color: 'text-info' },
  { value: 'maintenance', icon: Wrench, label: 'Maintenance', labelRu: 'Ремонт', color: 'text-orange-500' },
  { value: 'inspection', icon: Search, label: 'Inspection', labelRu: 'Осмотр', color: 'text-purple-500' },
  { value: 'meter_reading', icon: Gauge, label: 'Meter Reading', labelRu: 'Счётчики', color: 'text-cyan-500' },
  { value: 'check_in', icon: LogIn, label: 'Check-in', labelRu: 'Заезд', color: 'text-success' },
  { value: 'check_out', icon: LogOut, label: 'Check-out', labelRu: 'Выезд', color: 'text-warning' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', labelRu: 'Низкий' },
  { value: 'normal', label: 'Normal', labelRu: 'Обычный' },
  { value: 'high', label: 'High', labelRu: 'Высокий' },
  { value: 'urgent', label: 'Urgent', labelRu: 'Срочный' },
];

export function CreateServiceTaskDialog({
  open,
  onOpenChange,
  properties,
  defaultPropertyId,
  defaultDate = new Date(),
}: CreateServiceTaskDialogProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const { createTask } = useOperationalTasks();

  const [formData, setFormData] = useState({
    property_id: defaultPropertyId || '',
    task_type: 'cleaning' as CreateTaskInput['task_type'],
    title: '',
    title_ru: '',
    description: '',
    scheduled_date: defaultDate,
    scheduled_time: '',
    priority: 'normal' as CreateTaskInput['priority'],
    assigned_to: '',
    notes: '',
  });

  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleSubmit = async () => {
    if (!formData.property_id) {
      toast.error(isRu ? 'Выберите объект' : 'Select a property');
      return;
    }

    if (!formData.title && !formData.title_ru) {
      // Auto-generate title based on task type
      const taskType = TASK_TYPES.find(t => t.value === formData.task_type);
      formData.title = taskType?.label || formData.task_type;
      formData.title_ru = taskType?.labelRu || formData.task_type;
    }

    try {
      await createTask.mutateAsync({
        property_id: formData.property_id,
        task_type: formData.task_type,
        title: formData.title || TASK_TYPES.find(t => t.value === formData.task_type)?.label || '',
        title_ru: formData.title_ru || undefined,
        description: formData.description || undefined,
        scheduled_date: format(formData.scheduled_date, 'yyyy-MM-dd'),
        scheduled_time: formData.scheduled_time || undefined,
        priority: formData.priority,
        assigned_to: formData.assigned_to || undefined,
        notes: formData.notes || undefined,
      });

      toast.success(isRu ? 'Задача создана' : 'Task created');
      onOpenChange(false);
      
      // Reset form
      setFormData({
        property_id: defaultPropertyId || '',
        task_type: 'cleaning',
        title: '',
        title_ru: '',
        description: '',
        scheduled_date: new Date(),
        scheduled_time: '',
        priority: 'normal',
        assigned_to: '',
        notes: '',
      });
    } catch (error) {
      toast.error(isRu ? 'Ошибка при создании задачи' : 'Error creating task');
    }
  };

  const selectedTaskType = TASK_TYPES.find(t => t.value === formData.task_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRu ? 'Новая сервисная задача' : 'New Service Task'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Property Selection */}
          <div>
            <Label>{isRu ? 'Объект' : 'Property'} *</Label>
            <Select 
              value={formData.property_id} 
              onValueChange={(v) => setFormData(f => ({ ...f, property_id: v }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} />
              </SelectTrigger>
              <SelectContent>
                {properties.filter(p => p.id).map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {isRu ? (property.title_ru || property.title) : property.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Type Selection */}
          <div>
            <Label>{isRu ? 'Тип задачи' : 'Task Type'}</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {TASK_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={formData.task_type === type.value ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      "flex flex-col h-auto py-2 gap-1",
                      formData.task_type !== type.value && type.color
                    )}
                    onClick={() => setFormData(f => ({ ...f, task_type: type.value }))}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{isRu ? type.labelRu : type.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRu ? 'Дата' : 'Date'}</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !formData.scheduled_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduled_date ? (
                      format(formData.scheduled_date, 'dd.MM.yyyy')
                    ) : (
                      isRu ? 'Выберите дату' : 'Pick a date'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.scheduled_date}
                    onSelect={(date) => {
                      if (date) {
                        setFormData(f => ({ ...f, scheduled_date: date }));
                        setDatePickerOpen(false);
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>{isRu ? 'Время' : 'Time'}</Label>
              <div className="relative mt-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData(f => ({ ...f, scheduled_time: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Title (optional) */}
          <div>
            <Label>{isRu ? 'Название (опционально)' : 'Title (optional)'}</Label>
            <Input
              value={isRu ? formData.title_ru : formData.title}
              onChange={(e) => setFormData(f => ({ 
                ...f, 
                [isRu ? 'title_ru' : 'title']: e.target.value 
              }))}
              placeholder={selectedTaskType ? (isRu ? selectedTaskType.labelRu : selectedTaskType.label) : ''}
              className="mt-1"
            />
          </div>

          {/* Priority */}
          <div>
            <Label>{isRu ? 'Приоритет' : 'Priority'}</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(v) => setFormData(f => ({ ...f, priority: v as any }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {isRu ? opt.labelRu : opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label>{isRu ? 'Описание' : 'Description'}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
              placeholder={isRu ? 'Подробности задачи...' : 'Task details...'}
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Quick Date Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData(f => ({ ...f, scheduled_date: new Date() }))}
            >
              {isRu ? 'Сегодня' : 'Today'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData(f => ({ ...f, scheduled_date: addDays(new Date(), 1) }))}
            >
              {isRu ? 'Завтра' : 'Tomorrow'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData(f => ({ ...f, scheduled_date: addDays(new Date(), 7) }))}
            >
              {isRu ? 'Через неделю' : 'In a week'}
            </Button>
          </div>

          {/* Submit */}
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={createTask.isPending}
          >
            {createTask.isPending 
              ? (isRu ? 'Создание...' : 'Creating...') 
              : (isRu ? 'Создать задачу' : 'Create Task')
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
