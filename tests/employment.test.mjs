import test from 'node:test';import assert from 'node:assert/strict';import {employmentInfo} from '../public/profile.mjs';
test('não presume concurso pelo regime estatutário',()=>assert.equal(employmentInfo([{tipo:'salario',data:'2026-01-01',vinculo:'RPPS'}]).status,'Não informado pela prefeitura'));
test('usa forma de provimento explícita e ano de admissão',()=>{const r=employmentInfo([{tipo:'salario',data:'2026-01-01',forma_provimento:'CONCURSO PUBLICO',data_admissao:'2011-03-21',cargo:'Motorista'}]);assert.equal(r.year,'2011');assert.match(r.status,/Concursado/)});
test('comissão explícita indica não concursado',()=>assert.match(employmentInfo([{tipo:'salario',data:'2026-01-01',forma_provimento:'CARGO EM COMISSAO'}]).status,/Não concursado/));
test('reconhece as três formas não concursadas publicadas pelo município',()=>{for(const forma_provimento of ['LIVRE PROVIMENTO ','TEMPO DETERMINADO','ELEICAO/INDICACAO'])assert.match(employmentInfo([{tipo:'salario',data:'2026-09-01',forma_provimento}]).status,/Não concursado/)});

