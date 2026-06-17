/* ═══════════════════════════════════════════════════════════
   StockPro PWA — app.js
   Firebase Firestore realtime sync · hk-pro-housekeeping
   ═══════════════════════════════════════════════════════════ */

const S = {
  user:null, items:[], movements:[], recentScans:[], onlineUsers:[],
  currentFilter:'all', editingId:null, scannerActive:false, codeReader:null,
  unsubs:[], fbReady:false, offlineMode:false,
};
const CAT_EMOJI={'Ropa de Cama':'🛏️','Toallas':'🛁','Amenidades':'✨','Limpieza':'🧹','Insumos':'📦'};
const BAR_COLORS=['#2E5FA3','#27AE60','#F4A623','#E74C3C','#8E44AD'];
const SEED=[
  {id:'itm1',barcode:'7501234567890',sku:'SAB-QS-001',name:'Sábanas Queen Size',cat:'Ropa de Cama',qty:24,minQty:10,unit:'Piezas',loc:'Estante A-1',price:12.50,supplier:'Textiles MX'},
  {id:'itm2',barcode:'7501234567891',sku:'TOA-BA-002',name:'Toallas de Baño',cat:'Toallas',qty:60,minQty:20,unit:'Piezas',loc:'Estante A-2',price:5.75,supplier:'Textiles MX'},
  {id:'itm3',barcode:'7501234567892',sku:'ALM-ES-003',name:'Almohadas Estándar',cat:'Ropa de Cama',qty:30,minQty:12,unit:'Piezas',loc:'Estante A-3',price:8.00,supplier:'Confort Plus'},
  {id:'itm4',barcode:'7501234567893',sku:'JAB-MA-004',name:'Jabón de Manos 250ml',cat:'Amenidades',qty:7,minQty:30,unit:'Unidades',loc:'Estante B-1',price:1.20,supplier:'Amenities Pro'},
  {id:'itm5',barcode:'7501234567894',sku:'SHA-HO-005',name:'Shampoo 300ml',cat:'Amenidades',qty:80,minQty:30,unit:'Unidades',loc:'Estante B-1',price:1.80,supplier:'Amenities Pro'},
  {id:'itm6',barcode:'7501234567895',sku:'PAP-HI-006',name:'Papel Higiénico Doble',cat:'Insumos',qty:200,minQty:50,unit:'Rollos',loc:'Estante B-2',price:0.65,supplier:'Office Depot'},
  {id:'itm7',barcode:'7501234567896',sku:'DES-PI-008',name:'Desinfectante 1L',cat:'Limpieza',qty:0,minQty:10,unit:'Litros',loc:'Estante C-1',price:3.50,supplier:'CleanCo'},
  {id:'itm8',barcode:'7501234567897',sku:'TOA-MA-010',name:'Toallas de Mano',cat:'Toallas',qty:90,minQty:25,unit:'Piezas',loc:'Estante A-2',price:3.00,supplier:'Textiles MX'},
  {id:'itm9',barcode:'7501234567898',sku:'LIM-MU-011',name:'Limpiador Multiusos',cat:'Limpieza',qty:5,minQty:15,unit:'Unidades',loc:'Estante C-2',price:2.80,supplier:'CleanCo'},
  {id:'itm10',barcode:'7501234567899',sku:'FUN-AL-009',name:'Fundas de Almohada',cat:'Ropa de Cama',qty:48,minQty:20,unit:'Piezas',loc:'Estante A-3',price:4.25,supplier:'Textiles MX'},
  {id:'itm11',barcode:'7501234567900',sku:'ACO-CA-007',name:'Acondicionador 300ml',cat:'Amenidades',qty:3,minQty:30,unit:'Unidades',loc:'Estante B-1',price:1.95,supplier:'Amenities Pro'},
  {id:'itm12',barcode:'7501234567901',sku:'BOL-BA-012',name:'Bolsas de Basura',cat:'Insumos',qty:50,minQty:20,unit:'Paquetes',loc:'Estante C-3',price:1.50,supplier:'Office Depot'},
];

window.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    document.getElementById('splash').classList.add('fade-out');
    setTimeout(()=>{ document.getElementById('splash').style.display='none'; startApp(); },500);
  },1600);
});

async function startApp(){
  if(!window.firebase){S.offlineMode=true;loadLocal();showLoginScreen();return;}
  const result=initFirebase();
  if(!result.ok){ S.offlineMode=true; loadLocal(); showLoginScreen(); return; }
  S.fbReady=true;
  const savedCfg=localStorage.getItem('sp_fb_config');
  if(savedCfg){try{initFirebase(JSON.parse(savedCfg));}catch(e){}}
  getAuth().onAuthStateChanged(user=>{
    if(user){
      S.user={uid:user.uid,email:user.email,name:user.displayName||user.email.split('@')[0],initials:(user.displayName||user.email)[0].toUpperCase()};
      showApp(); attachListeners(); updatePresence(true);
    } else { detachListeners(); showLoginScreen(); }
  });
}
function showLoginScreen(){ document.getElementById('login-screen').classList.remove('hidden'); }

// ── AUTH ──────────────────────────────────────────────────────
function doLogin(){
  const email=document.getElementById('login-email').value.trim();
  const pass=document.getElementById('login-pass').value;
  document.getElementById('login-error').classList.add('hidden');
  if(!email||!pass){showLoginError('Completa todos los campos');return;}
  const btn=document.getElementById('login-btn'); btn.textContent='Iniciando...'; btn.disabled=true;
  if(!S.fbReady){
    S.user={uid:'demo',email,name:email.split('@')[0],initials:email[0].toUpperCase()};
    document.getElementById('login-screen').classList.add('hidden');
    loadLocal(); showApp(); btn.textContent='Iniciar sesión'; btn.disabled=false; return;
  }
  getAuth().signInWithEmailAndPassword(email,pass).catch(err=>{
    const msgs={'auth/user-not-found':'Usuario no encontrado','auth/wrong-password':'Contraseña incorrecta','auth/invalid-email':'Email inválido','auth/too-many-requests':'Demasiados intentos'};
    showLoginError(msgs[err.code]||err.message); btn.textContent='Iniciar sesión'; btn.disabled=false;
  });
}
function doGoogleLogin(){
  if(!S.fbReady||!window.firebase){showLoginError('Firebase no disponible. Usa email/contraseña.');return;}
  getAuth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(err=>showLoginError(err.message));
}
function doLogout(){
  if(!confirm('¿Cerrar sesión?'))return;
  updatePresence(false); detachListeners();
  if(S.fbReady) getAuth().signOut();
  S.user=null;
  document.getElementById('app').classList.add('hidden'); showLoginScreen(); toggleMenu(true);
}
function showLoginError(msg){const el=document.getElementById('login-error');el.textContent=msg;el.classList.remove('hidden');}
function showProfile(){showToast(`${S.user?.name} · ${S.user?.email}`);}

// ── FIREBASE REALTIME LISTENERS ────────────────────────────────
function attachListeners(){
  if(!S.fbReady)return;
  const db=getDB();
  const u1=db.collection(COLLECTIONS.INVENTARIO).orderBy('name').onSnapshot(snap=>{
    S.items=snap.docs.map(d=>({id:d.id,...d.data()}));
    if(S.items.length===0) seedFirestore();
    renderInventory(); setSyncOnline();
  },()=>setSyncOffline());
  const u2=db.collection(COLLECTIONS.MOVIMIENTOS).orderBy('date','desc').limit(60).onSnapshot(snap=>{
    S.movements=snap.docs.map(d=>({id:d.id,...d.data()})); renderMovements();
  },()=>{});
  const u3=db.collection(COLLECTIONS.USUARIOS).where('online','==',true).onSnapshot(snap=>{
    S.onlineUsers=snap.docs.map(d=>({id:d.id,...d.data()})); renderTeam(); updateOnlineBadge();
  },()=>{});
  S.unsubs=[u1,u2,u3];
}
function detachListeners(){ S.unsubs.forEach(u=>{try{u();}catch(e){}}); S.unsubs=[]; }

async function seedFirestore(){
  if(!S.fbReady)return;
  showToast('Cargando inventario inicial de Hotel Arbellas...');
  const db=getDB(); const batch=db.batch();
  SEED.forEach(item=>{
    const ref=db.collection(COLLECTIONS.INVENTARIO).doc(item.id);
    batch.set(ref,{...item,createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdBy:S.user?.email||'system'});
  });
  await batch.commit(); showToast('✅ 12 productos cargados en Firebase');
}

function loadLocal(){
  const s=localStorage.getItem('sp_items'); S.items=s?JSON.parse(s):JSON.parse(JSON.stringify(SEED));
  const m=localStorage.getItem('sp_movements'); S.movements=m?JSON.parse(m):[];
}
function saveLocal(){ localStorage.setItem('sp_items',JSON.stringify(S.items)); localStorage.setItem('sp_movements',JSON.stringify(S.movements)); }

async function updatePresence(online){
  if(!S.fbReady||!S.user)return;
  const ref=getDB().collection(COLLECTIONS.USUARIOS).doc(S.user.uid);
  await ref.set({name:S.user.name,email:S.user.email,online,lastSeen:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
  if(online) window.addEventListener('beforeunload',()=>ref.update({online:false}));
}
function setSyncOnline(){const d=document.querySelector('#sync-indicator .sync-dot');if(d)d.className='sync-dot online';}
function setSyncOffline(){const d=document.querySelector('#sync-indicator .sync-dot');if(d)d.className='sync-dot offline';}

function showApp(){
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  if(S.user){
    document.getElementById('user-avatar').textContent=S.user.initials||'U';
    document.getElementById('menu-user-name').textContent=S.user.name;
    document.getElementById('menu-user-email').textContent=S.user.email;
    const r=document.getElementById('mov-responsible'); if(r) r.value=S.user.name;
  }
  updateFBStats();
}

// ── NAVIGATION ─────────────────────────────────────────────────
function navigate(page){
  document.querySelectorAll('.page').forEach(p=>{p.classList.remove('active');p.classList.add('hidden');});
  const t=document.getElementById('page-'+page); if(t){t.classList.remove('hidden');t.classList.add('active');}
  document.querySelectorAll('.nav-btn,.menu-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  const titles={inventory:'Inventario',scanner:'Escáner',movements:'Movimientos',reports:'Reportes',export:'Exportar · Config',team:'Equipo en línea'};
  document.getElementById('topbar-title').textContent=titles[page]||'StockPro';
  if(page==='reports') renderReports();
  if(page==='movements') renderMovements();
  if(page==='scanner') renderRecentScans();
  if(page==='team') renderTeam();
  if(page==='export') updateFBStats();
  if(page!=='scanner') stopScanner();
  toggleMenu(true);
}
function toggleMenu(f){
  const m=document.getElementById('side-menu'),o=document.getElementById('menu-overlay');
  if(f){m.classList.remove('open');o.classList.remove('open');return;}
  const open=m.classList.contains('open'); m.classList.toggle('open',!open); o.classList.toggle('open',!open);
}

// ── HELPERS ────────────────────────────────────────────────────
function getStatus(i){
  if(!i.qty||i.qty===0) return{label:'Sin stock',cls:'badge-out'};
  if(i.qty<(i.minQty||10)) return{label:'Stock bajo',cls:'badge-low'};
  return{label:'OK',cls:'badge-ok'};
}

// ── INVENTORY ──────────────────────────────────────────────────
function renderInventory(){
  let list=S.items;
  if(S.currentFilter!=='all') list=list.filter(i=>i.cat===S.currentFilter);
  const el=document.getElementById('items-list');
  if(!list.length){el.innerHTML=`<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg><p>Sin productos</p><small>Agrega el primero con el botón +</small></div>`;return;}
  el.innerHTML=list.map(item=>{
    const s=getStatus(item); const emoji=CAT_EMOJI[item.cat]||'📦';
    const qc=item.qty===0?'var(--red)':item.qty<(item.minQty||10)?'var(--yellow)':'var(--blue)';
    return `<div class="item-card" onclick="openDetail('${item.id}')" role="button" tabindex="0">
      <div class="item-emoji">${emoji}</div>
      <div class="item-body"><div class="item-name">${item.name}</div><div class="item-sub">${item.sku} · ${item.loc}</div><span class="badge ${s.cls}">${s.label}</span></div>
      <div class="item-right"><div class="item-qty" style="color:${qc}">${item.qty||0}</div><div class="item-unit">${item.unit}</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px">$${Number(item.price||0).toFixed(2)}</div></div>
    </div>`;
  }).join('');
  renderQuickStats();
}
function renderQuickStats(){
  const el=document.getElementById('quick-stats'); if(!el) return;
  const total=S.items.length, low=S.items.filter(i=>i.qty>0&&i.qty<(i.minQty||10)).length, out=S.items.filter(i=>!i.qty||i.qty===0).length;
  el.innerHTML=`<div class="quick-stat"><div class="val blue">${total}</div><div class="lbl">Productos</div></div><div class="quick-stat"><div class="val amber">${low}</div><div class="lbl">Stock bajo</div></div><div class="quick-stat"><div class="val red">${out}</div><div class="lbl">Sin stock</div></div>`;
}
function filterCat(btn,cat){S.currentFilter=cat;document.querySelectorAll('.filter-chip').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderInventory();}

// ── DETAIL ─────────────────────────────────────────────────────
function openDetail(id){
  const item=S.items.find(i=>i.id===id); if(!item) return;
  const s=getStatus(item); const emoji=CAT_EMOJI[item.cat]||'📦';
  const overlay=document.createElement('div'); overlay.className='detail-overlay'; overlay.id='detail-overlay';
  overlay.innerHTML=`<div class="detail-sheet">
    <div class="detail-topbar"><button class="detail-back" onclick="closeDetailSheet()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Volver</button><h2>${item.name}</h2><button style="background:none;border:none;color:#fff" onclick="openEditModal('${id}')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></div>
    <div class="detail-hero"><div class="detail-hero-icon">${emoji}</div><div class="detail-hero-name">${item.name}</div><div class="detail-hero-sku">${item.sku}</div><span class="badge ${s.cls}" style="margin-top:6px">${s.label}</span></div>
    <div class="detail-qty-row"><button class="qty-adj-btn" onclick="adjustQty('${id}',-1)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg></button><div><div class="qty-display" id="dqty-${id}">${item.qty||0}</div><div class="qty-unit" style="text-align:center">${item.unit}</div></div><button class="qty-adj-btn" onclick="adjustQty('${id}',1)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button></div>
    <div class="detail-fields">
      <div class="detail-field"><span class="detail-field-label">Código de barras</span><span class="detail-field-value" style="font-family:monospace;font-size:13px">${item.barcode}</span></div>
      <div class="detail-field"><span class="detail-field-label">Categoría</span><span class="detail-field-value">${item.cat}</span></div>
      <div class="detail-field"><span class="detail-field-label">Ubicación</span><span class="detail-field-value">${item.loc}</span></div>
      <div class="detail-field"><span class="detail-field-label">Stock mínimo</span><span class="detail-field-value">${item.minQty||10} ${item.unit}</span></div>
      <div class="detail-field"><span class="detail-field-label">Precio unitario</span><span class="detail-field-value">$${Number(item.price||0).toFixed(2)}</span></div>
      <div class="detail-field"><span class="detail-field-label">Valor en stock</span><span class="detail-field-value" style="color:var(--blue)">$${((item.qty||0)*(item.price||0)).toFixed(2)}</span></div>
      <div class="detail-field"><span class="detail-field-label">Proveedor</span><span class="detail-field-value">${item.supplier||'—'}</span></div>
    </div>
    <div class="detail-actions"><button class="btn-secondary" onclick="openEditModal('${id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar</button><button class="btn-secondary" style="color:var(--red);border-color:var(--red)" onclick="deleteItem('${id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg> Eliminar</button></div>
  </div>`;
  document.body.appendChild(overlay);
  setTimeout(()=>overlay.style.background='rgba(0,0,0,.4)',10);
}
function closeDetailSheet(){const el=document.getElementById('detail-overlay');if(el)el.remove();}
async function adjustQty(id,delta){
  const item=S.items.find(i=>i.id===id); if(!item) return;
  const newQty=Math.max(0,(item.qty||0)+delta);
  const el=document.getElementById('dqty-'+id); if(el) el.textContent=newQty;
  showToast(delta>0?'+1 unidad':'-1 unidad');
  if(S.fbReady){
    const db=getDB();
    await db.collection(COLLECTIONS.INVENTARIO).doc(id).update({qty:newQty,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),updatedBy:S.user?.email||'unknown'});
    await db.collection(COLLECTIONS.MOVIMIENTOS).add({productId:id,productName:item.name,type:delta>0?'ENTRADA':'SALIDA',qty:1,responsible:S.user?.name||'Usuario',reason:'Ajuste rápido',date:firebase.firestore.FieldValue.serverTimestamp(),createdBy:S.user?.email||'unknown'});
  } else { item.qty=newQty; saveLocal(); }
}
async function deleteItem(id){
  if(!confirm('¿Eliminar este producto?')) return;
  if(S.fbReady) await getDB().collection(COLLECTIONS.INVENTARIO).doc(id).delete();
  else { S.items=S.items.filter(i=>i.id!==id); saveLocal(); }
  closeDetailSheet(); showToast('Producto eliminado');
}

// ── ADD/EDIT MODAL ──────────────────────────────────────────────
function openAddModal(){
  S.editingId=null; document.getElementById('modal-title').textContent='Agregar producto';
  ['f-barcode','f-sku','f-name','f-qty','f-min','f-price','f-loc','f-supplier'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  document.getElementById('f-cat').value='Ropa de Cama'; document.getElementById('f-unit').value='Piezas'; document.getElementById('edit-id').value='';
  document.getElementById('add-modal-overlay').classList.remove('hidden');
  setTimeout(()=>document.getElementById('f-name').focus(),200);
}
function openEditModal(id){
  const item=S.items.find(i=>i.id===id); if(!item) return; S.editingId=id;
  document.getElementById('modal-title').textContent='Editar producto'; document.getElementById('edit-id').value=id;
  document.getElementById('f-barcode').value=item.barcode||''; document.getElementById('f-sku').value=item.sku||''; document.getElementById('f-name').value=item.name||'';
  document.getElementById('f-cat').value=item.cat||'Ropa de Cama'; document.getElementById('f-unit').value=item.unit||'Piezas';
  document.getElementById('f-qty').value=item.qty||0; document.getElementById('f-min').value=item.minQty||10; document.getElementById('f-price').value=item.price||''; document.getElementById('f-loc').value=item.loc||''; document.getElementById('f-supplier').value=item.supplier||'';
  document.getElementById('add-modal-overlay').classList.remove('hidden'); closeDetailSheet();
}
function closeAddModal(){document.getElementById('add-modal-overlay').classList.add('hidden');}
async function saveItem(){
  const name=document.getElementById('f-name').value.trim(); if(!name){showToast('Ingresa el nombre');return;}
  const editId=document.getElementById('edit-id').value;
  const data={barcode:document.getElementById('f-barcode').value.trim()||'BC'+Date.now(),sku:document.getElementById('f-sku').value.trim()||'SKU-'+Date.now(),name,cat:document.getElementById('f-cat').value,unit:document.getElementById('f-unit').value,qty:parseInt(document.getElementById('f-qty').value)||0,minQty:parseInt(document.getElementById('f-min').value)||10,price:parseFloat(document.getElementById('f-price').value)||0,loc:document.getElementById('f-loc').value.trim()||'Sin ubicación',supplier:document.getElementById('f-supplier').value.trim()||'',updatedAt:S.fbReady?firebase.firestore.FieldValue.serverTimestamp():new Date().toISOString(),updatedBy:S.user?.email||'unknown'};
  if(S.fbReady){
    const db=getDB();
    if(editId) await db.collection(COLLECTIONS.INVENTARIO).doc(editId).update(data);
    else { data.createdAt=firebase.firestore.FieldValue.serverTimestamp(); data.createdBy=S.user?.email||'unknown'; await db.collection(COLLECTIONS.INVENTARIO).add(data); }
  } else {
    if(editId){const idx=S.items.findIndex(i=>i.id===editId);if(idx>=0)S.items[idx]={...S.items[idx],...data};}
    else{data.id='itm'+Date.now();S.items.unshift(data);}
    saveLocal(); renderInventory();
  }
  closeAddModal(); showToast(editId?'✅ Actualizado en Firebase':'✅ Guardado en Firebase');
}

// ── SCANNER ─────────────────────────────────────────────────────
let _scanActive=false;
async function startScanner(){
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}}});
    document.getElementById('scanner-video').srcObject=stream; _scanActive=true;
    document.getElementById('scanner-start-btn').classList.add('hidden');
    document.getElementById('scanner-stop-btn').classList.remove('hidden');
    if(window.ZXing){
      const hints=new Map();
      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS,[ZXing.BarcodeFormat.EAN_13,ZXing.BarcodeFormat.EAN_8,ZXing.BarcodeFormat.CODE_128,ZXing.BarcodeFormat.CODE_39,ZXing.BarcodeFormat.UPC_A,ZXing.BarcodeFormat.UPC_E,ZXing.BarcodeFormat.QR_CODE]);
      hints.set(ZXing.DecodeHintType.TRY_HARDER,true);
      S.codeReader=new ZXing.BrowserMultiFormatReader(hints);
      S.codeReader.decodeFromVideoDevice(null,'scanner-video',result=>{if(result)handleScannedCode(result.getText());});
    }
  }catch(err){showToast(err.name==='NotAllowedError'?'Permite acceso a la cámara en Ajustes del iPhone':'Error al abrir cámara');}
}
function stopScanner(){
  if(S.codeReader){try{S.codeReader.reset();}catch(e){}S.codeReader=null;}
  const v=document.getElementById('scanner-video');
  if(v?.srcObject){v.srcObject.getTracks().forEach(t=>t.stop());v.srcObject=null;}
  _scanActive=false;
  const s=document.getElementById('scanner-start-btn'),e=document.getElementById('scanner-stop-btn');
  if(s)s.classList.remove('hidden'); if(e)e.classList.add('hidden');
}
function handleScannedCode(code){
  if(!_scanActive)return; stopScanner();
  if('vibrate' in navigator) navigator.vibrate([80,40,80]);
  document.getElementById('manual-code').value=code; searchByCode(code);
}
function searchByCode(code){
  const q=(code||document.getElementById('manual-code').value).trim(); if(!q){showToast('Ingresa un código');return;}
  const item=S.items.find(i=>i.barcode===q||i.sku===q||(i.sku||'').toLowerCase()===q.toLowerCase());
  const panel=document.getElementById('scan-result-panel');
  if(item){
    const s=getStatus(item); const emoji=CAT_EMOJI[item.cat]||'📦';
    panel.innerHTML=`<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><span style="font-size:28px">${emoji}</span><div><div style="font-size:14px;font-weight:700">${item.name}</div><div style="font-size:12px;color:var(--text-secondary)">${item.sku}</div></div><span class="badge ${s.cls}" style="margin-left:auto">${s.label}</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px"><div style="background:var(--surface2);border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--blue)">${item.qty||0}</div><div style="font-size:11px;color:var(--text-muted)">${item.unit}</div></div><div style="background:var(--surface2);border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--green)">$${Number(item.price||0).toFixed(2)}</div><div style="font-size:11px;color:var(--text-muted)">Precio unit.</div></div></div><div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">📍 ${item.loc}</div><button class="btn-primary" style="width:100%" onclick="navigate('inventory');setTimeout(()=>openDetail('${item.id}'),200)">Ver detalle completo</button>`;
    addRecentScan({code:q,name:item.name,found:true});
  } else {
    panel.innerHTML=`<div style="text-align:center;padding:10px"><div style="font-size:30px;margin-bottom:8px">🔍</div><div style="font-size:14px;font-weight:600;margin-bottom:4px">No encontrado en Firebase</div><div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px;font-family:monospace">${q}</div><button class="btn-primary" style="width:100%" onclick="openAddModalWithCode('${q}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Agregar a Firebase</button></div>`;
    addRecentScan({code:q,name:'No encontrado',found:false});
  }
  panel.classList.remove('hidden');
}
function openAddModalWithCode(code){navigate('inventory');setTimeout(()=>{openAddModal();document.getElementById('f-barcode').value=code;},200);}
function addRecentScan(scan){
  scan.time=new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
  S.recentScans=[scan,...S.recentScans.filter(s=>s.code!==scan.code)].slice(0,8);
  localStorage.setItem('sp_recent_scans',JSON.stringify(S.recentScans)); renderRecentScans();
}
function renderRecentScans(){
  const el=document.getElementById('recent-scans-list'); if(!el) return;
  const saved=localStorage.getItem('sp_recent_scans'); if(saved) S.recentScans=JSON.parse(saved);
  if(!S.recentScans.length){el.innerHTML='<div style="font-size:13px;color:var(--text-muted);text-align:center;padding:12px">Sin escaneos recientes</div>';return;}
  el.innerHTML=S.recentScans.map(s=>`<div class="scan-recent-chip" onclick="document.getElementById('manual-code').value='${s.code}';searchByCode('${s.code}')"><span class="scan-recent-icon">${s.found?'✅':'❓'}</span><div class="scan-recent-text">${s.name}<br><span style="font-size:11px;color:var(--text-muted);font-family:monospace">${s.code}</span></div><span class="scan-recent-time">${s.time}</span></div>`).join('');
}

// ── MOVEMENTS ───────────────────────────────────────────────────
function openMovementModal(){
  const sel=document.getElementById('mov-product'); sel.innerHTML=S.items.map(i=>`<option value="${i.id}">${i.name}</option>`).join('');
  ['mov-qty','mov-reason'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  const r=document.getElementById('mov-responsible'); if(r) r.value=S.user?.name||'';
  document.getElementById('mov-type').value='ENTRADA';
  document.querySelectorAll('.type-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector('.type-btn[data-type="ENTRADA"]').classList.add('active');
  document.getElementById('movement-modal-overlay').classList.remove('hidden');
}
function closeMovementModal(){document.getElementById('movement-modal-overlay').classList.add('hidden');}
function selectMovType(btn,type){document.getElementById('mov-type').value=type;document.querySelectorAll('.type-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}
async function saveMovement(){
  const productId=document.getElementById('mov-product').value;
  const type=document.getElementById('mov-type').value;
  const qty=parseInt(document.getElementById('mov-qty').value);
  const responsible=document.getElementById('mov-responsible').value.trim()||S.user?.name||'Usuario';
  const reason=document.getElementById('mov-reason').value.trim();
  if(!qty||qty<=0){showToast('Ingresa una cantidad válida');return;}
  const item=S.items.find(i=>i.id===productId); if(!item) return;
  let newQty=item.qty||0;
  if(type==='ENTRADA') newQty+=qty;
  else if(type==='SALIDA') newQty=Math.max(0,newQty-qty);
  else if(type==='AJUSTE') newQty=qty;
  if(S.fbReady){
    const db=getDB(); const batch=db.batch();
    batch.update(db.collection(COLLECTIONS.INVENTARIO).doc(productId),{qty:newQty,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),updatedBy:S.user?.email||'unknown'});
    batch.set(db.collection(COLLECTIONS.MOVIMIENTOS).doc(),{productId,productName:item.name,type,qty,newQty,responsible,reason,date:firebase.firestore.FieldValue.serverTimestamp(),createdBy:S.user?.email||'unknown'});
    await batch.commit();
  } else { item.qty=newQty; S.movements.unshift({id:'mov'+Date.now(),productId,productName:item.name,type,qty,responsible,reason,date:new Date().toISOString()}); saveLocal(); renderInventory(); renderMovements(); }
  closeMovementModal(); showToast(`✅ ${type} · ${qty} ${item.unit} — ${item.name}`);
}
function renderMovements(){
  const el=document.getElementById('movements-list'); if(!el) return;
  if(!S.movements.length){el.innerHTML=`<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg><p>Sin movimientos</p><small>Registra entradas y salidas del almacén</small></div>`;return;}
  el.innerHTML=S.movements.map(m=>{
    const dv=m.date?.toDate?m.date.toDate():new Date(m.date||Date.now());
    const ds=dv.toLocaleDateString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    const ic=m.type==='ENTRADA'?'mov-in':m.type==='SALIDA'?'mov-out':'mov-adj';
    const bc=m.type==='ENTRADA'?'badge-entrada':m.type==='SALIDA'?'badge-salida':'badge-ajuste';
    const sign=m.type==='ENTRADA'?'+':m.type==='SALIDA'?'-':'~';
    const color=m.type==='ENTRADA'?'var(--green)':m.type==='SALIDA'?'var(--red)':'var(--blue)';
    return `<div class="movement-card"><div class="mov-indicator ${ic}"></div><div class="mov-body"><div class="mov-name">${m.productName}</div><div class="mov-meta">${ds} · ${m.responsible||'—'}</div>${m.reason?`<div class="mov-meta">${m.reason}</div>`:''}<span class="badge ${bc}" style="margin-top:4px">${m.type}</span></div><div class="mov-right"><div class="mov-qty" style="color:${color}">${sign}${m.qty}</div></div></div>`;
  }).join('');
}

// ── REPORTS ─────────────────────────────────────────────────────
function renderReports(){
  const el=document.getElementById('reports-container'); if(!el) return;
  const tv=S.items.reduce((s,i)=>s+(i.qty||0)*(i.price||0),0);
  const low=S.items.filter(i=>(i.qty||0)>0&&(i.qty||0)<(i.minQty||10));
  const out=S.items.filter(i=>!i.qty||i.qty===0);
  const cats={}; S.items.forEach(i=>{cats[i.cat]=(cats[i.cat]||0)+(i.qty||0);});
  const catE=Object.entries(cats).sort((a,b)=>b[1]-a[1]); const maxC=catE[0]?catE[0][1]:1;
  el.innerHTML=`
    <div class="report-stats">
      <div class="report-stat"><div class="val blue">${S.items.length}</div><div class="lbl">Productos</div></div>
      <div class="report-stat"><div class="val green">$${tv.toFixed(0)}</div><div class="lbl">Valor total</div></div>
      <div class="report-stat"><div class="val amber">${low.length}</div><div class="lbl">Stock bajo</div></div>
      <div class="report-stat"><div class="val red">${out.length}</div><div class="lbl">Sin stock</div></div>
    </div>
    <div class="report-card"><h3>Stock por categoría</h3>${catE.map(([cat,qty],i)=>`<div class="bar-row"><div class="bar-lbl">${cat}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.round(qty/maxC*100)}%;background:${BAR_COLORS[i%BAR_COLORS.length]}"></div></div><div class="bar-val">${qty}</div></div>`).join('')}</div>
    ${out.length?`<div class="report-card"><h3>⛔ Sin stock (${out.length})</h3>${out.map(i=>`<div class="alert-card danger"><div class="alert-card-icon">${CAT_EMOJI[i.cat]||'📦'}</div><div class="alert-card-body"><div class="alert-card-name">${i.name}</div><div class="alert-card-meta">${i.loc} · Reordenar: ${i.minQty||10} ${i.unit}</div></div></div>`).join('')}</div>`:''}
    ${low.length?`<div class="report-card"><h3>⚠️ Stock bajo (${low.length})</h3>${low.map(i=>`<div class="alert-card"><div class="alert-card-icon">${CAT_EMOJI[i.cat]||'📦'}</div><div class="alert-card-body"><div class="alert-card-name">${i.name}</div><div class="alert-card-meta">${i.qty||0} / ${i.minQty||10} ${i.unit} mínimos</div></div></div>`).join('')}</div>`:''}
    <div class="report-card"><h3>🏆 Top 5 valor en stock</h3>${[...S.items].sort((a,b)=>(b.qty||0)*(b.price||0)-(a.qty||0)*(a.price||0)).slice(0,5).map(i=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><span style="font-size:20px">${CAT_EMOJI[i.cat]||'📦'}</span><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i.name}</div><div style="font-size:11px;color:var(--text-muted)">${i.qty||0} ${i.unit}</div></div><div style="font-size:14px;font-weight:700;color:var(--blue)">$${((i.qty||0)*(i.price||0)).toFixed(2)}</div></div>`).join('')}</div>`;
}

// ── TEAM ─────────────────────────────────────────────────────────
function renderTeam(){
  const el=document.getElementById('team-container'); if(!el) return;
  const users=S.onlineUsers;
  el.innerHTML=`<div style="padding:16px"><h2 class="section-title">Usuarios en línea ahora</h2>${!users.length?'<div class="empty-state"><p>Solo tú estás conectado</p></div>':users.map(u=>`<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);margin-bottom:8px"><div style="width:40px;height:40px;border-radius:50%;background:var(--blue-pale);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:var(--blue)">${(u.name||u.email||'U')[0].toUpperCase()}</div><div style="flex:1"><div style="font-size:14px;font-weight:600">${u.name||u.email}</div><div style="font-size:12px;color:var(--text-secondary)">${u.email}</div></div><span class="sync-dot online" style="width:10px;height:10px;flex-shrink:0"></span></div>`).join('')}<div style="margin-top:16px;padding:12px;background:var(--surface);border-radius:var(--radius);border:1px solid var(--border)"><div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">🔥 Firebase Project</div><div style="font-size:13px;color:var(--text-secondary)">hk-pro-housekeeping · us-east1</div><div style="font-size:13px;color:var(--text-secondary);margin-top:4px">Colección inventario: ${COLLECTIONS.INVENTARIO}</div><div style="font-size:13px;color:var(--text-secondary);margin-top:4px">Colección movimientos: ${COLLECTIONS.MOVIMIENTOS}</div></div></div>`;
}
function updateOnlineBadge(){
  if(S.onlineUsers.length>1){const b=document.querySelector('.nav-btn[data-page="team"]');if(b&&!b.querySelector('.online-badge')){const d=document.createElement('span');d.className='online-badge';d.style.cssText='position:absolute;top:4px;right:12px;width:8px;height:8px;border-radius:50%;background:var(--green);border:2px solid var(--surface)';b.style.position='relative';b.appendChild(d);}}
}

// ── EXPORT ───────────────────────────────────────────────────────
function exportCSV(){
  const headers=['ID','Código','SKU','Nombre','Categoría','Cantidad','Unidad','Ubicación','Precio','Valor Total','Stock Min','Proveedor','Estado'];
  const rows=S.items.map(i=>{const s=i.qty===0?'Sin stock':(i.qty||0)<(i.minQty||10)?'Stock bajo':'OK';return [i.id,i.barcode,i.sku,`"${i.name}"`,i.cat,i.qty||0,i.unit,i.loc,Number(i.price||0).toFixed(2),((i.qty||0)*(i.price||0)).toFixed(2),i.minQty||10,i.supplier||'',s];});
  const csv=[headers.join(','),...rows.map(r=>r.join(','))].join('\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`StockPro_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  showToast('CSV exportado');
}
function exportJSON(){
  const data={exportedAt:new Date().toISOString(),project:'hk-pro-housekeeping',hotel:'Hotel Arbellas',exportedBy:S.user?.email,totalItems:S.items.length,totalValue:S.items.reduce((s,i)=>s+(i.qty||0)*(i.price||0),0).toFixed(2),items:S.items};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`StockPro_Firebase_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  showToast('JSON exportado');
}
function printInventory(){window.print();}
function updateFBStats(){
  const el=document.getElementById('fb-stats'); if(!el) return;
  el.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"><div style="text-align:center;padding:10px;background:var(--surface2);border-radius:8px"><div style="font-size:20px;font-weight:700;color:var(--blue)">${S.items.length}</div><div style="font-size:11px;color:var(--text-muted)">Productos</div></div><div style="text-align:center;padding:10px;background:var(--surface2);border-radius:8px"><div style="font-size:20px;font-weight:700;color:var(--green)">${S.movements.length}</div><div style="font-size:11px;color:var(--text-muted)">Movimientos</div></div><div style="text-align:center;padding:10px;background:var(--surface2);border-radius:8px"><div style="font-size:20px;font-weight:700;color:var(--yellow)">${S.onlineUsers.length}</div><div style="font-size:11px;color:var(--text-muted)">En línea</div></div><div style="text-align:center;padding:10px;background:var(--surface2);border-radius:8px"><div style="font-size:20px;font-weight:700;color:var(--navy)">🔥</div><div style="font-size:11px;color:var(--text-muted)">us-east1</div></div></div>`;
  const pid=document.getElementById('fb-projectid'); if(pid&&!pid.value) pid.value='hk-pro-housekeeping';
  const ad=document.getElementById('fb-authdomain'); if(ad&&!ad.value) ad.value='hk-pro-housekeeping.firebaseapp.com';
  const bk=document.getElementById('fb-bucket'); if(bk&&!bk.value) bk.value='hk-pro-housekeeping.appspot.com';
}
async function reconnectFirebase(){
  const config={apiKey:document.getElementById('fb-apikey').value.trim(),authDomain:document.getElementById('fb-authdomain').value.trim(),projectId:document.getElementById('fb-projectid').value.trim(),storageBucket:document.getElementById('fb-bucket').value.trim(),messagingSenderId:document.getElementById('fb-senderid').value.trim(),appId:document.getElementById('fb-appid').value.trim()};
  if(!config.apiKey||!config.projectId){showToast('Completa API Key y Project ID');return;}
  localStorage.setItem('sp_fb_config',JSON.stringify(config));
  detachListeners(); const result=initFirebase(config);
  if(result.ok){S.fbReady=true;showToast('🔥 Firebase reconectado');attachListeners();}
  else showToast('Error: '+result.error);
}

// ── SEARCH ───────────────────────────────────────────────────────
function openSearch(){document.getElementById('search-overlay').classList.remove('hidden');setTimeout(()=>document.getElementById('global-search').focus(),100);}
function closeSearch(){document.getElementById('search-overlay').classList.add('hidden');document.getElementById('global-search').value='';document.getElementById('search-results').innerHTML='';}
function globalSearch(q){
  const el=document.getElementById('search-results'); if(!el) return;
  if(!q.trim()){el.innerHTML='';return;}
  const l=q.toLowerCase(); const results=S.items.filter(i=>i.name.toLowerCase().includes(l)||i.barcode.includes(l)||(i.sku||'').toLowerCase().includes(l)||(i.cat||'').toLowerCase().includes(l)||(i.loc||'').toLowerCase().includes(l));
  if(!results.length){el.innerHTML=`<div class="empty-state" style="padding:32px"><p>Sin resultados</p></div>`;return;}
  el.innerHTML=results.map(item=>{const s=getStatus(item);return `<div class="item-card" onclick="closeSearch();openDetail('${item.id}')"><div class="item-emoji">${CAT_EMOJI[item.cat]||'📦'}</div><div class="item-body"><div class="item-name">${item.name}</div><div class="item-sub">${item.sku} · ${item.loc}</div><span class="badge ${s.cls}">${s.label}</span></div><div class="item-right"><div class="item-qty">${item.qty||0}</div><div class="item-unit">${item.unit}</div></div></div>`;}).join('');
}

// ── TOAST ────────────────────────────────────────────────────────
let _tt;
function showToast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(_tt);_tt=setTimeout(()=>el.classList.remove('show'),2600);}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSearch();closeAddModal();closeMovementModal();closeDetailSheet();}});
