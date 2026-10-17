import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, chmodSync, chownSync, realpathSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const team=id(1), admin=id(2), provider=id(3), foreign=id(4), companyMember=id(5), P=id(10), Q=id(11);
let directory: string; let sql: ReturnType<typeof postgres>; let started=false;
