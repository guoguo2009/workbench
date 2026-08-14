// ===== 蓝莓工作站 app.js =====
const STORE = 'wb_data_v1';
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const today = () => new Date().toISOString().slice(0,10);
const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } };
const save = (d) => localStorage.setItem(STORE, JSON.stringify(d));

// ---- 路由 ----
function go(id) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $('#' + id).classList.add('active');
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.go === id));
  $('#app').scrollTop = 0;
  window.scrollTo(0,0);
  if (id === 'page-home') renderHome();
  if (id === 'page-ai') renderAI();
  if (id === 'page-chinese') renderChinese();
  if (id === 'page-work') renderWork();
  if (id === 'page-exercise') renderExercise();
  if (id === 'page-diet') renderDiet();
  if (id === 'page-sleep') renderSleep();
}
$$('[data-go]').forEach(el => el.addEventListener('click', () => go(el.dataset.go)));

// ---- 首页（分组） ----
const GROUPS = [
  { name:'孩子学习', items:[
    { id:'page-english', ico:'📘', title:'英语平台', sub:'听说读写', color:'var(--green)', key:'en' },
    { id:'page-chinese', ico:'📗', title:'语文', sub:'字词默写', color:'var(--blue)', key:'cn' },
    { id:'page-math',    ico:'🔢', title:'数学', sub:'口算练习', color:'var(--amber)', key:'math' },
  ]},
  { name:'创作 & 工作', items:[
    { id:'page-ai',   ico:'🤖', title:'AI 创作', sub:'每日精选', color:'var(--berry-light)', key:'ai' },
    { id:'page-work', ico:'🗂️', title:'工作', sub:'待办清单', color:'var(--blush)', key:'wk' },
  ]},
  { name:'健康生活', items:[
    { id:'page-exercise', ico:'🏃', title:'运动', sub:'今日记录', color:'var(--teal)', key:'ex' },
    { id:'page-diet',     ico:'🍱', title:'饮食', sub:'今日记录', color:'var(--coral)', key:'diet' },
    { id:'page-sleep',    ico:'😴', title:'睡眠', sub:'昨晚记录', color:'var(--indigo)', key:'sl' },
  ]},
];
function renderHome() {
  const d = load();
  const wrap = $('#zoneGrid'); wrap.innerHTML = '';
  GROUPS.forEach(g => {
    const head = document.createElement('div');
    head.className = 'zone-head'; head.textContent = g.name;
    wrap.appendChild(head);
    const grid = document.createElement('div');
    grid.className = 'zone-grid';
    g.items.forEach(z => {
      let sub = z.sub;
      if (z.key === 'ex')   sub = (d.exercise||[]).filter(r=>r.date===today()).reduce((s,r)=>s+(+r.min||0),0) ? `今天 ${(d.exercise||[]).filter(r=>r.date===today()).reduce((s,r)=>s+(+r.min||0),0)} 分钟` : '今天还没记录';
      if (z.key === 'diet') sub = (d.diet||[]).filter(r=>r.date===today()).length ? `今天 ${(d.diet||[]).filter(r=>r.date===today()).length} 餐` : '今天还没记录';
      if (z.key === 'sl')   { const last=(d.sleep||[])[0]; sub = last ? `昨晚 ${last.hours} 小时` : '昨晚未记录'; }
      const el = document.createElement('div');
      el.className = 'zone-card'; el.dataset.go = z.id;
      el.innerHTML = `<div class="zc-bar" style="background:${z.color}"></div><div class="zc-ico">${z.ico}</div><div class="zc-title">${z.title}</div><div class="zc-sub">${sub}</div>`;
      el.addEventListener('click', () => go(z.id));
      grid.appendChild(el);
    });
    wrap.appendChild(grid);
  });
  const now = new Date();
  const wd = ['周日','周一','周二','周三','周四','周五','周六'][now.getDay()];
  $('#heroDate').textContent = `${now.getMonth()+1} 月 ${now.getDate()} 日 · ${wd}`;
  const h = now.getHours();
  $('#heroHello').textContent = (h<11?'早上好':h<14?'中午好':h<18?'下午好':'晚上好') + '，蓝莓';
}

// ---- AI 创作 ----
async function renderAI() {
  const list = $('#aiList'); list.innerHTML = '<p class="hint">加载中…</p>';
  let items = [];
  try {
    const r = await fetch('ai-daily/manifest.json?cb=' + Date.now());
    items = await r.json();
  } catch { items = []; }
  if (!items.length) { list.innerHTML = '<p class="hint">暂无可读日报。</p>'; return; }
  list.innerHTML = '';
  items.forEach(it => {
    const el = document.createElement('div');
    el.className = 'module-card';
    el.innerHTML = `<span class="mc-ico">✨</span><div><div class="mc-title">${it.title}</div><div class="mc-sub">${it.date}</div></div><span class="mc-arrow">›</span>`;
    el.addEventListener('click', () => showAIViewer(it.file, it.title));
    list.appendChild(el);
  });
}
function showAIViewer(file, title) {
  let v = $('#page-aiview');
  if (!v) {
    v = document.createElement('section'); v.className='page'; v.id='page-aiview';
    v.innerHTML = `<div class="topbar"><button class="back" id="aiBack">‹</button><span>${title}</span></div><iframe class="embed" id="aiFrame"></iframe>`;
    $('#app').insertBefore(v, $('#installBar'));
    $('#aiBack').addEventListener('click', () => go('page-ai'));
  }
  $('#aiFrame').src = file;
  $('#page-aiview .topbar span').textContent = title;
  go('page-aiview');
}

// ---- 工作 待办 ----
function renderWork() {
  const d = load(); d.work = d.work || []; save(d);
  const list = $('#wkList'); list.innerHTML = '';
  d.work.forEach((t, i) => {
    const el = document.createElement('div'); el.className = 'rec' + (t.done ? ' rec-done' : '');
    el.innerHTML = `<div><div class="rec-main">${t.done ? '✓ ' : ''}${t.text}</div><div class="rec-sub">${t.date || ''}</div></div><button class="rec-del">删除</button>`;
    el.querySelector('.rec-main').addEventListener('click', () => { t.done = !t.done; save(d); renderWork(); });
    el.querySelector('.rec-del').addEventListener('click', () => { d.work.splice(i,1); save(d); renderWork(); });
    list.appendChild(el);
  });
  if (!d.work.length) list.innerHTML = '<p class="hint">还没有待办，添加一件今天想完成的事。</p>';
}
$('#wkAdd').addEventListener('click', () => {
  const v = $('#wkTask').value.trim(); if (!v) return;
  const d = load(); d.work = d.work || [];
  d.work.unshift({ text:v, date:today(), done:false });
  save(d); $('#wkTask').value = ''; renderWork();
});

// ---- 语文 字词本 ----
function renderChinese() {
  const d = load(); d.cn = d.cn || []; save(d);
  const list = $('#cnList'); list.innerHTML = '';
  d.cn.forEach((w, i) => {
    const el = document.createElement('div'); el.className='rec';
    el.innerHTML = `<div><div class="rec-main">${w.word} <span class="rec-sub">${w.py||''}</span></div><div class="rec-sub">${w.mean||''}</div></div><button class="rec-del">删除</button>`;
    el.querySelector('.rec-del').addEventListener('click', () => { d.cn.splice(i,1); save(d); renderChinese(); });
    list.appendChild(el);
  });
  if (!d.cn.length) list.innerHTML = '<p class="hint">还没有字词，添加几个试试。</p>';
}
$('#cnAdd').addEventListener('click', () => {
  const word = $('#cnWord').value.trim(); if (!word) return;
  const d = load(); d.cn = d.cn || [];
  d.cn.push({ word, py:$('#cnPy').value.trim(), mean:$('#cnMean').value.trim() });
  save(d); $('#cnWord').value=$('#cnPy').value=$('#cnMean').value=''; renderChinese();
});

// ---- 数学 口算 ----
let mathAns = 0, mathScore = 0, mathTotal = 0;
function newMath() {
  const a = Math.floor(Math.random()*20)+1, b = Math.floor(Math.random()*20)+1;
  const op = ['+','-','×'][Math.floor(Math.random()*3)];
  let q, ans;
  if (op==='+'){ q=`${a} + ${b}`; ans=a+b; }
  else if (op==='-'){ q=`${a+b} - ${b}`; ans=a; }
  else { q=`${a} × ${b}`; ans=a*b; }
  mathAns = ans;
  $('#quizBox').innerHTML = `<div class="q">${q} = ?</div><div class="qs">已做 ${mathTotal} 题 · 正确 ${mathScore}</div>`;
  $('#mathResult').textContent = '';
  $('#mathAns').value = '';
}
$('#mathCheck').addEventListener('click', () => {
  const v = $('#mathAns').value.trim();
  if (v==='') return;
  mathTotal++;
  if (+v === mathAns) mathScore++;
  $('#mathResult').textContent = (+v===mathAns) ? '✅ 答对了！' : `❌ 答案是 ${mathAns}`;
  $('#mathResult').style.color = (+v===mathAns) ? 'var(--teal)' : '#c0392b';
  newMath();
});
$('#mathNext').addEventListener('click', newMath);

// ---- 运动 ----
function renderExercise() {
  const d = load(); d.exercise = d.exercise || []; save(d);
  const list = $('#exList'); list.innerHTML='';
  const sum = d.exercise.filter(r=>r.date===today()).reduce((s,r)=>s+(+r.min||0),0);
  $('#exSummary').textContent = sum ? `今天 ${sum} 分钟` : '今天还没记录';
  [...d.exercise].reverse().slice(0,15).forEach((r,i) => {
    const el=document.createElement('div'); el.className='rec';
    el.innerHTML=`<div><div class="rec-main">${r.type} · ${r.min} 分钟</div><div class="rec-sub">${r.date}</div></div><button class="rec-del">删除</button>`;
    el.querySelector('.rec-del').addEventListener('click',()=>{ d.exercise.splice(d.exercise.length-1-i,1); save(d); renderExercise(); });
    list.appendChild(el);
  });
  if (!d.exercise.length) list.innerHTML='<p class="hint">记录一次运动吧。</p>';
}
$('#exAdd').addEventListener('click', () => {
  const min = $('#exMin').value.trim(); if (!min) return;
  const d=load(); d.exercise=d.exercise||[];
  d.exercise.push({ date:today(), type:$('#exType').value, min });
  save(d); $('#exMin').value=''; renderExercise();
});

// ---- 饮食 ----
function renderDiet() {
  const d=load(); d.diet=d.diet||[]; save(d);
  const list=$('#dietList'); list.innerHTML='';
  const n=d.diet.filter(r=>r.date===today()).length;
  $('#dietSummary').textContent = n ? `今天 ${n} 餐` : '今天还没记录';
  [...d.diet].reverse().slice(0,15).forEach((r,i)=>{
    const el=document.createElement('div'); el.className='rec';
    el.innerHTML=`<div><div class="rec-main">${r.meal} · ${r.food}</div><div class="rec-sub">${r.date}</div></div><button class="rec-del">删除</button>`;
    el.querySelector('.rec-del').addEventListener('click',()=>{ d.diet.splice(d.diet.length-1-i,1); save(d); renderDiet(); });
    list.appendChild(el);
  });
  if (!d.diet.length) list.innerHTML='<p class="hint">记录今天吃了什么。</p>';
}
$('#dietAdd').addEventListener('click', () => {
  const food=$('#dietFood').value.trim(); if(!food) return;
  const d=load(); d.diet=d.diet||[];
  d.diet.push({ date:today(), meal:$('#dietMeal').value, food });
  save(d); $('#dietFood').value=''; renderDiet();
});

// ---- 睡眠 ----
function hoursBetween(bed, wake) {
  const [bh,bm]=bed.split(':').map(Number), [wh,wm]=wake.split(':').map(Number);
  let mins=(wh*60+wm)-(bh*60+bm); if(mins<=0) mins+=1440;
  return (mins/60).toFixed(1);
}
function renderSleep() {
  const d=load(); d.sleep=d.sleep||[]; save(d);
  const list=$('#slList'); list.innerHTML='';
  const last=d.sleep[0];
  $('#sleepSummary').textContent = last ? `昨晚 ${last.hours} 小时` : '昨晚未记录';
  [...d.sleep].slice(0,15).forEach((r,i)=>{
    const el=document.createElement('div'); el.className='rec';
    el.innerHTML=`<div><div class="rec-main">${r.hours} 小时 · 质量 ${r.quality}/5</div><div class="rec-sub">${r.date}</div></div><button class="rec-del">删除</button>`;
    el.querySelector('.rec-del').addEventListener('click',()=>{ d.sleep.splice(i,1); save(d); renderSleep(); });
    list.appendChild(el);
  });
  if (!d.sleep.length) list.innerHTML='<p class="hint">记录昨晚的睡眠。</p>';
}
$('#slAdd').addEventListener('click', () => {
  const d=load(); d.sleep=d.sleep||[];
  const hrs=hoursBetween($('#slBed').value, $('#slWake').value);
  d.sleep.unshift({ date:today(), bed:$('#slBed').value, wake:$('#slWake').value, hours:hrs, quality:+$('#slQuality').value });
  save(d); renderSleep();
});

// ---- PWA ----
let defPrompt=null;
window.addEventListener('beforeinstallprompt', e=>{
  // 已安装(独立窗口)或用户曾关闭过 → 不再弹
  const installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (installed || localStorage.getItem('wb_install_dismissed') === '1') { e.preventDefault(); return; }
  e.preventDefault(); defPrompt=e; $('#installBar').hidden=false;
});
$('#installBtn').addEventListener('click', ()=>{ if(defPrompt){ defPrompt.prompt(); defPrompt.userChoice.then(()=>{ $('#installBar').hidden=true; }); } });
$('#installClose').addEventListener('click', ()=>{ $('#installBar').hidden=true; localStorage.setItem('wb_install_dismissed','1'); });
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').then(reg=>reg&&reg.update()).catch(()=>{});
    let rl=false;
    navigator.serviceWorker.addEventListener('controllerchange', ()=>{ if(rl) return; rl=true; location.reload(); });
  });
}

// init
newMath();
renderHome();
