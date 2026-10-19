import test from 'node:test';import assert from 'node:assert/strict';import {periodPair,periodValue,variation} from '../public/comparison.mjs';
test('janeiro compara com dezembro do ano anterior',()=>assert.deepEqual(periodPair('2026','01',2026,10).b,{year:2025,months:[12]}));
test('ano corrente compara a mesma janela e não o ano completo anterior',()=>assert.equal(periodPair('2026','all',2026,10).b.months.length,10));
test('falta de cobertura não vira queda de cem por cento',()=>assert.equal(variation(periodValue([],[],{year:2026,months:[1]},'pagamento'),{value:100,complete:true}),null));
test('base zero tem diferença absoluta sem percentual infinito',()=>assert.deepEqual(variation({value:20,complete:true},{value:0,complete:true}),{absolute:20,percent:null}));
test('valor ausente impede comparação percentual',()=>{const v=periodValue([{tipo:'salario',data:'2026-01-01',liquido:null}], [{kind:'salary',year:2026,month:1,status:'available'}],{year:2026,months:[1]},'salario','liquido');assert.equal(v.complete,false)});

