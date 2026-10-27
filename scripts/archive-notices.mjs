import {collectNativeNotices,extractReadmeLicenseSection} from './native-notice-bundles.mjs';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync,realpathSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,relative,resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const cli=process.env.npm_execpath;
if(!cli)throw new Error('Run npm run licenses:generate so the actual npm CLI is used.');
const paths=execFileSync(process.execPath,[cli,'ls','--omit=dev','--all','--parseable'],{cwd:root,encoding:'utf8',maxBuffer:8e6}).trim().split(/\r?\n/).filter(p=>resolve(p)!==root);
const groups=new Map(),inventory=[],missing=[];
function notices(directory){
 const result=[];
 const walk=dir=>{for(const e of readdirSync(dir,{withFileTypes:true})){
  if(e.name==='node_modules'||e.name==='.git')continue;
  const p=join(dir,e.name);
  if(e.isDirectory())walk(p);
  else if(e.isFile()&&/^(?:licen[sc]e|copying|notice)(?:$|[._-])/i.test(e.name))result.push({name:relative(directory,p).replaceAll('\\','/'),text:readFileSync(p,'utf8')});
 }};walk(directory);return result;
}
for(const directory of new Set(paths.map(p=>realpathSync(p)))){
 const pkg=JSON.parse(readFileSync(join(directory,'package.json'),'utf8')),id=`${pkg.name}@${pkg.version}`;
 let list=notices(directory);
 if(!list.length){try{const section=extractReadmeLicenseSection(readFileSync(join(directory,'README.md'),'utf8'));if(section)list=[{name:'README.md licensing section',text:section}];}catch{}}
 list.push(...collectNativeNotices({name:pkg.name,version:pkg.version,license:pkg.license,bundledNoticeCount:list.length,packagePath:directory},root));
 if(!list.length&&pkg.license==='MIT'){
  if((pkg.name==='@next/env'||pkg.name.startsWith('@next/swc-'))&&pkg.version==='16.4.3')list=[{name:'UPSTREAM-NEXT-SAME-VERSION:license.md',text:readFileSync(join(root,'node_modules/next/license.md'),'utf8')}];
  if(pkg.name==='client-only'&&pkg.version==='0.0.1')list=[{name:'UPSTREAM-REACT:LICENSE (manifest links facebook/react)',text:readFileSync(join(root,'node_modules/react/LICENSE'),'utf8')}];
 }
 if(!list.length&&pkg.license==='MIT'){const supplements={'@napi-rs/wasm-runtime@1.1.6':'napi-wasm-runtime-1.1.6-MIT.txt','@tybys/wasm-util@0.10.3':'tybys-wasm-util-0.10.3-MIT.txt','@unrs/resolver-binding-linux-x64-gnu@1.12.2':'unrs-resolver-1.12.2-MIT.txt'};const file=supplements[id];if(file){const metadata=JSON.parse(readFileSync(join(root,'licenses/upstream/WASM-NOTICE-SOURCES.json'),'utf8')).find(x=>x.identity===id&&x.file===file);const raw=readFileSync(join(root,'licenses/upstream',file));if(!metadata||createHash('sha256').update(raw).digest('hex')!==metadata.sha256)throw Error('Reviewed upstream notice hash mismatch');list=[{name:'REVIEWED-UPSTREAM:'+file+'; source and scope in WASM-NOTICE-SOURCES.json',text:raw.toString('utf8')}];}}
 if(!list.length)missing.push(id);
 inventory.push({id,license:pkg.license??'UNKNOWN',sources:list.map(n=>n.name)});
 for(const n of list){const text=n.text.replace(/\r\n/g,'\n').trim(),hash=createHash('sha256').update(text).digest('hex'),record=groups.get(hash)??{text,packages:new Set(),sources:new Set()};record.packages.add(id);record.sources.add(n.name);groups.set(hash,record);}
}
const lines=['# Production dependency notices','','Generated from `npm ls --omit=dev --all --parseable`. Nested bundled LICENSE/COPYING/NOTICE files are included; identical texts are deduplicated. This describes this installed platform; other platform packages retain their own original licenses when installed. No dependency binaries are copied into this repository.','','Packages omitting their own notice use only the explicitly reviewed Next16.4.3 / React / exact napi-rs and UnRS gitHead / maintainer wasm-util MIT supplements indicated in the inventory and WASM-NOTICE-SOURCES.json; the actual upstream text and copyright remain unchanged.','','- Packages: '+inventory.length,'- Distinct texts: '+groups.size,'- Unresolved: '+missing.length,'','## Inventory','','| Package | Declared license | Original notice paths or reviewed upstream supplement |','|---|---|---|'];
for(const p of inventory.sort((a,b)=>a.id.localeCompare(b.id)))lines.push(`| ${p.id} | ${p.license} | ${p.sources.join(', ')} |`);
for(const [hash,n] of [...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0])))lines.push('','## '+[...n.packages].sort().join(', '),'','Sources: '+[...n.sources].sort().join(', '),'','SHA256: `'+hash+'`','','````text',n.text,'````');
mkdirSync(join(root,'licenses'),{recursive:true});writeFileSync(join(root,'licenses/NPM_NOTICES.md'),lines.join('\n')+'\n');
mkdirSync(join(root,'public/licenses'),{recursive:true});writeFileSync(join(root,'public/licenses/NPM_NOTICES.md'),lines.join('\n')+'\n');
writeFileSync(join(root,'public/licenses/PROJECT_MIT.txt'),readFileSync(join(root,'LICENSE'),'utf8'));
console.log(JSON.stringify({packages:inventory.length,texts:groups.size,unresolved:missing}));if(missing.length)process.exitCode=1;
