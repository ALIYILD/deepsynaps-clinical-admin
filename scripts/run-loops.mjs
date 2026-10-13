// One finite local verification pass. No background scheduling, credentials or deployments.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {sourceEvidence,unassignedNodeTests} from './source-evidence.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const ledger=JSON.parse(fs.readFileSync(path.join(root,'loops/implementation.json'),'utf8'));
const records=[];let failed=false;
const source=sourceEvidence(root);
const unassignedTests=unassignedNodeTests(source.manifest,ledger.loops);
if(unassignedTests.length){failed=true;console.error('Node test suites missing from loop ledger: '+unassignedTests.join(', '));}
let sourceChanged=false;
const syntaxChecks=[];
// Remove prior TAP files so skipped loops cannot appear verified by this run.
fs.mkdirSync(path.join(root,'loops/evidence'),{recursive:true});
for(const file of fs.readdirSync(path.join(root,'loops/evidence')).filter(f=>f.endsWith('.tap'))){
 fs.unlinkSync(path.join(root,'loops/evidence',file));
}
// Validate shipped JS before recording any passing local loop.
for(const file of source.manifest.map(f=>f.path).filter(f=>/\.(js|mjs)$/.test(f))){
 const r=spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8',timeout:30000});
 syntaxChecks.push({file,result:r.status===0?'passed':'failed'});
 if(r.status!==0){console.error(r.stderr||r.error);failed=true;}
}
for(const loop of ledger.loops){
 if(loop.mode==='blocked'){records.push({...loop,result:'blocked',testsPassed:0});console.log(loop.id+' BLOCKED — '+loop.blockers[0]);continue;}
 if(failed){records.push({...loop,result:'not_run',testsPassed:0});continue;}
 const r=spawnSync(process.execPath,['--test','--test-reporter=tap',...loop.tests],{cwd:root,encoding:'utf8',timeout:60000});
 const output=(r.stdout||'')+(r.stderr||'')+(r.error?'\nRunner error: '+r.error.code+'\n':'');
 sourceChanged=sourceEvidence(root).fingerprint!==source.fingerprint;
 const passed=r.status===0&&!sourceChanged;
 const testsPassed=Number(output.match(/^# pass (\d+)/m)?.[1]||0);
 fs.mkdirSync(path.join(root,'loops/evidence'),{recursive:true});fs.writeFileSync(path.join(root,'loops/evidence',loop.id+'.tap'),output);
 records.push({...loop,result:passed?'passed':'failed',testsPassed,...(sourceChanged?{verificationError:'source_changed_during_verification'}:{})});
 console.log(loop.id+' '+(passed?'PASS':'FAIL')+' — '+testsPassed+' tests');
 if(!passed){failed=true;console.error(sourceChanged?'Source changed during verification; later local loops will not run.':output||String(r.error));}
}
sourceChanged=sourceChanged||sourceEvidence(root).fingerprint!==source.fingerprint;
if(sourceChanged)failed=true;
const report={schemaVersion:2,generatedAt:new Date().toISOString(),sourceFingerprint:source.fingerprint,fingerprintAlgorithm:source.algorithm,sourceManifest:source.manifest,sourceChanged,unassignedTests,syntaxChecks,result:failed?'failed':'passed',verification:'Local Node tests and static syntax checks; browser tests are fingerprinted but run separately in CI; no live staging tests or manual accessibility audit',totalPassed:records.reduce((n,l)=>n+l.testsPassed,0),loops:records};
fs.writeFileSync(path.join(root,'loops/latest-report.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(root,'dist/loop-report.js'),'const implementationLoopReport='+JSON.stringify(report)+';\n');
process.exitCode=failed?1:0;
