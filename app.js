'use strict';

const ROSTER = [
  { id: '01', name: '板垣 清' },
  { id: '02', name: '町元 俐香' },
  { id: '03', name: '道家 侑希' },
  { id: '04', name: '根本 果凜' },
  { id: '05', name: '早井 葉子' },
  { id: '06', name: '一瀬 翔大朗' },
  { id: '07', name: '服部 泰士' },
  { id: '08', name: '藤木 優弥' },
  { id: '09', name: '中野 暁裕' },
  { id: '10', name: '板垣 励' },
  { id: '11', name: '石井 瑛二' },
  { id: '12', name: '北野 瑶郁' },
  { id: '13', name: '引間 美和' },
  { id: '14', name: '吉永 瑛帆' },
  { id: '15', name: '髙橋 大志' },
  { id: '16', name: '古川 文泰' },
  { id: '17', name: '墨谷 杏奈' },
  { id: '18', name: '平岡 佳曉' },
  { id: '19', name: '辰井 琢真' },
  { id: '20', name: '浅野 凪' },
  { id: '21', name: '北庄 琴音' },
  { id: '22', name: '伊東 旺甫' },
  { id: '23', name: '朝倉 弥生' },
  { id: '24', name: '川﨑 清平' },
  { id: '25', name: '鈴木 桜乃' },
  { id: '26', name: '芳野 芽衣' },
  { id: '27', name: '鈴木 カンナ' }
];

const THEMES = [
  { ac: '#c90000', bg: '#e9e7e2' },
  { ac: '#e6a5bd', bg: '#24432d' },
  { ac: '#e72805', bg: '#e7dece' },
  { ac: '#d4ea06', bg: '#080a58' },
  { ac: '#1e1e22', bg: '#e9e7e2' },
  { ac: '#e92000', bg: '#a2cfc5' },
  { ac: '#f494c9', bg: '#5e0800' },
  { ac: '#1a0683', bg: '#eadcc6' },
  { ac: '#b3d47a', bg: '#361c00' },
  { ac: '#1a1c1c', bg: '#b5c8c6' },
  { ac: '#3537e4', bg: '#f5cd25' },
  { ac: '#e0b8c3', bg: '#1e1936' },
  { ac: '#247850', bg: '#93b0eb' },
  { ac: '#7b1e0f', bg: '#b5d7f3' },
  { ac: '#f4ffda', bg: '#f35a2f' },
  { ac: '#050205', bg: '#f4c4ad' },
  { ac: '#001c4e', bg: '#d48766' },
  { ac: '#161ba7', bg: '#c9c862' },
  { ac: '#2e0a14', bg: '#a0d0f0' },
];

const STORAGE_KEY = 'whosnext.appState.v1';
/** @typedef {'START'|'RESULT'} Screen */
/** @type {{schemaVersion:number, roster:{id:string,name:string}[], remainingIds:string[], pickedHistoryIds:string[], currentPickIds:string[], pickCount:number, themeIndex:number, screen:Screen, updatedAt:number}} */
let state;

const $ = (sel) => document.querySelector(sel);
const centerPanel = $('#centerPanel');
const historyEl = $('#history');
const pickInput = $('#pickInput');
const statusEl = $('#status');
const resetBtn = $('#resetBtn');
const toastEl = $('#toast');

const nameById = new Map(ROSTER.map(m => [m.id, m.name]));

function now(){ return Date.now(); }

function clampInt(v, min, max){
  if (!Number.isFinite(v)) return min;
  v = Math.floor(v);
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

function pad2(n){
  return String(n).padStart(2,'0');
}

function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => toastEl.classList.remove('show'), 1600);
}

function saveState(){
  state.updatedAt = now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.schemaVersion !== 1) return null;
    return s;
  }catch{
    return null;
  }
}

function freshState(){
  return {
    schemaVersion: 1,
    roster: ROSTER,
    remainingIds: ROSTER.map(m => m.id),
    pickedHistoryIds: [],
    currentPickIds: [],
    pickCount: 1,
    themeIndex: 0,
    screen: 'START',
    updatedAt: now(),
  };
}

function applyTheme(){
  const t = THEMES[state.themeIndex % THEMES.length];
  document.documentElement.style.setProperty('--bg', t.bg);
  document.documentElement.style.setProperty('--ac', t.ac);
  document.documentElement.style.setProperty('--text', t.ac);
}

function cycleTheme(){
  state.themeIndex = (state.themeIndex + 1) % THEMES.length;
  applyTheme();
  saveState();
}

function normalizePickCount(){
  const raw = pickInput.value;
  const n = Number(raw);
  const max = Math.max(1, state.remainingIds.length);
  const normalized = clampInt(n, 1, max);
  if (!Number.isFinite(n) || normalized !== n){
    pickInput.value = String(normalized);
  }
  state.pickCount = normalized;
  saveState();
}

function shuffleCopy(arr){
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function draw(){
  if (state.remainingIds.length === 0){
    showToast('finished!');
    return;
  }

  const n = clampInt(state.pickCount, 1, state.remainingIds.length);
  state.pickCount = n;
  pickInput.value = String(n);

  const shuffled = shuffleCopy(state.remainingIds);
  const pick = shuffled.slice(0, n);

  const pickSet = new Set(pick);
  state.remainingIds = state.remainingIds.filter(id => !pickSet.has(id));

  state.currentPickIds = pick;
  state.pickedHistoryIds.push(...pick);

  state.screen = 'RESULT';
  saveState();

  render();
}

function backToStart(){
  state.screen = 'START';
  state.currentPickIds = [];
  saveState();
  cycleTheme();
  render();
}

function resetAll(){
  const ok = confirm('Initialize?');
  if (!ok) return;
  state = freshState();
  saveState();
  applyTheme();
  render();
  showToast('Initialized.');
}

function renderHistory(){
  const total = state.roster.length;
  const hist = state.pickedHistoryIds;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < total; i++){
    const row = document.createElement('div');
    row.className = 'row';

    const no = document.createElement('div');
    no.className = 'no';
    no.textContent = pad2(i + 1);

    const name = document.createElement('div');
    name.className = 'name';

    if (i < hist.length){
      name.textContent = nameById.get(hist[i]) ?? '(unknown)';
    } else {
      name.textContent = '-';
      name.classList.add('emptyDash');
    }

    row.appendChild(no);
    row.appendChild(name);
    frag.appendChild(row);
  }

  historyEl.innerHTML = '';
  historyEl.appendChild(frag);
}

function getColsForPick(n){
  if (n <= 3) return 1;
  if (n <= 8) return 2;
  if (n <= 15) return 3;
  if (n <= 24) return 4;
  return 5;
}

function alignStageToViewportCenter(){
  const stage = document.getElementById('stage');
      if (!stage) return;

      stage.style.transform = 'translateY(0px)';

      const r = stage.getBoundingClientRect();
      const stageCenterY = r.top + r.height / 2;

      // スマホ（HISTORYが下に落ちる幅）では、見える範囲の上側に寄せたいのでオフセットを入れる
      const isMobileLayout = window.matchMedia('(max-width: 920px)').matches;
      const liftPx = isMobileLayout ? 160 : 0;

      const viewportCenterY = (window.innerHeight / 2) - liftPx;

      const delta = viewportCenterY - stageCenterY;
      stage.style.transform = `translateY(${delta}px)`;
}

function renderCenter(){
  centerPanel.innerHTML = '';

  const total = state.roster.length;
  const done = state.pickedHistoryIds.length;
  statusEl.textContent = `done: ${done}/${total}`;

  const stage = document.createElement('div');
  stage.className = 'stage';
  stage.id = 'stage';

  const stageTitle = document.createElement('div');
  stageTitle.className = 'stageTitle';
  stageTitle.textContent = "WHO'S NEXT?";
  stage.appendChild(stageTitle);

  if (state.screen === 'START'){
    const btn = document.createElement('button');
    btn.className = 'startBtn mainCard';
    btn.id = 'startBtn';
    btn.textContent = 'START';
    btn.disabled = state.remainingIds.length === 0;
    btn.addEventListener('click', draw);
    stage.appendChild(btn);

  } else {
    const area = document.createElement('div');
    area.className = 'resultArea';
    area.id = 'resultArea';
    area.addEventListener('click', backToStart);

    const n = state.currentPickIds.length;
    const cols = getColsForPick(n);
    const rows = Math.ceil(n / cols);

    const scroller = document.createElement('div');
    scroller.className = 'resultScroller';

    const inner = document.createElement('div');
    inner.className = 'scrollerInner';

    const grid = document.createElement('div');
    grid.className = 'cardsGrid';
    grid.style.gridTemplateColumns = `repeat(${cols}, var(--main-w))`;
    grid.style.gridTemplateRows = `repeat(${rows}, var(--main-h))`;

    if (n >= 4){
      grid.classList.add('scale80');
    } else {
      scroller.style.overflowX = 'hidden';
    }

    const baseIndex = state.pickedHistoryIds.length - state.currentPickIds.length;

    state.currentPickIds.forEach((id, idx) => {
      const c = document.createElement('div');
      c.className = 'mainCard nameCard';

      const baseLag = 55;
      const factor = Math.max(28, baseLag - cols * 6);
      c.style.animationDelay = `${idx * factor}ms`;

      const no = document.createElement('div');
      no.className = 'pickNo';
      no.textContent = pad2(baseIndex + idx + 1);

      const nm = document.createElement('div');
      nm.className = 'pickName';
      nm.textContent = nameById.get(id) ?? '(unknown)';

      c.appendChild(no);
      c.appendChild(nm);

      grid.appendChild(c);
    });

    inner.appendChild(grid);
    scroller.appendChild(inner);
    area.appendChild(scroller);
    stage.appendChild(area);

    requestAnimationFrame(() => {
      scroller.scrollLeft = 0;
    });
  }

  centerPanel.appendChild(stage);
  requestAnimationFrame(alignStageToViewportCenter);
}

function render(){
  applyTheme();
  renderHistory();
  renderCenter();
}

pickInput.addEventListener('change', () => {
  normalizePickCount();
  showToast(`PICK = ${state.pickCount}`);
  requestAnimationFrame(alignStageToViewportCenter);
});

pickInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter'){
    pickInput.blur();
  }
});

resetBtn.addEventListener('click', resetAll);

window.addEventListener('resize', () => {
  requestAnimationFrame(alignStageToViewportCenter);
});

(function boot(){
  state = loadState() ?? freshState();

  if (state.roster.length !== ROSTER.length) {
    state = freshState();
  }

  pickInput.value = String(state.pickCount ?? 1);

  state.themeIndex = (Number.isFinite(state.themeIndex) ? state.themeIndex : 0);
  state.themeIndex = (state.themeIndex + 1) % THEMES.length;
  saveState();

  render();
})();
