import test from 'node:test';import assert from 'node:assert/strict';import {concentration,contractState,linkedSearch} from '../public/insights.mjs';
test('concentração soma por CNPJ e divide pelo total',()=>{const c=concentration([{tipo:'pagamento',entidade_id:'a',nome:'A',valor:20},{tipo:'pagamento',entidade_id:'a',nome:'A',valor:30},{tipo:'pagamento',entidade_id:'b',nome:'B',valor:50}]);assert.equal(c.top1,50);assert.equal(c.top5,100)});
test('saldo negativo bloqueia percentual enganoso',()=>assert.equal(concentration([{tipo:'pagamento',entidade_id:'a',nome:'A',valor:-10},{tipo:'pagamento',entidade_id:'b',nome:'B',valor:50}]),null));
test('vencimento atualizado prevalece sobre prazo original',()=>assert.equal(contractState({vigencia_fim:'2026-01-01',vencimento_atual:'2026-11-01'},'2026-10-19'),'Vence em 13 dias'));
test('prazo ausente e encerramento são estados distintos',()=>{assert.equal(contractState({},'2026-10-19'),'Vigência não informada');assert.equal(contractState({encerramento:'2026-10-01'},'2026-10-19'),'Encerrado')});
test('busca por objeto vincula o processo sem inferir pagamentos',()=>assert.deepEqual([...linkedSearch([{tipo:'processo',nome:'Aquisição de combustível',processo_id:'1'},{tipo:'pagamento',nome:'Fornecedor',processo_id:''}],'combustivel')],['1']));

