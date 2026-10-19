import test from 'node:test';import assert from 'node:assert/strict';import {profileURL,profileMarkup} from '../public/profile.mjs';
test('link compartilhável codifica matrícula sem alterar identidade',()=>{const u=new URL(profileURL('001:23/1',true),'https://example.com');assert.equal(u.searchParams.get('id'),'001:23/1');assert.equal(u.searchParams.get('perfil'),'servidor')});
test('perfil separa pagamentos de outra empresa e escapa nomes',()=>{const html=profileMarkup([{tipo:'pagamento',entidade_id:'1',nome:'<script>',data:'2026-01-01',valor:10},{tipo:'pagamento',entidade_id:'2',nome:'Outra',data:'2026-01-01',valor:999}],{kind:'empresa',id:'1'},false);assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('999'));assert.ok(!html.includes('Outra'))});

