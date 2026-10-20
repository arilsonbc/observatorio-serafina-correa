import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const PUBLIC_SOURCE='https://observatorio-serafina-correa.wise-sun-9588.chatgpt.site';
const assets=['style.css','municipio.css','app.js','profile.mjs','payroll.mjs','annual-chart.mjs','comparison.mjs','insights.mjs','data.mjs'];

// Transform only the Pages artifact; the Worker deployment keeps its own routes.
export function pagesAsset(source,name){
  let result=source.replaceAll('/painel','./index.html');
  if(name==='app.js'){
    result=result.replaceAll("'/api./index.html?year='+year","'./data/'+year+'.json'")
      .replaceAll("'/api./index.html?year='+y","'./data/'+y+'.json'");
    result=result.replace('stale=c.some(c=>c.stale)',"stale=c.some(c=>c.stale||(c.fetchedAt&&Date.now()-Date.parse(c.fetchedAt)>(c.year>=current-1?36*3600000:8*24*3600000)))");
    if(result.includes('/api'))throw Error('Unconverted API route in Pages artifact');
  }
  if(name==='painel.html'){
    result=result.replaceAll('href="/style.css"','href="./style.css"').replaceAll('href="/municipio.css"','href="./municipio.css"').replaceAll('src="/app.js"','src="./app.js"');
    result=result.replace('A coleta diária está agendada para 7h (Brasília) no Sites.', 'Esta cópia no GitHub Pages é atualizada diariamente após as 7h30 (Brasília), a partir da coleta pública do Observatório. O horário pode variar conforme a execução do GitHub Actions. A coleta na prefeitura está agendada para 7h.');
  }
  return result;
}

export function validateDataset(data,year){
  if(data.year!==year||!Array.isArray(data.rows)||!Array.isArray(data.coverage)||!data.coverage.some(c=>['available','empty'].includes(c.status)))throw Error('Resposta pública inválida para '+year);
  return data;
}

async function downloadYear(year){
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const response=await fetch(PUBLIC_SOURCE+'/api/painel?year='+year,{signal:AbortSignal.timeout(90000)});
      if(!response.ok)throw Error('HTTP '+response.status);
      return validateDataset(await response.json(),year);
    }catch(error){if(attempt===3)throw Error('Falha ao obter '+year+': '+error.message);}
  }
}

export async function buildPages(output='pages-output'){
  const root=resolve(import.meta.dirname,'..'),out=resolve(root,output);
  if(out===root||!out.startsWith(root+'/')&&!out.startsWith(root+'\\'))throw Error('A saída deve ficar dentro do projeto');
  await mkdir(resolve(out,'data'),{recursive:true});
  for(const name of assets)await writeFile(resolve(out,name),pagesAsset(await readFile(resolve(root,'public',name),'utf8'),name));
  await writeFile(resolve(out,'index.html'),pagesAsset(await readFile(resolve(root,'public/painel.html'),'utf8'),'painel.html'));
  await writeFile(resolve(out,'.nojekyll'),'');
  const current=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'America/Sao_Paulo'}).format(new Date()));
  const years=Array.from({length:current-2016},(_,i)=>2017+i),summary=[];let at=0;
  async function worker(){while(at<years.length){const year=years[at++],data=await downloadYear(year);await writeFile(resolve(out,'data',year+'.json'),JSON.stringify(data));summary.push({year,rows:data.rows.length});console.log(year+': '+data.rows.length+' registros');}}
  await Promise.all([worker(),worker()]);
  await writeFile(resolve(out,'publication.json'),JSON.stringify({generatedAt:new Date().toISOString(),publicSource:PUBLIC_SOURCE,years:summary.sort((a,b)=>a.year-b.year)},null,2));
  console.log('GitHub Pages pronto em '+out);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await buildPages(process.argv[2]);

