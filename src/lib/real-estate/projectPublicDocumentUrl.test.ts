import { describe, expect, it } from 'vitest';
import { projectPublicDocumentUrl } from './projectPublicDocumentUrl';

const permit = { projectId: 'project-a', category: 'permits' };
const endpoint = 'https://eia.onep.go.th/services/web//doc/download-eia-approval';
const approval = `${endpoint}?id=13505`;

describe('projectPublicDocumentUrl: official EIA approval', () => {
  it('accepts only the canonical public government PDF form for a project permit', () => {
    expect(projectPublicDocumentUrl(approval, permit)).toBe(approval);
    expect(projectPublicDocumentUrl(approval)).toBeNull();
    expect(projectPublicDocumentUrl(approval, { ...permit, category: 'floor_plans' })).toBeNull();
    expect(projectPublicDocumentUrl(approval, { ...permit, projectId: '' })).toBeNull();
  });

  it.each([
    approval.replace('eia.onep.go.th', 'eia.onep.go.th.invalid'),
    approval.replace('https://', 'http://'),
    approval.replace('https://', 'https://editor@'),
    approval.replace('onep.go.th', 'onep.go.th:444'),
    approval.replace('download-eia-approval', 'download-different-file'),
    `${approval}&id=13506`,
    `${approval}&download=1`,
    `${approval}#page=1`,
    `${endpoint}?id=%3113505`,
  ])('rejects a different or ambiguous destination: %s', (url) => {
    expect(projectPublicDocumentUrl(url, permit)).toBeNull();
  });

  it('does not broaden storage project or category boundaries', () => {
    const base = 'https://canonical.supabase.co/storage/v1/object/sign/project-documents';
    const file = (project: string, category: string) => `${base}/${project}/${category}/permit.pdf?token=example.signature`;
    expect(projectPublicDocumentUrl(file('project-a', 'permits'), permit)).toBe(file('project-a', 'permits'));
    expect(projectPublicDocumentUrl(file('project-b', 'permits'), permit)).toBeNull();
    expect(projectPublicDocumentUrl(file('project-a', 'contracts'), permit)).toBeNull();
  });
});
