const KEY = 'glassmark-v1';
const defaults = {
  theme: 'dusk', columns: 12, iconStyle: 'rounded',
  widgets: [
    { id: 'greeting', type: 'greeting', x: 1, y: 1, w: 12, h: 2 },
    { id: 'clock', type: 'clock', x: 1, y: 3, w: 3, h: 2 },
    { id: 'weather', type: 'weather', x: 4, y: 3, w: 3, h: 2 },
    { id: 'focus', type: 'focus', x: 7, y: 3, w: 3, h: 2 },
    { id: 'note', type: 'note', x: 10, y: 3, w: 3, h: 2 },
    { id: 'bookmarks', type: 'bookmarks', x: 1, y: 5, w: 12, h: 4 },
  ],
  groups: [
    { id: 'daily', name: 'Daily', items: [
      { name: 'Google', url: 'https://google.com', icon: 'G', color: '#4285f4' },
      { name: 'Notion', url: 'https://notion.so', icon: 'N', color: '#222222' },
      { name: 'YouTube', url: 'https://youtube.com', icon: '▶', color: '#ff0033' },
      { name: 'GitHub', url: 'https://github.com', icon: '⌘', color: '#171717' },
      { name: 'Gmail', url: 'https://mail.google.com', icon: 'M', color: '#e7493f' },
    ]},
    { id: 'inspiration', name: 'Inspiration', items: [
      { name: 'Are.na', url: 'https://are.na', icon: '✦', color: '#7959c5' },
      { name: 'Pinterest', url: 'https://pinterest.com', icon: 'P', color: '#d3212d' },
      { name: 'Behance', url: 'https://behance.net', icon: 'Bē', color: '#1769ff' },
    ]},
    { id: 'later', name: 'For later', items: [
      { name: 'Reddit', url: 'https://reddit.com', icon: '◉', color: '#ff4500' },
      { name: 'Medium', url: 'https://medium.com', icon: 'M', color: '#111111' },
      { name: 'Arc', url: 'https://arc.net', icon: '◌', color: '#7357ff' },
    ]},
  ],
  note: 'A little idea worth keeping…', focus: false, focusRemaining: 25 * 60,
};
let state = loadState();
let drag = null;
let timer;

function loadState() {
  try { return { ...structuredClone(defaults), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return structuredClone(defaults); }
}
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
const icons = { settings: '⚙', plus: '+', search: '⌕', drag: '⠿', sun: '☼' };
function widget(type) { return state.widgets.find(w => w.type === type); }
function htmlEscape(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function formatDate() { return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()); }
function render() {
  document.body.dataset.theme = state.theme;
  document.body.dataset.icon = state.iconStyle;
  document.body.style.setProperty('--custom-wallpaper', state.wallpaper ? `url("${state.wallpaper}")` : 'none');
  document.querySelector('#app').innerHTML = `
    <header class="topbar glass">
      <a class="brand" href="#" aria-label="Glassmark home"><span class="brand-mark">✳</span><span>glassmark</span></a>
      <div class="top-meta"><span>${formatDate().toUpperCase()}</span><span class="weather-mini">☀ &nbsp;18° <i>·</i> Bucharest</span></div>
      <div class="top-actions"><button class="icon-button" id="searchButton" title="Search">${icons.search}</button><button class="glass-button ${state.dragMode?'active':''}" id="dragToggle">${state.dragMode?'✓ Done':'⠿ Arrange'}</button><button class="glass-button" id="settingsButton">⚙ <span>Customize</span></button></div>
    </header>
    <main><section id="canvas" class="canvas ${state.dragMode?'is-editing':''}" style="--columns:${state.columns}">${state.widgets.map(renderWidget).join('')}</section></main>
    <footer class="footer">A calm little corner of the internet <span>·</span> ${state.groups.reduce((n,g)=>n+g.items.length,0)} bookmarks <span>·</span> Saved on this device</footer>
    <div id="modalRoot"></div>`;
  bind(); tick(); clearInterval(timer); timer = setInterval(tick, 1000);
}
function renderWidget(w) {
  let inner = '';
  if (w.type === 'greeting') inner = `<div class="greeting-copy"><div class="eyebrow">YOUR PERSONAL DASHBOARD</div><h1>A little space for everything<span>.</span></h1><p>Your favorite corners of the internet, all in one place.</p></div><div class="search-box glass"><span>⌕</span><input id="searchInput" placeholder="Search bookmarks or the web…"/><kbd>⌘ K</kbd></div>`;
  if (w.type === 'clock') inner = `<div class="widget-heading">LOCAL TIME <span class="live-dot"></span></div><div class="clock-value" id="clockValue">--:--</div><div class="subtle">Bucharest, Romania</div>`;
  if (w.type === 'weather') inner = `<div class="widget-heading">WEATHER <span>↗</span></div><div class="weather-line"><span class="sun-icon">☀</span><strong>18°</strong></div><div class="subtle">Partly cloudy <span class="weather-range">H 21° &nbsp; L 12°</span></div>`;
  if (w.type === 'focus') inner = `<div class="widget-heading">FOCUS SESSION <span>◷</span></div><div class="focus-value">${state.focus?formatFocus(): 'Ready when you are'}</div><button class="text-action" id="focusButton">${state.focus?'Pause focus':'Start a focus session'} <span>→</span></button>`;
  if (w.type === 'note') inner = `<div class="widget-heading">QUICK NOTE <span>✎</span></div><textarea id="noteInput" placeholder="A little idea worth keeping…">${htmlEscape(state.note)}</textarea><div class="note-hint">Saved automatically</div>`;
  if (w.type === 'bookmarks') inner = `<div class="bookmark-head"><div><div class="eyebrow">YOUR COLLECTIONS</div><h2>Bookmarks</h2></div><div class="bookmark-actions"><select id="viewSelect" aria-label="Bookmark layout"><option value="grid">▦ Comfortable grid</option><option value="compact">☷ Compact list</option></select><button class="add-button" id="addBookmark">＋ <span>Add bookmark</span></button><button class="add-button" id="addGroup" title="Add collection">＋ <span>Collection</span></button></div></div><div class="group-grid">${state.groups.map(renderGroup).join('')}</div>`;
  return `<article class="widget widget-${w.type}" data-widget="${w.id}" style="--x:${w.x};--y:${w.y};--w:${w.w};--h:${w.h}">${state.dragMode?`<div class="edit-toolbar"><span class="move-grip" title="Drag to arrange">⠿ <small>Drag to move</small></span><span class="size-controls"><button data-size="w-" title="Narrower">−W</button><button data-size="w+" title="Wider">＋W</button><button data-size="h-" title="Shorter">−H</button><button data-size="h+" title="Taller">＋H</button></span>${w.type!=='greeting'&&w.type!=='bookmarks'?`<button class="remove-widget" title="Remove widget">×</button>`:''}</div>`:''}${inner}${state.dragMode?'<div class="resize-grip" title="Drag to resize">⤢</div>':''}</article>`;
}
function renderGroup(group) { return `<section class="bookmark-group"><div class="group-title"><h3>${htmlEscape(group.name)}</h3><span>${String(group.items.length).padStart(2,'0')}</span><button class="group-menu" data-group="${group.id}" aria-label="Collection options">···</button></div><div class="link-list">${group.items.map((item,idx)=>`<a class="bookmark-link" href="${htmlEscape(item.url)}" target="_blank" rel="noopener"><span class="favicon" style="--brand:${htmlEscape(item.color||'#607d9b')}">${item.iconImage?`<img src="${htmlEscape(item.iconImage)}" alt=""/>`:htmlEscape(item.icon||item.name.slice(0,1))}</span><span class="bookmark-name">${htmlEscape(item.name)}</span><button class="item-more" data-item="${group.id}:${idx}" title="Edit bookmark" aria-label="Edit ${htmlEscape(item.name)}">···</button></a>`).join('')}<button class="add-link" data-add-to="${group.id}">＋ Add a site</button></div></section>`; }
function bind() {
  document.querySelector('#dragToggle').onclick = () => { state.dragMode = !state.dragMode; save(); render(); };
  document.querySelector('#settingsButton').onclick = settingsModal;
  document.querySelector('#searchButton').onclick = () => document.querySelector('#searchInput')?.focus();
  document.querySelector('#searchInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.value.trim()) window.open(`https://www.google.com/search?q=${encodeURIComponent(e.target.value.trim())}`,'_blank','noopener');});
  document.querySelector('#addBookmark')?.addEventListener('click',()=>bookmarkModal());
  document.querySelector('#addGroup')?.addEventListener('click',groupModal);
  document.querySelectorAll('[data-add-to]').forEach(b=>b.onclick=()=>bookmarkModal(b.dataset.addTo));
  document.querySelectorAll('.item-more').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();const [gid,idx]=b.dataset.item.split(':');bookmarkModal(gid,+idx);});
  document.querySelectorAll('.group-menu').forEach(b=>b.onclick=()=>groupMenu(b.dataset.group));
  document.querySelector('#focusButton')?.addEventListener('click',()=>{if(state.focus)state.focus=false;else{if(!state.focusRemaining||state.focusRemaining<=0)state.focusRemaining=25*60;state.focus=true;}save();render();});
  const note=document.querySelector('#noteInput'); if(note) note.oninput=()=>{state.note=note.value;save();};
  document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>resizeWidget(b.closest('.widget').dataset.widget,b.dataset.size));
  document.querySelectorAll('.remove-widget').forEach(b=>b.onclick=()=>{state.widgets=state.widgets.filter(w=>w.id!==b.closest('.widget').dataset.widget);save();render();});
  document.querySelectorAll('.widget').forEach(el=>el.addEventListener('pointerdown',e=>{
    if(e.target.closest('.resize-grip')) return;
    if(e.target.closest('button,input,textarea,select,a')) return;
    startMove(e);
  }));
  document.querySelectorAll('.resize-grip').forEach(g=>g.addEventListener('pointerdown',startResize));
  document.querySelector('#viewSelect')?.addEventListener('change',e=>{document.querySelector('.widget-bookmarks').dataset.view=e.target.value;state.view=e.target.value;save();});
  if(state.view) {const el=document.querySelector('.widget-bookmarks'); if(el){el.dataset.view=state.view;document.querySelector('#viewSelect').value=state.view;}}
}
function gridMetrics(canvas) {
  const style=getComputedStyle(canvas), tracks=style.gridTemplateColumns.trim().split(/\s+/).map(parseFloat);
  const gap=parseFloat(style.columnGap)||0, rowGap=parseFloat(style.rowGap)||0;
  return {columns:tracks.length||state.columns,columnStep:(tracks[0]||100)+gap,rowStep:(parseFloat(style.gridAutoRows)||134)+rowGap};
}
function resizeWidget(id,dir) {
  const w=state.widgets.find(x=>x.id===id), canvas=document.querySelector('#canvas');if(!w||!canvas)return;
  const {columns}=gridMetrics(canvas);
  if(dir==='w+')w.w=Math.min(columns,w.w+1);if(dir==='w-')w.w=Math.max(2,w.w-1);
  if(dir==='h+')w.h=Math.min(8,w.h+1);if(dir==='h-')w.h=Math.max(1,w.h-1);
  w.x=Math.min(w.x,columns-w.w+1);save();render();
}
function startTrackingDrag(kind,e,el,w) {
  const {columnStep,rowStep}=gridMetrics(document.querySelector('#canvas'));
  drag={kind,id:w.id,startX:e.clientX,startY:e.clientY,x:w.x,y:w.y,w:w.w,h:w.h,columnStep,rowStep,el};
  el.classList.add('dragging');
  window.addEventListener('pointermove',onDrag);
  window.addEventListener('pointerup',endDrag,{once:true});
  window.addEventListener('pointercancel',endDrag,{once:true});
}
function startMove(e) { if(e.button!==0||!state.dragMode)return;e.preventDefault();const el=e.currentTarget.closest('.widget'),w=state.widgets.find(x=>x.id===el.dataset.widget);if(!w)return;startTrackingDrag('move',e,el,w); }
function startResize(e) { e.preventDefault();e.stopPropagation();const el=e.currentTarget.closest('.widget'),w=state.widgets.find(x=>x.id===el.dataset.widget);if(!w)return;startTrackingDrag('resize',e,el,w); }
function onDrag(e) {
  if(!drag)return;const canvas=document.querySelector('#canvas'),w=state.widgets.find(x=>x.id===drag.id);if(!w)return;
  const {columns}=gridMetrics(canvas),dx=Math.round((e.clientX-drag.startX)/drag.columnStep),dy=Math.round((e.clientY-drag.startY)/drag.rowStep);
  if(drag.kind==='move'){w.x=Math.max(1,Math.min(columns-w.w+1,drag.x+dx));w.y=Math.max(1,drag.y+dy);}
  else{w.w=Math.max(2,Math.min(columns-drag.x+1,drag.w+dx));w.h=Math.max(1,Math.min(8,drag.h+dy));}
  applyLayout();
}
function applyLayout(){for(const w of state.widgets){const el=document.querySelector(`[data-widget="${w.id}"]`);if(el)el.style.cssText=`--x:${w.x};--y:${w.y};--w:${w.w};--h:${w.h}`;}}
function endDrag(){if(drag){drag.el.classList.remove('dragging');save();drag=null;}window.removeEventListener('pointermove',onDrag);window.removeEventListener('pointercancel',endDrag);}
function formatFocus(){const n=Math.max(0,state.focusRemaining??1500);return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
function tick(){const e=document.querySelector('#clockValue');if(e)e.textContent=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Bucharest'}).format(new Date());if(state.focus){state.focusRemaining=Math.max(0,(state.focusRemaining??1500)-1);if(state.focusRemaining===0)state.focus=false;const f=document.querySelector('.focus-value');if(f)f.textContent=state.focus?formatFocus():'Session complete';save();}}
function modal(title,body){const root=document.querySelector('#modalRoot');root.innerHTML=`<div class="modal-backdrop"><section class="modal glass"><div class="modal-head"><h2>${title}</h2><button class="close-modal">×</button></div>${body}</section></div>`;root.querySelector('.modal-backdrop').onclick=e=>{if(e.target===e.currentTarget)root.innerHTML='';};root.querySelector('.close-modal').onclick=()=>root.innerHTML='';return root.querySelector('.modal');}
function settingsModal(){const m=modal('Make it yours',`<label class="field-label">Wallpaper mood</label><div class="theme-options">${['dusk','ocean','meadow','midnight'].map(t=>`<button class="theme-swatch ${state.theme===t?'selected':''}" data-theme-choice="${t}"><i class="swatch-${t}"></i>${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}</div><label class="field-label">Or choose your own wallpaper</label><div class="wallpaper-upload"><label class="upload-button">＋ Upload an image<input id="wallpaperFile" type="file" accept="image/*" hidden/></label>${state.wallpaper?'<button id="clearWallpaper" class="subtle-button">Remove image</button>':''}</div><label class="field-label">Columns <span id="columnLabel">${state.columns}</span></label><input id="columnsRange" type="range" min="6" max="16" value="${state.columns}"/><label class="field-label">Bookmark icon shape</label><div class="segmented"><button data-icon-choice="rounded" class="${state.iconStyle==='rounded'?'selected':''}">Rounded</button><button data-icon-choice="circle" class="${state.iconStyle==='circle'?'selected':''}">Circle</button><button data-icon-choice="square" class="${state.iconStyle==='square'?'selected':''}">Square</button></div><label class="field-label">Add an inbuilt widget</label><div class="widget-picker">${[['clock','Clock'],['weather','Weather'],['focus','Focus timer'],['note','Quick note']].map(([id,n])=>`<button data-add-widget="${id}">＋ ${n}</button>`).join('')}</div><div class="modal-foot"><button class="subtle-button" id="resetLayout">Reset layout</button><button class="primary-button close-done">Done</button></div>`);
 m.querySelectorAll('[data-theme-choice]').forEach(b=>b.onclick=()=>{state.theme=b.dataset.themeChoice;save();document.body.dataset.theme=state.theme;m.querySelectorAll('[data-theme-choice]').forEach(x=>x.classList.toggle('selected',x===b));});
 m.querySelector('#wallpaperFile').onchange=e=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{state.wallpaper=reader.result;save();render();settingsModal();};reader.readAsDataURL(file);};
 m.querySelector('#clearWallpaper')?.addEventListener('click',()=>{state.wallpaper='';save();render();settingsModal();});
 m.querySelector('#columnsRange').oninput=e=>{state.columns=+e.target.value;m.querySelector('#columnLabel').textContent=state.columns;for(const w of state.widgets){w.w=Math.min(w.w,state.columns);w.x=Math.min(w.x,state.columns-w.w+1);}save();};m.querySelector('#columnsRange').onchange=()=>render();
 m.querySelectorAll('[data-icon-choice]').forEach(b=>b.onclick=()=>{state.iconStyle=b.dataset.iconChoice;save();document.body.dataset.icon=state.iconStyle;m.querySelectorAll('[data-icon-choice]').forEach(x=>x.classList.toggle('selected',x===b));});
 m.querySelectorAll('[data-add-widget]').forEach(b=>b.onclick=()=>{const type=b.dataset.addWidget;if(widget(type)){document.querySelector(`#modalRoot`).innerHTML='';return;}state.widgets.push({id:type+'-'+Date.now(),type,x:1,y:Math.max(...state.widgets.map(w=>w.y+w.h)),w:3,h:2});save();render();settingsModal();});
 m.querySelector('#resetLayout').onclick=()=>{const fresh=structuredClone(defaults);state.widgets=fresh.widgets;state.columns=12;save();render();settingsModal();};m.querySelector('.close-done').onclick=()=>m.querySelector('.close-modal').click();}
function bookmarkModal(groupId=state.groups[0]?.id,index=null){
  const existing=index!==null?state.groups.find(g=>g.id===groupId)?.items[index]:null;
  const g=state.groups.find(x=>x.id===groupId)||state.groups[0];
  const m=modal(existing?'Edit bookmark':'Add a bookmark',`<form id="bookmarkForm">
    <label class="field-label">Name</label><input name="name" required placeholder="e.g. Design inspiration" value="${htmlEscape(existing?.name||'')}"/>
    <label class="field-label">Website address</label><input name="url" type="url" required placeholder="https://example.com" value="${htmlEscape(existing?.url||'')}"/>
    <label class="field-label">Collection</label><select name="group">${state.groups.map(x=>`<option value="${x.id}" ${x.id===groupId?'selected':''}>${htmlEscape(x.name)}</option>`).join('')}</select>
    <label class="field-label">Custom symbol</label><input name="icon" maxlength="4" value="${htmlEscape(existing?.icon||'')}" placeholder="Try ★, ☕, or a letter"/>
    <label class="field-label">Symbol background color</label><input name="color" type="color" value="${htmlEscape(existing?.color||'#597fa2')}" class="color-input"/>
    <label class="field-label">Or upload an icon image</label><input name="iconImage" id="bookmarkIconFile" type="file" accept="image/*" class="file-input"/>
    ${existing?.iconImage?'<button type="button" class="subtle-button clear-bookmark-icon">Remove current image</button>':''}
    <div class="modal-foot">${existing?'<button type="button" class="subtle-button" id="deleteBookmark">Delete</button>':''}<button class="primary-button" type="submit">${existing?'Save changes':'Add bookmark'}</button></div>
  </form>`);
  let iconImage=existing?.iconImage||'';
  m.querySelector('.clear-bookmark-icon')?.addEventListener('click',()=>{iconImage='';m.querySelector('#bookmarkIconFile').value='';m.querySelector('.clear-bookmark-icon').remove();});
  m.querySelector('#bookmarkForm').onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget),file=m.querySelector('#bookmarkIconFile').files[0];
    if(file){if(file.size>1_500_000){alert('Please choose an image smaller than 1.5 MB.');return;}iconImage=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});}
    const gid=f.get('group'),to=state.groups.find(x=>x.id===gid),item={name:f.get('name').trim(),url:f.get('url').trim(),icon:f.get('icon').trim()||f.get('name').trim().slice(0,1).toUpperCase(),color:f.get('color'),iconImage};
    if(existing){g.items.splice(index,1);to.items.push(item);}else to.items.push(item);
    save();render();
  };
  m.querySelector('#deleteBookmark')?.addEventListener('click',()=>{g.items.splice(index,1);save();render();});
}
function groupModal(){const m=modal('New collection',`<form id="groupForm"><label class="field-label">Collection name</label><input name="name" required placeholder="e.g. Reading list"/><div class="modal-foot"><button class="primary-button">Create collection</button></div></form>`);m.querySelector('#groupForm').onsubmit=e=>{e.preventDefault();state.groups.push({id:'group-'+Date.now(),name:new FormData(e.currentTarget).get('name').trim(),items:[]});save();render();};}
function groupMenu(id){const g=state.groups.find(x=>x.id===id);const m=modal('Collection options',`<label class="field-label">Rename collection</label><input id="renameGroup" value="${htmlEscape(g.name)}"/><div class="modal-foot"><button class="subtle-button" id="removeGroup">Delete collection</button><button class="primary-button" id="saveGroup">Save name</button></div>`);m.querySelector('#saveGroup').onclick=()=>{g.name=m.querySelector('#renameGroup').value.trim()||g.name;save();render();};m.querySelector('#removeGroup').onclick=()=>{state.groups=state.groups.filter(x=>x.id!==id);save();render();};}
render();
