// Guarded focused evidence from the real Vitest report; no scanner/production claims.
import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { dirname,resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const controls={
 actor_key_payload:/rejects changed payload and cross-actor key reuse/,
 lost_acknowledgement:/lost response and concurrent same-key retries/,
 rollback_after_write:/failure after inquiry insert rolls back/,
 scoped_operator_read:/checked operator list is scoped/,
 null_authorization:/NULL ownership cannot authorize/,
 pending_is_not_inventory:/without a hold or payment claim/,
 confirmation_conflict:/concurrent confirmations yield exactly one occupied stay/,
 cancellation_boundary:/confirmed request cannot synthesize paid cancellation/,
 stop_preserves_receipt:/emergency stop disables new writes/,
 estimate_is_not_paid:/unpaid estimate confirmation and repeated decisions never synthesize paid/,
 legacy_finance_preserved:/legacy financial trigger branch is preserved/,
 unrelated_dates_preserved:/cancelling a never-held request preserves unrelated booked availability/,
 inventory_mutation_guard:/owner cannot directly cancel, redate, delete or unlink/,
 inventory_replay_check:/acceptance replay rejects a missing occupied row/,
 restored_receipt_identity:/native restore preserves request receipt identity/,
};
export function focusedSecurityEvidence(report,headSha) {
 if(!/^[a-f0-9]{40}$/.test(headSha||''))throw Error('Exact PR head SHA is required');
 const suites=report?.testResults?.filter(s=>s.name?.replace(/\\/g,'/').endsWith('/src/lib/__tests__/rentalRequest.postgres.test.ts'))||[];
 if(suites.length!==1)throw Error('Exactly one real rental PostgreSQL suite is required');
 const suite=suites[0],cases=suite.assertionResults||[];
 const distinct=new Set(cases.map(c=>c.fullName));
 if(report.success!==true || suite.status!=='passed' || cases.length<33 || distinct.size!==cases.length || cases.some(c=>c.status!=='passed'))throw Error('Security suite is missing, failed, skipped, duplicated or incomplete');
 const covered=Object.fromEntries(Object.entries(controls).map(([name,pattern])=>[name,cases.filter(c=>pattern.test(c.fullName)).length]));
 if(Object.values(covered).some(count=>count===0))throw Error('Required security control evidence is absent');
 return {version:1,status:'passed',head_sha:headSha,assertions:cases.length,controls:covered,scope:'Actual SQL on isolated synthetic PostgreSQL; no hosted privileges, scanner certification, payment or production acceptance'};
}
const sha256=value=>createHash('sha256').update(value).digest('hex');
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Input report and output evidence paths are required');
  const raw=readFileSync(input);const evidence=focusedSecurityEvidence(JSON.parse(raw),process.env.SECURITY_EVIDENCE_HEAD_SHA);
  const paths=['src/lib/rentalRequest.ts','src/lib/__tests__/rentalRequest.postgres.test.ts','docs/convergence/rental_request_recovery/forward.sql','docs/convergence/rental_request_recovery/rollback.sql'];
  evidence.report_sha256=sha256(raw);evidence.source_sha256=Object.fromEntries(paths.map(path=>[path,sha256(readFileSync(path))]));
  evidence.workflow_run_id=process.env.GITHUB_RUN_ID||null;
  evidence.checkout_sha=process.env.GITHUB_SHA||null;
  evidence.generated_at=new Date().toISOString();
  mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(evidence,null,2),{mode:0o600});
  console.log(`Guarded rental security evidence: ${evidence.assertions} actual SQL assertions passed for ${evidence.head_sha}`);
 }catch(error){console.error(error.message);process.exitCode=1;}
}
