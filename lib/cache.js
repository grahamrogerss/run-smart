import{mkdir,readFile,writeFile}from'node:fs/promises';import{join}from'node:path';import{gzip,gunzip}from'node:zlib';import{promisify}from'node:util';
const zip=promisify(gzip),unzip=promisify(gunzip),memory=new Map(),TTL=7*24*60*60*1000,MAX_MEMORY=8,localDir=join(process.cwd(),'.cache','activ');
const blobEnabled=()=>Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const pathname=key=>`map-cache/v1/${key}.json.gz`;
const remember=(key,item)=>{memory.set(key,item);if(memory.size>MAX_MEMORY)memory.delete(memory.keys().next().value);};

async function readBlob(key){const{get}=await import('@vercel/blob'),result=await get(pathname(key),{access:'private'});if(!result?.stream)return null;return Buffer.from(await new Response(result.stream).arrayBuffer());}
async function writeBlob(key,bytes){const{put}=await import('@vercel/blob');await put(pathname(key),bytes,{access:'private',allowOverwrite:true,contentType:'application/gzip'});}
async function readDisk(key){return readFile(join(localDir,`${key}.json.gz`));}
async function writeDisk(key,bytes){await mkdir(localDir,{recursive:true});await writeFile(join(localDir,`${key}.json.gz`),bytes);}

export async function cacheGet(key){const hit=memory.get(key);if(hit&&Date.now()-hit.ts<TTL)return{value:hit.value,source:'server memory cache'};try{const bytes=blobEnabled()?await readBlob(key):await readDisk(key),item=JSON.parse((await unzip(bytes)).toString());if(Date.now()-item.ts>TTL)return null;remember(key,item);return{value:item.value,source:blobEnabled()?'persistent Vercel cache':'persistent disk cache'};}catch(error){if(!['ENOENT','BlobNotFoundError'].includes(error?.code)&&error?.name!=='BlobNotFoundError')console.warn('Persistent cache read skipped:',error.message);return null;}}
export async function cacheSet(key,value){const item={ts:Date.now(),value};remember(key,item);try{const bytes=await zip(JSON.stringify(item),{level:6});if(blobEnabled())await writeBlob(key,bytes);else await writeDisk(key,bytes);}catch(error){console.warn('Persistent cache write skipped:',error.message);}}
export function clearMemoryCache(){memory.clear();}
