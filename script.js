// ==================================================
// INFINITY QUEST - Core Game Engine
// Created by Yerfan Hridoy
// Pure Vanilla JavaScript, HTML5 Canvas & CSS3
// ==================================================

import {
  initAudio,
  soundTap,
  soundSuccess,
  soundFail,
  soundLevelUp,
  soundCoin,
  soundClick,
  soundBoss,
  setSoundEnabled,
  isSoundEnabled
} from './audio.js';

import { getLevelConfig, createPRNG } from './levels-data.js';

// STORAGE KEY
const STORAGE_KEY = 'infinity_quest_save_v1';

// COSMETICS DATABASE
const COSMETICS = {
  balls: [
    { id: 'ball_cyan', name: 'Cyan Pulse', price: 0, color: '#00f0ff', glow: 'rgba(0, 240, 255, 0.6)' },
    { id: 'ball_gold', name: 'Solar Gold', price: 100, color: '#ffd166', glow: 'rgba(255, 209, 102, 0.6)' },
    { id: 'ball_purple', name: 'Plasma Violet', price: 250, color: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)' },
    { id: 'ball_emerald', name: 'Emerald Flare', price: 500, color: '#06d6a0', glow: 'rgba(6, 214, 160, 0.6)' }
  ],
  targets: [
    { id: 'target_ring', name: 'Neon Ring', price: 0, shape: 'ring' },
    { id: 'target_diamond', name: 'Cyber Diamond', price: 100, shape: 'diamond' },
    { id: 'target_hex', name: 'Hex Shield', price: 250, shape: 'hex' },
    { id: 'target_star', name: 'Quantum Star', price: 500, shape: 'star' }
  ],
  trails: [
    { id: 'trail_glow', name: 'Glow Trail', price: 0 },
    { id: 'trail_dots', name: 'Stardust', price: 100 },
    { id: 'trail_spark', name: 'Lightning', price: 250 },
    { id: 'trail_none', name: 'Minimal (None)', price: 50 }
  ],
  themes: [
    { id: 'neon', name: 'Neon Dark', price: 0 },
    { id: 'cyberpunk', name: 'Cyberpunk', price: 150 },
    { id: 'solar', name: 'Solar Gold', price: 250 },
    { id: 'pearl', name: 'Clean Slate', price: 350 }
  ]
};

// GLOBAL GAME STATE
const state = {
  highestLevel: 1,
  completedLevels: {},
  totalCoins: 0,
  totalStars: 0,
  bestScore: 0,
  gamesPlayed: 0,
  levelsCompleted: 0,
  perfectLevels: 0,
  totalRetries: 0,
  soundEnabled: true,
  vibrationEnabled: true,
  reducedMotion: false,
  theme: 'neon',
  onboardingDone: false,
  inventory: ['ball_cyan', 'target_ring', 'trail_glow', 'neon'],
  equipped: {
    ball: 'ball_cyan',
    target: 'target_ring',
    trail: 'trail_glow',
    theme: 'neon'
  },
  dailyChallenge: {
    date: '',
    completed: false,
    stars: 0,
    score: 0
  }
};

// RUNTIME ENGINE STATE
const engine = {
  activeScreen: 'screen-loading',
  currentLevelId: 1,
  isDaily: false,
  currentConfig: null,
  isPaused: false,
  isRunning: false,
  timeRemaining: 10,
  totalTime: 10,
  timerInterval: null,
  animFrameId: null,
  onboardingStep: 0,
  starsEarned: 3,
  levelStartTime: 0,
  mistakes: 0,
  // Canvas elements
  canvas: null,
  ctx: null,
  bgCanvas: null,
  bgCtx: null,
  width: 360,
  height: 640,
  dpr: 1,
  // Interaction pointers
  pointerDown: false,
  pointerPos: { x: 0, y: 0 },
  pointerStart: { x: 0, y: 0 },
  trailPoints: [],
  // Level specific dynamic state
  levelState: {}
};

// LOAD SAVED PROGRESS
function loadGameData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        state.highestLevel = Math.max(1, parseInt(data.highestLevel, 10) || 1);
        state.completedLevels = data.completedLevels || {};
        state.totalCoins = Math.max(0, parseInt(data.totalCoins, 10) || 0);
        state.totalStars = Math.max(0, parseInt(data.totalStars, 10) || 0);
        state.bestScore = Math.max(0, parseInt(data.bestScore, 10) || 0);
        state.gamesPlayed = Math.max(0, parseInt(data.gamesPlayed, 10) || 0);
        state.levelsCompleted = Math.max(0, parseInt(data.levelsCompleted, 10) || 0);
        state.perfectLevels = Math.max(0, parseInt(data.perfectLevels, 10) || 0);
        state.totalRetries = Math.max(0, parseInt(data.totalRetries, 10) || 0);
        state.soundEnabled = data.soundEnabled !== false;
        state.vibrationEnabled = data.vibrationEnabled !== false;
        state.reducedMotion = !!data.reducedMotion;
        state.theme = data.theme || 'neon';
        state.onboardingDone = !!data.onboardingDone;
        if (Array.isArray(data.inventory)) state.inventory = data.inventory;
        if (data.equipped) state.equipped = { ...state.equipped, ...data.equipped };
        if (data.dailyChallenge) state.dailyChallenge = data.dailyChallenge;
      }
    }
  } catch (e) {
    console.warn('LocalStorage load error, using in-memory state:', e);
  }
}

// SAVE PROGRESS
function saveGameData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

// VIBRATION HELPER
function triggerVibrate(pattern) {
  if (state.vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }
}

// TOAST NOTIFIER
function showToast(message, icon = '✨') {
  const toast = document.getElementById('toast-notification');
  const iconSpan = document.getElementById('toast-icon');
  const msgSpan = document.getElementById('toast-message');
  if (toast && msgSpan) {
    iconSpan.textContent = icon;
    msgSpan.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }
}

// APPLY THEME
function applyTheme(themeName) {
  state.theme = themeName;
  document.body.setAttribute('data-theme', themeName);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === themeName);
  });
  saveGameData();
}

// SCREEN TRANSITIONS
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(scr => {
    scr.classList.remove('active');
  });
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    engine.activeScreen = screenId;
  }
}

// ONBOARDING
function updateOnboardingUI() {
  const slides = [
    { icon: '✨', title: 'Welcome to Infinity Quest', desc: 'An endless casual arcade game where every single level introduces a new and distinct challenge.' },
    { icon: '♾️', title: 'Endless Variety', desc: 'No repetitive speed-ups. Experience puzzles, reflexes, memory, avoidance, gravity, and boss challenges.' },
    { icon: '👆', title: 'Simple Controls', desc: 'Clean, intuitive touch mechanics: Tap, Swipe, Hold, Drag. Understand every level in 5 seconds.' },
    { icon: '↻', title: 'Instant Retry', desc: 'Failed a level? Retry the exact same level immediately without losing your milestone progress.' }
  ];

  const slide = slides[engine.onboardingStep];
  const iconBox = document.getElementById('onboard-icon');
  const titleEl = document.getElementById('onboard-title');
  const descEl = document.getElementById('onboard-desc');
  const nextBtn = document.getElementById('btn-onboard-next');

  if (iconBox) iconBox.textContent = slide.icon;
  if (titleEl) titleEl.textContent = slide.title;
  if (descEl) descEl.textContent = slide.desc;

  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById(`dot-${i}`);
    if (dot) dot.classList.toggle('active', i === engine.onboardingStep);
  }

  if (nextBtn) {
    nextBtn.textContent = engine.onboardingStep === 3 ? "LET'S PLAY" : "NEXT";
  }
}

// HOME SCREEN UI SYNC
function updateHomeUI() {
  const coinsEl = document.getElementById('home-coins-val');
  const levelStat = document.getElementById('home-stat-level');
  const starsStat = document.getElementById('home-stat-stars');
  const scoreStat = document.getElementById('home-stat-score');
  const playBtnText = document.getElementById('home-play-text');
  const soundBtn = document.getElementById('btn-sound-toggle-home');

  if (coinsEl) coinsEl.textContent = state.totalCoins;
  if (levelStat) levelStat.textContent = state.highestLevel;
  if (starsStat) starsStat.textContent = state.totalStars;
  if (scoreStat) scoreStat.textContent = state.bestScore;
  if (playBtnText) playBtnText.textContent = `PLAY LEVEL ${state.highestLevel}`;
  if (soundBtn) soundBtn.textContent = state.soundEnabled ? '🔊' : '🔇';
}

// LEVEL SELECT SCREEN UI
let currentLevelTab = 0;
function renderLevelSelect() {
  const tabsContainer = document.getElementById('level-tabs-container');
  const gridContainer = document.getElementById('level-grid-container');
  const starsVal = document.getElementById('levels-stars-val');
  if (starsVal) starsVal.textContent = state.totalStars;

  if (!tabsContainer || !gridContainer) return;

  // Render Tabs (25 levels per tab)
  const totalTabs = Math.max(4, Math.ceil(state.highestLevel / 25) + 1);
  tabsContainer.innerHTML = '';
  for (let i = 0; i < totalTabs; i++) {
    const start = i * 25 + 1;
    const end = (i + 1) * 25;
    const btn = document.createElement('button');
    btn.className = `level-tab ${i === currentLevelTab ? 'active' : ''}`;
    btn.textContent = `${start}-${end}`;
    btn.type = 'button';
    btn.addEventListener('click', () => {
      soundClick();
      currentLevelTab = i;
      renderLevelSelect();
    });
    tabsContainer.appendChild(btn);
  }

  // Render 25 Level Cards
  gridContainer.innerHTML = '';
  const startLevel = currentLevelTab * 25 + 1;
  const endLevel = (currentLevelTab + 1) * 25;

  for (let lvl = startLevel; lvl <= endLevel; lvl++) {
    const card = document.createElement('div');
    const isUnlocked = lvl <= state.highestLevel;
    const isCurrent = lvl === state.highestLevel;
    const isCompleted = !!state.completedLevels[lvl];
    const isBoss = lvl % 10 === 0;

    card.className = `level-card ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''} ${isBoss ? 'boss' : ''}`;
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `Level ${lvl}`);

    const numSpan = document.createElement('span');
    numSpan.className = 'level-num';
    numSpan.textContent = lvl < 10 ? `0${lvl}` : lvl;
    card.appendChild(numSpan);

    if (isCompleted) {
      const starsCount = state.completedLevels[lvl].stars || 1;
      const starsDiv = document.createElement('div');
      starsDiv.className = 'level-stars-mini';
      starsDiv.textContent = '★'.repeat(starsCount) + '☆'.repeat(3 - starsCount);
      card.appendChild(starsDiv);
    } else if (isUnlocked) {
      const playIcon = document.createElement('span');
      playIcon.style.fontSize = '12px';
      playIcon.style.color = 'var(--primary)';
      playIcon.textContent = isCurrent ? '▶ PLAY' : 'READY';
      card.appendChild(playIcon);
    } else {
      const lockIcon = document.createElement('span');
      lockIcon.className = 'level-lock-icon';
      lockIcon.textContent = '🔒';
      card.appendChild(lockIcon);
    }

    if (isUnlocked) {
      card.addEventListener('click', () => {
        soundClick();
        startLevel(lvl);
      });
    }

    gridContainer.appendChild(card);
  }
}

// SHOP SCREEN UI
let currentShopTab = 'balls';
function renderShop() {
  const grid = document.getElementById('shop-items-grid');
  const coinsEl = document.getElementById('shop-coins-val');
  if (coinsEl) coinsEl.textContent = state.totalCoins;
  if (!grid) return;

  grid.innerHTML = '';
  const items = COSMETICS[currentShopTab] || [];

  items.forEach(item => {
    const isOwned = state.inventory.includes(item.id) || item.price === 0;
    const isEquipped = state.equipped[currentShopTab === 'themes' ? 'theme' : currentShopTab.slice(0, -1)] === item.id;

    const card = document.createElement('div');
    card.className = 'shop-item-card';

    // Item preview
    const preview = document.createElement('div');
    preview.className = 'shop-item-preview';
    if (currentShopTab === 'balls') {
      preview.innerHTML = `<div style="width: 26px; height: 26px; border-radius: 50%; background: ${item.color}; box-shadow: 0 0 15px ${item.glow};"></div>`;
    } else if (currentShopTab === 'targets') {
      preview.innerHTML = `<div style="width: 28px; height: 28px; border: 3px solid var(--primary); border-radius: ${item.shape === 'ring' ? '50%' : '4px'}; transform: ${item.shape === 'diamond' ? 'rotate(45deg)' : 'none'}; box-shadow: 0 0 12px var(--primary-glow);"></div>`;
    } else if (currentShopTab === 'trails') {
      preview.innerHTML = `<span style="font-size: 24px;">✨</span>`;
    } else if (currentShopTab === 'themes') {
      preview.innerHTML = `<span style="font-size: 24px;">🎨</span>`;
    }

    const title = document.createElement('div');
    title.className = 'shop-item-name';
    title.textContent = item.name;

    const btn = document.createElement('button');
    btn.className = `shop-item-btn ${isEquipped ? 'equipped' : isOwned ? 'owned' : 'buy'}`;
    btn.type = 'button';

    if (isEquipped) {
      btn.textContent = 'EQUIPPED';
    } else if (isOwned) {
      btn.textContent = 'EQUIP';
      btn.addEventListener('click', () => {
        soundClick();
        const catKey = currentShopTab === 'themes' ? 'theme' : currentShopTab.slice(0, -1);
        state.equipped[catKey] = item.id;
        if (currentShopTab === 'themes') applyTheme(item.id);
        saveGameData();
        renderShop();
        showToast(`${item.name} equipped!`, '🎒');
      });
    } else {
      btn.textContent = `BUY ${item.price} 🪙`;
      btn.addEventListener('click', () => {
        if (state.totalCoins >= item.price) {
          state.totalCoins -= item.price;
          state.inventory.push(item.id);
          const catKey = currentShopTab === 'themes' ? 'theme' : currentShopTab.slice(0, -1);
          state.equipped[catKey] = item.id;
          if (currentShopTab === 'themes') applyTheme(item.id);
          soundCoin();
          saveGameData();
          renderShop();
          updateHomeUI();
          showToast(`Unlocked ${item.name}!`, '🎉');
        } else {
          soundFail();
          showToast('Not enough coins! Keep playing levels.', '⚠️');
        }
      });
    }

    card.appendChild(preview);
    card.appendChild(title);
    card.appendChild(btn);
    grid.appendChild(card);
  });
}

// STATS SCREEN UI
function renderStats() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setVal('stat-val-highest', state.highestLevel);
  setVal('stat-val-completed', state.levelsCompleted);
  setVal('stat-val-stars', state.totalStars);
  setVal('stat-val-coins', state.totalCoins);
  setVal('stat-val-perfect', state.perfectLevels);
  setVal('stat-val-played', state.gamesPlayed);
  setVal('stat-val-retries', state.totalRetries);
}

// CANVAS SETUP & RESIZING
function initCanvases() {
  engine.canvas = document.getElementById('game-canvas');
  engine.ctx = engine.canvas ? engine.canvas.getContext('2d') : null;

  engine.bgCanvas = document.getElementById('bg-canvas');
  engine.bgCtx = engine.bgCanvas ? engine.bgCanvas.getContext('2d') : null;

  resizeCanvases();
  window.addEventListener('resize', resizeCanvases);
}

function resizeCanvases() {
  const container = document.getElementById('app-container');
  if (!container) return;
  const rect = container.getBoundingClientRect();
  engine.width = rect.width;
  engine.height = rect.height;
  engine.dpr = Math.min(window.devicePixelRatio || 1, 2);

  if (engine.canvas && engine.ctx) {
    engine.canvas.width = engine.width * engine.dpr;
    engine.canvas.height = engine.height * engine.dpr;
    engine.ctx.setTransform(1, 0, 0, 1, 0, 0);
    engine.ctx.scale(engine.dpr, engine.dpr);
  }

  if (engine.bgCanvas && engine.bgCtx) {
    engine.bgCanvas.width = engine.width * engine.dpr;
    engine.bgCanvas.height = engine.height * engine.dpr;
    engine.bgCtx.setTransform(1, 0, 0, 1, 0, 0);
    engine.bgCtx.scale(engine.dpr, engine.dpr);
  }
}

// AMBIENT STARFIELD BACKGROUND
const stars = [];
for (let i = 0; i < 45; i++) {
  stars.push({
    x: Math.random(),
    y: Math.random(),
    size: Math.random() * 2 + 0.8,
    speed: Math.random() * 0.0003 + 0.0001,
    alpha: Math.random() * 0.7 + 0.3
  });
}

function renderAmbientBackground() {
  if (!engine.bgCtx || state.reducedMotion) return;
  const ctx = engine.bgCtx;
  const w = engine.width;
  const h = engine.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';

  stars.forEach(st => {
    st.y -= st.speed;
    if (st.y < 0) st.y = 1;
    ctx.globalAlpha = st.alpha * 0.6;
    ctx.beginPath();
    ctx.arc(st.x * w, st.y * h, st.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1.0;
  requestAnimationFrame(renderAmbientBackground);
}

// GAMEPLAY INITIALIZATION
function startLevel(lvlNumber, isDaily = false) {
  initAudio();
  engine.isDaily = isDaily;
  engine.currentLevelId = lvlNumber;
  engine.currentConfig = getLevelConfig(lvlNumber);
  engine.isPaused = false;
  engine.isRunning = false;
  engine.mistakes = 0;
  engine.trailPoints = [];

  showScreen('screen-game');
  updateGameHUD();

  // Show Level Intro Modal
  showIntroOverlay();
}

function updateGameHUD() {
  const badge = document.getElementById('hud-level-label');
  const objText = document.getElementById('hud-objective-text');
  const starsIndicator = document.getElementById('hud-stars-indicator');
  const soundBtn = document.getElementById('btn-game-sound');

  if (badge) badge.textContent = engine.isDaily ? 'DAILY' : `LEVEL ${engine.currentLevelId}`;
  if (objText) objText.textContent = engine.currentConfig.objective;
  if (soundBtn) soundBtn.textContent = state.soundEnabled ? '🔊' : '🔇';

  if (starsIndicator) {
    starsIndicator.innerHTML = '★'.repeat(engine.starsEarned) + '☆'.repeat(3 - engine.starsEarned);
  }

  updateTimerBar(1.0);
}

function updateTimerBar(fraction) {
  const bar = document.getElementById('hud-timer-bar');
  if (bar) {
    const pct = Math.max(0, Math.min(100, fraction * 100));
    bar.style.width = `${pct}%`;
    bar.classList.toggle('danger', fraction < 0.25);
  }
}

// SHOW LEVEL INTRO MODAL
function showIntroOverlay() {
  const overlay = document.getElementById('overlay-intro');
  const badge = document.getElementById('intro-badge');
  const title = document.getElementById('intro-title');
  const controlIcon = document.getElementById('intro-control-icon');
  const controlText = document.getElementById('intro-control-text');
  const desc = document.getElementById('intro-desc');

  if (badge) badge.textContent = engine.isDaily ? 'DAILY QUEST' : (engine.currentConfig.isBoss ? `BOSS LEVEL ${engine.currentLevelId}` : `LEVEL ${engine.currentLevelId}`);
  if (title) title.textContent = engine.currentConfig.name;
  if (controlText) controlText.textContent = engine.currentConfig.controlHint;
  if (desc) desc.textContent = engine.currentConfig.instructions;

  // Icon mapping
  const iconMap = {
    TAP: '👆',
    SWIPE: '↔️',
    HOLD: '⏱️',
    DRAG: '🤏',
    MEMORY: '🧠',
    TIMING: '🎯'
  };
  let foundIcon = '🎯';
  for (const k in iconMap) {
    if (engine.currentConfig.controlHint.includes(k)) {
      foundIcon = iconMap[k];
      break;
    }
  }
  if (controlIcon) controlIcon.textContent = foundIcon;

  if (overlay) overlay.classList.add('active');
}

// START ACTIVE LEVEL LOGIC
function launchLevelGameplay() {
  const overlay = document.getElementById('overlay-intro');
  if (overlay) overlay.classList.remove('active');

  engine.isRunning = true;
  engine.isPaused = false;
  engine.totalTime = engine.currentConfig.timeLimit;
  engine.timeRemaining = engine.totalTime;
  engine.levelStartTime = performance.now();
  engine.starsEarned = 3;

  state.gamesPlayed++;
  saveGameData();

  if (engine.currentConfig.isBoss) {
    soundBoss();
    triggerVibrate([80, 50, 80]);
  } else {
    soundTap();
  }

  initLevelMechanic(engine.currentConfig);
  startTimer();
  startRenderLoop();
}

// TIMER LOOP
function startTimer() {
  stopTimer();
  const step = 100;
  engine.timerInterval = setInterval(() => {
    if (engine.isPaused || !engine.isRunning) return;
    engine.timeRemaining -= step / 1000;
    const fraction = Math.max(0, engine.timeRemaining / engine.totalTime);
    updateTimerBar(fraction);

    if (engine.timeRemaining <= 0) {
      stopTimer();
      failLevel('Time ran out! Try to be faster.');
    }
  }, step);
}

function stopTimer() {
  if (engine.timerInterval) {
    clearInterval(engine.timerInterval);
    engine.timerInterval = null;
  }
}

// ==================================================
// LEVEL MECHANIC INITIALIZERS
// ==================================================
function initLevelMechanic(cfg) {
  const w = engine.width;
  const h = engine.height;
  const rng = createPRNG(cfg.id * 8831);
  const pad = 45;
  const topPad = 80;

  engine.levelState = {};

  switch (cfg.type) {
    case 'tapTarget': {
      const count = cfg.config.count || 1;
      const targets = [];
      for (let i = 0; i < count; i++) {
        targets.push({
          x: pad + rng() * (w - pad * 2),
          y: topPad + rng() * (h - topPad - pad * 2),
          vx: cfg.config.moving ? (rng() - 0.5) * (cfg.config.speed || 2) * 2 : 0,
          vy: cfg.config.moving ? (rng() - 0.5) * (cfg.config.speed || 2) * 2 : 0,
          radius: cfg.config.size ? cfg.config.size / 2 : 26,
          hit: false,
          color: 'var(--primary)',
          num: cfg.config.sizeOrder ? i + 1 : null
        });
      }
      engine.levelState = { targets, remaining: count, sizeOrder: cfg.config.sizeOrder, currentExpected: 1 };
      break;
    }

    case 'sequence': {
      const count = cfg.config.count || 3;
      const nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          num: i + 1,
          x: pad + rng() * (w - pad * 2),
          y: topPad + rng() * (h - topPad - pad * 2),
          radius: 26,
          active: true
        });
      }
      engine.levelState = { nodes, nextNum: 1, total: count };
      break;
    }

    case 'avoidMoving': {
      const droneCount = cfg.config.drones || 1;
      const drones = [];
      for (let i = 0; i < droneCount; i++) {
        drones.push({
          x: pad + rng() * (w - pad * 2),
          y: topPad + 40 + rng() * (h - topPad - 160),
          vx: (rng() > 0.5 ? 1 : -1) * (cfg.config.droneSpeed || 2.0),
          vy: (rng() > 0.5 ? 1 : -1) * (cfg.config.droneSpeed || 2.0) * 0.8,
          radius: 18
        });
      }
      engine.levelState = {
        player: { x: w / 2, y: h - 90, radius: 18 },
        goal: { x: w / 2, y: topPad + 50, radius: 26 },
        drones,
        invertX: !!cfg.config.invertX
      };
      break;
    }

    case 'greenZone': {
      engine.levelState = {
        angle: 0,
        speed: cfg.config.speed || 2.4,
        zoneStart: 0.35,
        zoneWidth: cfg.config.zoneWidth || 0.25,
        hitsNeeded: cfg.config.requiredHits || 1,
        hitsDone: 0
      };
      break;
    }

    case 'doors': {
      const count = cfg.config.doors || 3;
      const doorWidth = (w - pad * 2 - (count - 1) * 12) / count;
      const doors = [];
      const answers = cfg.config.answers || ['Cyan', 'Ruby', 'Solar'];
      for (let i = 0; i < count; i++) {
        doors.push({
          x: pad + i * (doorWidth + 12),
          y: h / 2 - 40,
          w: doorWidth,
          h: 110,
          label: answers[i] !== undefined ? String(answers[i]) : `Door ${i + 1}`,
          isCorrect: i === (cfg.config.correctIndex || 0)
        });
      }
      engine.levelState = {
        doors,
        mathQuestion: cfg.config.mathQuestion || 'Select the correct door:'
      };
      break;
    }

    case 'simonMemory': {
      const pads = [
        { id: 0, color: '#00f0ff', active: false, x: w / 2 - 65, y: h / 2 - 75 },
        { id: 1, color: '#ffd166', active: false, x: w / 2 + 15, y: h / 2 - 75 },
        { id: 2, color: '#06d6a0', active: false, x: w / 2 - 65, y: h / 2 + 10 },
        { id: 3, color: '#ff007f', active: false, x: w / 2 + 15, y: h / 2 + 10 }
      ];
      const steps = cfg.config.steps || 3;
      const sequence = [];
      for (let i = 0; i < steps; i++) {
        sequence.push(Math.floor(rng() * 4));
      }
      engine.levelState = {
        pads,
        sequence,
        userIndex: 0,
        isShowingSequence: true,
        currentFlash: -1,
        stepDelay: cfg.config.flashSpeed || 400
      };
      playSimonSequence();
      break;
    }

    case 'dodgeLane': {
      const lanes = [w * 0.25, w * 0.5, w * 0.75];
      const waves = [];
      const waveCount = cfg.config.waves || 5;
      for (let i = 0; i < waveCount; i++) {
        const safeLane = Math.floor(rng() * 3);
        for (let l = 0; l < 3; l++) {
          if (l !== safeLane) {
            waves.push({
              lane: l,
              y: -80 - i * 160,
              w: 50,
              h: 24,
              speed: (cfg.config.speed || 2.4) * 1.8
            });
          }
        }
      }
      engine.levelState = {
        lanes,
        currentLane: 1,
        waves,
        playerY: h - 110,
        playerRadius: 18,
        invertControls: !!cfg.config.invertControls
      };
      break;
    }

    case 'oddOneOut': {
      const size = cfg.config.gridSize || 3;
      const total = size * size;
      const diffIndex = Math.floor(rng() * total);
      const items = [];
      const cellSize = Math.min((w - pad * 2) / size, 70);
      const startX = (w - cellSize * size) / 2;
      const startY = h / 2 - (cellSize * size) / 2;

      for (let i = 0; i < total; i++) {
        const row = Math.floor(i / size);
        const col = i % size;
        items.push({
          x: startX + col * cellSize + cellSize / 2,
          y: startY + row * cellSize + cellSize / 2,
          isOdd: i === diffIndex,
          type: cfg.config.diffType || 'color',
          radius: cellSize * 0.36
        });
      }
      engine.levelState = { items };
      break;
    }

    case 'holdRelease': {
      engine.levelState = {
        targetTime: cfg.config.targetTime || 2.0,
        tolerance: cfg.config.tolerance || 0.35,
        handsOff: !!cfg.config.handsOff,
        isHolding: false,
        holdStartTime: 0,
        currentHoldSec: 0
      };
      break;
    }

    case 'bossReaction': {
      engine.levelState = {
        strikesNeeded: cfg.config.strikes || 3,
        strikesDone: 0,
        windowMs: cfg.config.windowMs || 700,
        bossState: 'WAITING',
        promptTime: 0,
        nextPromptDelay: 1200 + rng() * 1200
      };
      scheduleNextReactionPrompt();
      break;
    }

    case 'catchFalling': {
      engine.levelState = {
        paddleX: w / 2,
        paddleY: h - 90,
        paddleW: 75,
        paddleH: 14,
        targetStars: cfg.config.targetStars || 5,
        caughtStars: 0,
        fallSpeed: (cfg.config.fallSpeed || 2.2) * 1.5,
        items: []
      };
      break;
    }

    case 'avoidFalling': {
      engine.levelState = {
        player: { x: w / 2, y: h - 90, radius: 18 },
        spawnRate: cfg.config.spawnRate || 320,
        speed: (cfg.config.speed || 2.5) * 1.5,
        lastSpawn: 0,
        hazards: []
      };
      break;
    }

    case 'followPath': {
      const points = [];
      const count = cfg.config.points || 4;
      const segY = (h - topPad - 160) / (count - 1);
      for (let i = 0; i < count; i++) {
        points.push({
          x: pad + 30 + rng() * (w - pad * 2 - 60),
          y: topPad + 40 + i * segY
        });
      }
      engine.levelState = {
        points,
        pathWidth: cfg.config.pathWidth || 38,
        playerPos: { x: points[0].x, y: points[0].y },
        goalIndex: count - 1,
        completed: false
      };
      break;
    }

    case 'colorFilter': {
      const targetC = cfg.config.targetColor || 'blue';
      const count = cfg.config.targetCount || cfg.config.blueCount || 4;
      const decoyCount = cfg.config.decoyCount || cfg.config.redCount || 4;
      const nodes = [];

      for (let i = 0; i < count; i++) {
        nodes.push({
          x: pad + rng() * (w - pad * 2),
          y: topPad + rng() * (h - topPad - pad * 2),
          color: targetC,
          isTarget: true,
          radius: 24,
          active: true
        });
      }
      for (let i = 0; i < decoyCount; i++) {
        nodes.push({
          x: pad + rng() * (w - pad * 2),
          y: topPad + rng() * (h - topPad - pad * 2),
          color: targetC === 'blue' ? 'red' : 'purple',
          isTarget: false,
          radius: 24,
          active: true
        });
      }
      engine.levelState = { nodes, remainingTargets: count };
      break;
    }

    case 'memoryPairs': {
      const pairsCount = cfg.config.pairs || 2;
      const symbols = ['⭐', '💎', '⚡', '🔥', '🌀'].slice(0, pairsCount);
      const deck = [];
      symbols.forEach((sym, idx) => {
        deck.push({ id: idx * 2, sym, matched: false, flipped: false });
        deck.push({ id: idx * 2 + 1, sym, matched: false, flipped: false });
      });
      // Shuffle
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      const cols = pairsCount <= 2 ? 2 : (pairsCount <= 3 ? 3 : 4);
      const rows = Math.ceil(deck.length / cols);
      const cardW = 64;
      const cardH = 76;
      const startX = (w - cols * (cardW + 10)) / 2;
      const startY = h / 2 - (rows * (cardH + 10)) / 2;

      deck.forEach((card, idx) => {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        card.x = startX + c * (cardW + 10);
        card.y = startY + r * (cardH + 10);
        card.w = cardW;
        card.h = cardH;
      });

      engine.levelState = {
        cards: deck,
        firstFlipped: null,
        lockInput: false,
        pairsFound: 0,
        totalPairs: pairsCount
      };
      break;
    }

    case 'movingBridge': {
      engine.levelState = {
        bridgeX: w / 2,
        bridgeY: h / 2,
        bridgeW: 90,
        bridgeH: 26,
        targetX: w / 2,
        speed: (cfg.config.bridgeSpeed || 2.5) * 2.2,
        direction: 1,
        tolerance: cfg.config.tolerance || 32,
        locked: false
      };
      break;
    }

    case 'safeLock': {
      engine.levelState = {
        angle: 0,
        speed: cfg.config.needleSpeed || 2.8,
        safeStart: Math.PI * 0.4,
        safeArc: (cfg.config.arcSize || 0.25) * Math.PI * 2,
        radius: 80,
        centerX: w / 2,
        centerY: h / 2
      };
      break;
    }

    case 'miniMaze': {
      const mazePad = 40;
      engine.levelState = {
        player: { x: mazePad + 25, y: topPad + 40, radius: 14 },
        goal: { x: w - mazePad - 25, y: h - 100, radius: 20 },
        walls: [
          { x: mazePad, y: topPad + 110, w: w - mazePad * 2 - 60, h: 14 },
          { x: mazePad + 60, y: topPad + 220, w: w - mazePad * 2 - 60, h: 14 },
          { x: mazePad, y: topPad + 330, w: w - mazePad * 2 - 60, h: 14 }
        ],
        invertY: !!cfg.config.invertY
      };
      break;
    }

    case 'symbolMatch': {
      const glyphs = ['▲', '■', '●', '◆', '★', '✖'];
      engine.levelState = {
        glyphs,
        leftIndex: 0,
        rightIndex: 1,
        matchesDone: 0,
        targetMatches: cfg.config.targetMatches || 2,
        lastCycle: performance.now(),
        cycleInterval: cfg.config.cycleSpeed || 750
      };
      break;
    }

    case 'rapidTap': {
      engine.levelState = {
        charge: 0,
        required: 100,
        decay: cfg.config.decayRate || 2.0
      };
      break;
    }

    case 'sliderBalance': {
      engine.levelState = {
        bubblePos: 0, // -1 to +1
        drift: 0.3,
        sliderX: 0,
        holdTimeNeeded: cfg.config.holdTime || 4.0,
        timeBalanced: 0
      };
      break;
    }

    case 'gravityFlip': {
      engine.levelState = {
        playerY: h - 100,
        gravityDirection: 1, // 1 = floor, -1 = ceiling
        floorY: h - 90,
        ceilY: topPad + 60,
        speed: (cfg.config.speed || 2.4) * 2,
        spikes: [
          { x: w + 80, onCeil: false, w: 28, h: 32 },
          { x: w + 240, onCeil: true, w: 28, h: 32 },
          { x: w + 400, onCeil: false, w: 28, h: 32 },
          { x: w + 560, onCeil: true, w: 28, h: 32 }
        ],
        passedCount: 0,
        targetCount: cfg.config.obstacleCount || 4
      };
      break;
    }

    case 'darkness': {
      engine.levelState = {
        torchPos: { x: w / 2, y: h / 2 },
        torchRadius: cfg.config.radius || 60,
        goal: { x: pad + rng() * (w - pad * 2), y: topPad + rng() * (h - topPad - pad * 2), radius: 22 },
        found: false
      };
      break;
    }

    case 'orbitJump': {
      engine.levelState = {
        planet: { x: w / 2, y: h / 2, radius: 45 },
        angle: 0,
        orbitRadius: 90,
        playerState: 'ORBITING', // ORBITING or LAUNCHED
        playerPos: { x: 0, y: 0 },
        playerVel: { x: 0, y: 0 },
        dockZone: { angleStart: Math.PI * 1.3, angleEnd: Math.PI * 1.7 }
      };
      break;
    }

    case 'bossBattle': {
      engine.levelState = {
        bossName: cfg.config.bossName || 'Infinity Gate',
        shields: cfg.config.shields || 4,
        maxShields: cfg.config.shields || 4,
        coreX: w / 2,
        coreY: h / 2 - 30,
        coreRadius: 55,
        rotation: 0
      };
      break;
    }

    default:
      engine.levelState = {};
      break;
  }
}

// SIMON MEMORY HELPER
function playSimonSequence() {
  const ls = engine.levelState;
  if (!ls.sequence) return;
  ls.isShowingSequence = true;
  let i = 0;

  const interval = setInterval(() => {
    if (!engine.isRunning || engine.isPaused) {
      clearInterval(interval);
      return;
    }
    if (i < ls.sequence.length) {
      const padId = ls.sequence[i];
      flashSimonPad(padId);
      soundTap();
      i++;
    } else {
      clearInterval(interval);
      ls.isShowingSequence = false;
      ls.userIndex = 0;
    }
  }, ls.stepDelay || 400);
}

function flashSimonPad(padId) {
  const ls = engine.levelState;
  if (ls.pads && ls.pads[padId]) {
    ls.pads[padId].active = true;
    setTimeout(() => {
      if (ls.pads && ls.pads[padId]) ls.pads[padId].active = false;
    }, 220);
  }
}

// BOSS REACTION HELPER
let reactionTimeout = null;
function scheduleNextReactionPrompt() {
  clearTimeout(reactionTimeout);
  const ls = engine.levelState;
  if (!ls || !engine.isRunning) return;

  reactionTimeout = setTimeout(() => {
    if (!engine.isRunning || engine.isPaused) return;
    ls.bossState = 'STRIKE';
    ls.promptTime = performance.now();
    soundBoss();
    triggerVibrate(60);

    // Strike window timer
    reactionTimeout = setTimeout(() => {
      if (ls.bossState === 'STRIKE') {
        failLevel('Too slow! Counter window missed.');
      }
    }, ls.windowMs);
  }, ls.nextPromptDelay || 1200);
}

// ==================================================
// RENDER & UPDATE LOOP
// ==================================================
function startRenderLoop() {
  if (engine.animFrameId) cancelAnimationFrame(engine.animFrameId);

  const loop = () => {
    if (engine.isRunning && !engine.isPaused) {
      updateActiveLevel();
      renderActiveLevel();
    }
    engine.animFrameId = requestAnimationFrame(loop);
  };
  engine.animFrameId = requestAnimationFrame(loop);
}

// UPDATE LEVEL LOGIC
function updateActiveLevel() {
  const cfg = engine.currentConfig;
  const ls = engine.levelState;
  const w = engine.width;
  const h = engine.height;
  if (!cfg) return;

  switch (cfg.type) {
    case 'tapTarget':
      if (cfg.config.moving) {
        ls.targets.forEach(t => {
          if (!t.hit) {
            t.x += t.vx;
            t.y += t.vy;
            if (t.x < t.radius || t.x > w - t.radius) t.vx *= -1;
            if (t.y < 80 + t.radius || t.y > h - 40 - t.radius) t.vy *= -1;
          }
        });
      }
      break;

    case 'avoidMoving':
      ls.drones.forEach(d => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < d.radius || d.x > w - d.radius) d.vx *= -1;
        if (d.y < 120 || d.y > h - 140) d.vy *= -1;

        // Collision with player
        const dist = Math.hypot(d.x - ls.player.x, d.y - ls.player.y);
        if (dist < d.radius + ls.player.radius - 2) {
          failLevel('Caught by patrol drone! Avoid red hazards.');
        }
      });
      // Check goal
      if (Math.hypot(ls.player.x - ls.goal.x, ls.player.y - ls.goal.y) < ls.goal.radius + ls.player.radius) {
        completeLevel();
      }
      break;

    case 'greenZone':
      ls.angle += (ls.speed * 0.04);
      break;

    case 'dodgeLane':
      ls.waves.forEach(wv => {
        wv.y += wv.speed;
        // Collision check with player
        if (wv.lane === ls.currentLane && Math.abs(wv.y - ls.playerY) < 26) {
          failLevel('Collided with energy barrier! Swipe to safe lane.');
        }
      });
      // Check if all waves survived
      if (ls.waves.every(wv => wv.y > h + 40)) {
        completeLevel();
      }
      break;

    case 'holdRelease':
      if (ls.isHolding) {
        ls.currentHoldSec = (performance.now() - ls.holdStartTime) / 1000;
        if (ls.handsOff) {
          failLevel('You touched the screen! Objective was DO NOT TOUCH.');
        }
      }
      if (ls.handsOff && engine.timeRemaining < 0.3) {
        completeLevel();
      }
      break;

    case 'catchFalling':
      // Spawn items
      if (Math.random() < 0.04) {
        const isHazard = Math.random() < 0.35;
        ls.items.push({
          x: 40 + Math.random() * (w - 80),
          y: -20,
          speed: ls.fallSpeed * (0.8 + Math.random() * 0.4),
          isHazard
        });
      }
      ls.items.forEach((it, idx) => {
        it.y += it.speed;
        // Catch check
        if (it.y >= ls.paddleY - 10 && it.y <= ls.paddleY + ls.paddleH + 10) {
          if (Math.abs(it.x - ls.paddleX) < ls.paddleW / 2 + 10) {
            if (it.isHazard) {
              failLevel('Caught a hazard skull! Catch only stars.');
            } else {
              soundCoin();
              triggerVibrate(20);
              ls.caughtStars++;
              ls.items.splice(idx, 1);
              if (ls.caughtStars >= ls.targetStars) {
                completeLevel();
              }
            }
          }
        }
      });
      ls.items = ls.items.filter(it => it.y < h + 30);
      break;

    case 'avoidFalling':
      if (performance.now() - ls.lastSpawn > ls.spawnRate) {
        ls.lastSpawn = performance.now();
        ls.hazards.push({
          x: 20 + Math.random() * (w - 40),
          y: -20,
          radius: 12 + Math.random() * 8,
          speed: ls.speed * (0.8 + Math.random() * 0.5)
        });
      }
      ls.hazards.forEach(hz => {
        hz.y += hz.speed;
        const dist = Math.hypot(hz.x - ls.player.x, hz.y - ls.player.y);
        if (dist < hz.radius + ls.player.radius) {
          failLevel('Hit by falling meteor! Drag smoothly to dodge.');
        }
      });
      ls.hazards = ls.hazards.filter(hz => hz.y < h + 30);
      // If time passes, complete level
      if (engine.timeRemaining < 0.3) {
        completeLevel();
      }
      break;

    case 'movingBridge':
      if (!ls.locked) {
        ls.bridgeX += ls.speed * ls.direction;
        if (ls.bridgeX > w - 70) ls.direction = -1;
        if (ls.bridgeX < 70) ls.direction = 1;
      }
      break;

    case 'safeLock':
      ls.angle += ls.speed * 0.04;
      break;

    case 'miniMaze':
      // Wall collision check
      ls.walls.forEach(wl => {
        if (
          ls.player.x + ls.player.radius > wl.x &&
          ls.player.x - ls.player.radius < wl.x + wl.w &&
          ls.player.y + ls.player.radius > wl.y &&
          ls.player.y - ls.player.radius < wl.y + wl.h
        ) {
          failLevel('Touched maze wall! Stay within the safe lane.');
        }
      });
      if (Math.hypot(ls.player.x - ls.goal.x, ls.player.y - ls.goal.y) < ls.goal.radius + ls.player.radius) {
        completeLevel();
      }
      break;

    case 'symbolMatch':
      if (performance.now() - ls.lastCycle > ls.cycleInterval) {
        ls.lastCycle = performance.now();
        ls.leftIndex = Math.floor(Math.random() * ls.glyphs.length);
        ls.rightIndex = Math.random() < 0.4 ? ls.leftIndex : Math.floor(Math.random() * ls.glyphs.length);
      }
      break;

    case 'rapidTap':
      ls.charge = Math.max(0, ls.charge - ls.decay * 0.2);
      if (ls.charge >= ls.required) {
        completeLevel();
      }
      break;

    case 'sliderBalance':
      ls.bubblePos += (Math.random() - 0.5) * 0.04 + (ls.sliderX * 0.03);
      if (Math.abs(ls.bubblePos) < 0.28) {
        ls.timeBalanced += 0.016;
        if (ls.timeBalanced >= ls.holdTimeNeeded) {
          completeLevel();
        }
      }
      if (Math.abs(ls.bubblePos) > 1.0) {
        failLevel('Balance lost! Keep the gyro indicator inside center.');
      }
      break;

    case 'gravityFlip':
      // Move spikes left
      ls.spikes.forEach(sp => {
        sp.x -= ls.speed;
        // Collision
        if (Math.abs(sp.x - w / 2) < 22) {
          const isCeil = ls.gravityDirection === -1;
          if (isCeil === sp.onCeil) {
            failLevel('Hit spike barrier! Tap to flip gravity.');
          }
        }
      });
      if (ls.spikes.every(sp => sp.x < -40)) {
        completeLevel();
      }
      break;

    case 'darkness':
      if (Math.hypot(ls.torchPos.x - ls.goal.x, ls.torchPos.y - ls.goal.y) < ls.torchRadius + ls.goal.radius) {
        completeLevel();
      }
      break;

    case 'orbitJump':
      if (ls.playerState === 'ORBITING') {
        ls.angle += 0.04;
        ls.playerPos.x = ls.planet.x + Math.cos(ls.angle) * ls.orbitRadius;
        ls.playerPos.y = ls.planet.y + Math.sin(ls.angle) * ls.orbitRadius;
      } else if (ls.playerState === 'LAUNCHED') {
        ls.playerPos.x += ls.playerVel.x;
        ls.playerPos.y += ls.playerVel.y;
        // Check if reaches boundary or dock
        if (ls.playerPos.y < 90) {
          completeLevel();
        } else if (ls.playerPos.x < 0 || ls.playerPos.x > w || ls.playerPos.y > h) {
          failLevel('Lost in space! Launch towards the upper docking bay.');
        }
      }
      break;

    default:
      break;
  }
}

// RENDER LEVEL GRAPHICS
function renderActiveLevel() {
  const ctx = engine.ctx;
  const cfg = engine.currentConfig;
  const ls = engine.levelState;
  const w = engine.width;
  const h = engine.height;
  if (!ctx || !cfg) return;

  ctx.clearRect(0, 0, w, h);

  // Render cosmetic trail
  if (state.equipped.trail !== 'trail_none' && engine.trailPoints.length > 1) {
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(engine.trailPoints[0].x, engine.trailPoints[0].y);
    for (let i = 1; i < engine.trailPoints.length; i++) {
      ctx.lineTo(engine.trailPoints[i].x, engine.trailPoints[i].y);
    }
    ctx.stroke();
  }

  // Mechanic Specific Render
  switch (cfg.type) {
    case 'tapTarget':
      ls.targets.forEach((t, i) => {
        if (!t.hit) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#00f0ff';
          ctx.shadowColor = 'rgba(0, 240, 255, 0.7)';
          ctx.shadowBlur = 18;
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          if (t.num) {
            ctx.fillStyle = '#050811';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(t.num, t.x, t.y);
          }
          ctx.restore();
        }
      });
      break;

    case 'sequence':
      ls.nodes.forEach(nd => {
        if (nd.active) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(nd.x, nd.y, nd.radius, 0, Math.PI * 2);
          ctx.fillStyle = nd.num === ls.nextNum ? '#00f0ff' : 'rgba(255, 255, 255, 0.15)';
          ctx.shadowColor = nd.num === ls.nextNum ? 'rgba(0, 240, 255, 0.8)' : 'transparent';
          ctx.shadowBlur = 16;
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = nd.num === ls.nextNum ? '#050811' : '#ffffff';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(nd.num, nd.x, nd.y);
          ctx.restore();
        }
      });
      break;

    case 'avoidMoving':
      // Render Goal Portal
      ctx.save();
      ctx.beginPath();
      ctx.arc(ls.goal.x, ls.goal.y, ls.goal.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PORTAL', ls.goal.x, ls.goal.y);
      ctx.restore();

      // Render Drones
      ls.drones.forEach(d => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ef476f';
        ctx.shadowColor = '#ef476f';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.restore();
      });

      // Render Player
      renderPlayerBall(ctx, ls.player.x, ls.player.y, ls.player.radius);
      break;

    case 'greenZone': {
      const cx = w / 2;
      const cy = h / 2;
      const r = 90;

      // Outer track
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 14;
      ctx.stroke();

      // Green zone arc
      const startAngle = ls.zoneStart * Math.PI * 2;
      const endAngle = (ls.zoneStart + ls.zoneWidth) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.strokeStyle = '#06d6a0';
      ctx.lineWidth = 14;
      ctx.shadowColor = '#06d6a0';
      ctx.shadowBlur = 15;
      ctx.stroke();

      // Needle / cursor
      const currentA = ls.angle % (Math.PI * 2);
      const nx = cx + Math.cos(currentA) * r;
      const ny = cy + Math.sin(currentA) * r;

      ctx.beginPath();
      ctx.arc(nx, ny, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.fill();

      // Center prompt
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TAP NOW', cx, cy);
      ctx.restore();
      break;
    }

    case 'doors':
      // Prompt Question
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ls.mathQuestion, w / 2, h / 2 - 80);

      // Doors
      ls.doors.forEach(dr => {
        ctx.fillStyle = 'rgba(25, 36, 62, 0.9)';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.fillRect(dr.x, dr.y, dr.w, dr.h);
        ctx.strokeRect(dr.x, dr.y, dr.w, dr.h);

        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(dr.label, dr.x + dr.w / 2, dr.y + dr.h / 2);
      });
      ctx.restore();
      break;

    case 'simonMemory':
      ls.pads.forEach(pd => {
        ctx.save();
        ctx.fillStyle = pd.active ? '#ffffff' : pd.color;
        ctx.shadowColor = pd.color;
        ctx.shadowBlur = pd.active ? 28 : 10;
        ctx.beginPath();
        ctx.roundRect(pd.x, pd.y, 50, 50, 10);
        ctx.fill();
        ctx.restore();
      });
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ls.isShowingSequence ? 'WATCH SEQUENCE...' : 'YOUR TURN!', w / 2, h / 2 + 100);
      break;

    case 'dodgeLane':
      // Lane lines
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ls.lanes.forEach(lx => {
        ctx.beginPath();
        ctx.moveTo(lx, 80);
        ctx.lineTo(lx, h);
        ctx.stroke();
      });

      // Barriers
      ls.waves.forEach(wv => {
        const lx = ls.lanes[wv.lane];
        ctx.fillStyle = '#ef476f';
        ctx.shadowColor = '#ef476f';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.roundRect(lx - wv.w / 2, wv.y - wv.h / 2, wv.w, wv.h, 6);
        ctx.fill();
      });

      // Player
      renderPlayerBall(ctx, ls.lanes[ls.currentLane], ls.playerY, ls.playerRadius);
      ctx.restore();
      break;

    case 'oddOneOut':
      ls.items.forEach(it => {
        ctx.save();
        ctx.beginPath();
        if (it.type === 'shape') {
          if (it.isOdd) {
            // Diamond
            ctx.save();
            ctx.translate(it.x, it.y);
            ctx.rotate(Math.PI / 4);
            ctx.rect(-it.radius * 0.7, -it.radius * 0.7, it.radius * 1.4, it.radius * 1.4);
            ctx.restore();
          } else {
            // Circle
            ctx.arc(it.x, it.y, it.radius, 0, Math.PI * 2);
          }
        } else if (it.type === 'rotation') {
          // Arrow
          ctx.save();
          ctx.translate(it.x, it.y);
          if (it.isOdd) ctx.rotate(Math.PI);
          ctx.moveTo(-it.radius * 0.7, 0);
          ctx.lineTo(it.radius * 0.7, 0);
          ctx.lineTo(it.radius * 0.2, -it.radius * 0.5);
          ctx.moveTo(it.radius * 0.7, 0);
          ctx.lineTo(it.radius * 0.2, it.radius * 0.5);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        } else {
          // Color
          ctx.arc(it.x, it.y, it.radius, 0, Math.PI * 2);
        }

        if (it.type !== 'rotation') {
          ctx.fillStyle = it.isOdd ? '#ffd166' : '#00f0ff';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 10;
          ctx.fill();
        }
        ctx.restore();
      });
      break;

    case 'holdRelease': {
      const cx = w / 2;
      const cy = h / 2;
      const r = 80;

      ctx.save();
      // Circle button
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = ls.isHolding ? '#a855f7' : '#131b2e';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.stroke();

      // Text inside
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ls.handsOff ? 'DO NOT TOUCH' : `${ls.currentHoldSec.toFixed(1)}s`, cx, cy);

      ctx.font = '13px sans-serif';
      ctx.fillStyle = 'var(--text-muted)';
      ctx.fillText(ls.handsOff ? 'WAIT IT OUT' : `TARGET: ${ls.targetTime.toFixed(1)}s`, cx, cy + 30);
      ctx.restore();
      break;
    }

    case 'bossReaction': {
      const cx = w / 2;
      const cy = h / 2;

      ctx.save();
      if (ls.bossState === 'STRIKE') {
        ctx.fillStyle = '#ef476f';
        ctx.shadowColor = '#ef476f';
        ctx.shadowBlur = 35;
        ctx.beginPath();
        ctx.arc(cx, cy, 100, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TAP NOW!', cx, cy);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(cx, cy, 90, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`STRIKES: ${ls.strikesDone} / ${ls.strikesNeeded}`, cx, cy - 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PREPARE TO COUNTER...', cx, cy + 15);
      }
      ctx.restore();
      break;
    }

    case 'catchFalling':
      // Paddle
      ctx.save();
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.roundRect(ls.paddleX - ls.paddleW / 2, ls.paddleY, ls.paddleW, ls.paddleH, 6);
      ctx.fill();

      // Falling items
      ls.items.forEach(it => {
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(it.isHazard ? '💀' : '⭐', it.x, it.y);
      });

      // Score counter
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`CAUGHT: ${ls.caughtStars} / ${ls.targetStars}`, w / 2, 95);
      ctx.restore();
      break;

    case 'avoidFalling':
      // Hazards
      ctx.save();
      ls.hazards.forEach(hz => {
        ctx.beginPath();
        ctx.arc(hz.x, hz.y, hz.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ef476f';
        ctx.shadowColor = '#ef476f';
        ctx.shadowBlur = 12;
        ctx.fill();
      });

      // Player
      renderPlayerBall(ctx, ls.player.x, ls.player.y, ls.player.radius);
      ctx.restore();
      break;

    case 'followPath':
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = ls.pathWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ls.points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Goal
      const goalPt = ls.points[ls.goalIndex];
      ctx.beginPath();
      ctx.arc(goalPt.x, goalPt.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#06d6a0';
      ctx.shadowColor = '#06d6a0';
      ctx.shadowBlur = 15;
      ctx.fill();

      // Player
      renderPlayerBall(ctx, ls.playerPos.x, ls.playerPos.y, 14);
      ctx.restore();
      break;

    case 'colorFilter':
      ls.nodes.forEach(nd => {
        if (nd.active) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(nd.x, nd.y, nd.radius, 0, Math.PI * 2);
          ctx.fillStyle = nd.color === 'blue' ? '#00f0ff' : (nd.color === 'green' ? '#06d6a0' : (nd.color === 'yellow' ? '#ffd166' : '#ef476f'));
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 14;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
      });
      break;

    case 'memoryPairs':
      ls.cards.forEach(cd => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(cd.x, cd.y, cd.w, cd.h, 10);
        if (cd.flipped || cd.matched) {
          ctx.fillStyle = '#131b2e';
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();
          ctx.font = '28px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cd.sym, cd.x + cd.w / 2, cd.y + cd.h / 2);
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', cd.x + cd.w / 2, cd.y + cd.h / 2);
        }
        ctx.restore();
      });
      break;

    case 'movingBridge':
      ctx.save();
      // Chasm lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, ls.bridgeY - 40);
      ctx.lineTo(w, ls.bridgeY - 40);
      ctx.moveTo(0, ls.bridgeY + 40);
      ctx.lineTo(w, ls.bridgeY + 40);
      ctx.stroke();

      // Moving bridge segment
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 15;
      ctx.fillRect(ls.bridgeX - ls.bridgeW / 2, ls.bridgeY - ls.bridgeH / 2, ls.bridgeW, ls.bridgeH);

      // Safe target markers
      ctx.strokeStyle = '#06d6a0';
      ctx.lineWidth = 2;
      ctx.strokeRect(w / 2 - ls.tolerance, ls.bridgeY - ls.bridgeH / 2, ls.tolerance * 2, ls.bridgeH);
      ctx.restore();
      break;

    case 'safeLock': {
      ctx.save();
      const cx = ls.centerX;
      const cy = ls.centerY;
      const r = ls.radius;

      // Dial circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 14;
      ctx.stroke();

      // Safe arc
      ctx.beginPath();
      ctx.arc(cx, cy, r, ls.safeStart, ls.safeStart + ls.safeArc);
      ctx.strokeStyle = '#06d6a0';
      ctx.lineWidth = 14;
      ctx.shadowColor = '#06d6a0';
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Needle
      const currentA = ls.angle % (Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(currentA) * (r + 10), cy + Math.sin(currentA) * (r + 10));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TAP TO LOCK', cx, cy);
      ctx.restore();
      break;
    }

    case 'miniMaze':
      ctx.save();
      // Walls
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ls.walls.forEach(wl => {
        ctx.fillRect(wl.x, wl.y, wl.w, wl.h);
      });

      // Goal
      ctx.beginPath();
      ctx.arc(ls.goal.x, ls.goal.y, ls.goal.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#06d6a0';
      ctx.fill();
      ctx.fillStyle = '#050811';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('F', ls.goal.x, ls.goal.y);

      // Player
      renderPlayerBall(ctx, ls.player.x, ls.player.y, ls.player.radius);
      ctx.restore();
      break;

    case 'symbolMatch': {
      ctx.save();
      const cx = w / 2;
      const cy = h / 2 - 30;

      // Glyphs boxes
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#00f0ff';
      ctx.fillText(ls.glyphs[ls.leftIndex], cx - 60, cy);
      ctx.fillStyle = '#ffd166';
      ctx.fillText(ls.glyphs[ls.rightIndex], cx + 60, cy);

      // Match button
      ctx.fillStyle = '#06d6a0';
      ctx.shadowColor = '#06d6a0';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.roundRect(cx - 75, cy + 90, 150, 48, 24);
      ctx.fill();

      ctx.fillStyle = '#050811';
      ctx.font = '900 16px sans-serif';
      ctx.fillText('MATCH!', cx, cy + 114);
      ctx.restore();
      break;
    }

    case 'rapidTap': {
      const cx = w / 2;
      const cy = h / 2;
      const barW = 200;
      const barH = 20;

      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.roundRect(cx - barW / 2, cy - 80, barW, barH, 10);
      ctx.fill();

      const pct = Math.min(1, ls.charge / ls.required);
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(cx - barW / 2, cy - 80, barW * pct, barH, 10);
      ctx.fill();

      // Hammer button
      ctx.beginPath();
      ctx.arc(cx, cy + 40, 65, 0, Math.PI * 2);
      ctx.fillStyle = '#ef476f';
      ctx.shadowColor = '#ef476f';
      ctx.shadowBlur = 24;
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TAP FAST!', cx, cy + 40);
      ctx.restore();
      break;
    }

    case 'sliderBalance': {
      const cx = w / 2;
      const cy = h / 2;
      const barW = 220;

      ctx.save();
      // Track
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(cx - barW / 2, cy);
      ctx.lineTo(cx + barW / 2, cy);
      ctx.stroke();

      // Green safe center
      ctx.strokeStyle = '#06d6a0';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(cx - barW * 0.15, cy);
      ctx.lineTo(cx + barW * 0.15, cy);
      ctx.stroke();

      // Bubble
      const bx = cx + ls.bubblePos * (barW / 2);
      ctx.beginPath();
      ctx.arc(bx, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd166';
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'gravityFlip':
      ctx.save();
      // Ceil & Floor
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, ls.ceilY - 8, w, 8);
      ctx.fillRect(0, ls.floorY, w, 8);

      // Spikes
      ls.spikes.forEach(sp => {
        ctx.fillStyle = '#ef476f';
        ctx.beginPath();
        if (sp.onCeil) {
          ctx.moveTo(sp.x - sp.w / 2, ls.ceilY);
          ctx.lineTo(sp.x + sp.w / 2, ls.ceilY);
          ctx.lineTo(sp.x, ls.ceilY + sp.h);
        } else {
          ctx.moveTo(sp.x - sp.w / 2, ls.floorY);
          ctx.lineTo(sp.x + sp.w / 2, ls.floorY);
          ctx.lineTo(sp.x, ls.floorY - sp.h);
        }
        ctx.fill();
      });

      // Player
      const pY = ls.gravityDirection === 1 ? ls.floorY - 14 : ls.ceilY + 14;
      renderPlayerBall(ctx, w / 2, pY, 14);
      ctx.restore();
      break;

    case 'darkness':
      ctx.save();
      // Dark room
      ctx.fillStyle = 'rgba(5, 8, 16, 0.98)';
      ctx.fillRect(0, 0, w, h);

      // Torch hole
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(ls.torchPos.x, ls.torchPos.y, ls.torchRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // Goal crystal
      ctx.beginPath();
      ctx.arc(ls.goal.x, ls.goal.y, ls.goal.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd166';
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.restore();
      break;

    case 'orbitJump':
      ctx.save();
      // Planet
      ctx.beginPath();
      ctx.arc(ls.planet.x, ls.planet.y, ls.planet.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#131b2e';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 4;
      ctx.fill();
      ctx.stroke();

      // Orbit ring
      ctx.beginPath();
      ctx.arc(ls.planet.x, ls.planet.y, ls.orbitRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Upper Docking Bay
      ctx.fillStyle = '#06d6a0';
      ctx.fillRect(w / 2 - 50, 75, 100, 16);

      // Player
      renderPlayerBall(ctx, ls.playerPos.x, ls.playerPos.y, 12);
      ctx.restore();
      break;

    case 'bossBattle': {
      const cx = ls.coreX;
      const cy = ls.coreY;
      ctx.save();
      // Core Boss
      ctx.beginPath();
      ctx.arc(cx, cy, ls.coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#ef476f';
      ctx.shadowColor = '#ef476f';
      ctx.shadowBlur = 24;
      ctx.fill();

      // Shields
      for (let s = 0; s < ls.shields; s++) {
        const sr = ls.coreRadius + 18 + s * 12;
        ctx.beginPath();
        ctx.arc(cx, cy, sr, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ls.bossName, cx, cy - 8);
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`SHIELDS: ${ls.shields}`, cx, cy + 14);
      ctx.restore();
      break;
    }

    default:
      break;
  }
}

// RENDER COSMETIC PLAYER BALL
function renderPlayerBall(ctx, x, y, radius) {
  const equippedBallId = state.equipped.ball;
  const ballData = COSMETICS.balls.find(b => b.id === equippedBallId) || COSMETICS.balls[0];

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = ballData.color;
  ctx.shadowColor = ballData.glow;
  ctx.shadowBlur = 18;
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// ==================================================
// POINTER & TOUCH EVENT HANDLERS
// ==================================================
function setupInputListeners() {
  const stage = document.getElementById('game-stage-container');
  if (!stage) return;

  const getCanvasCoords = e => {
    const rect = engine.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      x: Math.max(0, Math.min(engine.width, x)),
      y: Math.max(0, Math.min(engine.height, y))
    };
  };

  stage.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (!engine.isRunning || engine.isPaused) return;

    engine.pointerDown = true;
    const pos = getCanvasCoords(e);
    engine.pointerPos = pos;
    engine.pointerStart = { ...pos };

    // Record trail
    engine.trailPoints = [pos];

    handleGameInteraction('down', pos);
  });

  window.addEventListener('pointermove', e => {
    if (!engine.pointerDown || !engine.isRunning || engine.isPaused) return;
    const pos = getCanvasCoords(e);
    engine.pointerPos = pos;

    engine.trailPoints.push(pos);
    if (engine.trailPoints.length > 8) engine.trailPoints.shift();

    handleGameInteraction('move', pos);
  });

  window.addEventListener('pointerup', e => {
    if (!engine.pointerDown) return;
    engine.pointerDown = false;
    const pos = getCanvasCoords(e);
    handleGameInteraction('up', pos);
    engine.trailPoints = [];
  });

  window.addEventListener('pointercancel', () => {
    engine.pointerDown = false;
    engine.trailPoints = [];
  });
}

function handleGameInteraction(type, pos) {
  const cfg = engine.currentConfig;
  const ls = engine.levelState;
  const w = engine.width;
  if (!cfg || !ls) return;

  switch (cfg.type) {
    case 'tapTarget':
      if (type === 'down') {
        let hitAny = false;
        ls.targets.forEach(t => {
          if (!t.hit && Math.hypot(t.x - pos.x, t.y - pos.y) <= t.radius + 14) {
            if (ls.sizeOrder) {
              if (t.num === ls.currentExpected) {
                t.hit = true;
                ls.currentExpected++;
                ls.remaining--;
                hitAny = true;
                soundTap();
                triggerVibrate(15);
              } else {
                failLevel('Wrong order! Must tap from smallest to largest.');
              }
            } else {
              t.hit = true;
              ls.remaining--;
              hitAny = true;
              soundTap();
              triggerVibrate(15);
            }
          }
        });
        if (hitAny && ls.remaining <= 0) {
          completeLevel();
        }
      }
      break;

    case 'sequence':
      if (type === 'down') {
        const targetNode = ls.nodes.find(nd => nd.num === ls.nextNum && nd.active);
        if (targetNode && Math.hypot(targetNode.x - pos.x, targetNode.y - pos.y) <= targetNode.radius + 15) {
          targetNode.active = false;
          ls.nextNum++;
          soundTap();
          triggerVibrate(20);
          if (ls.nextNum > ls.total) {
            completeLevel();
          }
        } else {
          // Check if wrong node was tapped
          const anyNode = ls.nodes.find(nd => nd.active && Math.hypot(nd.x - pos.x, nd.y - pos.y) <= nd.radius + 15);
          if (anyNode) {
            failLevel('Wrong sequence! Follow numbers in ascending order.');
          }
        }
      }
      break;

    case 'avoidMoving':
      if (type === 'move' || type === 'down') {
        const dx = pos.x - engine.pointerStart.x;
        const dy = pos.y - engine.pointerStart.y;
        engine.pointerStart = { ...pos };

        ls.player.x += ls.invertX ? -dx : dx;
        ls.player.y += dy;
        ls.player.x = Math.max(ls.player.radius, Math.min(w - ls.player.radius, ls.player.x));
        ls.player.y = Math.max(100, Math.min(engine.height - ls.player.radius, ls.player.y));
      }
      break;

    case 'greenZone':
      if (type === 'down') {
        const currentNorm = (ls.angle % (Math.PI * 2)) / (Math.PI * 2);
        const inZone = currentNorm >= ls.zoneStart && currentNorm <= (ls.zoneStart + ls.zoneWidth);
        if (inZone) {
          ls.hitsDone++;
          soundTap();
          triggerVibrate(25);
          if (ls.hitsDone >= ls.hitsNeeded) {
            completeLevel();
          } else {
            showToast('Hit 1! Hit again!', '⚡');
          }
        } else {
          failLevel('Missed the green zone! Time your tap precisely.');
        }
      }
      break;

    case 'doors':
      if (type === 'down') {
        ls.doors.forEach(dr => {
          if (pos.x >= dr.x && pos.x <= dr.x + dr.w && pos.y >= dr.y && pos.y <= dr.y + dr.h) {
            if (dr.isCorrect) {
              soundTap();
              completeLevel();
            } else {
              failLevel('Wrong door! Look closely at the clue.');
            }
          }
        });
      }
      break;

    case 'simonMemory':
      if (type === 'down' && !ls.isShowingSequence) {
        ls.pads.forEach(pd => {
          if (pos.x >= pd.x && pos.x <= pd.x + 50 && pos.y >= pd.y && pos.y <= pd.y + 50) {
            flashSimonPad(pd.id);
            soundTap();
            triggerVibrate(15);
            if (pd.id === ls.sequence[ls.userIndex]) {
              ls.userIndex++;
              if (ls.userIndex >= ls.sequence.length) {
                completeLevel();
              }
            } else {
              failLevel('Wrong pad pressed! Remember the light order.');
            }
          }
        });
      }
      break;

    case 'dodgeLane':
      if (type === 'down') {
        const dx = pos.x - w / 2;
        if (dx < -30) {
          ls.currentLane = ls.invertControls ? Math.min(2, ls.currentLane + 1) : Math.max(0, ls.currentLane - 1);
          soundTap();
          triggerVibrate(15);
        } else if (dx > 30) {
          ls.currentLane = ls.invertControls ? Math.max(0, ls.currentLane - 1) : Math.min(2, ls.currentLane + 1);
          soundTap();
          triggerVibrate(15);
        }
      }
      break;

    case 'oddOneOut':
      if (type === 'down') {
        ls.items.forEach(it => {
          if (Math.hypot(it.x - pos.x, it.y - pos.y) <= it.radius + 10) {
            if (it.isOdd) {
              soundTap();
              triggerVibrate(25);
              completeLevel();
            } else {
              failLevel('Not that one! Find the single distinct shape.');
            }
          }
        });
      }
      break;

    case 'holdRelease':
      if (type === 'down') {
        ls.isHolding = true;
        ls.holdStartTime = performance.now();
        soundTap();
        triggerVibrate(15);
      } else if (type === 'up') {
        if (ls.isHolding) {
          ls.isHolding = false;
          const diff = Math.abs(ls.currentHoldSec - ls.targetTime);
          if (diff <= ls.tolerance) {
            completeLevel();
          } else {
            failLevel(`Released at ${ls.currentHoldSec.toFixed(1)}s! Target was ${ls.targetTime.toFixed(1)}s.`);
          }
        }
      }
      break;

    case 'bossReaction':
      if (type === 'down') {
        if (ls.bossState === 'STRIKE') {
          clearTimeout(reactionTimeout);
          ls.strikesDone++;
          ls.bossState = 'WAITING';
          soundSuccess();
          triggerVibrate([40, 40, 40]);
          if (ls.strikesDone >= ls.strikesNeeded) {
            completeLevel();
          } else {
            showToast(`Deflected strike ${ls.strikesDone}!`, '🛡️');
            scheduleNextReactionPrompt();
          }
        } else {
          failLevel('Tapped too early! Wait for the STRIKE signal.');
        }
      }
      break;

    case 'catchFalling':
      if (type === 'move' || type === 'down') {
        ls.paddleX = Math.max(ls.paddleW / 2, Math.min(w - ls.paddleW / 2, pos.x));
      }
      break;

    case 'avoidFalling':
      if (type === 'move' || type === 'down') {
        ls.player.x = Math.max(ls.player.radius, Math.min(w - ls.player.radius, pos.x));
      }
      break;

    case 'followPath':
      if (type === 'move' || type === 'down') {
        ls.playerPos = { ...pos };
        const goal = ls.points[ls.goalIndex];
        if (Math.hypot(pos.x - goal.x, pos.y - goal.y) < 26) {
          completeLevel();
        }
      }
      break;

    case 'colorFilter':
      if (type === 'down') {
        ls.nodes.forEach(nd => {
          if (nd.active && Math.hypot(nd.x - pos.x, nd.y - pos.y) <= nd.radius + 12) {
            if (nd.isTarget) {
              nd.active = false;
              ls.remainingTargets--;
              soundTap();
              triggerVibrate(15);
              if (ls.remainingTargets <= 0) {
                completeLevel();
              }
            } else {
              failLevel(`Tapped wrong color! Objective is only ${cfg.config.targetColor.toUpperCase()}.`);
            }
          }
        });
      }
      break;

    case 'memoryPairs':
      if (type === 'down' && !ls.lockInput) {
        ls.cards.forEach(cd => {
          if (!cd.flipped && !cd.matched) {
            if (pos.x >= cd.x && pos.x <= cd.x + cd.w && pos.y >= cd.y && pos.y <= cd.y + cd.h) {
              cd.flipped = true;
              soundTap();
              triggerVibrate(15);

              if (!ls.firstFlipped) {
                ls.firstFlipped = cd;
              } else {
                // Second card picked
                ls.lockInput = true;
                if (ls.firstFlipped.sym === cd.sym) {
                  soundCoin();
                  cd.matched = true;
                  ls.firstFlipped.matched = true;
                  ls.pairsFound++;
                  ls.firstFlipped = null;
                  ls.lockInput = false;
                  if (ls.pairsFound >= ls.totalPairs) {
                    completeLevel();
                  }
                } else {
                  setTimeout(() => {
                    cd.flipped = false;
                    if (ls.firstFlipped) ls.firstFlipped.flipped = false;
                    ls.firstFlipped = null;
                    ls.lockInput = false;
                  }, 650);
                }
              }
            }
          }
        });
      }
      break;

    case 'movingBridge':
      if (type === 'down' && !ls.locked) {
        ls.locked = true;
        const diff = Math.abs(ls.bridgeX - w / 2);
        if (diff <= ls.tolerance) {
          soundSuccess();
          triggerVibrate(30);
          completeLevel();
        } else {
          failLevel('Bridge misaligned! Fell into the chasm.');
        }
      }
      break;

    case 'safeLock':
      if (type === 'down') {
        const currentA = ls.angle % (Math.PI * 2);
        const inArc = currentA >= ls.safeStart && currentA <= (ls.safeStart + ls.safeArc);
        if (inArc) {
          soundSuccess();
          triggerVibrate(30);
          completeLevel();
        } else {
          failLevel('Lock jammed! Needle was outside the safe sector.');
        }
      }
      break;

    case 'miniMaze':
      if (type === 'move' || type === 'down') {
        const dx = pos.x - engine.pointerStart.x;
        const dy = pos.y - engine.pointerStart.y;
        engine.pointerStart = { ...pos };
        ls.player.x += dx;
        ls.player.y += ls.invertY ? -dy : dy;
      }
      break;

    case 'symbolMatch':
      if (type === 'down') {
        const isMatch = ls.leftIndex === ls.rightIndex;
        if (isMatch) {
          soundCoin();
          triggerVibrate(25);
          ls.matchesDone++;
          if (ls.matchesDone >= ls.targetMatches) {
            completeLevel();
          } else {
            showToast('Match 1 confirmed! Match again!', '✨');
          }
        } else {
          failLevel('Symbols did not match! Look for identical holograms.');
        }
      }
      break;

    case 'rapidTap':
      if (type === 'down') {
        ls.charge += 10;
        soundTap();
        triggerVibrate(15);
      }
      break;

    case 'sliderBalance':
      if (type === 'move' || type === 'down') {
        ls.sliderX = (pos.x - w / 2) / (w / 2);
      }
      break;

    case 'gravityFlip':
      if (type === 'down') {
        ls.gravityDirection *= -1;
        soundTap();
        triggerVibrate(20);
      }
      break;

    case 'darkness':
      if (type === 'move' || type === 'down') {
        ls.torchPos = { ...pos };
      }
      break;

    case 'orbitJump':
      if (type === 'down' && ls.playerState === 'ORBITING') {
        ls.playerState = 'LAUNCHED';
        soundTap();
        triggerVibrate(25);
        ls.playerVel = {
          x: Math.cos(ls.angle) * 8,
          y: Math.sin(ls.angle) * 8
        };
      }
      break;

    case 'bossBattle':
      if (type === 'down') {
        if (Math.hypot(pos.x - ls.coreX, pos.y - ls.coreY) <= ls.coreRadius + 30) {
          ls.shields--;
          soundBoss();
          triggerVibrate(40);
          if (ls.shields <= 0) {
            completeLevel();
          }
        }
      }
      break;

    default:
      break;
  }
}

// ==================================================
// LEVEL COMPLETION & RETRY SYSTEM
// ==================================================
function completeLevel(stars = 3) {
  stopTimer();
  engine.isRunning = false;

  const elapsed = (performance.now() - engine.levelStartTime) / 1000;
  let finalStars = 3;
  if (engine.mistakes > 0 || elapsed > engine.totalTime * 0.75) finalStars = 2;
  if (elapsed > engine.totalTime * 0.9) finalStars = 1;

  const coinsAwarded = 10 + (finalStars === 3 ? 5 : 0) + (engine.currentConfig.isBoss ? 20 : 0);
  const scoreAwarded = finalStars * 50 + Math.floor((engine.totalTime - elapsed) * 10);

  state.totalCoins += coinsAwarded;
  state.bestScore += scoreAwarded;
  state.levelsCompleted++;
  if (finalStars === 3) state.perfectLevels++;

  // Record Level Status
  const prevData = state.completedLevels[engine.currentLevelId];
  if (!prevData || prevData.stars < finalStars) {
    const starDiff = finalStars - (prevData ? prevData.stars : 0);
    state.totalStars += starDiff;
    state.completedLevels[engine.currentLevelId] = {
      stars: finalStars,
      score: scoreAwarded,
      time: elapsed
    };
  }

  // Milestone Progression
  if (engine.currentLevelId === state.highestLevel) {
    state.highestLevel++;
  }

  saveGameData();
  soundLevelUp();
  triggerVibrate([40, 50, 40]);

  showCompleteOverlay(finalStars, coinsAwarded, scoreAwarded);
}

function showCompleteOverlay(stars, coins, score) {
  const overlay = document.getElementById('overlay-complete');
  const levelLabel = document.getElementById('complete-level-label');
  const coinsPill = document.getElementById('reward-coins-pill');
  const scorePill = document.getElementById('reward-score-pill');

  if (levelLabel) levelLabel.textContent = `Level ${engine.currentLevelId}`;
  if (coinsPill) coinsPill.textContent = `+${coins} COINS 🪙`;
  if (scorePill) scorePill.textContent = `+${score} PTS`;

  // Animated stars
  for (let s = 1; s <= 3; s++) {
    const starEl = document.getElementById(`star-${s}`);
    if (starEl) {
      starEl.classList.toggle('earned', s <= stars);
    }
  }

  if (overlay) overlay.classList.add('active');
}

function failLevel(tip) {
  stopTimer();
  engine.isRunning = false;
  state.totalRetries++;
  saveGameData();

  soundFail();
  triggerVibrate(80);

  const overlay = document.getElementById('overlay-failed');
  const levelLabel = document.getElementById('failed-level-label');
  const tipEl = document.getElementById('failed-tip');

  if (levelLabel) levelLabel.textContent = `Level ${engine.currentLevelId}`;
  if (tipEl) tipEl.textContent = tip || 'Obstacle hit! Try again.';

  if (overlay) overlay.classList.add('active');
}

function retryLevel() {
  hideAllOverlays();
  startLevel(engine.currentLevelId, engine.isDaily);
}

function nextLevel() {
  hideAllOverlays();
  startLevel(engine.currentLevelId + 1, false);
}

function hideAllOverlays() {
  document.querySelectorAll('.modal-overlay').forEach(ov => ov.classList.remove('active'));
}

// PAUSE & RESUME
function pauseGame() {
  if (!engine.isRunning || engine.isPaused) return;
  engine.isPaused = true;
  document.getElementById('overlay-pause')?.classList.add('active');
}

function resumeGame() {
  engine.isPaused = false;
  document.getElementById('overlay-pause')?.classList.remove('active');
}

// DAILY CHALLENGE GENERATOR
function launchDailyChallenge() {
  const today = new Date().toISOString().split('T')[0];
  const dateSeed = today.split('-').reduce((acc, part) => acc * 31 + parseInt(part, 10), 7);
  const dailyLevelNum = 5000 + (dateSeed % 500);

  startLevel(dailyLevelNum, true);
}

// RESET PROGRESS CONFIRMATION
function resetAllProgress() {
  const confirmMsg = 'Are you sure you want to reset all game progress, coins, and levels? This cannot be undone.';
  if (window.confirm(confirmMsg)) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    state.highestLevel = 1;
    state.completedLevels = {};
    state.totalCoins = 0;
    state.totalStars = 0;
    state.bestScore = 0;
    state.gamesPlayed = 0;
    state.levelsCompleted = 0;
    state.perfectLevels = 0;
    state.totalRetries = 0;
    state.equipped = { ball: 'ball_cyan', target: 'target_ring', trail: 'trail_glow', theme: 'neon' };
    state.inventory = ['ball_cyan', 'target_ring', 'trail_glow', 'neon'];
    applyTheme('neon');
    saveGameData();
    showToast('Progress reset successfully.', '🔄');
    showScreen('screen-home');
    updateHomeUI();
  }
}

// ==================================================
// INITIALIZATION ON LOAD
// ==================================================
function init() {
  loadGameData();
  applyTheme(state.theme);
  setSoundEnabled(state.soundEnabled);
  initCanvases();
  setupInputListeners();
  renderAmbientBackground();

  // Settings Toggles sync
  const toggleSound = document.getElementById('toggle-sound');
  const toggleVibration = document.getElementById('toggle-vibration');
  const toggleMotion = document.getElementById('toggle-motion');

  if (toggleSound) toggleSound.classList.toggle('on', state.soundEnabled);
  if (toggleVibration) toggleVibration.classList.toggle('on', state.vibrationEnabled);
  if (toggleMotion) toggleMotion.classList.toggle('on', state.reducedMotion);

  // Setup Button Handlers
  setupButtonListeners();

  // Loading Screen Animation
  const bar = document.getElementById('loading-bar');
  if (bar) {
    setTimeout(() => { bar.style.width = '100%'; }, 100);
  }

  setTimeout(() => {
    if (!state.onboardingDone) {
      engine.onboardingStep = 0;
      updateOnboardingUI();
      showScreen('screen-onboarding');
    } else {
      showScreen('screen-home');
      updateHomeUI();
    }
  }, 1300);

  // Tab Visibility Auto-pause
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && engine.isRunning && !engine.isPaused) {
      pauseGame();
    }
  });
}

function setupButtonListeners() {
  // Sound Toggles
  const toggleSoundFn = () => {
    initAudio();
    state.soundEnabled = !state.soundEnabled;
    setSoundEnabled(state.soundEnabled);
    saveGameData();
    updateHomeUI();
    const gameSoundBtn = document.getElementById('btn-game-sound');
    if (gameSoundBtn) gameSoundBtn.textContent = state.soundEnabled ? '🔊' : '🔇';
    const toggleSwitch = document.getElementById('toggle-sound');
    if (toggleSwitch) toggleSwitch.classList.toggle('on', state.soundEnabled);
    showToast(state.soundEnabled ? 'Sound Enabled' : 'Sound Muted', state.soundEnabled ? '🔊' : '🔇');
  };

  document.getElementById('btn-sound-toggle-home')?.addEventListener('click', toggleSoundFn);
  document.getElementById('btn-game-sound')?.addEventListener('click', toggleSoundFn);

  // Settings Toggles
  document.getElementById('toggle-sound')?.addEventListener('click', toggleSoundFn);
  document.getElementById('toggle-vibration')?.addEventListener('click', () => {
    state.vibrationEnabled = !state.vibrationEnabled;
    document.getElementById('toggle-vibration')?.classList.toggle('on', state.vibrationEnabled);
    saveGameData();
    if (state.vibrationEnabled) triggerVibrate(30);
    showToast(state.vibrationEnabled ? 'Vibration On' : 'Vibration Off', '📳');
  });
  document.getElementById('toggle-motion')?.addEventListener('click', () => {
    state.reducedMotion = !state.reducedMotion;
    document.getElementById('toggle-motion')?.classList.toggle('on', state.reducedMotion);
    saveGameData();
  });

  // Themes in Settings
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      soundClick();
      applyTheme(btn.dataset.theme);
    });
  });

  // Reset Progress
  document.getElementById('btn-reset-data')?.addEventListener('click', resetAllProgress);

  // Navigation Buttons
  document.getElementById('btn-onboard-next')?.addEventListener('click', () => {
    initAudio();
    soundClick();
    if (engine.onboardingStep < 3) {
      engine.onboardingStep++;
      updateOnboardingUI();
    } else {
      state.onboardingDone = true;
      saveGameData();
      showScreen('screen-home');
      updateHomeUI();
    }
  });

  document.getElementById('btn-home-play')?.addEventListener('click', () => {
    soundClick();
    startLevel(state.highestLevel);
  });

  document.getElementById('btn-home-levels')?.addEventListener('click', () => {
    soundClick();
    currentLevelTab = Math.floor((state.highestLevel - 1) / 25);
    renderLevelSelect();
    showScreen('screen-levels');
  });

  document.getElementById('btn-home-daily')?.addEventListener('click', () => {
    soundClick();
    launchDailyChallenge();
  });

  document.getElementById('btn-home-shop')?.addEventListener('click', () => {
    soundClick();
    renderShop();
    showScreen('screen-shop');
  });

  document.getElementById('btn-home-stats')?.addEventListener('click', () => {
    soundClick();
    renderStats();
    showScreen('screen-stats');
  });

  document.getElementById('btn-home-settings')?.addEventListener('click', () => {
    soundClick();
    showScreen('screen-settings');
  });

  // Back to Home Buttons
  document.getElementById('btn-levels-back')?.addEventListener('click', () => {
    soundClick();
    showScreen('screen-home');
    updateHomeUI();
  });
  document.getElementById('btn-shop-back')?.addEventListener('click', () => {
    soundClick();
    showScreen('screen-home');
    updateHomeUI();
  });
  document.getElementById('btn-stats-back')?.addEventListener('click', () => {
    soundClick();
    showScreen('screen-home');
    updateHomeUI();
  });
  document.getElementById('btn-settings-back')?.addEventListener('click', () => {
    soundClick();
    showScreen('screen-home');
    updateHomeUI();
  });

  // Shop Category Tabs
  document.querySelectorAll('.shop-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      soundClick();
      document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentShopTab = tab.dataset.tab;
      renderShop();
    });
  });

  // Intro Modal Start
  document.getElementById('btn-intro-start')?.addEventListener('click', () => {
    launchLevelGameplay();
  });

  // Pause Controls
  document.getElementById('btn-game-pause')?.addEventListener('click', () => {
    soundClick();
    pauseGame();
  });
  document.getElementById('btn-pause-resume')?.addEventListener('click', () => {
    soundClick();
    resumeGame();
  });
  document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
    hideAllOverlays();
    startLevel(engine.currentLevelId, engine.isDaily);
  });
  document.getElementById('btn-pause-levels')?.addEventListener('click', () => {
    hideAllOverlays();
    currentLevelTab = Math.floor((state.highestLevel - 1) / 25);
    renderLevelSelect();
    showScreen('screen-levels');
  });
  document.getElementById('btn-pause-home')?.addEventListener('click', () => {
    hideAllOverlays();
    showScreen('screen-home');
    updateHomeUI();
  });

  // Complete Controls
  document.getElementById('btn-complete-next')?.addEventListener('click', () => {
    soundClick();
    nextLevel();
  });
  document.getElementById('btn-complete-replay')?.addEventListener('click', () => {
    soundClick();
    retryLevel();
  });
  document.getElementById('btn-complete-levels')?.addEventListener('click', () => {
    soundClick();
    hideAllOverlays();
    currentLevelTab = Math.floor((state.highestLevel - 1) / 25);
    renderLevelSelect();
    showScreen('screen-levels');
  });

  // Failed Controls (RETRY IS PRIMARY)
  document.getElementById('btn-failed-retry')?.addEventListener('click', () => {
    soundClick();
    retryLevel();
  });
  document.getElementById('btn-failed-levels')?.addEventListener('click', () => {
    soundClick();
    hideAllOverlays();
    currentLevelTab = Math.floor((state.highestLevel - 1) / 25);
    renderLevelSelect();
    showScreen('screen-levels');
  });
  document.getElementById('btn-failed-home')?.addEventListener('click', () => {
    soundClick();
    hideAllOverlays();
    showScreen('screen-home');
    updateHomeUI();
  });
}

// Boot game on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
