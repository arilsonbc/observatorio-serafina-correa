import {env} from 'cloudflare:workers';
import {sourceURL,normalize} from '../../../lib/municipal.mjs';
const cache=new Map<string,{at:number,data:unknown}>();
const TTL=6*60*60*1000;
export async function GET(request:Request){const u=new URL(request.url),kind=u.searchParams.get('kind')||'',year=Number(u.searchParams.get('year')),month=Number(u.searchParams.get('month'));const current=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'America/Sao_Paulo'}).format(new Date()));
if(!['salary','expenses','bids','contracts'].includes(kind)||!Number.isInteger(year)||year<2014||year>current||!Number.isInteger(month)||month<1||month>12)return Response.json({error:'Consulta inválida'},{status:400});
const snapshot=await env.BUCKET?.get(`municipal/${kind}/${year}/${month}.json`);if(snapshot){const data=await snapshot.json();return Response.json({...data,stale:Date.now()-Date.parse((data as any).fetchedAt)>36*60*60*1000})}
const key=`${kind}:${year}:${month}`,previous=cache.get(key);if(previous&&Date.now()-previous.at<TTL)return Response.json(previous.data);
const url=sourceURL(kind,year,month);try{const response=await fetch(url,{signal:AbortSignal.timeout(25000),headers:{Accept:'application/json'}});if(!response.ok)throw Error(`HTTP ${response.status}`);const raw=await response.json(),rows=normalize(kind,raw,year,month,url),data={rows,source:url,fetchedAt:new Date().toISOString(),kind,year,month,rawCount:raw.length,empty:rows.length===0};if(cache.size>400)cache.delete(cache.keys().next().value!);cache.set(key,{at:Date.now(),data});return Response.json(data)}catch(e){return Response.json({error:'A fonte municipal não respondeu corretamente. Tente novamente mais tarde.',source:url,diagnostic:e instanceof Error?e.message:'Falha de conexão'},{status:502})}}
