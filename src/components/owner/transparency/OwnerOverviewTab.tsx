import React from 'react';
import { PropertyStatusCard } from './PropertyStatusCard';
import { OwnerKPISummary } from './OwnerKPISummary';
import { ActivityFeed } from './ActivityFeed';

interface Props {
  propertyId: string;
}

export function OwnerOverviewTab({ propertyId }: Props) {
  return (
    <div className="space-y-5">
      <PropertyStatusCard propertyId={propertyId} />
      <OwnerKPISummary propertyId={propertyId} />
      <ActivityFeed propertyId={propertyId} limit={5} />
    </div>
  );
}
