import {env} from 'cloudflare:workers';
import {sourceURL} from '../../../lib/municipal.mjs';
export async function POST(request:Request){
// This endpoint relies on the Site's confirmed owner-only platform access boundary.
// Keep the Site private. Sites validates service access before dispatching requests.
try{if(Number(request.headers.get('content-length')||0)>8_000_000)return Response.json({error:'Arquivo excede o limite'},{status:413});const body=await request.json();const {kind,year,month,rows,fetchedAt,source,rawCount}=body;
if(!['salary','expenses','bids','contracts'].includes(kind)||!Number.isInteger(year)||year<2014||year>2100||!Number.isInteger(month)||month<1||month>12||!Array.isArray(rows)||rows.length>10000||source!==sourceURL(kind,year,month)||!Number.isFinite(Date.parse(fetchedAt))||Date.parse(fetchedAt)>Date.now()+300000||rows.some((r:any)=>!r.registro_id||!r.nome||!r.entidade_id||!['salario','pagamento','contrato','processo'].includes(r.tipo)||!/^\d{4}-\d{2}-\d{2}$/.test(r.data)||Object.keys(r).some(k=>/cpf|banco|conta/i.test(k))))return Response.json({error:'Lote inválido'},{status:400});
const value={kind,year,month,rows,fetchedAt,source,rawCount,empty:rows.length===0,collection:'scheduled'};await env.BUCKET.put(`municipal/${kind}/${year}/${month}.json`,JSON.stringify(value),{httpMetadata:{contentType:'application/json'}});return Response.json({saved:true,kind,year,month,count:rows.length,fetchedAt});
}catch{return Response.json({error:'Não foi possível salvar a coleta'},{status:500})}}
