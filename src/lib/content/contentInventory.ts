/**
 * Content inventory — Design Bible Round 4A · H3 "Content manager".
 * One table for all editorial content with type, languages, status and
 * pre-publish checks (language completeness, SEO basics, copy check).
 * Pure functions; the hook in useContentInventory feeds them rows.
 */
import { checkCopy, type CopyIssue } from './copyCheck';

export type ContentKind = 'guide' | 'article' | 'legal' | 'news';
export type ContentLang = 'en' | 'ru';
export type ContentStatus = 'published' | 'partial' | 'draft' | 'archived';

export interface ContentItem {
  id: string;
  source: 'relocation_articles' | 'investment_articles' | 'legal_documents' | 'official_news';
  kind: ContentKind;
  title: string;
  slug: string | null;
  languages: Record<ContentLang, boolean>;
  status: ContentStatus;
  updatedAt: string | null;
  owner: string | null;
  /** Text used for SEO + copy checks (all languages concatenated). */
  summary: string;
  body: string;
  editHref: string | null;
  publicHref: string | null;
}

export interface ContentCheck {
  id: 'languages' | 'title_length' | 'summary_length' | 'slug' | 'internal_links' | 'copy';
  ok: boolean;
  value: string;
}

const filled = (v: string | null | undefined) => Boolean(v && v.trim());

function statusFor(isLive: boolean, langs: Record<ContentLang, boolean>): ContentStatus {
  if (!isLive) return 'draft';
  return langs.en && langs.ru ? 'published' : 'partial';
}

export interface RelocationRow { id: string; slug: string; title_en: string; title_ru: string; summary_en: string | null; summary_ru: string | null; content_en: string | null; content_ru: string | null; is_published: boolean; updated_at: string; category: string }
export interface InvestmentRow { id: string; slug: string; title_en: string; title_ru: string; excerpt_en: string | null; excerpt_ru: string | null; body_en: string | null; body_ru: string | null; is_published: boolean; updated_at: string; author_name: string | null }
export interface LegalRow { id: string; doc_key: string; title_en: string; title_ru: string; content_md: string; is_active: boolean; published_at: string | null; created_at: string; version: string }
export interface NewsRow { id: string; title: string; title_ru: string | null; summary: string | null; summary_ru: string | null; lang: string; url: string; published_at: string | null; fetched_at: string; source_label: string }

export function fromRelocation(r: RelocationRow): ContentItem {
  const languages = { en: filled(r.content_en) && filled(r.title_en), ru: filled(r.content_ru) && filled(r.title_ru) };
  return {
    id: `reloc:${r.id}`, source: 'relocation_articles', kind: 'guide', title: r.title_en || r.title_ru, slug: r.slug,
    languages, status: statusFor(r.is_published, languages), updatedAt: r.updated_at, owner: r.category,
    summary: [r.summary_en, r.summary_ru].filter(Boolean).join('\n'), body: [r.content_en, r.content_ru].filter(Boolean).join('\n'),
    editHref: '/admin/relocation-articles', publicHref: null,
  };
}

export function fromInvestment(r: InvestmentRow): ContentItem {
  const languages = { en: filled(r.body_en) && filled(r.title_en), ru: filled(r.body_ru) && filled(r.title_ru) };
  return {
    id: `invest:${r.id}`, source: 'investment_articles', kind: 'article', title: r.title_en || r.title_ru, slug: r.slug,
    languages, status: statusFor(r.is_published, languages), updatedAt: r.updated_at, owner: r.author_name,
    summary: [r.excerpt_en, r.excerpt_ru].filter(Boolean).join('\n'), body: [r.body_en, r.body_ru].filter(Boolean).join('\n'),
    editHref: null, publicHref: null,
  };
}

export function fromLegal(r: LegalRow): ContentItem {
  const languages = { en: filled(r.title_en), ru: filled(r.title_ru) };
  return {
    id: `legal:${r.id}`, source: 'legal_documents', kind: 'legal', title: `${r.title_en || r.title_ru} · v${r.version}`, slug: r.doc_key,
    languages, status: r.is_active ? statusFor(true, languages) : 'archived', updatedAt: r.published_at ?? r.created_at, owner: 'Legal',
    summary: '', body: r.content_md, editHref: '/admin/legal-documents', publicHref: null,
  };
}

export function fromNews(r: NewsRow): ContentItem {
  const en = r.lang === 'en' || filled(r.title);
  const ru = r.lang === 'ru' || filled(r.title_ru);
  const languages = { en, ru };
  return {
    id: `news:${r.id}`, source: 'official_news', kind: 'news', title: r.title || r.title_ru || '—', slug: null,
    languages, status: statusFor(Boolean(r.published_at), languages), updatedAt: r.published_at ?? r.fetched_at, owner: r.source_label,
    summary: [r.summary, r.summary_ru].filter(Boolean).join('\n'), body: '', editHref: '/admin/official-news', publicHref: null,
  };
}

const INTERNAL_LINK = /\]\((\/[^)\s]*)\)|href="(\/[^"]*)"/g;

export function countInternalLinks(text: string): number {
  return Array.from(text.matchAll(INTERNAL_LINK)).length;
}

export function contentChecks(item: ContentItem): { checks: ContentCheck[]; copyIssues: CopyIssue[] } {
  const copyIssues = checkCopy(`${item.title}\n${item.summary}\n${item.body}`);
  const firstSummary = item.summary.split('\n')[0] ?? '';
  const langsMissing = (Object.keys(item.languages) as ContentLang[]).filter((l) => !item.languages[l]);
  const links = countInternalLinks(item.body);
  const checks: ContentCheck[] = [
    { id: 'languages', ok: langsMissing.length === 0, value: langsMissing.length ? langsMissing.join(', ').toUpperCase() : 'EN · RU' },
    { id: 'title_length', ok: item.title.length > 0 && item.title.length <= 70, value: String(item.title.length) },
    { id: 'summary_length', ok: item.kind === 'legal' || (firstSummary.length >= 50 && firstSummary.length <= 170), value: String(firstSummary.length) },
    { id: 'slug', ok: item.kind === 'news' || Boolean(item.slug), value: item.slug ?? '—' },
    { id: 'internal_links', ok: item.kind !== 'guide' || links > 0, value: String(links) },
    { id: 'copy', ok: copyIssues.length === 0, value: String(copyIssues.length) },
  ];
  return { checks, copyIssues };
}

export function sortByUpdated(items: readonly ContentItem[]): ContentItem[] {
  return [...items].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
}
