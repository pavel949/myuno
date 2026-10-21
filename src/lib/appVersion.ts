import { version } from '../../package.json';
import { logger } from '@/lib/logger';

export const APP_VERSION = version;

// The build plugin emits these exact values in /version.json as well.
// Unknown metadata stays unknown in dev/tests; never invent a runtime build time.
declare const __BUILD_TIMESTAMP__: string;
declare const __BUILD_COMMIT__: string;
export const BUILD_TIMESTAMP = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : '';
export const BUILD_COMMIT = typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : '';
export const UPDATE_CHECK_EVENT = 'myuno:check-update';

export interface DeploymentMetadata {
  version: string;
  commit?: string;
  buildTime?: string;
}

export interface AvailableDeployment extends DeploymentMetadata {
  key: string;
}

function validCommit(value: unknown): string | null {
  return typeof value === 'string' && /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/i.test(value)
    ? value.toLowerCase() : null;
}

function validBuildTime(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value ? time : null;
}

function parseDeploymentMetadata(remote: unknown): DeploymentMetadata | null {
  if (!remote || typeof remote !== 'object') return null;
  const data = remote as Record<string, unknown>;
  if (typeof data.version !== 'string' ||
      !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(data.version)) return null;
  const commit = validCommit(data.commit);
  const time = validBuildTime(data.buildTime);
  return { version: data.version, ...(commit ? { commit } : {}),
    ...(time !== null ? { buildTime: new Date(time).toISOString() } : {}) };
}

export function getDeploymentKey(metadata: DeploymentMetadata): string {
  return `${metadata.version}:${validCommit(metadata.commit) ?? 'version'}:${validBuildTime(metadata.buildTime) ?? ''}`;
}

/** Deployment identity only, not proof of hosted business/backend acceptance. */
export function getAvailableDeployment(
  remote: unknown,
  local: DeploymentMetadata = { version: APP_VERSION, commit: BUILD_COMMIT, buildTime: BUILD_TIMESTAMP },
): AvailableDeployment | null {
  const metadata = parseDeploymentMetadata(remote);
  if (!metadata) return null;
  const remoteCommit = validCommit(metadata.commit);
  const localCommit = validCommit(local.commit);
  const remoteTime = validBuildTime(metadata.buildTime);
  const localTime = validBuildTime(local.buildTime);
  const available = metadata.version !== local.version ||
    (remoteCommit !== null && localCommit !== null && remoteCommit !== localCommit) ||
    (remoteTime !== null && localTime !== null && remoteTime > localTime);
  return available ? { ...metadata, key: getDeploymentKey(metadata) } : null;
}

/** A failed/offline/invalid check throws; it must never authorize a reload. */
export async function fetchDeploymentMetadata(): Promise<DeploymentMetadata> {
  if (!navigator.onLine) throw new Error('Offline');
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`/version.json?_=${Date.now()}`, {
      cache: 'no-store', credentials: 'omit', signal: controller.signal,
    });
    if (!response.ok) throw new Error('Deployment check failed');
    const metadata = parseDeploymentMetadata(await response.json());
    if (!metadata) throw new Error('Invalid deployment metadata');
    return metadata;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchAvailableDeployment(): Promise<AvailableDeployment | null> {
  return getAvailableDeployment(await fetchDeploymentMetadata());
}

export async function checkForUpdates(): Promise<boolean> {
  try {
    return (await fetchAvailableDeployment()) !== null;
  } catch {
    return false;
  }
}

/** SW activation asks the watcher to check; it never grants permission to reload. */
export function requestUpdateCheck(): void {
  window.dispatchEvent(new Event(UPDATE_CHECK_EVENT));
}

export function reloadForDeployment(key: string, location: Pick<Location, 'href' | 'replace'> = window.location): void {
  const url = new URL(location.href);
  url.searchParams.set('_v', key);
  location.replace(url.toString());
}

/** Clear only myUNO's app-shell caches. Storage is business/auth state, not cache. */
export async function forceCleanAllCaches(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      const worker = registration.active ?? registration.waiting ?? registration.installing;
      if (!worker) continue;
      const script = new URL(worker.scriptURL);
      if (script.origin !== window.location.origin || script.pathname !== '/sw.js' ||
          registration.scope !== `${window.location.origin}/`) continue;
      if (!await registration.unregister()) throw new Error('App service worker could not be unregistered');
    }
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    const precache = `workbox-precache-v2-${window.location.origin}/`;
    await Promise.all(keys.filter(key => key === 'myuno-assets' || key === precache)
      .map(key => caches.delete(key)));
  }
  // Never clear sessionStorage/localStorage/IndexedDB: booking drafts, OAuth
  // context, saved sessions and pending business work must survive a reload.
  logger.log('[myUNO] App-shell caches cleared');
}
