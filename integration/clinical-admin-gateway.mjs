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
const response=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
/** All dependencies are trusted server functions. Never construct these from request fields. */
export function createClinicalAdminGateway({verifySession,resolveTenantReader,canReadPatient,now=Date.now}={}){
 return async function handle(request){
  try{
   if(request.method!=='GET')return response(405,{error:'read_only_gateway'});
   const url=new URL(request.url);const key=url.pathname.replace(/^\/api\/clinical-admin\//,'');
   if(!Object.hasOwn(routes,key))return response(404,{error:'route_not_found'});
   if(typeof verifySession!=='function'||typeof resolveTenantReader!=='function')return response(503,{error:'session_integration_not_configured'});
   const session=await verifySession(request);
   if(!session||typeof session.subject!=='string'||!session.subject||typeof session.organisationId!=='string'||!session.organisationId||!Number.isFinite(session.expiresAt)||session.expiresAt<=now())return response(401,{error:'valid_session_required'});
   const route=routes[key];
   if(!Array.isArray(session.permissions)||!session.permissions.includes(route.permission))return response(403,{error:'permission_required'});
   const allowed=route.patient?['patientId']:route.operation==='tasks'?['status']:[];
   if([...url.searchParams.keys()].some(k=>!allowed.includes(k))||allowed.some(k=>url.searchParams.getAll(k).length>1))return response(400,{error:'unsupported_query'});
   const params={};
   if(route.patient){
    const patientId=url.searchParams.get('patientId');
    if(!patientId||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(patientId))return response(400,{error:'invalid_patient_id'});
    if(typeof canReadPatient!=='function')return response(503,{error:'patient_authorisation_not_configured'});
    if(await canReadPatient(session,patientId)!==true)return response(404,{error:'patient_not_found'});
    params.patientId=patientId;
   }
   if(route.operation==='tasks'){params.status=url.searchParams.get('status')||'requested';if(!['requested','accepted','all'].includes(params.status))return response(400,{error:'invalid_status'})}
   const binding=await resolveTenantReader(session.organisationId);
   if(!binding||binding.organisationId!==session.organisationId||!binding.reader)return response(503,{error:'tenant_integration_not_configured'});
   if(route.channel==='workspace'){
    if(typeof session.upstreamAccessToken!=='string'||!session.upstreamAccessToken)return response(401,{error:'upstream_session_required'});
    params.accessToken=session.upstreamAccessToken;
   }
   const data=await binding.reader[route.channel](route.operation,params);
   return response(200,{mode:'synthetic-staging',data});
  }catch(error){
   if(error instanceof IntegrationError)return response(error.status,{error:error.code});
   return response(503,{error:'integration_unavailable'});
  }
 };
}
