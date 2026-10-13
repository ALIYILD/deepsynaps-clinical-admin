import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {sourceEvidence} from '../scripts/source-evidence.mjs';

test('manifest covers nested browser and deployment inputs and excludes generated reports',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'clinical-evidence-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const inputs=['dist/index.html','dist/style.css','dist/assets/logo.svg','docs/runbook.md','tests/browser/workflow.spec.mjs','package-lock.json','netlify.toml','netlify/functions/health.mjs','.github/workflows/verify.yml'];
 for(const file of inputs){fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),'original');}
 const original=sourceEvidence(root);
 assert.deepEqual(original.manifest.map(f=>f.path),inputs.sort());
 assert.equal(sourceEvidence(root).fingerprint,original.fingerprint);
 fs.writeFileSync(path.join(root,'dist/loop-report.js'),'generated at a new time');
 assert.equal(sourceEvidence(root).fingerprint,original.fingerprint);
 for(const file of inputs){
  fs.writeFileSync(path.join(root,file),'changed');
  assert.notEqual(sourceEvidence(root).fingerprint,original.fingerprint,file);
  fs.writeFileSync(path.join(root,file),'original');
 }
 fs.unlinkSync(path.join(root,'dist/style.css'));
 assert.notEqual(sourceEvidence(root).fingerprint,original.fingerprint);
});
