import {normalizeSearch} from './data.mjs';

export function suggestEmployees(rows,query,limit=8){
  const q=normalizeSearch(query).trim(),tokens=q.split(/\s+/);
  if(!q)return [];
  const people=new Map();
  for(const r of rows){
    if(r.tipo!=='salario'||!r.entidade_id||!r.nome)continue;
    const name=normalizeSearch(r.nome);
    if(!tokens.every(t=>name.includes(t)))continue;
    const old=people.get(r.entidade_id);
    if(!old||String(r.data)>String(old.data)||r.data===old.data&&!old.cargo&&r.cargo)people.set(r.entidade_id,r);
  }
  const priority=r=>normalizeSearch(r.nome).startsWith(q)?0:normalizeSearch(r.nome).split(/\s+/).some(w=>w.startsWith(q))?1:2;
  return [...people.values()].sort((a,b)=>priority(a)-priority(b)||a.nome.localeCompare(b.nome,'pt-BR')||a.entidade_id.localeCompare(b.entidade_id)).slice(0,limit).map(r=>({id:r.entidade_id,name:r.nome,role:r.cargo?.trim()||'Cargo não informado pela prefeitura'}));
}

export function suggestSuppliers(rows,query,limit=8){
  const q=normalizeSearch(query).trim(),tokens=q.split(/\s+/),digits=q.replace(/\D/g,'');
  if(!q)return [];
  const suppliers=new Map();
  for(const r of rows){
    const cnpj=String(r.entidade_id||'').replace(/\D/g,'');
    if(!['pagamento','contrato','licitacao','adjudicacao'].includes(r.tipo)||cnpj.length!==14||!r.nome)continue;
    if(!tokens.every(t=>normalizeSearch(r.nome).includes(t))&&!(/^[\d.\/\-\s]+$/.test(q)&&digits&&cnpj.includes(digits)))continue;
    const old=suppliers.get(cnpj);
    if(!old||String(r.data)>String(old.data))suppliers.set(cnpj,r);
  }
  return [...suppliers.entries()].sort(([,a],[,b])=>Number(!normalizeSearch(a.nome).startsWith(q))-Number(!normalizeSearch(b.nome).startsWith(q))||a.nome.localeCompare(b.nome,'pt-BR')||a.entidade_id.localeCompare(b.entidade_id)).slice(0,limit).map(([cnpj,r])=>({id:r.entidade_id,name:r.nome,role:'CNPJ '+cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,'$1.$2.$3/$4-$5')}));
}

export function attachEmployeeSuggestions(input,{getRows,isActive,onChoose,getSuggestions=suggestEmployees,getLabel=()=> 'Sugestões de servidores'}){
  const label=input.closest('label'),wrapper=document.createElement('div');
  wrapper.className='search-field';label.before(wrapper);wrapper.append(label);
  const list=document.createElement('div');list.id='employeeSuggestions';list.className='employee-suggestions';list.setAttribute('role','listbox');list.setAttribute('aria-label','Sugestões de servidores');list.hidden=true;wrapper.append(list);
  const status=document.createElement('span');status.className='sr-only';status.setAttribute('role','status');wrapper.append(status);
  input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');
  let items=[],active=-1,dismissed=false;
  function close(){list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;status.textContent='';}
  function highlight(){[...list.children].forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));if(active>=0){input.setAttribute('aria-activedescendant',list.children[active].id);list.children[active].scrollIntoView({block:'nearest'});}else input.removeAttribute('aria-activedescendant');}
  function choose(i){const item=items[i];if(!item)return;input.value=item.name;dismissed=true;close();onChoose(item);input.focus();}
  function refresh(){
    if(!isActive()||document.activeElement!==input||dismissed){close();return;}
    list.setAttribute('aria-label',getLabel());
    const next=getSuggestions(getRows(),input.value);
    if(!list.hidden&&JSON.stringify(next)===JSON.stringify(items))return;
    items=next;active=-1;list.replaceChildren();
    if(!items.length){close();if(input.value.trim())status.textContent='Nenhum nome correspondente nos filtros atuais.';return;}
    items.forEach((item,i)=>{const option=document.createElement('div');option.id='employeeSuggestion-'+i;option.setAttribute('role','option');option.setAttribute('aria-selected','false');const name=document.createElement('strong'),role=document.createElement('small');name.textContent=item.name;role.textContent=item.role;option.append(name,role);option.addEventListener('pointerdown',e=>e.preventDefault());option.addEventListener('click',()=>choose(i));list.append(option);});
    list.hidden=false;input.setAttribute('aria-expanded','true');input.removeAttribute('aria-activedescendant');status.textContent=items.length+' sugestões. Use as setas para navegar e Enter para selecionar.';
  }
  input.addEventListener('input',()=>{dismissed=false;refresh();});input.addEventListener('focus',()=>{dismissed=false;refresh();});input.addEventListener('blur',close);
  input.addEventListener('keydown',e=>{if(e.isComposing)return;if(e.key==='Escape'){dismissed=true;close();return;}if(e.key==='Tab'){close();return;}if(list.hidden)return;if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();active=e.key==='ArrowDown'?(active+1)%items.length:active<0?items.length-1:(active-1+items.length)%items.length;highlight();}else if(e.key==='Enter'&&active>=0){e.preventDefault();choose(active);}});
  document.addEventListener('pointerdown',e=>{if(!wrapper.contains(e.target))close();});
  return {refresh,close};
}

