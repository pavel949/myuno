/** Must stay self-contained: Workbox serializes this callback into the generated worker. */
export async function assetCacheWillUpdate({ response }: { response: Response }): Promise<Response | null> {
  if (response.status !== 0 && response.status !== 200) return null;
  // SPA hosts may return their HTML shell with 200 for an obsolete hashed asset.
  // Do not persist that response as JavaScript/CSS for the next thirty days.
  const contentType = response.headers.get('content-type') || '';
  return /^\s*(?:text\/html|application\/xhtml\+xml)(?:\s*;|\s*$)/i.test(contentType) ? null : response;
}
