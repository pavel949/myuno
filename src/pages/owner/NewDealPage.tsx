import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateDealSheet } from '@/components/owner/sales/CreateDealSheet';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewDealPage() {
  const navigate = useNavigate();
  const { data: membership, isLoading } = useMyCompanyId();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      navigate('/mc/sales');
    }
  }, [open, navigate]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto pt-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-none" />
      </div>
    );
  }

  return (
    <CreateDealSheet
      open={open}
      onOpenChange={setOpen}
      companyId={membership?.company_id || ''}
    />
  );
}
