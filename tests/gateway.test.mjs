import test from 'node:test';import assert from 'node:assert/strict';
import {createClinicalAdminGateway} from '../integration/clinical-admin-gateway.mjs';
import {IntegrationError,createClinicalOsReader} from '../integration/clinical-os-reader.mjs';
const request=(path,init)=>new Request('https://clinical-admin.example.invalid/api/clinical-admin/'+path,init);
const session=()=>({subject:'tester-1',organisationId:'synthetic-oxford',expiresAt:2000,permissions:['workspace:read','partner:read','partner:clinic_read'],upstreamAccessToken:'test-user-token'});
function configured(overrides={}){const calls=[];return {calls,handle:createClinicalAdminGateway({now:()=>1000,verifySession:async()=>session(),canReadPatient:async()=>true,resolveTenantReader:async org=>({organisationId:org,reader:{workspace:async(op,p)=>{calls.push({org,op,p});return {sample:true}},partner:async(op,p)=>{calls.push({org,op,p});return {sample:true}}}}),...overrides})}}
test('unconfigured sessions cannot be bypassed by request headers',async()=>{const h=createClinicalAdminGateway();const r=await h(request('workspace/profile',{headers:{Authorization:'Bearer pretend','X-Organisation':'synthetic-oxford'}}));assert.equal(r.status,503)});
test('missing, expired and malformed sessions denied',async()=>{for(const value of [null,{...session(),expiresAt:999},{...session(),expiresAt:'forever'},{...session(),subject:''}]){const {handle,calls}=configured({verifySession:async()=>value});assert.equal((await handle(request('workspace/profile'))).status,401);assert.equal(calls.length,0)}});
test('upstream identity is taken from verified session',async()=>{const {handle,calls}=configured();const r=await handle(request('workspace/profile',{headers:{'X-Organisation':'another','X-Access-Token':'fake'}}));assert.equal(r.status,200);assert.equal(calls[0].org,'synthetic-oxford');assert.equal(calls[0].p.accessToken,'test-user-token');assert.equal(r.headers.get('cache-control'),'no-store')});
test('missing permission and absent upstream session denied',async()=>{for(const [patch,path,code] of [[{permissions:[]},'partner/meta',403],[{upstreamAccessToken:null},'workspace/profile',401]]){const {handle,calls}=configured({verifySession:async()=>({...session(),...patch})});assert.equal((await handle(request(path))).status,code);assert.equal(calls.length,0)}});
test('patient access cannot be inherited from a broad partner key',async()=>{for(const decision of [false,undefined,'false',{}]){const {handle,calls}=configured({canReadPatient:async()=>decision});assert.equal((await handle(request('partner/documents?patientId=DEMO-002'))).status,404);assert.equal(calls.length,0)}});
test('missing patient authoriser and mismatched tenant binding fail closed',async()=>{let c=configured({canReadPatient:undefined});assert.equal((await c.handle(request('partner/documents?patientId=DEMO-001'))).status,503);c=configured({resolveTenantReader:async()=>({organisationId:'other',reader:{}})});assert.equal((await c.handle(request('partner/meta'))).status,503)});
test('clinic-wide handovers require explicit permission',async()=>{const {handle,calls}=configured({verifySession:async()=>({...session(),permissions:['partner:read']})});assert.equal((await handle(request('partner/tasks'))).status,403);assert.equal(calls.length,0)});
test('writes, unknown routes and scope-injecting query parameters denied',async()=>{const {handle,calls}=configured();for(const [path,init,status] of [['workspace/profile',{method:'POST'},405],['partner/unknown',{},404],['partner/meta?organisationId=other',{},400],['partner/documents?patientId=a&patientId=b',{},400],['partner/tasks?status=deleted',{},400]])assert.equal((await handle(request(path,init))).status,status);assert.equal(calls.length,0)});
test('approved patient read succeeds through bound reader',async()=>{const {handle,calls}=configured();const r=await handle(request('partner/documents?patientId=DEMO-001'));assert.equal(r.status,200);assert.equal(calls[0].p.patientId,'DEMO-001');assert.equal(calls[0].p.accessToken,undefined)});
test('upstream denials preserved; unexpected errors never expose secrets',async()=>{for(const e of [new IntegrationError('upstream_access_denied',403),Error('secret-stack')]){const {handle}=configured({resolveTenantReader:async()=>{throw e}});const r=await handle(request('partner/meta'));assert.equal(r.status,e.status||503);assert(!(await r.text()).includes('secret'))}});
test('expiry during patient authorisation stops before tenant resolution',async()=>{
 let time=1000,resolutions=0;
 const {handle,calls}=configured({now:()=>time,canReadPatient:async()=>{time=2000;return true;},resolveTenantReader:async()=>{resolutions++;}});
 const r=await handle(request('partner/documents?patientId=DEMO-001'));
 assert.equal(r.status,401);assert.equal(resolutions,0);assert.equal(calls.length,0);
});
test('expiry during tenant lookup prevents an upstream request',async()=>{
 let time=1000,reads=0;
 const {handle}=configured({now:()=>time,resolveTenantReader:async organisationId=>{
  time=2000;return {organisationId,reader:{partner:async()=>{reads++;return {};}}};
 }});
 assert.equal((await handle(request('partner/meta'))).status,401);assert.equal(reads,0);
});
test('a session that expires during an upstream read cannot receive its patient data',async()=>{
 let time=1000;
 const {handle}=configured({now:()=>time,resolveTenantReader:async organisationId=>({organisationId,reader:{partner:async()=>{time=2000;return {patient:'must-not-be-returned'};}}})});
 const r=await handle(request('partner/documents?patientId=DEMO-001'));
 assert.equal(r.status,401);assert.deepEqual(await r.json(),{error:'valid_session_required'});
 assert.equal(r.headers.get('cache-control'),'no-store');
});
test('invalid clocks and whitespace identities fail closed',async()=>{
 for(const now of [()=>NaN,()=>Infinity])assert.equal((await configured({now}).handle(request('partner/meta'))).status,401);
 for(const patch of [{subject:' '},{organisationId:'\t'},{upstreamAccessToken:' '},{upstreamAccessToken:'token\r\nsecret'}]){
  const {handle,calls}=configured({verifySession:async()=>({...session(),...patch})});
  assert.equal((await handle(request('workspace/profile'))).status,401);assert.equal(calls.length,0);
 }
});
test('shared verified objects cannot mutate the identity used for the pending read',async()=>{
 const verified=session();let resolved,token;
 const {handle}=configured({verifySession:async()=>verified,canReadPatient:async s=>{
  assert(Object.isFrozen(s));assert(Object.isFrozen(s.permissions));
  verified.organisationId='other';verified.upstreamAccessToken='other-token';return true;
 },resolveTenantReader:async organisationId=>{resolved=organisationId;return {organisationId,reader:{workspace:async(op,p)=>{token=p.accessToken;return {};}}};}});
 assert.equal((await handle(request('workspace/briefing?patientId=DEMO-001'))).status,200);
 assert.equal(resolved,'synthetic-oxford');assert.equal(token,'test-user-token');
});
test('unknown typed errors and invalid HTTP error statuses never escape',async()=>{
 for(const error of [new IntegrationError('private-token-diagnostic',403),new IntegrationError('upstream_unavailable',200),new IntegrationError('upstream_unavailable',302),new IntegrationError('upstream_unavailable',999)]){
  const {handle}=configured({resolveTenantReader:async()=>{throw error;}});
  const r=await handle(request('partner/meta'));
  assert.equal(r.status,503);assert.deepEqual(await r.json(),{error:'integration_unavailable'});
 }
});
test('malformed reader values cannot become successful connected responses',async()=>{
 for(const data of [undefined,null,[],true,'private-upstream-text',42]){
  const {handle}=configured({resolveTenantReader:async organisationId=>({organisationId,reader:{partner:async()=>data}})});
  const r=await handle(request('partner/meta'));assert.equal(r.status,502);
  assert.deepEqual(await r.json(),{error:'invalid_upstream_shape'});
 }
});
test('method errors advertise GET and retain non-cacheable security headers',async()=>{
 const r=await configured().handle(request('partner/meta',{method:'POST'}));
 assert.equal(r.status,405);assert.equal(r.headers.get('allow'),'GET');
 assert.equal(r.headers.get('cache-control'),'no-store');
 assert.equal(r.headers.get('x-content-type-options'),'nosniff');
 assert.equal(r.headers.get('referrer-policy'),'no-referrer');
});
test('gateway deadlines require bounded integer configuration',()=>{
 for(const timeoutMs of [0,-1,NaN,Infinity,0.5,30001,'1000'])assert.throws(()=>createClinicalAdminGateway({timeoutMs}),{code:'invalid_timeout'});
 for(const timeoutMs of [1,30000])assert.doesNotThrow(()=>createClinicalAdminGateway({timeoutMs}));
});
test('stalled session, patient, tenant and reader dependencies hit the shared deadline',{timeout:2000},async()=>{
 for(const stage of ['session','patient','tenant','reader']){
  let receivedSignal;
  const hang=signal=>{receivedSignal=signal;return new Promise(()=>{});};
  const {handle}=configured({timeoutMs:10,
   verifySession:async(request,{signal})=>stage==='session'?hang(signal):session(),
   canReadPatient:async(s,id,{signal})=>stage==='patient'?hang(signal):true,
   resolveTenantReader:async(organisationId,{signal})=>stage==='tenant'?hang(signal):({organisationId,reader:{partner:async(op,params)=>stage==='reader'?hang(params.signal):{}}})
  });
  const r=await handle(request('partner/documents?patientId=DEMO-001'));
  assert.equal(r.status,504,stage);assert.deepEqual(await r.json(),{error:'gateway_timeout'});
  assert.equal(receivedSignal.aborted,true);assert.equal(r.headers.get('cache-control'),'no-store');
 }
});
test('late completion after timeout cannot perform downstream work',{timeout:2000},async()=>{
 let complete;let resolutions=0;
 const {handle}=configured({timeoutMs:10,verifySession:()=>new Promise(resolve=>{complete=resolve;}),resolveTenantReader:async()=>{resolutions++;}});
 assert.equal((await handle(request('partner/meta'))).status,504);
 complete(session());await new Promise(resolve=>setImmediate(resolve));
 assert.equal(resolutions,0);
});
test('already cancelled requests never call the verifier',async()=>{
 let verifications=0;const controller=new AbortController();controller.abort('private cancellation reason');
 const {handle}=configured({verifySession:async()=>{verifications++;return session();}});
 const r=await handle(request('partner/meta',{signal:controller.signal}));
 assert.equal(r.status,408);assert.deepEqual(await r.json(),{error:'request_cancelled'});assert.equal(verifications,0);
});
test('caller cancellation aborts pending access checks and prevents later reads',{timeout:2000},async()=>{
 const controller=new AbortController();let entered,complete,dependencySignal;let resolutions=0;
 const started=new Promise(resolve=>{entered=resolve;});
 const {handle}=configured({canReadPatient:(s,id,{signal})=>{dependencySignal=signal;entered();return new Promise(resolve=>{complete=resolve;});},resolveTenantReader:async()=>{resolutions++;}});
 const pending=handle(request('partner/documents?patientId=DEMO-001',{signal:controller.signal}));
 await started;controller.abort('private cancellation reason');
 const r=await pending;assert.equal(r.status,408);assert.deepEqual(await r.json(),{error:'request_cancelled'});
 assert.equal(dependencySignal.aborted,true);complete(true);await new Promise(resolve=>setImmediate(resolve));assert.equal(resolutions,0);
});
test('gateway deadline propagates through the real reader into upstream fetch',{timeout:2000},async()=>{
 let fetchSignal;
 const origin='https://synthetic.example.invalid';
 const reader=createClinicalOsReader({origin,approvedOrigins:[origin],partnerSandboxKey:'dsk_test_fixture',timeoutMs:1000,fetchImpl:async(url,{signal})=>{
  fetchSignal=signal;return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true}));
 }});
 const {handle}=configured({timeoutMs:20,resolveTenantReader:async organisationId=>({organisationId,reader})});
 const r=await handle(request('partner/meta'));assert.equal(r.status,504);assert.equal(fetchSignal.aborted,true);
 assert.deepEqual(await r.json(),{error:'gateway_timeout'});
});
