/** Reports locations/types only: never include matched private values in logs. */
export function findSourceIdentifiers(text) {
  const findings = [];
  const sourceLink = /https?:\/\/(?:drive\.google\.com|docs\.google\.com|t\.me)\/[^\s<>"`]+/g;
  for (const match of text.matchAll(sourceLink)) findings.push({ kind: 'source_link', offset: match.index });
  const sourceId = /(?<![A-Za-z0-9_-])1[A-Za-z0-9_-]{28,}(?![A-Za-z0-9_-])/g;
  for (const match of text.matchAll(sourceId)) {
    if (/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(match[0])) continue; // Git/content hashes are not source IDs.
    findings.push({ kind: 'source_identifier', offset: match.index });
  }
  return findings;
}
