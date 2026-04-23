import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useInvestmentInterest, type CreateInterestData } from '@/hooks/useInvestmentInterest';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  TrendingUp, 
  MessageCircle, 
  Phone,
  CheckCircle,
  Loader2,
  LogIn
} from 'lucide-react';

interface InterestFormProps {
  projectId: string;
  projectTitle: string;
  minInvestment?: number | null;
  currency?: string;
  className?: string;
}

export function InterestForm({
  projectId,
  projectTitle,
  minInvestment,
  currency = 'USD',
  className,
}: InterestFormProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const isRu = language === 'ru';
  
  const { 
    hasExpressedInterest, 
    existingInterest,
    createInterest, 
    isSubmitting 
  } = useInvestmentInterest(projectId);

  const [open, setOpen] = useState(false);
  const [interestType, setInterestType] = useState<'invest' | 'learn_more' | 'call_request'>('learn_more');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/auth', { state: { from: `/invest/${projectId}` } });
      return;
    }

    const data: CreateInterestData = {
      project_id: projectId,
      interest_type: interestType,
      notes: notes || undefined,
    };

    if (interestType === 'invest' && amount) {
      data.preferred_amount = parseFloat(amount);
      data.preferred_currency = currency;
    }

    await createInterest(data);
    setOpen(false);
  };

  // Already expressed interest
  if (hasExpressedInterest && existingInterest) {
    return (
      <div className={cn(
        'p-4 rounded-none bg-success/10 border border-success/40',
        className
      )}>
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">
            {isRu ? 'Вы уже выразили интерес' : 'Interest submitted'}
          </span>
        </div>
        <p className="text-sm text-success mt-1">
          {isRu 
            ? 'Наш эксперт свяжется с вами в течение 24 часов.'
            : 'Our team will contact you within 24 hours.'
          }
        </p>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className={cn('w-full gap-2', className)}
        >
          <TrendingUp className="h-5 w-5" />
          {isRu ? 'Выразить интерес' : 'Express Interest'}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRu ? 'Выразить интерес' : 'Express Interest'}
          </DialogTitle>
          <DialogDescription>
            {projectTitle}
          </DialogDescription>
        </DialogHeader>

        {!user && !authLoading ? (
          <div className="py-6 text-center space-y-4">
            <p className="text-muted-foreground">
              {isRu 
                ? 'Войдите, чтобы выразить интерес к проекту'
                : 'Sign in to express interest in this project'
              }
            </p>
            <Button onClick={() => navigate('/auth', { state: { from: `/invest/${projectId}` } })}>
              <LogIn className="h-4 w-4 mr-2" />
              {isRu ? 'Войти' : 'Sign In'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Interest type */}
            <div className="space-y-3">
              <Label>{isRu ? 'Тип запроса' : 'Request Type'}</Label>
              <RadioGroup 
                value={interestType} 
                onValueChange={(v) => setInterestType(v as any)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3 p-3 rounded-none border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="invest" id="invest" />
                  <Label htmlFor="invest" className="flex items-center gap-2 cursor-pointer flex-1">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <div>
                      <div className="font-medium">
                        {isRu ? 'Хочу инвестировать' : 'I want to invest'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isRu ? 'Готов обсудить условия' : 'Ready to discuss terms'}
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-none border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="learn_more" id="learn_more" />
                  <Label htmlFor="learn_more" className="flex items-center gap-2 cursor-pointer flex-1">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">
                        {isRu ? 'Хочу узнать больше' : 'I want to learn more'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isRu ? 'Получить документы и информацию' : 'Get documents and info'}
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-none border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="call_request" id="call_request" />
                  <Label htmlFor="call_request" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Phone className="h-4 w-4 text-accent" />
                    <div>
                      <div className="font-medium">
                        {isRu ? 'Запрос на звонок' : 'Request a call'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isRu ? 'Эксперт перезвонит вам' : 'Expert will call you back'}
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Investment amount (only for invest type) */}
            {interestType === 'invest' && (
              <div className="space-y-2">
                <Label htmlFor="amount">
                  {isRu ? 'Предполагаемая сумма' : 'Intended Amount'} ({currency})
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder={minInvestment ? `min ${minInvestment}` : '50000'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={minInvestment || 0}
                />
                {minInvestment && (
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'Минимальный вход:' : 'Minimum entry:'} ${minInvestment.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                {isRu ? 'Комментарий (необязательно)' : 'Notes (optional)'}
              </Label>
              <Textarea
                id="notes"
                placeholder={isRu ? 'Ваши вопросы или пожелания...' : 'Your questions or preferences...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isRu ? 'Отправка...' : 'Submitting...'}
                </>
              ) : (
                isRu ? 'Отправить' : 'Submit'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              {isRu 
                ? 'Наш эксперт свяжется с вами в течение 24 часов'
                : 'Our expert will contact you within 24 hours'
              }
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
