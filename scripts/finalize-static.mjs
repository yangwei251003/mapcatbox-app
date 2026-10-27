import {readdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join,relative,sep} from 'node:path';
/** Static export compatibility: preserve real RSC bytes under the flat names requested by this Next client. */
const root=resolve('out');const sourceFiles=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=join(dir,entry.name);if(entry.isSymbolicLink())throw Error('Unexpected link in static export');if(entry.isDirectory())await walk(file);else sourceFiles.push(file);}}
await walk(root);const aliases=[];
for(const file of sourceFiles){
 const parts=relative(root,file).split(sep);const index=parts.findIndex(part=>part.startsWith('__next.'));
 if(index<0||index===parts.length-1||!file.endsWith('.txt'))continue;
 const alias=join(root,...parts.slice(0,index),parts.slice(index).join('.'));
 if(!alias.startsWith(root+sep))throw Error('Unexpected export path');
 const bytes=await readFile(file);let existing=null;try{existing=await readFile(alias);}catch(error){if(error.code!=='ENOENT')throw error;}
 if(existing&&!existing.equals(bytes))throw Error('Conflicting real static RSC alias');
 if(!existing)await writeFile(alias,bytes);
 aliases.push({source:relative(root,file).split(sep).join('/'),alias:relative(root,alias).split(sep).join('/'),bytes:bytes.length});
}
await writeFile(join(root,'.nojekyll'),'');await writeFile(join(root,'static-export-aliases.json'),JSON.stringify({purpose:'Flat URL aliases of genuine generated RSC data; no backend or invented payload',aliases},null,2)+'\n');
console.log(JSON.stringify({staticRscAliases:aliases.length,bytesUnmodified:true}));
