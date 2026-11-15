import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export function verifyDependencyAudits(all,production,policy,readBytes){
 for(const report of [all,production]){
  if(report?.error||!Number.isSafeInteger(report?.metadata?.vulnerabilities?.total)||!report.vulnerabilities||report.metadata.vulnerabilities.total!==Object.keys(report.vulnerabilities).length)throw new Error('Verified complete npm audit report is required');
 }
 if(production.metadata.vulnerabilities.total!==0||Object.keys(production.vulnerabilities).length)throw new Error('Production dependency advisories are not accepted');
 const allowed=new Set(policy.allowed_dev_nodes);
 for(const [name,entry] of Object.entries(all.vulnerabilities)){
  if(!allowed.has(name)||entry.severity!=='low'||!Array.isArray(entry.via)||!entry.via.length)throw new Error(`Unreviewed advisory: ${name}`);
  for(const cause of entry.via){
   if(typeof cause==='string'?!allowed.has(cause):cause.url!==policy.advisory||cause.severity!=='low')throw new Error(`Unreviewed advisory cause: ${name}`);
  }
 }
 for(const file of policy.reviewed_installed_sources){
  if(createHash('sha256').update(readBytes(file.path)).digest('hex')!==file.sha256)throw new Error('Reviewed build consumer changed; reassess advisory reachability');
 }
 return {production:0,reviewedBuildOnlyNodes:Object.keys(all.vulnerabilities).length};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const [allPath,prodPath]=process.argv.slice(2);if(!allPath||!prodPath)throw new Error('Pass full and production npm audit JSON reports');
 const parse=path=>JSON.parse(readFileSync(path,'utf8'));
 console.log(JSON.stringify(verifyDependencyAudits(parse(allPath),parse(prodPath),parse('docs/security/dependency-audit-policy.json'),readFileSync)));
}
