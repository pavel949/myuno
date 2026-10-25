import { Navigate, useLocation } from 'react-router-dom';

export type AgentEntry = 'join' | 'dashboard' | 'resources';

/** Compatibility destinations only. These links never confer agent authority. */
function agentEntryDestination(entry: AgentEntry, search: string, hash: string) {
  const params = new URLSearchParams(search);
  if (entry === 'resources') return { pathname: '/property/browse', search: params.toString(), hash };
  params.set('agentIntent', entry === 'dashboard' ? 'workspace' : 'cooperation');
  return { pathname: '/for/agent', search: params.toString(), hash: hash || '#agent-contact' };
}

export function AgentEntryRedirect({ entry }: { entry: AgentEntry }) {
  const location = useLocation();
  return <Navigate to={agentEntryDestination(entry, location.search, location.hash)} state={location.state} replace />;
}
