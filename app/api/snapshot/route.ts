import {env} from 'cloudflare:workers';
import {sourceURL} from '../../../lib/municipal.mjs';
const types:Record<string,string[]>={salary:['salario'],expenses:['pagamento'],bids:['processo'],contracts:['contrato'],results:['licitacao','adjudicacao']};
export async function POST(request:Request){
// Public reads and authenticated collector writes use separate authorization.
const expected=(env as unknown as {COLLECTOR_WRITE_TOKEN?:string}).COLLECTOR_WRITE_TOKEN;
const supplied=request.headers.get('X-Collector-Key');
if(!expected||!supplied)return Response.json({error:'Coletor não autorizado'},{status:401});
const encoder=new TextEncoder();const [a,b]=await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(expected)),crypto.subtle.digest('SHA-256',encoder.encode(supplied))]);
const left=new Uint8Array(a),right=new Uint8Array(b);let difference=0;for(let i=0;i<left.length;i++)difference|=left[i]^right[i];
if(difference)return Response.json({error:'Coletor não autorizado'},{status:403});
try{if(!request.headers.get('content-type')?.includes('application/json'))return Response.json({error:'Use JSON'},{status:415});const text=await request.text();if(text.length>8_000_000)return Response.json({error:'Lote excede o limite'},{status:413});const body=JSON.parse(text),{kind,year,month,rows,fetchedAt,source,rawCount,coverage,normalizerVersion}=body;
if(!types[kind]||!Number.isInteger(year)||year<2014||year>2100||!Number.isInteger(month)||month<1||month>12||!Array.isArray(rows)||rows.length>15000||source!==sourceURL(kind,year,month)||!Number.isFinite(Date.parse(fetchedAt))||Date.parse(fetchedAt)>Date.now()+300000)return Response.json({error:'Lote inválido'},{status:400});
const seen=new Set();for(const r of rows){if(!r.registro_id||seen.has(r.registro_id)||!r.nome||!r.entidade_id||!types[kind].includes(r.tipo)||!/^\d{4}-\d{2}-\d{2}$/.test(r.data)||isNaN(Date.parse(r.data))||Object.keys(r).some(k=>/cpf|banco|conta/i.test(k))||['valor','bruto','descontos','liquido'].some(k=>r[k]!==null&&!Number.isFinite(r[k])))return Response.json({error:'Registro inválido'},{status:400});seen.add(r.registro_id)}
const key=`municipal/${kind}/${year}/${month}.json`;let savedRows=rows;
if(kind==='results'&&coverage?.failedProcesses?.length){const old=await env.BUCKET!.get(key);if(old){const previous:any=await old.json(),failed=new Set(coverage.failedProcesses.map((p:any)=>p.processo));savedRows=[...rows,...previous.rows.filter((r:any)=>failed.has(r.processo_id)&&!seen.has(r.registro_id))]}}
const value={kind,year,month,rows:savedRows,fetchedAt,source,rawCount,coverage,normalizerVersion:normalizerVersion||1,empty:savedRows.length===0,collection:'scheduled'};await env.BUCKET!.put(key,JSON.stringify(value),{httpMetadata:{contentType:'application/json'}});return Response.json({saved:true,kind,year,month,count:savedRows.length,fetchedAt});
}catch{return Response.json({error:'Não foi possível salvar a coleta'},{status:500})}}

