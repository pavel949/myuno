import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePinManagement } from '@/hooks/usePinManagement';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { PinInput } from '@/components/auth/PinInput';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const texts = {
  ru: {
    setupTitle: 'Настройка PIN-кода',
    setupDesc: 'Создайте 4-значный PIN для быстрого входа',
    changeTitle: 'Изменить PIN-код',
    changeDesc: 'Введите текущий и новый PIN-код',
    resetTitle: 'Сбросить PIN-код',
    resetDesc: 'Введите пароль для сброса PIN',
    disableTitle: 'Отключить PIN-код?',
    disableDesc: 'Вам придётся входить с email и паролем',
    currentPin: 'Текущий PIN',
    newPin: 'Новый PIN',
    confirmPin: 'Подтвердите PIN',
    password: 'Пароль',
    save: 'Сохранить',
    cancel: 'Отмена',
    disable: 'Отключить',
    success: 'PIN успешно обновлён',
    setupSuccess: 'PIN-код настроен',
    disableSuccess: 'PIN-код отключён',
    pinMismatch: 'PIN-коды не совпадают',
    incorrectPin: 'Неверный PIN',
    incorrectPassword: 'Неверный пароль',
    enterPin: 'Введите 4-значный PIN',
    step1: 'Введите новый PIN',
    step2: 'Подтвердите PIN',
  },
  en: {
    setupTitle: 'Set up PIN',
    setupDesc: 'Create a 4-digit PIN for quick login',
    changeTitle: 'Change PIN',
    changeDesc: 'Enter your current and new PIN',
    resetTitle: 'Reset PIN',
    resetDesc: 'Enter your password to reset PIN',
    disableTitle: 'Disable PIN?',
    disableDesc: 'You will need to log in with email and password',
    currentPin: 'Current PIN',
    newPin: 'New PIN',
    confirmPin: 'Confirm PIN',
    password: 'Password',
    save: 'Save',
    cancel: 'Cancel',
    disable: 'Disable',
    success: 'PIN updated successfully',
    setupSuccess: 'PIN set up successfully',
    disableSuccess: 'PIN disabled',
    pinMismatch: 'PINs do not match',
    incorrectPin: 'Incorrect PIN',
    incorrectPassword: 'Incorrect password',
    enterPin: 'Enter 4-digit PIN',
    step1: 'Enter new PIN',
    step2: 'Confirm PIN',
  },
};

type DialogMode = 'setup' | 'change' | 'reset' | 'disable' | null;

interface PinManagementDialogProps {
  mode: DialogMode;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PinManagementDialog({ mode, onClose, onSuccess }: PinManagementDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { setupPin, changePin, resetPinWithPassword, disablePin, isLoading } = usePinManagement();
  const t = texts[language === 'th' ? 'en' : language] || texts.en;
  
  // Initialize step based on mode
  const getInitialStep = (dialogMode: DialogMode): 'current' | 'new' | 'confirm' | 'password' => {
    if (dialogMode === 'reset') return 'password';
    if (dialogMode === 'setup') return 'new';
    return 'current';
  };
  
  const [step, setStep] = useState<'current' | 'new' | 'confirm' | 'password'>(getInitialStep(mode));
  const [currentPinValue, setCurrentPinValue] = useState('');
  const [newPinValue, setNewPinValue] = useState('');
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [password, setPassword] = useState('');
  const [pinInputKey, setPinInputKey] = useState(0);

  // Reset step when mode changes
  useEffect(() => {
    if (mode) {
      setStep(getInitialStep(mode));
      setCurrentPinValue('');
      setNewPinValue('');
      setConfirmPinValue('');
      setPassword('');
      setPinInputKey(prev => prev + 1);
    }
  }, [mode]);

  const resetState = () => {
    setStep(getInitialStep(mode));
    setCurrentPinValue('');
    setNewPinValue('');
    setConfirmPinValue('');
    setPassword('');
    setPinInputKey(prev => prev + 1);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Setup PIN flow
  const handleSetupPinComplete = async (pin: string) => {
    if (step === 'new' || step === 'current') {
      setNewPinValue(pin);
      setStep('confirm');
      setPinInputKey(prev => prev + 1);
      return;
    }
    
    if (step === 'confirm') {
      if (pin !== newPinValue) {
        toast.error(t.pinMismatch);
        setStep('new');
        setNewPinValue('');
        setPinInputKey(prev => prev + 1);
        return;
      }
      
      const result = await setupPin(pin);
      if (result.success) {
        toast.success(t.setupSuccess);
        onSuccess?.();
        handleClose();
      } else {
        toast.error(result.error);
      }
    }
  };

  // Change PIN flow
  const handleChangePinComplete = async (pin: string) => {
    if (step === 'current') {
      setCurrentPinValue(pin);
      setStep('new');
      setPinInputKey(prev => prev + 1);
      return;
    }
    
    if (step === 'new') {
      setNewPinValue(pin);
      setStep('confirm');
      setPinInputKey(prev => prev + 1);
      return;
    }
    
    if (step === 'confirm') {
      if (pin !== newPinValue) {
        toast.error(t.pinMismatch);
        setStep('new');
        setNewPinValue('');
        setPinInputKey(prev => prev + 1);
        return;
      }
      
      const result = await changePin(currentPinValue, pin);
      if (result.success) {
        toast.success(t.success);
        onSuccess?.();
        handleClose();
      } else {
        if (result.error?.includes('Incorrect')) {
          toast.error(t.incorrectPin);
          setStep('current');
          setCurrentPinValue('');
        } else {
          toast.error(result.error);
        }
        setPinInputKey(prev => prev + 1);
      }
    }
  };

  // Reset PIN with password
  const handleResetPin = async () => {
    if (!user?.email || !password) return;
    
    if (step === 'password') {
      setStep('new');
      setPinInputKey(prev => prev + 1);
      return;
    }
  };

  const handleResetPinComplete = async (pin: string) => {
    if (step === 'new') {
      setNewPinValue(pin);
      setStep('confirm');
      setPinInputKey(prev => prev + 1);
      return;
    }
    
    if (step === 'confirm') {
      if (pin !== newPinValue) {
        toast.error(t.pinMismatch);
        setStep('new');
        setNewPinValue('');
        setPinInputKey(prev => prev + 1);
        return;
      }
      
      const result = await resetPinWithPassword(user?.email || '', password, pin);
      if (result.success) {
        toast.success(t.success);
        onSuccess?.();
        handleClose();
      } else {
        if (result.error?.includes('password')) {
          toast.error(t.incorrectPassword);
          setStep('password');
          setPassword('');
        } else {
          toast.error(result.error);
        }
      }
    }
  };

  // Disable PIN
  const handleDisablePin = async () => {
    const result = await disablePin();
    if (result.success) {
      toast.success(t.disableSuccess);
      onSuccess?.();
      handleClose();
    } else {
      toast.error(result.error);
    }
  };

  if (mode === 'disable') {
    return (
      <AlertDialog open={mode === 'disable'} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.disableTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.disableDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDisablePin} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : t.disable}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  const getTitle = () => {
    switch (mode) {
      case 'setup': return t.setupTitle;
      case 'change': return t.changeTitle;
      case 'reset': return t.resetTitle;
      default: return '';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'setup': return t.setupDesc;
      case 'change': return t.changeDesc;
      case 'reset': return t.resetDesc;
      default: return '';
    }
  };

  const getStepLabel = () => {
    if (mode === 'change' && step === 'current') return t.currentPin;
    if (step === 'new') return t.step1;
    if (step === 'confirm') return t.step2;
    return t.enterPin;
  };

  const isDialogOpen = mode === 'setup' || mode === 'change' || mode === 'reset';

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {mode === 'reset' && step === 'password' ? (
            <div className="space-y-4">
              <div>
                <Label>{t.password}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  autoFocus
                />
              </div>
              <Button 
                onClick={handleResetPin} 
                disabled={!password || isLoading}
                className="w-full"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : t.save}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <p className="text-sm text-muted-foreground mb-4">{getStepLabel()}</p>
              <PinInput
                key={pinInputKey}
                onComplete={
                  mode === 'setup' ? handleSetupPinComplete :
                  mode === 'change' ? handleChangePinComplete :
                  handleResetPinComplete
                }
                disabled={isLoading}
              />
              {isLoading && (
                <div className="mt-4">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
