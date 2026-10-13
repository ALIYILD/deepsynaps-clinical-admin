/** Process health never establishes upstream connectivity or clinical readiness. */
export const runtimeHealth=(gatewayConfigured=false)=>({status:'ok',uiMode:'synthetic-demo',gatewayConfigured,connectedVerified:false,writesSupported:false});
export function healthResponse(method='GET',gatewayConfigured=false){
 const allowed=['GET','HEAD'].includes(method);
 return new Response(method==='HEAD'?null:JSON.stringify(allowed?runtimeHealth(gatewayConfigured):{error:'method_not_allowed'}),{
  status:allowed?200:405,
  headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...(!allowed?{Allow:'GET, HEAD'}:{})}
 });
}
