import test from 'node:test';
import assert from 'node:assert/strict';
import {suggestEmployees} from '../public/autocomplete.mjs';
const row=(id,nome,cargo,data='2026-09-01')=>({tipo:'salario',entidade_id:id,nome,cargo,data});
test('sugere nome parcial sem acentos e mostra o cargo mais recente sem duplicar folhas',()=>{
  const rows=[row('1','ADRIANE LANZARIN FIN','PROFESSORA','2026-01-01'),row('1','ADRIANE LANZARIN FIN','DIRETORA'),row('2','ADRIANA ÁVILA','ENFERMEIRA'),row('3','JOÃO SILVA','MOTORISTA')];
  assert.deepEqual(suggestEmployees(rows,'adria').map(r=>[r.name,r.role]),[['ADRIANA ÁVILA','ENFERMEIRA'],['ADRIANE LANZARIN FIN','DIRETORA']]);
  assert.equal(suggestEmployees(rows,'adriana avila')[0].id,'2');
});
test('não sugere empresas, não busca pelo cargo e mantém homônimos por matrícula',()=>{
  const rows=[row('1','ANA','MÉDICA'),row('2','ANA',null),{...row('3','ANA EMPRESA',''),tipo:'pagamento'}];
  assert.equal(suggestEmployees(rows,'ana').length,2);assert.equal(suggestEmployees(rows,'medica').length,0);assert.deepEqual(suggestEmployees(rows,' '),[]);assert.equal(suggestEmployees(rows,'ana')[1].role,'Cargo não informado pela prefeitura');
});
test('prioriza começo do nome e limita lista',()=>{
  const rows=[row('1','MARIA ADRIANA','A'),row('2','ADRIANA SILVA','B')];
  assert.deepEqual(suggestEmployees(rows,'adria',1).map(r=>r.id),['2']);
});

