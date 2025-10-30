// =============================
// Clean Water Catch - Project 6
// =============================

// ---------- Difficulty Config ----------
const DIFFICULTY = {
  easy:   { time: 45, spawn: 900, speedMin: 1.6, speedMax: 2.6, pollutedPct: 0.25, win: 120 },
  normal: { time: 30, spawn: 800, speedMin: 2.0, speedMax: 3.2, pollutedPct: 0.30, win: 150 },
  hard:   { time: 20, spawn: 650, speedMin: 2.6, speedMax: 4.0, pollutedPct: 0.45, win: 180 }
};

// ---------- State ----------
let score = 0;
let timeLeft = DIFFICULTY.normal.time;
let gameActive = false;
let timerId = null;
let spawnId = null;
let currentMode = 'normal';
const shownMilestones = new Set();

// Milestones (LevelUp): array + conditionals
const milestones = [
  { score: 50,  text: '💧 771 million people lack access to clean water.' },
  { score: 100, text: '🚰 charity: water brings clean water to communities worldwide.' },
  { score: 150, text: '🌍 Clean water transforms health, education, and opportunity.' },
  { score: 200, text: '🧒 Time saved from collecting water helps kids stay in school.' }
];

// ---------- Elements ----------
const scoreEl   = document.getElementById('score');
const timerEl   = document.getElementById('timer');
const gameArea  = document.getElementById('game-area');
const messageEl = document.getElementById('message');
const startBtn  = document.getElementById('start-btn');
const resetBtn  = document.getElementById('reset-btn');
const modeSel   = document.getElementById('mode');
const confetti  = document.getElementById('confetti');
const ctx       = confetti.getContext('2d');

// ---------- Canvas Sizing ----------
function sizeCanvas(){
  confetti.width  = window.innerWidth;
  confetti.height = window.innerHeight;
}
sizeCanvas();
window.addEventListener('resize', sizeCanvas);

// ---------- Audio (LevelUp: Sound Effects via Web Audio) ----------
let audioCtx = null;
function ensureAudio(){
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playTone(freq = 660, duration = 0.12, type = 'sine', volume = 0.08){
  ensureAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  setTimeout(()=>{ osc.stop(); }, duration * 1000);
}
function playSuccess(){ playTone(740, 0.11, 'sine', 0.12); }
function playFail(){    playTone(160, 0.16, 'square', 0.12); }
function playWin(){
  // small arpeggio
  playTone(660, 0.10, 'sine', 0.14);
  setTimeout(()=>playTone(880, 0.10, 'sine', 0.14), 120);
  setTimeout(()=>playTone(990, 0.12, 'triangle', 0.14), 240);
}

// ---------- Game Control ----------
function applyMode(mode){
  currentMode = mode;
  const cfg = DIFFICULTY[mode];
  timeLeft = cfg.time;
  timerEl.textContent = timeLeft;
}

function startGame(){
  if (gameActive) return;
  // init state
  shownMilestones.clear();
  gameActive = true;
  score = 0;
  applyMode(modeSel.value);
  scoreEl.textContent = score;
  messageEl.textContent = '';
  messageEl.style.color = '#2E9DF7';
  gameArea.innerHTML = '';
  startBtn.style.display = 'none';
  resetBtn.style.display = 'inline-block';

  timerId = setInterval(tick, 1000);
  spawnId = setInterval(spawnDrop, DIFFICULTY[currentMode].spawn);
}

function endGame(showFinal = true){
  gameActive = false;
  clearInterval(timerId);
  clearInterval(spawnId);
  timerId = spawnId = null;

  if (showFinal){
    messageEl.style.color = '#2E9DF7';
    messageEl.textContent = `Time’s up! Final Score: ${score}`;
  }
  startBtn.style.display = 'inline-block';
  resetBtn.style.display = 'none';
  stopConfetti();
}

function resetGame(){
  endGame(false);
  score = 0;
  applyMode(modeSel.value);
  scoreEl.textContent = score;
  messageEl.textContent = '';
  gameArea.innerHTML = '';
}

// ---------- Timer ----------
function tick(){
  if (timeLeft <= 0){
    endGame(true);
    return;
  }
  timeLeft--;
  timerEl.textContent = timeLeft;
}

// ---------- Helpers: visual feedback ----------
function flyText(text, color, x, y){
  const f = document.createElement('div');
  f.className = 'fly';
  f.textContent = text;
  f.style.color = color;
  f.style.left = `${x}px`;
  f.style.top = `${y}px`;
  document.body.appendChild(f);
  setTimeout(()=>f.remove(), 650);
}
function splash(x, y){
  const s = document.createElement('div');
  s.className = 'splash';
  s.style.left = `${x}px`;
  s.style.top  = `${y}px`;
  document.body.appendChild(s);
  setTimeout(()=>s.remove(), 460);
}

// ---------- Spawning & Interaction ----------
function spawnDrop(){
  if (!gameActive) return;

  const cfg = DIFFICULTY[currentMode];
  const isClean = Math.random() < (1 - cfg.pollutedPct);
  const drop = document.createElement('div');
  drop.className = `drop ${isClean ? 'clean' : 'polluted'}`;

  // random horizontal position inside gameArea
  const maxLeft = gameArea.clientWidth - 48;
  drop.style.left = `${Math.max(0, Math.random() * maxLeft)}px`;
  gameArea.appendChild(drop);

  // fall loop
  let y = -60;
  const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
  const fallId = setInterval(() => {
    if (!gameActive){
      clearInterval(fallId);
      drop.remove();
      return;
    }
    y += speed;
    drop.style.top = `${y}px`;

    // off screen bottom
    if (y > gameArea.clientHeight){
      clearInterval(fallId);
      drop.remove();
    }
  }, 20);

  // click handler
  drop.addEventListener('click', (e) => {
    if (!gameActive) return;
    clearInterval(fallId);
    drop.remove();

    // position for fly text/splash
    const r = drop.getBoundingClientRect();
    const cx = r.left + r.width/2;
    const cy = r.top + r.height/2;

    if (isClean){
      score += 10;
      scoreEl.textContent = score;
      messageEl.style.color = '#159A48';
      messageEl.textContent = '+10 Clean Water!';
      flyText('+10', '#159A48', cx, cy);
      splash(cx, cy);
      playSuccess();
    } else {
      score -= 15;
      scoreEl.textContent = score;
      messageEl.style.color = '#F5402C';
      messageEl.textContent = '-15 Polluted Drop!';
      flyText('-15', '#F5402C', cx, cy);
      splash(cx, cy);
      playFail();
    }

    showMilestones();
    checkWinCelebrate();
  }, { once:true });
}

// ---------- Milestones ----------
function showMilestones(){
  for (const m of milestones){
    if (score >= m.score && !shownMilestones.has(m.score)){
      shownMilestones.add(m.score);
      messageEl.style.color = '#2E9DF7';
      messageEl.textContent = m.text;
      break;
    }
  }
}

// ---------- Celebrate Wins (Confetti) ----------
let confettiParts = [];
let confettiLoopId = null;

function startConfetti(){
  confettiParts = [];
  const colors = ['#FFC907','#2E9DF7','#4FCB53','#FF902A','#F5402C'];

  for (let i=0; i<180; i++){
    confettiParts.push({
      x: Math.random() * confetti.width,
      y: -10 - Math.random() * 200,
      size: 5 + Math.random() * 6,
      speed: 2 + Math.random() * 3,
      rot: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random()*colors.length)]
    });
  }

  if (confettiLoopId) cancelAnimationFrame(confettiLoopId);
  const draw = () => {
    ctx.clearRect(0,0,confetti.width, confetti.height);
    confettiParts.forEach(p=>{
      p.y += p.speed;
      p.rot += p.rotSpeed;
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
    });
    confettiParts = confettiParts.filter(p => p.y < confetti.height + 20);
    if (confettiParts.length > 0){
      confettiLoopId = requestAnimationFrame(draw);
    }
  };
  draw();
  // auto stop after 4 seconds
  setTimeout(stopConfetti, 4000);
}
function stopConfetti(){
  if (confettiLoopId) cancelAnimationFrame(confettiLoopId);
  confettiLoopId = null;
  ctx.clearRect(0,0,confetti.width, confetti.height);
}
function checkWinCelebrate(){
  const winScore = DIFFICULTY[currentMode].win;
  if (score >= winScore && gameActive){
    messageEl.style.color = '#159A48';
    messageEl.textContent = `You reached ${winScore}! 🎉`;
    startConfetti();
    playWin();
  }
}

// ---------- Events ----------
startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetGame);
modeSel.addEventListener('change', (e)=> {
  // apply immediately if not running; else take effect next round
  if (!gameActive) applyMode(e.target.value);
});
