import React from 'react';
import { UnifiedCatalogTable } from './UnifiedCatalogTable';

interface CatalogDataTabProps {
  searchQuery?: string;
  statusFilter?: string;
}

export function CatalogDataTab({ searchQuery, statusFilter }: CatalogDataTabProps) {
  return <UnifiedCatalogTable />;
}
