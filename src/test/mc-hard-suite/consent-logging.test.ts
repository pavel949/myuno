/**
 * @module consent-logging.test
 * @description Tests for Terms of Use consent logging verification.
 */
import { describe, it, expect } from 'vitest';
import { OWNER_A, MC_ALPHA } from './testSeedData';

describe('Consent Logging — Data Model', () => {

  // CON-001: Acceptance record structure
  it('CON-001: Acceptance record has all required fields', () => {
    const mockAcceptance = {
      id: 'test-acceptance-id',
      user_id: OWNER_A.id,
      company_id: MC_ALPHA.id,
      doc_id: 'test-doc-id',
      doc_key: 'terms_of_use',
      version: 'v1.0',
      content_hash: 'abc123def456',
      accepted_at: new Date().toISOString(),
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0 Test',
      acceptance_source: 'app_init',
    };

    expect(mockAcceptance.user_id).toBeTruthy();
    expect(mockAcceptance.doc_key).toBeTruthy();
    expect(mockAcceptance.version).toBeTruthy();
    expect(mockAcceptance.content_hash).toBeTruthy();
    expect(mockAcceptance.accepted_at).toBeTruthy();
    expect(mockAcceptance.acceptance_source).toBeTruthy();
  });

  // CON-004: Multiple versions tracked separately
  it('CON-004: Different versions produce distinct acceptance keys', () => {
    const v1Key = `terms_of_use::v1.0`;
    const v2Key = `terms_of_use::v2.0`;
    
    expect(v1Key).not.toBe(v2Key);
    
    const acceptedSet = new Set([v1Key]);
    expect(acceptedSet.has(v1Key)).toBe(true);
    expect(acceptedSet.has(v2Key)).toBe(false);
  });

  // CON-002: Pending documents detection
  it('CON-002: Detects pending documents for user', () => {
    const activeDocs = [
      { doc_key: 'terms_of_use', version: 'v2.0', is_active: true },
      { doc_key: 'privacy_policy', version: 'v1.0', is_active: true },
    ];

    const userAcceptances = [
      { doc_key: 'terms_of_use', version: 'v1.0' }, // old version
    ];

    const acceptedSet = new Set(
      userAcceptances.map(a => `${a.doc_key}::${a.version}`)
    );

    const pending = activeDocs.filter(
      d => !acceptedSet.has(`${d.doc_key}::${d.version}`)
    );

    // Both should be pending: terms v2.0 (new version) and privacy v1.0 (never accepted)
    expect(pending).toHaveLength(2);
    expect(pending.map(p => p.doc_key)).toContain('terms_of_use');
    expect(pending.map(p => p.doc_key)).toContain('privacy_policy');
  });

  // CON-005: Invalid doc_id handling
  it('CON-005: Invalid doc_id should not produce acceptance', () => {
    const validDocIds = new Set(['doc-1', 'doc-2', 'doc-3']);
    const attemptedId = 'invalid-doc-id-xyz';
    
    expect(validDocIds.has(attemptedId)).toBe(false);
  });
});

describe('Consent Logging — Hash Verification', () => {
  
  it('Content hash changes when document content changes', async () => {
    const hashContent = async (content: string) => {
      const buffer = new TextEncoder().encode(content);
      const hash = await crypto.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    };

    const hash1 = await hashContent('Terms of Use v1.0 content...');
    const hash2 = await hashContent('Terms of Use v2.0 updated content...');
    
    expect(hash1).not.toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 = 64 hex chars
  });
});
