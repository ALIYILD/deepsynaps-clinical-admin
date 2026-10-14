import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {request as httpRequest} from 'node:http';
import {once} from 'node:events';
import {createClinicalAdminServer} from '../integration/clinical-admin-server.mjs';

async function host(t,options={}){
 const server=createClinicalAdminServer(options);
 server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 return `http://127.0.0.1:${server.address().port}`;
}
const session={subject:'synthetic-user',organisationId:'test-clinic',expiresAt:Date.now()+60000,permissions:['workspace:read'],upstreamAccessToken:'test-only-token'};

test('HTTP host serves the demo and reports unconfigured API without fallback',async t=>{
 const base=await host(t);
 const page=await fetch(base);assert.equal(page.status,200);assert.match(await page.text(),/DeepSynaps/);
 assert.equal(page.headers.get('cache-control'),'no-store');
 const health=await (await fetch(base+'/healthz')).json();
 assert.equal(health.gatewayConfigured,false);assert.equal(health.connectedVerified,false);
 const api=await fetch(base+'/api/clinical-admin/workspace/capabilities');
 assert.equal(api.status,503);assert.deepEqual(await api.json(),{error:'session_integration_not_configured'});
});
test('HTTP host never exposes source, hidden files, directories or escaping symlinks',async t=>{
 const root=await mkdtemp(join(tmpdir(),'clinical-static-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await writeFile(join(root,'index.html'),'demo');await symlink('/etc/passwd',join(root,'escape.js'));
 const base=await host(t,{staticRoot:root});
 for(const path of ['/integration/clinical-admin-gateway.mjs','/.env','/%2e%2e%2fintegration%2fclinical-admin-gateway.mjs','/escape.js','/missing.js','/assets/','/%ZZ']){
  const response=await fetch(base+path);assert.ok([400,404].includes(response.status),path);assert.doesNotMatch(await response.text(),/root:|export function/);
 }
});
test('HTTP method boundaries and HEAD do not execute reads or return bodies',async t=>{
 let calls=0;const base=await host(t,{gatewayDependencies:{verifySession(){calls++;return session;}}});
 const head=await fetch(base,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
 const post=await fetch(base,{method:'POST',body:'ignored'});assert.equal(post.status,405);assert.equal(post.headers.get('allow'),'GET, HEAD');
 const api=await fetch(base+'/api/clinical-admin/workspace/capabilities',{method:'POST',body:'ignored'});assert.equal(api.status,405);assert.equal(api.headers.get('allow'),'GET');assert.equal(calls,0);
 assert.equal((await fetch(base+'/api/unknown')).status,404);
});
test('HTTP host forwards session headers to trusted verification and preserves tenant-bound results',async t=>{
 const base=await host(t,{gatewayDependencies:{
  verifySession(request){return request.headers.get('cookie')==='session=fixture'?session:null;},
  resolveTenantReader(organisationId){return {organisationId,reader:{workspace:async(operation,params)=>{assert.equal(params.accessToken,'test-only-token');return {operation};}}};},
  canReadPatient:()=>false
 }});
 assert.equal((await fetch(base+'/api/clinical-admin/workspace/capabilities')).status,401);
 const response=await fetch(base+'/api/clinical-admin/workspace/capabilities',{headers:{Cookie:'session=fixture',Host:'attacker.invalid'}});
 assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
 assert.deepEqual(await response.json(),{mode:'synthetic-staging',data:{operation:'capabilities'}});
});
test('HTTP disconnect aborts pending verification and prevents later tenant calls',async t=>{
 let started,aborted,tenantCalls=0;
 const began=new Promise(resolve=>started=resolve),cancelled=new Promise(resolve=>aborted=resolve);
 const base=await host(t,{gatewayDependencies:{
  verifySession(request,{signal}){started();return new Promise(resolve=>signal.addEventListener('abort',()=>{aborted();resolve(session);},{once:true}));},
  resolveTenantReader(){tenantCalls++;return null;}
 }});
 const req=httpRequest(base+'/api/clinical-admin/workspace/capabilities');req.on('error',()=>{});req.end();
 await began;req.destroy();
 await Promise.race([cancelled,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('disconnect not propagated')),2000);timer.unref();})]);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(tenantCalls,0);
});
test('HTTP host sanitises failures from trusted dependencies',async t=>{
 const base=await host(t,{gatewayDependencies:{verifySession(){throw Error('sensitive-example');},resolveTenantReader(){return null;}}});
 const response=await fetch(base+'/api/clinical-admin/workspace/profile');assert.equal(response.status,503);
 assert.deepEqual(await response.json(),{error:'integration_unavailable'});
});

test('Netlify entry points match local health and refuse unconfigured reads and writes',async()=>{
 const {default:health}=await import('../netlify/functions/health.mjs');
 const {default:gateway}=await import('../netlify/functions/clinical-admin.mjs');
 const response=await health(new Request('https://example.invalid/healthz'));
 assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
 assert.deepEqual(await response.json(),{status:'ok',uiMode:'synthetic-demo',gatewayConfigured:false,connectedVerified:false,writesSupported:false});
 assert.equal(await (await health(new Request('https://example.invalid/healthz',{method:'HEAD'}))).text(),'');
 assert.equal((await health(new Request('https://example.invalid/healthz',{method:'POST'}))).status,405);
 const read=await gateway(new Request('https://example.invalid/api/clinical-admin/workspace/capabilities'));
 assert.equal(read.status,503);assert.deepEqual(await read.json(),{error:'session_integration_not_configured'});
 assert.equal((await gateway(new Request('https://example.invalid/api/clinical-admin/workspace/capabilities',{method:'POST'}))).status,405);
 assert.equal((await gateway(new Request('https://example.invalid/api/clinical-admin/missing'))).status,404);
});
