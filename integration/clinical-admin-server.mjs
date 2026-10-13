/** Node HTTP host; identity and tenant dependencies stay in trusted server code. */
import {createServer} from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {dirname,extname,isAbsolute,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createClinicalAdminGateway} from './clinical-admin-gateway.mjs';

const defaultRoot=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.md':'text/markdown; charset=utf-8','.png':'image/png','.ico':'image/x-icon'};
const headers={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY'};
const inside=(root,file)=>{const path=relative(root,file);return path!==''&&!path.startsWith('..'+sep)&&path!=='..'&&!isAbsolute(path);};

export function createClinicalAdminServer({staticRoot=defaultRoot,gatewayDependencies}={}){
 const gateway=createClinicalAdminGateway(gatewayDependencies);
 const server=createServer(async(req,res)=>{
  const abort=new AbortController();
  const disconnected=()=>{if(!res.writableEnded)abort.abort();};
  req.once('aborted',disconnected);res.once('close',disconnected);
  const send=(status,body,type='application/json; charset=utf-8',extra={})=>{
   if(res.destroyed)return;
   res.writeHead(status,{...headers,'content-type':type,...extra});
   res.end(req.method==='HEAD'?undefined:body);
  };
  try{
   // Only origin-form targets; the client Host header never selects an upstream.
   if(!req.url?.startsWith('/')||req.url.startsWith('//')||req.url.includes('\\'))return send(400,'{"error":"invalid_request_target"}');
   const url=new URL(req.url,'http://clinical-admin.invalid');
   if(url.pathname.startsWith('/api/')){
    req.resume();
    if(!url.pathname.startsWith('/api/clinical-admin/'))return send(404,'{"error":"route_not_found"}');
    const request=new Request(url,{method:req.method,headers:req.headers,signal:abort.signal});
    const result=await gateway(request);
    return send(result.status,await result.text(),result.headers.get('Content-Type'),Object.fromEntries(result.headers));
   }
   if(!['GET','HEAD'].includes(req.method))return send(405,'{"error":"method_not_allowed"}',undefined,{Allow:'GET, HEAD'});
   if(url.pathname==='/healthz')return send(200,JSON.stringify({status:'ok',uiMode:'synthetic-demo',gatewayConfigured:!!gatewayDependencies,connectedVerified:false,writesSupported:false}));
   let path;
   try{path=decodeURIComponent(url.pathname);}catch{return send(400,'{"error":"invalid_path"}');}
   if(path.includes('\0')||path.includes('\\')||path.split('/').some(part=>part==='..'||part.startsWith('.')))return send(404,'{"error":"not_found"}');
   if(path==='/')path='/index.html';
   const root=await realpath(staticRoot),candidate=resolve(root,'.'+path);
   if(!inside(root,candidate)||!Object.hasOwn(types,extname(candidate)))return send(404,'{"error":"not_found"}');
   const file=await realpath(candidate);
   if(!inside(root,file)||!(await stat(file)).isFile())return send(404,'{"error":"not_found"}');
   return send(200,await readFile(file),types[extname(candidate)]);
  }catch(error){
   const missing=['ENOENT','ENOTDIR'].includes(error?.code);
   send(missing?404:503,JSON.stringify({error:missing?'not_found':'service_unavailable'}));
  }finally{req.off('aborted',disconnected);res.off('close',disconnected);}
 });
 server.requestTimeout=30000;server.headersTimeout=10000;server.keepAliveTimeout=5000;
 return server;
}
