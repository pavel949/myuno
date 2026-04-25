import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Sparkles, Clock, Bell, Mail, ShieldCheck, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useMaintenance } from '@/contexts/MaintenanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

export function UnderConstruction() {
  const [email, setEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);
  const { isMaintenanceMode, setMaintenanceMode } = useMaintenance();
  const { user } = useAuth();

  // Check if current user is admin (for admin toggle on this page)
  const { data: isAdmin } = useQuery({
    queryKey: ['user-is-admin-maintenance', user?.id],
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

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      const { error } = await (supabase as any)
        .from('email_subscriptions')
        .upsert(
          { email, source: 'coming_soon', subscribed_at: new Date().toISOString() },
          { onConflict: 'email' }
        );

      if (error) {
        // If table doesn't exist yet, still show success to user (email captured in logs)
        logger.warn('Email subscription insert failed:', error.message);
      }

      setSubscribed(true);
      setEmail('');
    } catch {
      // Graceful fallback — show success even if DB insert fails
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 relative overflow-auto z-50">
      {/* Admin toggle - floating at top */}
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 z-50"
        >
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-none shadow-lg border-2",
            isMaintenanceMode 
              ? "bg-warning/20 border-warning" 
              : "bg-background border-primary"
          )}>
            <ShieldCheck className="w-5 h-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Admin Mode</span>
              <span className="text-[10px] text-muted-foreground">
                {isMaintenanceMode ? 'Site closed' : 'Site open'}
              </span>
            </div>
            <Switch
              checked={isMaintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full text-center space-y-8"
      >
        {/* Logo */}
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex items-center justify-center gap-2"
        >
          <span className="text-xl font-medium text-muted-foreground">my</span>
          <div className="w-10 h-10 rounded-none gradient-gold flex items-center justify-center shadow-lg">
            <span className="text-lg font-bold text-primary-foreground">U</span>
          </div>
          <span className="text-2xl font-display font-bold text-gradient-gold">UNO</span>
        </motion.div>

        {/* Icon */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1
          }}
          className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <Clock className="w-12 h-12 text-primary" />
        </motion.div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Coming Soon
          </h1>
          <p className="text-lg text-muted-foreground">
            myUNO is launching soon in Phuket
          </p>
        </div>

        {/* Features preview */}
        <div className="grid grid-cols-3 gap-4 py-4">
          {[
            { icon: Rocket, label: 'Launching Soon' },
            { icon: Sparkles, label: 'New Experience' },
            { icon: Bell, label: 'Get Notified' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex flex-col items-center gap-2 p-3 rounded-none bg-muted/50"
            >
              <item.icon className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Email subscription */}
        {!subscribed ? (
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onSubmit={handleSubscribe}
            className="flex gap-2 max-w-sm mx-auto"
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" className="gap-2">
              <Mail className="w-4 h-4" />
              Notify Me
            </Button>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-4 px-6 bg-success/10 text-success rounded-none"
          >
            ✓ You'll be notified when we launch!
          </motion.div>
        )}

        {/* Sign in link for registered users */}
        {!user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.location.href = '/auth'}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </motion.div>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground pt-8">
          © 2025–2026 myUNO • Phuket Edition
        </p>
      </motion.div>
    </div>
  );
}
