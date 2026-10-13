import {isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createClinicalAdminServer} from '../integration/clinical-admin-server.mjs';

try{
 const port=Number(process.env.PORT||4179),host=process.env.HOST||'127.0.0.1';
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('invalid_port');
 let gatewayDependencies;
 const adapter=process.env.CLINICAL_ADMIN_SERVER_ADAPTER;
 if(adapter){
  if(!isAbsolute(adapter))throw Error('adapter_path_must_be_absolute');
  gatewayDependencies=(await import(pathToFileURL(adapter).href)).default;
  if(!gatewayDependencies||!['verifySession','resolveTenantReader','canReadPatient'].every(k=>typeof gatewayDependencies[k]==='function'))throw Error('invalid_adapter');
 }
 const server=createClinicalAdminServer({gatewayDependencies});
 server.on('error',()=>{console.error('Clinical Admin server could not start. Check its host, port and adapter configuration.');process.exitCode=1;});
 server.listen(port,host,()=>console.log(`Clinical Admin listening on port ${port}; UI: synthetic demo; gateway: ${adapter?'configured, connection not verified':'unconfigured'}; writes: disabled.`));
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{
  server.close(()=>process.exit(0));
  setTimeout(()=>{server.closeAllConnections();process.exit(0);},5000).unref();
 });
}catch{
 console.error('Clinical Admin startup refused. Check PORT and the trusted server adapter module. No credentials are printed.');
 process.exitCode=1;
}
