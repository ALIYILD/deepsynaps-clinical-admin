import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function setup(hash='',mobile=false){
 const nodes={},storage={},listeners={};
 const media={matches:mobile,addEventListener(type,fn){listeners.mediaChange=fn}};
 const historyEntries=[];
 const el=id=>nodes[id]||(nodes[id]={innerHTML:'',textContent:'',value:'',checked:false,open:false,style:{},dataset:{},attributes:{},setAttribute(k,v){this.attributes[k]=v},removeAttribute(k){delete this.attributes[k]},classList:{remove(){},toggle(){}},focus(){this.focused=true},insertAdjacentHTML(_,s){this.innerHTML+=s},addEventListener(){},showModal(){this.open=true;el('review-confirm').checked=false},close(){this.open=false}});
 const context=vm.createContext({console,document:{getElementById:el,documentElement:{dataset:{},style:{}},querySelector:s=>s==='.shell'?el('shell'):s==='.navigation-close'?el('navigation-close'):null,addEventListener:(type,fn)=>listeners[type]=fn},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},window:{scrollTo(){},matchMedia:()=>media},location:{hash},history:{replaceState(){},pushState(a,b,url){historyEntries.push(url);context.location.hash=url}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){}});
 for(const file of ['data.js','registry-evidence.js','product-data.js','app.js','product.js','workflow.js','loop-report.js','loops.js','product-ui.js'])vm.runInContext(fs.readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),context);
 return {historyEntries,media,run:s=>vm.runInContext(s,context),el,listeners,sign(){vm.runInContext('reviewNote()',context);el('review-confirm').checked=true;vm.runInContext('signNote()',context)}};
}
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
function parseHandlers(html){for(const m of html.matchAll(/\son(?:click|input|change|submit)="([^"]*)"/g))assert.doesNotThrow(()=>new Function('event',decode(m[1])),m[1]);}
test('product routes and dialogs render with valid interaction handlers',()=>{const {run,el}=setup();run('draftNote();fillForm()');for(const route of ['home','patients','record','documents','review','C','N','F','T','E','I','NHS','settings','catalogue','extensions','connections','organisation','delivery','loops']){run(`nav('${route}')`);assert(el('main').innerHTML.length>400,route);for(const id of ['main','sidebar','topbar'])parseHandlers(el(id).innerHTML);}for(const call of ['chooseConsultation()','openWorkspaceSearch()','openTaskComposer()','showWorkspaceProfile()','reviewNote()']){run(call);parseHandlers(el('dialog').innerHTML);}});
test('review queue and home counts aggregate separate patient notes and forms',()=>{const {run,el,sign}=setup();assert.equal(run('pendingReviewCount()'),0);run("draftNote();fillForm();openPatient('DEMO-002','N');draftNote();nav('review')");assert.equal(run('pendingReviewCount()'),3);assert(el('main').innerHTML.includes('Maya Collins'));assert(el('main').innerHTML.includes('Alex Taylor'));sign();assert.equal(run('pendingReviewCount()'),2);run('nav("home")');assert(el('main').innerHTML.includes('1</strong><span class="stat-bottom">Continue where you left off'));});
test('patient search works by name or ID, handles empty results and never renders query as markup',()=>{const {run}=setup();run("patientQuery='alex'");assert.equal(run('filteredPatients()[0].id'),'DEMO-002');run("patientQuery='demo-003'");assert.equal(run('filteredPatients()[0].name'),'Sam Wilson');run("patientQuery='<img src=x onerror=alert(1)>'");assert.equal(run('filteredPatients().length'),0);assert(!run('patientPage()').includes('<img src=x'));assert(run('patientDirectoryRows()').includes('No matching patients'));});
test('document filters remain distinct as reviews and amendments occur',()=>{const {run,sign}=setup();run('draftNote()');sign();run("openPatient('DEMO-002','N');draftNote();documentFilter='signed'");assert(run('documentsPage()').includes('Maya Collins'));assert(!run('documentsPage()').includes('Alex Taylor'));run("documentFilter='draft'");assert(!run('documentsPage()').includes('Maya Collins'));assert(run('documentsPage()').includes('Alex Taylor'));run("openPatient('DEMO-001','N');amendNote()");assert(run('documentsPage()').includes('Maya Collins'));});
test('changing active patient stays in the selected clinical workspace',()=>{const {run,el}=setup();run("openPatient('DEMO-001','F');chooseConsultation(route)");assert(el('dialog').innerHTML.includes("openPatient('DEMO-002','F')"));run("openPatient('DEMO-002','F')");assert.equal(run('route'),'F');assert(el('main').innerHTML.includes('Alex Taylor'));assert.equal((el('main').innerHTML.match(/aria-label="Active patient"/g)||[]).length,1);assert(el('main').innerHTML.indexOf('Active patient')<el('main').innerHTML.indexOf('aria-label="Patient workspace"'));});
test('product editor preserves exact-text review and signed-version protections',()=>{const {run,el,sign}=setup();run('draftNote();reviewNote()');el('review-confirm').checked=true;run("updateNote('A changed draft');signNote()");assert.equal(run('state.signed'),false);sign();assert.equal(run('state.signed'),true);assert(el('main').innerHTML.includes('readonly'));const text=run('state.note');run("updateNote('Cannot edit')");assert.equal(run('state.note'),text);run('amendNote()');assert.equal(run('state.version'),2);assert.equal(run('state.history[0].text'),text);});
test('task status and assignment filters operate on stable source indices',()=>{const {run}=setup();run("taskOwner='Admin team'");assert.equal(run('filteredTasks().length'),1);run('setTaskDone(2,true)');assert.equal(run('filteredTasks().length'),0);run("taskFilter='done'");assert.equal(run('filteredTasks()[0].index'),2);run("setTaskOwner(2,'Care team')");assert.equal(run('filteredTasks().length'),0);run("setTaskOwner(2,'Unexpected')");assert.equal(run('state.tasks[2].owner'),'Care team');});
test('task composer validates inputs and renders user text safely',()=>{const {run}=setup();run("saveComposedTask({description:{value:'<script>example</script>'},owner:{value:'Care team'}})");assert.equal(run('state.tasks.length'),4);assert(!run('tasks()').includes('<script>'));run("saveComposedTask({description:{value:' '},owner:{value:'Care team'}})");assert.equal(run('state.tasks.length'),4);run("saveComposedTask({description:{value:'Test'},owner:{value:'Unknown'}})");assert.equal(run('state.tasks.length'),4);});
test('workspace search exposes patient destinations and has keyboard entry',()=>{const {run,el,listeners}=setup();assert(run("workspaceSearchResults('sam')").includes("openPatient('DEMO-003')"));assert(run("workspaceSearchResults('review')").includes("nav('review')"));let prevented=false;listeners.keydown({metaKey:true,key:'k',preventDefault(){prevented=true}});assert.equal(prevented,true);assert.equal(el('workspace-query').focused,true);parseHandlers(el('dialog').innerHTML);});
test('product navigation moves engineering controls to settings while retaining honest environment state',()=>{const {run,el}=setup('#documents');assert.equal(run('route'),'documents');assert(!el('sidebar').innerHTML.includes('Implementation loops'));run("nav('settings')");assert(el('main').innerHTML.includes('Implementation loops'));const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert(html.includes('Development workspace'));assert(html.includes('Synthetic records'));assert(html.includes('Clinical OS not connected'));assert(!html.includes('INTERACTIVE DEMO'));assert.equal(run('productConfig.apiConnected'),false);assert(html.indexOf('src="product-ui.js"')>html.indexOf('src="workflow.js"'));});

test('mobile navigation hides closed controls and restores access and focus after dismissal',()=>{
 const {run,el}=setup('',true);
 assert.equal(el('sidebar').inert,true);assert.equal(el('shell').inert,false);
 run('openWorkspaceNavigation()');
 assert.equal(el('sidebar').inert,false);assert.equal(el('shell').inert,true);
 assert.equal(el('sidebar').attributes['aria-modal'],'true');
 assert.equal(el('navigation-toggle').attributes['aria-expanded'],'true');
 assert.equal(el('navigation-close').focused,true);
 run('closeWorkspaceNavigation()');
 assert.equal(el('sidebar').inert,true);assert.equal(el('shell').inert,false);
 assert.equal(el('navigation-toggle').focused,true);
 assert.equal(el('sidebar').attributes['aria-modal'],undefined);
});
test('route changes and desktop resize clear mobile navigation without leaving content inert',()=>{
 const {run,el,media,listeners}=setup('',true);
 run("openWorkspaceNavigation();nav('patients')");
 assert.equal(el('sidebar').inert,true);assert.equal(el('shell').inert,false);
 assert.equal(el('main').focused,true);
 assert.equal(run('document.title'),'Patients | DeepSynaps Clinical Admin');
 run('openWorkspaceNavigation()');media.matches=false;listeners.mediaChange();
 assert.equal(el('sidebar').inert,false);assert.equal(el('shell').inert,false);
 assert.equal(run('mobileNavigationOpen'),false);
});
test('navigation creates history entries once and preserves deep links',()=>{
 const {run,historyEntries}=setup('#home');
 run("nav('patients');nav('patients');nav('documents')");
 assert.deepEqual(historyEntries,['#patients','#documents']);
 assert.equal(run('location.hash'),'#documents');
});
