import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function setup(seed){
 const nodes={},storage=seed?{'clinical-admin-demo-v1':JSON.stringify(seed)}:{};
 const el=id=>nodes[id]||(nodes[id]={innerHTML:'',textContent:'',value:'',checked:false,disabled:false,open:false,style:{},dataset:{},classList:{remove(){},toggle(){}},insertAdjacentHTML(_,s){this.innerHTML+=s},addEventListener(){},showModal(){this.open=true;this.checked=false;el('review-confirm').checked=false},close(){this.open=false}});
 const ctx=vm.createContext({console,document:{getElementById:el,documentElement:{dataset:{},style:{}},querySelector:()=>null},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},window:{scrollTo(){}},location:{hash:''},history:{replaceState(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){}});
 for(const file of ['data.js','registry-evidence.js','product-data.js','app.js','product.js','workflow.js'])vm.runInContext(fs.readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),ctx);
 return {run:s=>vm.runInContext(s,ctx),el,storage,sign(){vm.runInContext('reviewNote()',ctx);el('review-confirm').checked=true;vm.runInContext('signNote()',ctx)}};
}
test('consent, notes and signatures stay with their fictional patient',()=>{const {run,sign}=setup();run('state.consent=true;draftNote()');sign();run("selectPatient('DEMO-002')");assert.equal(run('state.consent'),false);assert.equal(run('state.note'),'');assert.equal(run('state.signed'),false);run('draftNote()');assert(run("state.note.includes('Alex Taylor')"));assert(!run("state.note.includes('Maya')"));run("selectPatient('DEMO-001')");assert.equal(run('state.signed'),true);assert(run("state.note.includes('Maya Collins')"));});
test('saved multi-patient state rehydrates without losing selected record',()=>{const {run,storage}=setup();run("draftNote();selectPatient('DEMO-003');draftNote();save()");const {run:again}=setup(JSON.parse(storage['clinical-admin-demo-v1']));assert.equal(again('state.selectedPatientId'),'DEMO-003');assert(again("state.note.includes('Sam Wilson')"));again("selectPatient('DEMO-001')");assert(again("state.note.includes('Maya Collins')"));});
test('legacy browser notes migrate to Maya only',()=>{const base=setup().run('JSON.stringify(initial())');const old=JSON.parse(base);old.note='Legacy Maya draft';old.consent=true;const {run}=setup(old);assert.equal(run('state.note'),'Legacy Maya draft');run("selectPatient('DEMO-002')");assert.equal(run('state.note'),'');assert.equal(run('state.consent'),false);});
test('editing after review invalidates the exact snapshot',()=>{const {run,el}=setup();run('draftNote();reviewNote()');el('review-confirm').checked=true;run("updateNote('Changed text');signNote()");assert.equal(run('state.signed'),false);run('reviewNote()');el('review-confirm').checked=true;run('signNote()');assert.equal(run('state.signed'),true);});
test('switching patients cancels pending signature and stops simulated capture',()=>{const {run,el}=setup();run('draftNote();reviewNote();recording=true');el('review-confirm').checked=true;run("selectPatient('DEMO-002');signNote()");assert.equal(run('state.signed'),false);assert.equal(run('recording'),false);run("selectPatient('DEMO-001');signNote()");assert.equal(run('state.signed'),false);});
test('signed history remains unchanged during an amendment',()=>{const {run,sign}=setup();run('draftNote()');sign();const original=run('state.note');run("updateNote('Forbidden')");assert.equal(run('state.note'),original);run("amendNote();updateNote('Amended draft')");assert.equal(run('state.history[0].text'),original);assert.equal(run('state.version'),2);assert.equal(run('state.signed'),false);});
test('forms require all field reviews; edits invalidate approval eligibility',()=>{const {run,el}=setup();run('fillForm();approveForm()');assert.equal(run('state.formApproval'),null);run('reviewFormField(0,true);reviewFormField(1,true);reviewFormField(2,true)');assert.equal(run('state.formReviewed'),true);run("editFormField(1,'Friday morning');approveForm()");assert.equal(run('state.formApproval'),null);assert.equal(el('form-approve').disabled,true);run('reviewFormField(1,true);approveForm()');assert.equal(run('state.formApproval.fields[1].value'),'Friday morning');assert.equal(run('state.formApproval.fields[1].original'),'Tuesday morning');});
test('approved form snapshot is protected, isolated and explicitly reopened',()=>{const {run}=setup();run('fillForm();reviewFormField(0,true);reviewFormField(1,true);reviewFormField(2,true);approveForm()');run("editFormField(1,'Forbidden')");assert.equal(run('state.formData[1].value'),'Tuesday morning');run("selectPatient('DEMO-003');fillForm()");assert.equal(run('state.formApproval'),null);assert.equal(run('state.formData[1].value'),'Thursday morning');run("selectPatient('DEMO-001')");assert.equal(run('state.formApproval.patientId'),'DEMO-001');run('reopenForm()');assert.equal(run('state.formReviewed'),false);assert.equal(run('state.formData.some(f=>f.reviewed)'),false);});
test('follow-up tasks deduplicate by patient and signed version and retain source',()=>{const {run,sign}=setup();run('draftNote()');sign();run('createFollowup();createFollowup()');assert.equal(run('state.tasks.length'),4);const original=run('state.tasks[3].sourceNote');run("amendNote();updateNote('Updated next steps')");sign();run('createFollowup()');assert.equal(run('state.tasks.length'),5);assert.equal(run('state.tasks[3].sourceNote'),original);assert.equal(run('state.tasks[4].sourceNote'),'Updated next steps');});
test('handoff and exports use the selected patient with honest submission status',()=>{const {run,sign,el}=setup();run("selectPatient('DEMO-002');draftNote()");sign();run('previewHandoff()');assert(el('dialog').innerHTML.includes('DEMO-002'));assert(!el('dialog').innerHTML.includes('DEMO-001'));assert(el('dialog').innerHTML.includes('NOT_SUBMITTED'));run("let lastExport;download=(...args)=>lastExport=args;exportNote()");assert.equal(run('lastExport[0]'),'DEMO-002-note-v1.txt');assert(run("lastExport[1].includes('Alex Taylor')"));});
test('refilling cannot overwrite an approved form before explicit reopening',()=>{
 const {run}=setup();
 run("fillForm();editFormField(1,'Friday morning');reviewFormField(0,true);reviewFormField(1,true);reviewFormField(2,true);approveForm()");
 const approved=run('JSON.stringify(state.formApproval)');
 run('fillForm()');
 assert.equal(run('JSON.stringify(state.formApproval)'),approved);
 assert.equal(run('state.formData[1].value'),'Friday morning');
 run('reopenForm();fillForm()');
 assert.equal(run('state.formApproval'),null);
 assert.equal(run('state.formData[1].value'),'Tuesday morning');
});
test('edited note and form content is escaped when rendered',()=>{const {run}=setup();run("updateNote('<img src=x onerror=alert(1)>');fillForm();editFormField(0,'<script>bad()</script>')");assert(!run('notes()').includes('<img src=x'));assert(run('notes()').includes('&lt;img'));assert(!run('forms()').includes('<script>'));assert(run('forms()').includes('&lt;script&gt;'));});
test('reset clears all patient records and leaves API connection disabled',()=>{const {run}=setup();run("draftNote();selectPatient('DEMO-003');fillForm();state=initial();nav('home')");assert.equal(run('state.selectedPatientId'),'DEMO-001');assert.equal(run('Object.values(state.patientRecords).some(r=>r.note||r.formData)'),false);assert.equal(run('productConfig.apiConnected'),false);});
test('failed persistence warns without losing the current draft and retry saves all records',()=>{
 const {run,el,storage}=setup();
 run("const originalSetItem=localStorage.setItem;localStorage.setItem=()=>{throw Error('quota')};draftNote();saveNote()");
 assert.equal(el('storage-status').hidden,false);
 assert.match(el('toast').textContent,/Saving failed/);
 assert.match(run('state.note'),/Maya Collins/);
 run("selectPatient('DEMO-002');draftNote();localStorage.setItem=originalSetItem;retrySave()");
 assert.equal(el('storage-status').hidden,true);
 const saved=JSON.parse(storage['clinical-admin-demo-v1']);
 assert.match(saved.patientRecords['DEMO-001'].note,/Maya Collins/);
 assert.match(saved.patientRecords['DEMO-002'].note,/Alex Taylor/);
});
test('failed reset does not claim stored records were removed',()=>{
 const {run,el,storage}=setup();
 run("draftNote();const persistedBeforeReset=localStorage.getItem('clinical-admin-demo-v1');localStorage.setItem=()=>{throw Error('denied')};resetDemo()");
 assert.equal(storage['clinical-admin-demo-v1'],run('persistedBeforeReset'));
 assert.match(el('toast').textContent,/previous saved records may return/);
 assert.equal(el('storage-status').hidden,false);
 assert.equal(run('state.note'),'');
});
test('a stale tab cannot save or reset over a newer stored workspace',()=>{
 const {run,storage,el}=setup();run('draftNote()');
 const newer=JSON.parse(storage['clinical-admin-demo-v1']);
 newer.patientRecords['DEMO-001'].note='Newer signed note from another tab';
 newer.patientRecords['DEMO-001'].signed=true;
 storage['clinical-admin-demo-v1']=JSON.stringify(newer);
 run("updateNote('Stale edit');retrySave()");
 assert.equal(storage['clinical-admin-demo-v1'],JSON.stringify(newer));
 assert.match(el('storage-message').textContent,/Another tab/);
 assert.equal(el('storage-retry').hidden,true);
 assert.equal(el('storage-reload').hidden,false);
 run('resetDemo()');
 assert.equal(storage['clinical-admin-demo-v1'],JSON.stringify(newer));
});
test('cleared storage is not silently repopulated by an older tab',()=>{
 const {run,storage}=setup();run('draftNote()');
 delete storage['clinical-admin-demo-v1'];
 assert.equal(run('save()'),false);
 assert.equal(storage['clinical-admin-demo-v1'],undefined);
 run('let recovered;download=(name,body)=>{recovered=JSON.parse(body)};exportRecovery()');
 assert.equal(run('recovered.status'),'DEMO_LOCAL_RECOVERY_NOT_FOR_IMPORT');
 assert.match(run("recovered.workspace.patientRecords['DEMO-001'].note"),/Maya Collins/);
});
