import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

/**
 * Referral Landing: /ref/:code
 * Stores referral code in localStorage and redirects to /auth
 */
export default function ReferralLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      localStorage.setItem('referral_code', code.toUpperCase());
    }
    navigate(`/auth?ref=${code || ''}`, { replace: true });
  }, [code, navigate]);

  return (
    <AppLayout showHeader={false}>
      <div className="flex items-center justify-center min-h-[60vh] bg-background">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </AppLayout>
  );
}
