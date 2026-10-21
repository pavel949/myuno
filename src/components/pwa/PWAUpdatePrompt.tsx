import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchAvailableDeployment, getAvailableDeployment, type AvailableDeployment } from '@/lib/appVersion';
import { UPDATE_AVAILABLE_EVENT } from './VersionWatcher';
import { logger } from '@/lib/logger';
import { clearRecoveryReloadRequest, hasRecoveryReloadRequest, RECOVERY_RELOAD_EVENT, reloadAfterUserRecovery, reloadPreservingDrafts } from '@/lib/pwaRecovery';

/**
 * Non-blocking "Update available" prompt. Listens for the
 * `myuno:update-available` CustomEvent dispatched by {@link VersionWatcher}.
 *
 * UX:
 *  - Bottom-right toast card on desktop, bottom strip on mobile.
 *  - "Update now" → recheck availability + clear app-shell caches + reload.
 *  - "Later" → hidden for this deployment in this session; never reload on its own.
 */
export function PWAUpdatePrompt() {
  const { language } = useLanguage();
  const [pendingDeployment, setPendingDeployment] = React.useState<AvailableDeployment | null>(null);
  const [recoveryRequested, setRecoveryRequested] = React.useState(false);
  const [reloading, setReloading] = React.useState(false);
  const [updateFailed, setUpdateFailed] = React.useState(false);
  const updatingRef = React.useRef(false);
  const dismissedRef = React.useRef(new Set<string>());

  React.useEffect(() => {
    const handler = (e: Event) => {
      if (updatingRef.current) return;
      const deployment = getAvailableDeployment((e as CustomEvent<unknown>).detail);
      if (!deployment || dismissedRef.current.has(deployment.key)) return;
      try {
        if (sessionStorage.getItem(`pwa_update_dismissed_deployment_${deployment.key}`) === 'true') return;
      } catch { /* Storage may be unavailable; in-memory dismissal still works. */ }
      setPendingDeployment(deployment);
    };
    const recoveryHandler = (event?: Event) => {
      const userRequested = (event as CustomEvent<{ userRequested?: boolean }> | undefined)?.detail?.userRequested === true;
      if (updatingRef.current) return;
      if (userRequested) dismissedRef.current.delete('recovery');
      else if (dismissedRef.current.has('recovery')) return;
      try {
        if (userRequested) sessionStorage.removeItem('pwa_recovery_dismissed');
        else if (sessionStorage.getItem('pwa_recovery_dismissed') === 'true') return;
      } catch { /* The in-memory dismissal still applies. */ }
      setRecoveryRequested(true);
    };
    window.addEventListener(UPDATE_AVAILABLE_EVENT, handler);
    window.addEventListener(RECOVERY_RELOAD_EVENT, recoveryHandler);
    if (hasRecoveryReloadRequest()) recoveryHandler();
    return () => {
      window.removeEventListener(UPDATE_AVAILABLE_EVENT, handler);
      window.removeEventListener(RECOVERY_RELOAD_EVENT, recoveryHandler);
    };
  }, []);

  const handleUpdate = async () => {
    if ((!pendingDeployment && !recoveryRequested) || updatingRef.current) return;
    updatingRef.current = true;
    setReloading(true);
    setUpdateFailed(false);
    try {
      if (!pendingDeployment) {
        await reloadAfterUserRecovery();
        return;
      }
      // A previous notification is not evidence that the deployment is still online.
      const fresh = await fetchAvailableDeployment();
      if (!fresh || fresh.key !== pendingDeployment.key) {
        if (fresh) setPendingDeployment(fresh);
        throw new Error('Deployment changed or is unavailable');
      }
      await reloadPreservingDrafts(fresh.key);
    } catch (err) {
      logger.warn('[PWAUpdatePrompt] update deferred', err);
      setUpdateFailed(true);
      setReloading(false);
      updatingRef.current = false;
    }
  };

  const handleDismiss = () => {
    if ((!pendingDeployment && !recoveryRequested) || updatingRef.current) return;
    if (pendingDeployment) dismissedRef.current.add(pendingDeployment.key);
    if (recoveryRequested) {
      dismissedRef.current.add('recovery');
      clearRecoveryReloadRequest();
    }
    try {
      if (pendingDeployment) sessionStorage.setItem(`pwa_update_dismissed_deployment_${pendingDeployment.key}`, 'true');
      if (recoveryRequested) sessionStorage.setItem('pwa_recovery_dismissed', 'true');
    } catch { /* Dismissal must still work when storage is blocked/full. */ }
    setPendingDeployment(null);
    setRecoveryRequested(false);
    setUpdateFailed(false);
  };

  const texts = {
    ru: {
      title: 'Доступно обновление',
      recoveryTitle: 'Нужна перезагрузка',
      recoveryDescription: 'Не удалось загрузить часть приложения. Сохраните незавершённые изменения перед перезагрузкой.',
      reload: 'Перезагрузить',
      description: 'Доступна новая версия. Сохраните незавершённые изменения перед перезагрузкой.',
      failed: 'Не удалось подготовить обновление. Страница не перезагружена. Попробуйте ещё раз позже.',
      update: 'Обновить',
      later: 'Позже',
      reloading: 'Обновляем…',
    },
    en: {
      title: 'Update available',
      recoveryTitle: 'Reload available',
      recoveryDescription: 'Part of the app could not load. Save unfinished changes before reloading.',
      reload: 'Reload page',
      description: 'A new version is ready. Save unfinished changes before reloading.',
      failed: 'The update could not be prepared. This page has not reloaded. Please try again later.',
      update: 'Update now',
      later: 'Later',
      reloading: 'Updating…',
    },
  } as const;

  const t = texts[language] ?? texts.en;
  const visible = !!pendingDeployment || recoveryRequested;
  const isRecovery = recoveryRequested && !pendingDeployment;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-6 md:bottom-6 md:w-96"
          role="status"
          aria-live="polite"
        >
          <div className="bg-background border-2 border-primary/50 rounded-none p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-none bg-primary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{isRecovery ? t.recoveryTitle : t.title}</h3>
                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                    aria-label={language === 'ru' ? 'Закрыть' : 'Dismiss'}
                    disabled={reloading}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{isRecovery ? t.recoveryDescription : t.description}</p>
                {updateFailed && <p className="text-sm text-destructive mt-2" role="alert">{t.failed}</p>}
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    onClick={handleUpdate}
                    size="sm"
                    className="gap-2 flex-1"
                    disabled={reloading}
                  >
                    <RefreshCw className={`w-4 h-4 ${reloading ? 'animate-spin' : ''}`} />
                    {reloading ? t.reloading : isRecovery ? t.reload : t.update}
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    disabled={reloading}
                  >
                    {t.later}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
