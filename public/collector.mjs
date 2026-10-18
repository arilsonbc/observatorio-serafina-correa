import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {X509Certificate} from 'node:crypto';
import {rootCertificates} from 'node:tls';
import {readFileSync,writeFileSync,mkdtempSync,readdirSync,unlinkSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {normalize,sourceURL} from './municipal.mjs';
import {collectResults} from './result-collector.mjs';
const run=promisify(execFile),intermediatePEM=readFileSync(new URL('./municipal-ca.pem',import.meta.url),'utf8'),intermediate=new X509Certificate(intermediatePEM);
const trusted=rootCertificates.map(pem=>new X509Certificate(pem)).find(root=>root.subject===intermediate.issuer&&intermediate.verify(root.publicKey));
if(!trusted||Date.now()<Date.parse(intermediate.validFrom)||Date.now()>Date.parse(intermediate.validTo))throw Error('Certificado intermediário sem assinatura confiável ou fora da validade.');
const temporary=mkdtempSync(path.join(tmpdir(),'serafina-collect-')),caPath=path.join(temporary,'bundle.pem');
writeFileSync(caPath,rootCertificates.join('\n')+'\n'+intermediatePEM);
process.on('exit',()=>{try{for(const f of readdirSync(temporary))unlinkSync(path.join(temporary,f));rmdirSync(temporary)}catch{}});
async function hiddenInput(){process.stdin.setRawMode?.(true);process.stdin.resume();return new Promise((resolve,reject)=>{let data='';const read=chunk=>{data+=chunk.toString();if(data.includes('\n')||data.includes('\r')){process.stdin.removeListener('data',read);process.stdin.setRawMode?.(false);process.stdin.pause();try{resolve(JSON.parse(data.trim()))}catch(e){reject(e)}}};process.stdin.on('data',read)})}
console.log('Ready for private collector JSON on stdin (input is hidden).');
const input=await hiddenInput(),origin=new URL(input.site).origin;if(!origin.endsWith('.chatgpt.site'))throw Error('Use a origem exata do Site privado.');
const now=new Date(),year=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'America/Sao_Paulo'}).format(now)),month=Number(new Intl.DateTimeFormat('en',{month:'numeric',timeZone:'America/Sao_Paulo'}).format(now));
const years=input.years||[year,year-1],jobs=input.jobs||[];
if(!input.jobs)for(const y of years){jobs.push({kind:'bids',year:y,month:1},{kind:'contracts',year:y,month:1},{kind:'results',year:y,month:1});for(let m=1;m<=(y===year?month:12);m++)for(const kind of ['salary','expenses'])jobs.push({kind,year:y,month:m})}
async function requestMunicipal(url,{session,body}={}){if(!url.startsWith('https://sistemas.serafinacorrea.rs.gov.br/transparencia/'))throw Error('Fonte não autorizada');const args=['--cacert',caPath,'--fail','--silent','--show-error','--location','--max-time','45','--retry','2','--retry-delay','1'];if(session){if(!/^[a-z0-9-]+$/.test(session))throw Error('Sessão inválida');const cookie=path.join(temporary,session+'.cookies');args.push('--cookie',cookie,'--cookie-jar',cookie)}if(body){const filename=path.join(temporary,session+'.form');writeFileSync(filename,body);args.push('--header','Content-Type: application/x-www-form-urlencoded','--data-binary','@'+filename)}args.push(url);const {stdout}=await run(process.platform==='win32'?'curl.exe':'curl',args,{maxBuffer:40*1024*1024});return stdout}
let at=0,saved=0,total=0,failures=[];
async function worker(){while(at<jobs.length){const job=jobs[at++],url=sourceURL(job.kind,job.year,job.month);try{let rows,rawCount,coverage;if(job.kind==='results'){const bids=JSON.parse(await requestMunicipal(sourceURL('bids',job.year,1))),result=await collectResults({bids,year:job.year,request:requestMunicipal,onProgress:p=>console.log(JSON.stringify({results:p}))});rows=result.rows;coverage=result.coverage;rawCount=result.coverage.totalItems}else{const raw=JSON.parse(await requestMunicipal(url));rows=normalize(job.kind,raw,job.year,job.month,url);rawCount=raw.length}const payload={...job,source:url,rows,rawCount,coverage,fetchedAt:new Date().toISOString(),normalizerVersion:2};const response=await fetch(origin+'/api/snapshot',{method:'POST',headers:{'Content-Type':'application/json','X-Collector-Key':input.token,'OAI-Sites-Authorization':'Bearer '+input.token},body:JSON.stringify(payload),signal:AbortSignal.timeout(45000)});if(!response.ok)throw Error('Gravação no Site: HTTP '+response.status);const confirmation=await response.json();if(!confirmation.saved)throw Error('Gravação não confirmada');saved++;total+=rows.length;if(saved%10===0||job.kind==='results')console.log(JSON.stringify({saved,jobs:jobs.length,records:total,...(coverage?{coverage}:{})}));}catch(e){const error=String(e.stderr||e.message).slice(0,180);failures.push({...job,error});console.log(JSON.stringify({failed:job,error}))}}}
await Promise.all([worker(),worker()]);console.log(JSON.stringify({complete:true,saved,jobs:jobs.length,records:total,failures}));if(failures.length)process.exitCode=1;

