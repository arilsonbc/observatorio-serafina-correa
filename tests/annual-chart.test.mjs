import test from 'node:test';import assert from 'node:assert/strict';import {matchedAnnualTotals} from '../public/annual-chart.mjs';
test('compara bruto nos mesmos meses e exclui mês corrente',()=>{const coverage=[2025,2026].flatMap(year=>[1,2].map(month=>({year,month,kind:'salary',status:'available',count:1})));const rows=[2025,2026].flatMap(year=>[1,2].map(m=>({tipo:'salario',data:year+'-0'+m+'-01',bruto:100,liquido:70})));const r=matchedAnnualTotals(rows,coverage,'salary',1);assert.deepEqual(r.months,[1]);assert.equal(r.totals[0].value,100)});
test('não compara mês disponível em apenas um ano',()=>assert.deepEqual(matchedAnnualTotals([],[{kind:'salary',year:2026,month:1,status:'available',count:10}],'salary',1).months,[]));

