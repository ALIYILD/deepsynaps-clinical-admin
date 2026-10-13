import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

function fixture(t,{syntaxFailure=false,testFailure=false,sourceMutation=false,unassigned=false}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'clinical-admin-runner-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const dir of ['scripts','dist','integration','tests','loops/evidence'])fs.mkdirSync(path.join(root,dir),{recursive:true});
 fs.copyFileSync(new URL('../scripts/run-loops.mjs',import.meta.url),path.join(root,'scripts/run-loops.mjs'));
 fs.copyFileSync(new URL('../scripts/source-evidence.mjs',import.meta.url),path.join(root,'scripts/source-evidence.mjs'));
 fs.writeFileSync(path.join(root,'dist/app.js'),syntaxFailure?'const = ;':'const valid = true;');
 fs.writeFileSync(path.join(root,'tests/first.mjs'),`import test from 'node:test';test('first',()=>{${testFailure?"throw Error('intentional fixture failure');":''}});`);
 fs.writeFileSync(path.join(root,'tests/second.mjs'),"import test from 'node:test';test('second',()=>{});");
 if(sourceMutation)fs.writeFileSync(path.join(root,'tests/first.mjs'),"import fs from 'node:fs';import test from 'node:test';test('mutation',()=>fs.writeFileSync('dist/style.css','changed during test'));");
 if(unassigned)fs.writeFileSync(path.join(root,'tests/forgotten.test.mjs'),"import test from 'node:test';test('forgotten',()=>{});");
 fs.writeFileSync(path.join(root,'loops/implementation.json'),JSON.stringify({loops:[
  {id:'L01',mode:'local',tests:['tests/first.mjs']},
  {id:'L02',mode:'local',tests:['tests/second.mjs']},
  {id:'L04',mode:'blocked',blockers:['Identity contract missing']}
 ]}));
 for(const id of ['L01','L02'])fs.writeFileSync(path.join(root,'loops/evidence',id+'.tap'),'stale passing evidence');
 // Launch as an independent CLI invocation, outside this test worker's context.
 const env={...process.env};delete env.NODE_TEST_CONTEXT;
 const result=spawnSync(process.execPath,['scripts/run-loops.mjs'],{cwd:root,env,encoding:'utf8',timeout:15000});
 assert.ifError(result.error);
 return {root,result,report:JSON.parse(fs.readFileSync(path.join(root,'loops/latest-report.json'),'utf8'))};
}

test('failed loop stops later tests and removes their stale evidence',t=>{
 const {root,result,report}=fixture(t,{testFailure:true});
 assert.equal(result.status,1);
 assert.deepEqual(report.loops.map(l=>l.result),['failed','not_run','blocked']);
 assert.equal(fs.existsSync(path.join(root,'loops/evidence/L02.tap')),false);
 assert.match(fs.readFileSync(path.join(root,'loops/evidence/L01.tap'),'utf8'),/intentional fixture failure/);
});
test('syntax failure invalidates all local evidence while retaining blocked records',t=>{
 const {root,result,report}=fixture(t,{syntaxFailure:true});
 assert.equal(result.status,1);
 assert.deepEqual(report.loops.map(l=>l.result),['not_run','not_run','blocked']);
 assert.deepEqual(fs.readdirSync(path.join(root,'loops/evidence')),[]);
});
test('successful local verification does not report blocked connected loops as passed',t=>{
 const {root,result,report}=fixture(t);
 assert.equal(result.status,0);
 assert.equal(report.totalPassed,2);
 assert.deepEqual(report.loops.map(l=>l.result),['passed','passed','blocked']);
 assert.match(report.sourceFingerprint,/^[a-f0-9]{64}$/);
 assert.equal(fs.readFileSync(path.join(root,'dist/loop-report.js'),'utf8'),'const implementationLoopReport='+JSON.stringify(report)+';\n');
});
test('source changes during verification invalidate the pass and stop later loops',t=>{
 const {root,result,report}=fixture(t,{sourceMutation:true});
 assert.equal(result.status,1);assert.equal(report.result,'failed');
 assert.equal(report.sourceChanged,true);
 assert.deepEqual(report.loops.map(l=>l.result),['failed','not_run','blocked']);
 assert.equal(report.loops[0].verificationError,'source_changed_during_verification');
 assert.equal(fs.existsSync(path.join(root,'loops/evidence/L02.tap')),false);
});
test('unassigned Node suites fail verification instead of silently being skipped',t=>{
 const {result,report}=fixture(t,{unassigned:true});
 assert.equal(result.status,1);
 assert.deepEqual(report.unassignedTests,['tests/forgotten.test.mjs']);
 assert.deepEqual(report.loops.map(l=>l.result),['not_run','not_run','blocked']);
});
