import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ListingWizard } from '@/components/listing-wizard/ListingWizard';

export default function ListWithUsPage() {
  return (
    <AppLayout showHeader={false}>
      <ListingWizard />
    </AppLayout>
  );
}
