const STATUSES = ['New Lead','Comping','Offer Sent','Negotiating','Under Contract','Disposition','Closed','Passed'];
const STORAGE_KEY = 'robee-deals-v1';
const $ = selector => document.querySelector(selector);
const form = $('#propertyForm');
let deals = loadDeals();
let editingId = null;
let comps = [];

function loadDeals() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveDeals() { localStorage.setItem(STORAGE_KEY, JSON.stringify(deals)); }
function money(value) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(value)||0); }
function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }
function slug(value) { return value.replaceAll(' ','-'); }
function toast(message) { const el=$('#toast'); el.textContent=message; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2200); }

function setup() {
  STATUSES.forEach(status => { $('#statusFilter').add(new Option(status,status)); $('#formStatus').add(new Option(status,status)); });
  $('#addProperty').onclick = $('#emptyAdd').onclick = () => openEditor();
  $('#homeLink').onclick = event => { event.preventDefault(); showDashboard(); };
  $('#backButton').onclick = $('#cancelButton').onclick = showDashboard;
  $('#deleteButton').onclick = deleteDeal;
  $('#addComp').onclick = () => { comps.push({}); renderComps(); };
  $('#search').oninput = $('#statusFilter').onchange = $('#typeFilter').onchange = renderDashboard;
  $('#clearFilters').onclick = () => { $('#search').value=''; $('#statusFilter').value=''; $('#typeFilter').value=''; renderDashboard(); };
  document.querySelectorAll('.calc-input').forEach(input => input.addEventListener('input', renderCalculator));
  document.querySelectorAll('.margin-chip').forEach(button => button.onclick = () => { form.margin.value=button.dataset.margin; renderCalculator(); });
  form.onsubmit = saveDeal;
  renderDashboard();
}

function renderDashboard() {
  const query=$('#search').value.trim().toLowerCase(), status=$('#statusFilter').value, type=$('#typeFilter').value;
  const shown=deals.filter(deal => (!query || `${deal.address} ${deal.city} ${deal.zip}`.toLowerCase().includes(query)) && (!status||deal.status===status) && (!type||deal.type===type));
  const active=deals.filter(d=>!['Closed','Passed'].includes(d.status));
  const fees=deals.filter(d=>d.status!=='Passed').reduce((sum,d)=>sum+(Number(d.assignment)||0),0);
  $('#feeTotal').textContent=money(fees);
  $('#stats').innerHTML=[['Total leads',deals.length],['Active pipeline',active.length],['Under contract',deals.filter(d=>d.status==='Under Contract').length],['Closed deals',deals.filter(d=>d.status==='Closed').length]].map(([label,value])=>`<div class="stat panel"><span>${label}</span><strong>${value}</strong></div>`).join('');
  $('#resultCount').textContent=`${shown.length} ${shown.length===1?'property':'properties'}`;
  $('#propertyList').innerHTML=shown.map(deal=>{const c=DealMath.calculateDeal(deal);return `<button class="property-card" data-id="${deal.id}"><div class="address"><strong>${escapeHtml(deal.address)}</strong><span>${escapeHtml([deal.city,deal.state,deal.zip].filter(Boolean).join(', '))} · ${escapeHtml(deal.type||'Single Family')}</span></div><div class="hide-tablet"><small>List price</small><strong>${money(deal.listPrice)}</strong></div><div><small>ARV</small><strong>${money(deal.arv)}</strong></div><div class="hide-tablet"><small>Rehab</small><strong>${money(deal.rehab)}</strong></div><div class="mobile-mao"><small>MAO</small><strong>${money(c.mao)}</strong></div><div><small>Current offer</small><strong>${money(deal.offer)}</strong></div><div class="hide-tablet"><small>Assignment</small><strong>${money(deal.assignment)}</strong></div><span class="status ${slug(deal.status||'New Lead')}">${escapeHtml(deal.status||'New Lead')}</span></button>`}).join('');
  document.querySelectorAll('.property-card').forEach(card=>card.onclick=()=>openEditor(card.dataset.id));
  $('#emptyState').hidden=shown.length>0; $('#propertyList').hidden=shown.length===0;
}

function openEditor(id=null) {
  editingId=id; const deal=deals.find(item=>item.id===id) || {type:'Single Family',margin:25,assignment:10000,status:'New Lead'};
  form.reset(); comps=(deal.comps||[]).map(comp=>({...comp}));
  Object.entries(deal).forEach(([key,value])=>{ if(form.elements[key] && key!=='comps') form.elements[key].value=value; });
  $('#editorTitle').textContent=id ? deal.address : 'New property'; $('#deleteButton').hidden=!id;
  $('#dashboardView').hidden=true; $('#editorView').hidden=false; window.scrollTo(0,0); renderComps(); renderCalculator();
}
function showDashboard() { $('#editorView').hidden=true; $('#dashboardView').hidden=false; renderDashboard(); window.scrollTo(0,0); }

function readForm() {
  const data=Object.fromEntries(new FormData(form));
  ['bedrooms','bathrooms','squareFeet','listPrice','arv','rehab','margin','costs','assignment','offer'].forEach(key=>data[key]=Number(data[key])||0);
  data.comps=comps; return data;
}
function saveDeal(event) {
  event.preventDefault(); syncComps(); const data=readForm();
  if(editingId) deals=deals.map(deal=>deal.id===editingId?{...deal,...data,updatedAt:new Date().toISOString()}:deal);
  else deals.unshift({...data,id:crypto.randomUUID(),createdAt:new Date().toISOString()});
  saveDeals(); showDashboard(); toast(editingId?'Property updated':'Property added');
}
function deleteDeal() {
  if(!editingId || !confirm('Delete this property and its comparable sales?')) return;
  deals=deals.filter(deal=>deal.id!==editingId); saveDeals(); showDashboard(); toast('Property deleted');
}

function renderCalculator() {
  const data=readForm(), values=DealMath.calculateDeal(data);
  document.querySelectorAll('.margin-chip').forEach(button=>button.classList.toggle('active',Number(button.dataset.margin)===Number(data.margin)));
  const rows=[['ARV',values.arv],['Buyer target price',values.buyerTarget],['Rehab costs',-values.rehab],['Closing / holding',-values.costs],['Maximum allowable offer',values.mao,'feature'],['Recommended contract',values.contractPrice],['Recommended opening offer',values.openingOffer,'feature'],['Assignment fee',values.assignment],['End buyer purchase price',values.endBuyerPrice],['Estimated buyer profit',values.buyerProfit,'positive']];
  $('#calculatorRows').innerHTML=rows.map(([label,value,kind])=>`<div class="calc-row ${kind||''}"><span>${label}</span><strong>${value<0?'− ':''}${money(Math.abs(value))}</strong></div>`).join('')+`<div class="calc-row positive"><span>Buyer ROI / profit margin</span><strong>${values.roi.toFixed(1)}%</strong></div>`;
}

function syncComps() {
  document.querySelectorAll('.comp').forEach((row,index)=>{ const record={}; row.querySelectorAll('[data-key]').forEach(input=>record[input.dataset.key]=input.type==='number'?(Number(input.value)||0):input.value); comps[index]=record; });
}
function renderComps() {
  $('#compsList').innerHTML=comps.map((comp,index)=>`<div class="comp" data-index="${index}"><label>Address<input data-key="address" value="${escapeHtml(comp.address)}" placeholder="456 Oak Avenue"></label><label>Sold price<input data-key="soldPrice" type="number" min="0" value="${comp.soldPrice||''}" placeholder="$0"></label><label>Sold date<input data-key="soldDate" type="date" value="${comp.soldDate||''}"></label><label>Square feet<input data-key="squareFeet" type="number" min="0" value="${comp.squareFeet||''}" placeholder="0"></label><div class="comp-more"><label>Price / sq ft<input data-key="ppsf" type="number" min="0" step=".01" value="${comp.ppsf||''}" placeholder="Auto-calculated"></label><label>Bedrooms<input data-key="bedrooms" type="number" min="0" value="${comp.bedrooms||''}"></label><label>Bathrooms<input data-key="bathrooms" type="number" min="0" step=".5" value="${comp.bathrooms||''}"></label><label>Notes<input data-key="notes" value="${escapeHtml(comp.notes)}" placeholder="Condition, distance, upgrades…"></label></div><button type="button" class="remove-comp" aria-label="Remove comparable">×</button></div>`).join('');
  document.querySelectorAll('.comp input').forEach(input=>input.oninput=()=>{syncComps(); updateCompEstimate();});
  document.querySelectorAll('.remove-comp').forEach(button=>button.onclick=()=>{syncComps(); comps.splice(Number(button.closest('.comp').dataset.index),1); renderComps();});
  $('#noComps').hidden=comps.length>0; updateCompEstimate();
}
function updateCompEstimate() {
  const estimate=DealMath.estimateArv(comps,form.squareFeet.value), el=$('#compEstimate'); el.hidden=!estimate;
  if(estimate) el.innerHTML=`<strong>Comp-supported ARV: ${money(estimate)}</strong> · Based on ${comps.filter(c=>Number(c.soldPrice)>0).length} valid ${comps.filter(c=>Number(c.soldPrice)>0).length===1?'sale':'sales'} <button type="button" class="text-button" id="useArv">Use this ARV</button>`;
  $('#useArv')?.addEventListener('click',()=>{form.arv.value=Math.round(estimate);renderCalculator();toast('ARV updated from comps');});
}

setup();
