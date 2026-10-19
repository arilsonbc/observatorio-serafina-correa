import test from 'node:test';import assert from 'node:assert/strict';import {profileRank} from '../public/profile.mjs';
const row=(id,bruto,liquido)=>({tipo:'salario',entidade_id:id,nome:id,bruto,liquido,data:'2026-01-01'});
test('classificação de servidor usa bruto e total distinto',()=>{const r=profileRank([row('a',100,90),row('a',100,90),row('b',250,50),row('c',null,null)],{kind:'servidor',id:'b'});assert.equal(r.position,1);assert.equal(r.total,2)});
test('empates recebem a mesma posição',()=>{const r=profileRank([row('a',100,90),row('b',100,80)],{kind:'servidor',id:'b'});assert.equal(r.position,1);assert.equal(r.tied,true)});
test('empresa sem pagamento conhecido não ganha posição',()=>{const r=profileRank([{tipo:'contrato',entidade_id:'a',nome:'A',valor:100}],{kind:'empresa',id:'a'});assert.equal(r.position,null);assert.equal(r.total,0)});

