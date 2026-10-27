import type { QueryClient } from '@tanstack/react-query';
/** Existing canonical read caches, invalidated only after a successful CMS save. */
export function invalidateProjectPriceReaders(client: QueryClient) {
  return Promise.all(['offplan-projects', 'offplan-project', 'newbuild-projects',
    'newbuild-project', 'newbuild-stats', 'nb-developer-other-projects',
    'explore-layers-v1'].map(key => client.invalidateQueries({ queryKey: [key] })));
}
