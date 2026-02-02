import React from 'react';
import { useMaintenance } from '@/contexts/MaintenanceContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Construction, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function MaintenanceToggle({ className, showLabel = true }: MaintenanceToggleProps) {
  const { isMaintenanceMode, setMaintenanceMode } = useMaintenance();
  const { user } = useAuth();
  
  // Check if current user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ['user-is-admin', user?.id],
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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Only show toggle to admins
  if (!isAdmin) return null;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showLabel && (
        <div className="flex items-center gap-2">
          <Construction className={cn(
            "w-4 h-4 transition-colors",
            isMaintenanceMode ? "text-warning" : "text-muted-foreground"
          )} />
          <Label htmlFor="maintenance-toggle" className="text-sm font-medium cursor-pointer">
            Under Construction
          </Label>
        </div>
      )}
      <Switch
        id="maintenance-toggle"
        checked={isMaintenanceMode}
        onCheckedChange={setMaintenanceMode}
      />
      {isMaintenanceMode && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="w-3 h-3" />
          <span>You can bypass</span>
        </div>
      )}
    </div>
  );
}
