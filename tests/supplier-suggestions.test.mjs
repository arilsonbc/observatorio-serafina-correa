import test from 'node:test';
import assert from 'node:assert/strict';
import {suggestSuppliers} from '../public/autocomplete.mjs';
const row=(id,nome,tipo='pagamento',data='2026-09-01')=>({entidade_id:id,nome,tipo,data});
test('sugere empresas por nome sem acentos e deduplica por CNPJ',()=>{
  const rows=[row('12345678000190','HOSPITAL ANTIGO','contrato','2025-01-01'),row('12345678000190','HOSPITAL SÃO JOSÉ'),row('12345678000270','HOSPITAL SÃO JOSÉ')];
  const result=suggestSuppliers(rows,'hospital sao');assert.equal(result.length,2);assert.equal(result[0].role,'CNPJ 12.345.678/0001-90');
});
test('busca CNPJ com pontuação e não sugere CPF, servidores ou processos',()=>{
  const rows=[row('12345678000190','EMPRESA'),row('12345678901','PESSOA'),row('servidor:123','SERVIDOR','salario'),row('12345678000270','PROCESSO','processo')];
  assert.equal(suggestSuppliers(rows,'12.345.678/0001')[0].name,'EMPRESA');assert.equal(suggestSuppliers(rows,'pessoa').length,0);assert.equal(suggestSuppliers(rows,'servidor').length,0);assert.equal(suggestSuppliers(rows,'processo').length,0);assert.deepEqual(suggestSuppliers(rows,' '),[]);
});

