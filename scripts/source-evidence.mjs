import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const digest=value=>createHash('sha256').update(value).digest('hex');
export function sourceEvidence(root){
 const files=[];
 function visit(relative){
  const absolute=path.join(root,relative);
  if(!fs.existsSync(absolute))return;
  const stat=fs.lstatSync(absolute);
  if(stat.isSymbolicLink())throw Error('Evidence input must not be a symlink: '+relative);
  if(stat.isDirectory())for(const name of fs.readdirSync(absolute).sort())visit(relative+'/'+name);
  else if(stat.isFile()&&relative!=='dist/loop-report.js')files.push(relative);
 }
 for(const directory of ['dist','docs','integration','scripts','tests','.github/workflows'])visit(directory);
 for(const file of ['loops/implementation.json','package.json','package-lock.json','playwright.config.mjs'])visit(file);
 const manifest=files.sort().map(file=>({path:file,sha256:digest(fs.readFileSync(path.join(root,file)))}));
 return {algorithm:'sha256-manifest-v1',fingerprint:digest(JSON.stringify(manifest)),manifest};
}

export function unassignedNodeTests(manifest,loops){
 const assigned=new Set(loops.filter(l=>l.mode==='local').flatMap(l=>l.tests||[]));
 return manifest.map(f=>f.path).filter(file=>file.startsWith('tests/')&&file.endsWith('.test.mjs')&&!assigned.has(file));
}
