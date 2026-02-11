/**
 * DocumentExpiryNotifier — background component that checks for expiring documents
 * and creates in-app notifications + optionally triggers push notifications.
 * Mount once in AppLayout or Index.
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function DocumentExpiryNotifier() {
  const { user } = useAuth();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!user || checkedRef.current) return;
    checkedRef.current = true;

    const checkExpiring = async () => {
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data: docs } = await supabase
        .from('user_documents')
        .select('id, document_type, expiry_date, last_reminded_at')
        .eq('user_id', user.id)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', in30Days.toISOString().split('T')[0])
        .gte('expiry_date', now.toISOString().split('T')[0]);

      if (!docs || docs.length === 0) return;

      for (const doc of docs) {
        // Skip if reminded in last 7 days
        if (doc.last_reminded_at) {
          const lastReminded = new Date(doc.last_reminded_at);
          if (now.getTime() - lastReminded.getTime() < 7 * 24 * 60 * 60 * 1000) continue;
        }

        const daysLeft = Math.ceil(
          (new Date(doc.expiry_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Create in-app notification
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'status',
          title: daysLeft <= 7
            ? `⚠️ ${doc.document_type} expires in ${daysLeft} days!`
            : `📋 ${doc.document_type} expires in ${daysLeft} days`,
          body: daysLeft <= 7
            ? 'Take action now to avoid complications.'
            : 'Plan ahead to renew your document.',
          is_read: false,
        });

        // Mark as reminded
        await supabase
          .from('user_documents')
          .update({ last_reminded_at: now.toISOString() })
          .eq('id', doc.id);
      }
    };

    checkExpiring().catch(console.error);
  }, [user]);

  return null;
}
