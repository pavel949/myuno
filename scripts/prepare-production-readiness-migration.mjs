import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const financialSources=[
 'docs/convergence/atomic_property_order/forward.sql',
 'docs/hardening/production-readiness/managed-booking.sql',
 'docs/hardening/production-readiness/manual-request.sql',
 'docs/hardening/production-readiness/stripe-settlement.sql',
 'docs/hardening/production-readiness/manual-receipts.sql',
 'docs/hardening/production-readiness/order-authority.sql',
];
export function financialMigration(){
 const sections=financialSources.map(path=>{
  const source=readFileSync(path,'utf8');
  if(!/^BEGIN;$/m.test(source)||! /\nCOMMIT;\s*$/.test(source))throw new Error(`Transaction boundary missing: ${path}`);
  const body=source.replace(/^BEGIN;\r?\n/m,'').replace(/\nCOMMIT;\s*$/,'');
  return `-- Source: ${path}\n-- SHA256: ${createHash('sha256').update(source).digest('hex')}\n${body}`;
 });
 return `-- Generated from reviewed source snapshots. NOT APPLIED.\n-- One transaction: inventory, writers, receipt safeguards, restrictive cutover.\nBEGIN;\n\n${sections.join('\n\n')}\n\nCOMMIT;\n`;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const output=process.argv[2];
 if(!/^supabase\/migrations\/\d{14}_production_readiness_atomic_payments\.sql$/.test(output??''))throw new Error('Pass the empty path created by supabase migration new');
 if(readFileSync(output,'utf8').trim())throw new Error('Refusing to overwrite a populated migration');
 writeFileSync(output,financialMigration());
}
