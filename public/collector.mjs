// Run with Node >=22. Read the private Site service token from stdin only.
// Official sources use curl's normal certificate validation; never use -k.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {X509Certificate} from 'node:crypto';
import {rootCertificates} from 'node:tls';
import {readFileSync,writeFileSync,mkdtempSync,unlinkSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {normalize,sourceURL} from './municipal.mjs';
const run=promisify(execFile);
const intermediatePEM=readFileSync(new URL('./municipal-ca.pem',import.meta.url),'utf8');
const intermediate=new X509Certificate(intermediatePEM);
const trusted=rootCertificates.map(pem=>new X509Certificate(pem)).find(root=>root.subject===intermediate.issuer&&intermediate.verify(root.publicKey));
if(!trusted||Date.now()<Date.parse(intermediate.validFrom)||Date.now()>Date.parse(intermediate.validTo))throw Error('The municipal intermediate CA must have a valid signature from an existing trusted Node root.');
const temporary=mkdtempSync(path.join(tmpdir(),'serafina-ca-')),caPath=path.join(temporary,'bundle.pem');
writeFileSync(caPath,rootCertificates.join('\n')+'\n'+intermediatePEM);
process.on('exit',()=>{try{unlinkSync(caPath);rmdirSync(temporary)}catch{}});
async function hiddenInput(){process.stdin.setRawMode?.(true);process.stdin.resume();return new Promise((resolve,reject)=>{let data='';const read=chunk=>{data+=chunk.toString();if(data.includes('\n')||data.includes('\r')){process.stdin.removeListener('data',read);process.stdin.setRawMode?.(false);process.stdin.pause();try{resolve(JSON.parse(data.trim()))}catch(e){reject(e)}}};process.stdin.on('data',read)})}
console.log('Ready for private collector JSON on stdin (input is hidden).');
const input=await hiddenInput();const origin=new URL(input.site).origin;if(!origin.endsWith('.chatgpt.site'))throw Error('Use the exact private Site origin');
const now=new Date(),year=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'America/Sao_Paulo'}).format(now)),month=Number(new Intl.DateTimeFormat('en',{month:'numeric',timeZone:'America/Sao_Paulo'}).format(now));
const years=input.years||[year,year-1];const jobs=input.jobs||[];if(!input.jobs)for(const y of years){jobs.push({kind:'bids',year:y,month:1},{kind:'contracts',year:y,month:1});for(let m=1;m<=(y===year?month:12);m++)for(const kind of ['salary','expenses'])jobs.push({kind,year:y,month:m})}
let at=0,saved=0,total=0,failures=[];async function worker(){while(at<jobs.length){const job=jobs[at++],url=sourceURL(job.kind,job.year,job.month);try{const {stdout}=await run(process.platform==='win32'?'curl.exe':'curl',['--cacert',caPath,'--fail','--silent','--show-error','--location','--max-time','45',url],{maxBuffer:30*1024*1024});const raw=JSON.parse(stdout),rows=normalize(job.kind,raw,job.year,job.month,url);const payload={...job,source:url,rows,rawCount:raw.length,fetchedAt:new Date().toISOString()};const response=await fetch(origin+'/api/snapshot',{method:'POST',headers:{'Content-Type':'application/json','OAI-Sites-Authorization':'Bearer '+input.token},body:JSON.stringify(payload),signal:AbortSignal.timeout(45000)});if(!response.ok)throw Error('Site upload HTTP '+response.status);const confirmation=await response.json();if(!confirmation.saved||confirmation.count!==rows.length)throw Error('Upload verification failed');saved++;total+=rows.length;if(saved%10===0)console.log(JSON.stringify({saved,jobs:jobs.length,records:total}));}catch(e){failures.push({...job,error:e.message.slice(0,200)});console.log(JSON.stringify({failed:job,error:e.message.slice(0,120)}))}}}
await Promise.all([worker(),worker()]);console.log(JSON.stringify({complete:true,saved,jobs:jobs.length,records:total,failures}));if(failures.length)process.exitCode=1;
