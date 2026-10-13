// One finite local verification pass. No background scheduling, credentials or deployments.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const ledger=JSON.parse(fs.readFileSync(path.join(root,'loops/implementation.json'),'utf8'));
const records=[];let failed=false;
// Validate shipped JS before recording any passing local loop.
for(const file of fs.readdirSync(path.join(root,'dist')).filter(f=>f.endsWith('.js')&&f!=='loop-report.js')){
 const r=spawnSync(process.execPath,['--check','dist/'+file],{cwd:root,encoding:'utf8',timeout:30000});
 if(r.status!==0){console.error(r.stderr||r.error);failed=true;}
}
for(const loop of ledger.loops){
 if(loop.mode==='blocked'){records.push({...loop,result:'blocked',testsPassed:0});console.log(loop.id+' BLOCKED — '+loop.blockers[0]);continue;}
 if(failed){records.push({...loop,result:'not_run',testsPassed:0});continue;}
 const r=spawnSync(process.execPath,['--test','--test-reporter=tap',...loop.tests],{cwd:root,encoding:'utf8',timeout:60000});
 const output=(r.stdout||'')+(r.stderr||'');const passed=r.status===0;
 const testsPassed=Number(output.match(/^# pass (\d+)/m)?.[1]||0);
 fs.mkdirSync(path.join(root,'loops/evidence'),{recursive:true});fs.writeFileSync(path.join(root,'loops/evidence',loop.id+'.tap'),output);
 records.push({...loop,result:passed?'passed':'failed',testsPassed});
 console.log(loop.id+' '+(passed?'PASS':'FAIL')+' — '+testsPassed+' tests');
 if(!passed){failed=true;console.error(output||String(r.error));}
}
const evidenceFiles=['loops/implementation.json','scripts/run-loops.mjs',...fs.readdirSync(path.join(root,'dist')).filter(f=>f.endsWith('.js')&&f!=='loop-report.js').map(f=>'dist/'+f),...fs.readdirSync(path.join(root,'integration')).filter(f=>f.endsWith('.mjs')).map(f=>'integration/'+f),...fs.readdirSync(path.join(root,'tests')).filter(f=>f.endsWith('.mjs')).map(f=>'tests/'+f)].sort();
const hash=createHash('sha256');for(const file of evidenceFiles){hash.update(file);hash.update(fs.readFileSync(path.join(root,file)));}
const report={generatedAt:new Date().toISOString(),sourceFingerprint:hash.digest('hex'),verification:'Local Node tests and static syntax checks; no browser visual audit or live staging tests',totalPassed:records.reduce((n,l)=>n+l.testsPassed,0),loops:records};
fs.writeFileSync(path.join(root,'loops/latest-report.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(root,'dist/loop-report.js'),'const implementationLoopReport='+JSON.stringify(report)+';\n');
process.exitCode=failed?1:0;
