import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Campaign, CampaignFormData, CampaignChannel } from '@/types/marketing';
import { GOAL_LABELS, SEGMENT_LABELS, CHANNEL_LABELS } from '@/types/marketing';

const campaignFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  goal: z.enum(['awareness', 'acquisition', 'activation', 'retention', 'referral']),
  target_segment: z.enum(['b2c_users', 'providers', 'owners', 'partners']),
  channels: z.array(z.string()).min(1, 'Select at least one channel'),
  budget_total: z.number().min(1, 'Budget must be positive'),
  budget_daily_cap: z.number().optional(),
  budget_currency: z.enum(['USD', 'THB', 'RUB']),
  start_date: z.date(),
  end_date: z.date().optional(),
  target_leads: z.number().optional(),
  target_conversions: z.number().optional(),
  target_cac: z.number().optional(),
});

type FormValues = z.infer<typeof campaignFormSchema>;

interface CampaignFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign | null;
  onSubmit: (data: CampaignFormData) => void;
  isLoading?: boolean;
}

const CHANNELS: CampaignChannel[] = ['google', 'meta', 'tiktok', 'email', 'whatsapp', 'telegram', 'push'];

export function CampaignFormSheet({
  open,
  onOpenChange,
  campaign,
  onSubmit,
  isLoading,
}: CampaignFormSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isEditing = !!campaign;

  const form = useForm<FormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: campaign?.name || '',
      description: campaign?.description || '',
      goal: campaign?.goal || 'acquisition',
      target_segment: campaign?.target_segment || 'b2c_users',
      channels: campaign?.channels || [],
      budget_total: campaign?.budget?.total || 0,
      budget_daily_cap: campaign?.budget?.daily_cap,
      budget_currency: campaign?.budget?.currency || 'USD',
      start_date: campaign?.schedule?.start_date ? new Date(campaign.schedule.start_date) : new Date(),
      end_date: campaign?.schedule?.end_date ? new Date(campaign.schedule.end_date) : undefined,
      target_leads: campaign?.kpi_targets?.target_leads,
      target_conversions: campaign?.kpi_targets?.target_conversions,
      target_cac: campaign?.kpi_targets?.target_cac,
    },
  });

  // Reset form when campaign changes
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: campaign?.name || '',
        description: campaign?.description || '',
        goal: campaign?.goal || 'acquisition',
        target_segment: campaign?.target_segment || 'b2c_users',
        channels: campaign?.channels || [],
        budget_total: campaign?.budget?.total || 0,
        budget_daily_cap: campaign?.budget?.daily_cap,
        budget_currency: campaign?.budget?.currency || 'USD',
        start_date: campaign?.schedule?.start_date ? new Date(campaign.schedule.start_date) : new Date(),
        end_date: campaign?.schedule?.end_date ? new Date(campaign.schedule.end_date) : undefined,
        target_leads: campaign?.kpi_targets?.target_leads,
        target_conversions: campaign?.kpi_targets?.target_conversions,
        target_cac: campaign?.kpi_targets?.target_cac,
      });
    }
  }, [open, campaign, form]);

  const handleSubmit = (values: FormValues) => {
    const formData: CampaignFormData = {
      name: values.name,
      description: values.description,
      goal: values.goal,
      target_segment: values.target_segment,
      channels: values.channels as CampaignChannel[],
      budget: {
        total: values.budget_total,
        daily_cap: values.budget_daily_cap,
        currency: values.budget_currency,
      },
      schedule: {
        start_date: values.start_date.toISOString(),
        end_date: values.end_date?.toISOString(),
      },
      kpi_targets: {
        target_leads: values.target_leads,
        target_conversions: values.target_conversions,
        target_cac: values.target_cac,
      },
    };
    onSubmit(formData);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing
              ? (isRu ? 'Редактировать кампанию' : 'Edit Campaign')
              : (isRu ? 'Создать кампанию' : 'Create Campaign')}
          </SheetTitle>
          <SheetDescription>
            {isRu
              ? 'Заполните детали маркетинговой кампании'
              : 'Fill in the details for your marketing campaign'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-6">
            {/* Basic Info */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRu ? 'Название кампании' : 'Campaign Name'} *</FormLabel>
                  <FormControl>
                    <Input placeholder={isRu ? 'Summer Phuket Launch 2026' : 'Summer Phuket Launch 2026'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRu ? 'Описание' : 'Description'}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={isRu ? 'Описание целей и стратегии...' : 'Describe goals and strategy...'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRu ? 'Цель' : 'Goal'} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(GOAL_LABELS).map(([value, labels]) => (
                          <SelectItem key={value} value={value}>
                            {isRu ? labels.ru : labels.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_segment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRu ? 'Целевой сегмент' : 'Target Segment'} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(SEGMENT_LABELS).map(([value, labels]) => (
                          <SelectItem key={value} value={value}>
                            {isRu ? labels.ru : labels.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Channels */}
            <FormField
              control={form.control}
              name="channels"
              render={() => (
                <FormItem>
                  <FormLabel>{isRu ? 'Каналы' : 'Channels'} *</FormLabel>
                  <div className="flex flex-wrap gap-3">
                    {CHANNELS.map((channel) => (
                      <FormField
                        key={channel}
                        control={form.control}
                        name="channels"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(channel)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, channel]);
                                  } else {
                                    field.onChange(field.value.filter((v) => v !== channel));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {isRu ? CHANNEL_LABELS[channel].ru : CHANNEL_LABELS[channel].en}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Budget */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">{isRu ? 'Бюджет' : 'Budget'}</h4>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="budget_total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRu ? 'Общий' : 'Total'} *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget_daily_cap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRu ? 'Дневной лимит' : 'Daily Cap'}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget_currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRu ? 'Валюта' : 'Currency'}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="THB">THB (฿)</SelectItem>
                          <SelectItem value="RUB">RUB (₽)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Schedule */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">{isRu ? 'Расписание' : 'Schedule'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{isRu ? 'Дата старта' : 'Start Date'} *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{isRu ? 'Дата окончания' : 'End Date'}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : isRu ? 'Не указано' : 'Optional'}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < form.getValues('start_date')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* KPI Targets */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">{isRu ? 'Целевые KPI' : 'KPI Targets'}</h4>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="target_leads"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRu ? 'Лиды' : 'Leads'}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_conversions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRu ? 'Конверсии' : 'Conversions'}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_cac"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRu ? 'Целевой CAC' : 'Target CAC'}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <SheetFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? (isRu ? 'Сохранение...' : 'Saving...')
                  : isEditing
                    ? (isRu ? 'Сохранить' : 'Save')
                    : (isRu ? 'Создать черновик' : 'Save as Draft')}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
