import test from 'node:test';
import assert from 'node:assert/strict';
import {pagesAsset,validateDataset} from '../scripts/build-pages.mjs';
test('Pages usa dados locais e mantém links compartilháveis no subdiretório',()=>{
  const app=pagesAsset("fetch('/api/painel?year='+year);fetch('/api/painel?year='+y);location.href='/painel'",'app.js');
  assert.equal(app,"fetch('./data/'+year+'.json');fetch('./data/'+y+'.json');location.href='./index.html'");
  assert.equal(pagesAsset("'/painel?'+new URLSearchParams({id})",'profile.mjs'),"'./index.html?'+new URLSearchParams({id})");
});
test('Pages recusa resposta inválida em vez de publicar carga vazia por erro',()=>{
  assert.throws(()=>validateDataset({year:2026,rows:[],coverage:[{status:'error'}]},2026));
  assert.throws(()=>validateDataset({year:2025,rows:[],coverage:[{status:'available'}]},2026));
  assert.equal(validateDataset({year:2026,rows:[],coverage:[{status:'empty'}]},2026).year,2026);
});

