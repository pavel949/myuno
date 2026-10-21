export interface SourceEntry { id: string; path: string; sha256: string; optional?: boolean }
export interface BundleOptions { rootDir?: string; includeDelegation?: boolean; rollback?: boolean }
export interface SqlStatement { start: number; end: number; words: string[]; simpleKeyword: boolean }
export const repositoryRoot: string;
export const manifest: { sourceCommit: string; activation: SourceEntry[]; rollback: SourceEntry[] };
export function sqlStatementBoundaries(source: string): SqlStatement[];
export function stripOuterTransaction(source: string, label?: string): string;
export function buildEmployeePublicationBundle(options?: BundleOptions): string;
