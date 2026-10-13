/** Framework-neutral read gateway. Source-only until a real session verifier is supplied. */
import {IntegrationError} from './clinical-os-reader.mjs';
const routes=Object.freeze({
 'workspace/capabilities':{channel:'workspace',operation:'capabilities',permission:'workspace:read'},
 'workspace/functions':{channel:'workspace',operation:'functions',permission:'workspace:read'},
 'workspace/profile':{channel:'workspace',operation:'profile',permission:'workspace:read'},
 'workspace/briefing':{channel:'workspace',operation:'briefing',permission:'workspace:read',patient:true},
 'workspace/transcripts':{channel:'workspace',operation:'transcripts',permission:'workspace:read',patient:true},
 'partner/meta':{channel:'partner',operation:'meta',permission:'partner:read'},
 'partner/tasks':{channel:'partner',operation:'tasks',permission:'partner:clinic_read'},
 'partner/documents':{channel:'partner',operation:'documents',permission:'partner:read',patient:true},
 'partner/referrals':{channel:'partner',operation:'referrals',permission:'partner:read',patient:true}
});
const publicErrors=new Set([
 'invalid_identifier','invalid_status','invalid_timeout','invalid_origin','origin_not_approved',
 'sandbox_key_required','integration_not_configured','fetch_unavailable','unsupported_operation',
 'user_session_required','sandbox_key_not_configured','upstream_authentication_required',
 'upstream_access_denied','upstream_not_found','upstream_rate_limited','upstream_unavailable',
 'invalid_upstream_content','upstream_response_too_large','invalid_upstream_json',
 'invalid_upstream_shape','upstream_timeout','gateway_timeout','request_cancelled'
]);
const response=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...(status===405?{Allow:'GET'}:{})}});
/** All dependencies are trusted server functions. Never construct these from request fields. */
export function createClinicalAdminGateway({verifySession,resolveTenantReader,canReadPatient,now=Date.now,timeoutMs=15000}={}){
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw new IntegrationError('invalid_timeout',400);
 const sessionCurrent=session=>{const time=now();return Number.isFinite(time)&&Number.isFinite(session.expiresAt)&&session.expiresAt>time;};
 return async function handle(request){
  const controller=new AbortController();
  const cancel=()=>controller.abort(new IntegrationError('request_cancelled',408));
  const timer=setTimeout(()=>controller.abort(new IntegrationError('gateway_timeout',504)),timeoutMs);
  request.signal.addEventListener('abort',cancel,{once:true});
  if(request.signal.aborted)cancel();
  const context=Object.freeze({signal:controller.signal});
  // A timed-out dependency may finish later, but must never advance the pipeline.
  const run=operation=>new Promise((resolve,reject)=>{
   const signal=controller.signal;
   const stop=()=>{signal.removeEventListener('abort',stop);reject(signal.reason);};
   if(signal.aborted){stop();return;}
   signal.addEventListener('abort',stop,{once:true});
   Promise.resolve().then(()=>{if(signal.aborted)throw signal.reason;return operation();}).then(value=>{
    signal.removeEventListener('abort',stop);if(signal.aborted)reject(signal.reason);else resolve(value);
   },error=>{signal.removeEventListener('abort',stop);reject(signal.aborted?signal.reason:error);});
  });
  try{
   if(request.method!=='GET')return response(405,{error:'read_only_gateway'});
   const url=new URL(request.url);const key=url.pathname.replace(/^\/api\/clinical-admin\//,'');
   if(!Object.hasOwn(routes,key))return response(404,{error:'route_not_found'});
   if(typeof verifySession!=='function'||typeof resolveTenantReader!=='function')return response(503,{error:'session_integration_not_configured'});
   const verified=await run(()=>verifySession(request,context));
   if(!verified||typeof verified.subject!=='string'||!verified.subject.trim()||typeof verified.organisationId!=='string'||!verified.organisationId.trim()||!sessionCurrent(verified))return response(401,{error:'valid_session_required'});
   // Keep the verified identity stable throughout this request's async checks.
   const session=Object.freeze({...verified,permissions:Array.isArray(verified.permissions)?Object.freeze([...verified.permissions]):[]});
   const route=routes[key];
   if(!Array.isArray(session.permissions)||!session.permissions.includes(route.permission))return response(403,{error:'permission_required'});
   const allowed=route.patient?['patientId']:route.operation==='tasks'?['status']:[];
   if([...url.searchParams.keys()].some(k=>!allowed.includes(k))||allowed.some(k=>url.searchParams.getAll(k).length>1))return response(400,{error:'unsupported_query'});
   const params={};
   if(route.patient){
    const patientId=url.searchParams.get('patientId');
    if(!patientId||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(patientId))return response(400,{error:'invalid_patient_id'});
    if(typeof canReadPatient!=='function')return response(503,{error:'patient_authorisation_not_configured'});
    const allowedPatient=await run(()=>canReadPatient(session,patientId,context));
    if(!sessionCurrent(session))return response(401,{error:'valid_session_required'});
    if(allowedPatient!==true)return response(404,{error:'patient_not_found'});
    params.patientId=patientId;
   }
   if(route.operation==='tasks'){params.status=url.searchParams.get('status')||'requested';if(!['requested','accepted','all'].includes(params.status))return response(400,{error:'invalid_status'})}
   const binding=await run(()=>resolveTenantReader(session.organisationId,context));
   if(!sessionCurrent(session))return response(401,{error:'valid_session_required'});
   if(!binding||binding.organisationId!==session.organisationId||!binding.reader)return response(503,{error:'tenant_integration_not_configured'});
   if(route.channel==='workspace'){
    if(typeof session.upstreamAccessToken!=='string'||!session.upstreamAccessToken.trim()||/[\r\n]/.test(session.upstreamAccessToken))return response(401,{error:'upstream_session_required'});
    params.accessToken=session.upstreamAccessToken;
   }
   const data=await run(()=>binding.reader[route.channel](route.operation,{...params,signal:controller.signal}));
   if(!sessionCurrent(session))return response(401,{error:'valid_session_required'});
   if(!data||typeof data!=='object'||Array.isArray(data))return response(502,{error:'invalid_upstream_shape'});
   return response(200,{mode:'synthetic-staging',data});
  }catch(error){
   if(error instanceof IntegrationError&&publicErrors.has(error.code)&&Number.isInteger(error.status)&&error.status>=400&&error.status<=599)return response(error.status,{error:error.code});
   return response(503,{error:'integration_unavailable'});
  }finally{clearTimeout(timer);request.signal.removeEventListener('abort',cancel);}
 };
}
