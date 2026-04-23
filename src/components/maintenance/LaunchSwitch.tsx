import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMaintenance } from '@/contexts/MaintenanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Rocket, Construction, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface LaunchSwitchProps {
  className?: string;
  variant?: 'compact' | 'full';
}

/**
 * LaunchSwitch - One-click toggle to enable/disable maintenance mode
 * 
 * Usage: Place on admin dashboard or header for quick access
 * 
 * - Full variant: Shows detailed status with confirmation dialog
 * - Compact variant: Small toggle for header placement
 */
export function LaunchSwitch({ className, variant = 'full' }: LaunchSwitchProps) {
  const { isMaintenanceMode, setMaintenanceMode, isAdminRoute } = useMaintenance();
  const { user } = useAuth();
  
  // Check if current user is admin
  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ['user-is-admin-launch', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'uno_team'])
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Only show to admins
  if (isCheckingAdmin || !isAdmin) return null;

  const handleLaunch = () => {
    setMaintenanceMode(false);
  };

  const handleMaintenance = () => {
    setMaintenanceMode(true);
  };

  if (variant === 'compact') {
    return (
      <Button
        variant={isMaintenanceMode ? 'destructive' : 'default'}
        size="sm"
        onClick={isMaintenanceMode ? handleLaunch : handleMaintenance}
        className={cn('gap-2', className)}
      >
        {isMaintenanceMode ? (
          <>
            <Rocket className="w-4 h-4" />
            Launch
          </>
        ) : (
          <>
            <Construction className="w-4 h-4" />
            Maintenance
          </>
        )}
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-none border-2 p-6',
        isMaintenanceMode 
          ? 'bg-warning/10 border-warning' 
          : 'bg-success/10 border-success',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          'w-12 h-12 rounded-none flex items-center justify-center',
          isMaintenanceMode ? 'bg-warning/20' : 'bg-success/20'
        )}>
          <AnimatePresence mode="wait">
            {isMaintenanceMode ? (
              <motion.div
                key="construction"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Construction className="w-6 h-6 text-warning" />
              </motion.div>
            ) : (
              <motion.div
                key="rocket"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Rocket className="w-6 h-6 text-success" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Site Status
            </span>
          </div>
          
          <h3 className="text-lg font-bold mb-1">
            {isMaintenanceMode ? 'Under Construction' : 'Live & Public'}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4">
            {isMaintenanceMode 
              ? 'Visitors see "Coming Soon" page. Admins can browse normally.'
              : 'Site is live and accessible to all visitors.'}
          </p>

          {isMaintenanceMode ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full gap-2" size="lg">
                  <Rocket className="w-5 h-5" />
                  Launch Site
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-success" />
                    Launch myUNO?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will make the site publicly accessible. All visitors will be able to browse and use the platform.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLaunch} className="bg-success hover:bg-success/90">
                    Launch Now
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2" size="lg">
                  <Construction className="w-5 h-5" />
                  Enable Maintenance
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    Enable Maintenance Mode?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will show a "Coming Soon" page to all visitors. Only admins will be able to access the site.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleMaintenance} className="bg-warning hover:bg-warning/90 text-warning-foreground">
                    Enable Maintenance
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </motion.div>
  );
}