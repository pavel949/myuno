import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const original = readFileSync('supabase/migrations/20260121010005_982a783a-0ff3-49fc-bd4a-230f9365dbd8.sql', 'utf8');
const candidate = readFileSync('docs/convergence/employee-property-publication/vendor-notification-row-shape.candidate.sql', 'utf8');
const normalize = (body: string) => body.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim();

describe('vendor moderation row-shape source contract', () => {
  it('changes only optional record field lookup in the existing function body', () => {
    const sourceBody = original.split('RETURNS TRIGGER AS $$')[1].split('$$ LANGUAGE')[0];
    const candidateBody = candidate.split('AS $function$')[1].split('$function$')[0];
    expect(normalize(candidateBody)).toBe(normalize(sourceBody
      .replace('NEW.title_en', "to_jsonb(NEW)->>'title_en'")
      .replace('NEW.name_en', "to_jsonb(NEW)->>'name_en'")));
  });

  it('keeps a transaction-wrapped forward replacement outside active migration journals', () => {
    expect(candidate).toContain('BEGIN;');
    expect(candidate.trim()).toMatch(/COMMIT;$/);
    expect(candidate).toMatch(/\$function\$;\s*COMMIT;/);
    expect(candidate).toContain("to_regprocedure('public.notify_vendor_on_content_status_change()') IS NULL");
    expect(candidate).toContain('CREATE OR REPLACE FUNCTION public.notify_vendor_on_content_status_change()');
  });

  it('does not change grants, trigger attachments or historical business records', () => {
    expect(candidate).not.toMatch(/\b(?:GRANT|REVOKE|CREATE TRIGGER|DROP TRIGGER|ALTER TABLE|UPDATE public\.)\b/i);
    expect(candidate).toContain('SECURITY DEFINER');
    expect(candidate).toContain("SET search_path TO 'public'");
  });
});
