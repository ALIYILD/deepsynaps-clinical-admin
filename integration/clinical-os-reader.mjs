/** Server-only, synthetic-staging integration foundation. No routes are mounted by this module. */
if (typeof window !== 'undefined') throw new Error('Clinical OS credentials must remain on the server.');
export class IntegrationError extends Error {
  constructor(code,status=503){super(code);this.name='IntegrationError';this.code=code;this.status=status;}
}
const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
function id(value){if(typeof value!=='string'||!ID.test(value))throw new IntegrationError('invalid_identifier',400);return encodeURIComponent(value)}
const workspaceRoutes={
  capabilities:()=>'/api/v1/clinical-workspace/capabilities',
  functions:()=>'/api/v1/clinical-workspace/functions',
  profile:()=>'/api/v1/clinical-workspace/profile',
  speechStatus:()=>'/api/v1/clinical-workspace/speech-to-text/status',
  ocrStatus:()=>'/api/v1/clinical-workspace/ocr/status',
  briefing:o=>`/api/v1/clinical-workspace/patients/${id(o.patientId)}/briefing`,
  transcripts:o=>`/api/v1/clinical-workspace/patients/${id(o.patientId)}/transcripts`
};
const partnerRoutes={
  meta:()=>'/api/partner/v1/meta',
  tasks:o=>{const s=o.status||'requested';if(!['requested','accepted','all'].includes(s))throw new IntegrationError('invalid_status',400);return '/api/partner/v1/fhir/Task?status='+s},
  documents:o=>`/api/partner/v1/fhir/Patient/${id(o.patientId)}/DocumentReference`,
  referrals:o=>`/api/partner/v1/fhir/Patient/${id(o.patientId)}/ServiceRequest`
};
export function createClinicalOsReader({origin,approvedOrigins=[],partnerSandboxKey,fetchImpl=globalThis.fetch,timeoutMs=10000}={}){
  let base;
  if(origin){try{base=new URL(origin)}catch{throw new IntegrationError('invalid_origin',400)}
    if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||base.pathname!=='/'||!approvedOrigins.includes(base.origin))throw new IntegrationError('origin_not_approved',400);
  }
  if(partnerSandboxKey&&(!/^dsk_test_[A-Za-z0-9_-]+$/.test(partnerSandboxKey)))throw new IntegrationError('sandbox_key_required',400);
  const configured=()=>{if(!base)throw new IntegrationError('integration_not_configured');if(typeof fetchImpl!=='function')throw new IntegrationError('fetch_unavailable')};
  async function read(path,headers){
    configured();const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const response=await fetchImpl(new URL(path,base).href,{method:'GET',headers:{Accept:'application/json, application/fhir+json',...headers},redirect:'error',cache:'no-store',signal:controller.signal});
      if(!response.ok)throw new IntegrationError(response.status===401?'upstream_authentication_required':response.status===403?'upstream_access_denied':response.status===404?'upstream_not_found':response.status===429?'upstream_rate_limited':'upstream_unavailable',response.status);
      if(!/(application\/json|application\/fhir\+json)/i.test(response.headers.get('content-type')||''))throw new IntegrationError('invalid_upstream_content',502);
      const declared=Number(response.headers.get('content-length')||0);if(declared>1048576)throw new IntegrationError('upstream_response_too_large',502);
      const text=await response.text();if(new TextEncoder().encode(text).length>1048576)throw new IntegrationError('upstream_response_too_large',502);
      let value;try{value=JSON.parse(text)}catch{throw new IntegrationError('invalid_upstream_json',502)}
      if(!value||typeof value!=='object'||Array.isArray(value))throw new IntegrationError('invalid_upstream_shape',502);
      return value;
    }catch(error){if(error instanceof IntegrationError)throw error;throw new IntegrationError(controller.signal.aborted?'upstream_timeout':'upstream_unavailable',controller.signal.aborted?504:502)}finally{clearTimeout(timer)}
  }
  return Object.freeze({
    configuration(){return {originConfigured:!!base,partnerSandboxKeyConfigured:!!partnerSandboxKey,connected:false,mode:'synthetic-staging',writesSupported:false};},
    async workspace(operation,{accessToken,...params}={}){
      configured();if(!Object.hasOwn(workspaceRoutes,operation))throw new IntegrationError('unsupported_operation',400);
      if(typeof accessToken!=='string'||!accessToken||/[\r\n]/.test(accessToken))throw new IntegrationError('user_session_required',401);
      return read(workspaceRoutes[operation](params),{Authorization:'Bearer '+accessToken});
    },
    async partner(operation,params={}){
      configured();if(!Object.hasOwn(partnerRoutes,operation))throw new IntegrationError('unsupported_operation',400);
      if(!partnerSandboxKey)throw new IntegrationError('sandbox_key_not_configured');
      return read(partnerRoutes[operation](params),{'X-API-Key':partnerSandboxKey});
    }
  });
}
