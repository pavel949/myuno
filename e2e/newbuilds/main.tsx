// Isolated synthetic acceptance surface. Never mounts production app/providers.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BuyerProjectUnits } from '../../src/components/newbuilds/BuyerProjectUnits';
import { BuyerRequestSummary } from '../../src/components/newbuilds/BuyerRequestSummary';
import { BrowserRouter } from 'react-router-dom';
import '../../src/index.css';
function Team() { const [requests, setRequests] = React.useState<any[]>([]); React.useEffect(() => { const listener = () => setRequests([...(window as any).__requests]); window.addEventListener('synthetic-save', listener); return () => window.removeEventListener('synthetic-save', listener); }, []); return <div data-testid="team-queue">{requests.map((request, index) => <BuyerRequestSummary key={index} metadata={request.vertical_metadata} />)}</div>; }
createRoot(document.getElementById('root')!).render(<BrowserRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><main className="max-w-4xl mx-auto p-6 space-y-6"><h1 className="text-2xl">Synthetic project — buyer acceptance</h1><BuyerProjectUnits projectId="synthetic-project" /><Team /></main></QueryClientProvider></BrowserRouter>);
