// Dino Survivor - script.js (version complète, autonome si pas de sprite)
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const skinBtn = document.getElementById('skinBtn');
const restartBtn = document.getElementById('restartBtn');
const pauseBtn = document.getElementById('pauseBtn');
const overlay = document.getElementById('overlay');

const W = canvas.width;
const H = canvas.height;
const groundY = H - 20;

let lastTime = 0;
let running = false; // game running (map scrolls) — starts when user presses Space
let paused = false;
let gameSpeed = 6;
let gravity = 0.9;
let score = 0;
let bestScore = parseInt(localStorage.getItem('dino_best') || '0', 10);

// Assets (only sounds required)
const soundFiles = {
  run: 'assets/dino-runner_run.mp3',
  hit: 'assets/gameover.mp3',
  jump: 'assets/jump.mp3'
};
const sounds = {};
let assetsLoaded = 0;
const totalAssets = Object.keys(soundFiles).length + 1; // +1 for optional sprite

// Sprite sheet (optional). If absent, fallback to procedural dino.
const sprite = new Image();
sprite.src = 'assets/dino-sprite.png'; // if you delete it, code falls back automatically
let useSprite = true;
const spriteConfig = { frames: 4, frameW: 88, frameH: 94, orientation: 'horizontal' };

// Player (dimensions will be set after sprite check)
const player = {
  x: 50,
  y: 0,
  vy: 0,
  w: 0,
  h: 0,
  grounded: true,
  frame: 0,
  frameTimer: 0,
  frameInterval: 100,
  skinIndex: 0 // alternate color/skin when no sprite
};

function resetPlayerSize(){
  if(useSprite){
    player.w = spriteConfig.frameW * 0.6;
    player.h = spriteConfig.frameH * 0.6;
  } else {
    player.w = 44;
    player.h = 44;
  }
  player.y = groundY - player.h;
}
resetPlayerSize();

// Obstacles (cactus types)
let obstacles = [];
let spawnTimer = 0;
let spawnInterval = 1200;

// Spawn cactus with types
function spawnObstacle(){
  const type = Math.random();
  if(type < 0.5){
    // small cactus
    obstacles.push({ x: W + 20, w: 18, h: 30, y: groundY - 30 });
  } else if(type < 0.85){
    // tall cactus
    obstacles.push({ x: W + 20, w: 24, h: 48, y: groundY - 48 });
  } else {
    // double cactus (two stacked)
    obstacles.push({ x: W + 20, w: 28, h: 60, y: groundY - 60 });
  }
}

// Input handling
let keys = {};
document.addEventListener('keydown', e=>{
  if(e.code === 'Space' || e.code === 'ArrowUp'){
    e.preventDefault();
    if(!running){
      running = true; // start map scrolling on first space
    }
    jump();
  }
  if(e.code === 'KeyP'){
    togglePause();
  }
});
canvas.addEventListener('click', ()=>{
  if(!running) running = true;
  jump();
});
skinBtn.addEventListener('click', ()=>{ player.skinIndex = (player.skinIndex + 1) % 4; });
restartBtn.addEventListener('click', ()=>{ resetGame(); });
pauseBtn.addEventListener('click', ()=>{ togglePause(); });

function togglePause(){
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  if(!paused && running){
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
}

function jump(){
  if(!running || paused) return;
  if(player.grounded){
    player.vy = -14;
    player.grounded = false;
    playSound(sounds.jump);
  }
}

// Collision helper
function rectsCollide(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Update
function update(dt){
  if(!running || paused) return;

  // physics
  player.vy += gravity;
  player.y += player.vy;
  if(player.y + player.h >= groundY){
    player.y = groundY - player.h;
    player.vy = 0;
    player.grounded = true;
  }

  // animate player frames
  player.frameTimer += dt;
  if(player.frameTimer > player.frameInterval){
    player.frameTimer = 0;
    player.frame = (player.frame + 1) % (useSprite ? spriteConfig.frames : 4);
  }

  // spawn obstacles
  spawnTimer += dt;
  if(spawnTimer > spawnInterval){
    spawnTimer = 0;
    spawnInterval = Math.max(600, 900 + Math.random()*900 - score*2); // difficulty scales
    spawnObstacle();
  }

  // move obstacles and collisions
  for(let i = obstacles.length - 1; i >= 0; i--){
    obstacles[i].x -= gameSpeed;
    if(obstacles[i].x + obstacles[i].w < -50) obstacles.splice(i,1);
    if(rectsCollide(player, obstacles[i])){
      // hit
      playSound(sounds.hit);
      running = false;
      // update best
      if(Math.floor(score) > bestScore){
        bestScore = Math.floor(score);
        localStorage.setItem('dino_best', bestScore);
        bestEl.textContent = `Best: ${bestScore}`;
      }
      // brief pause then reset
      setTimeout(()=>{ resetGame(); }, 800);
    }
  }

  // score increases with time and speed
  score += dt * 0.01 * (gameSpeed / 6);
  scoreEl.textContent = Math.floor(score);

  // gradually increase speed
  if(Math.floor(score) % 200 === 0){
    gameSpeed = 6 + Math.floor(score / 200);
  }
}

// Draw
function draw(){
  // clear
  ctx.clearRect(0,0,W,H);

  // background sky
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(0,0,W,H);

  // parallax ground (simple repeating pattern)
  drawGround();

  // obstacles
  ctx.fillStyle = '#333';
  obstacles.forEach(o=>{
    ctx.fillRect(o.x, o.y, o.w, o.h);
    // small highlight
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(o.x + 2, o.y + 2, o.w - 4, o.h - 4);
    ctx.fillStyle = '#333';
  });

  // draw player (sprite if available, otherwise procedural)
  if(useSprite && sprite.complete && sprite.naturalWidth >= spriteConfig.frameW * spriteConfig.frames){
    const sx = player.frame * spriteConfig.frameW;
    const sy = 0;
    ctx.drawImage(sprite, sx, sy, spriteConfig.frameW, spriteConfig.frameH, player.x, player.y, player.w, player.h);
  } else {
    drawProceduralDino();
  }

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(player.x + player.w/2, groundY + 6, player.w/2, 6, 0, 0, Math.PI*2);
  ctx.fill();
}

// Ground drawing (repeating line + small stones)
let groundOffset = 0;
function drawGround(){
  // scroll ground only when running
  if(running && !paused) groundOffset = (groundOffset + gameSpeed) % 40;
  ctx.fillStyle = '#e9e9e9';
  ctx.fillRect(0, groundY, W, H - groundY);
  // dashed line
  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for(let x = -groundOffset; x < W; x += 20){
    ctx.moveTo(x, groundY + 6);
    ctx.lineTo(x + 10, groundY + 6);
  }
  ctx.stroke();
}

// Procedural dino (4-frame animation fallback)
function drawProceduralDino(){
  const x = player.x, y = player.y, w = player.w, h = player.h;
  // body
  const skin = player.skinIndex;
  const colors = ['#2b8a3e','#2b6ea8','#8a2b2b','#444'];
  ctx.fillStyle = colors[skin % colors.length];
  ctx.fillRect(x, y + h*0.2, w, h*0.6); // torso
  // head
  ctx.fillRect(x + w*0.6, y, w*0.4, h*0.4);
  // tail
  ctx.fillRect(x - w*0.25, y + h*0.35, w*0.25, h*0.15);
  // legs (animated)
  ctx.fillStyle = '#111';
  const frame = player.frame % 4;
  if(frame === 0){
    ctx.fillRect(x + w*0.15, y + h*0.75, w*0.18, h*0.25);
    ctx.fillRect(x + w*0.6, y + h*0.75, w*0.18, h*0.25);
  } else if(frame === 1){
    ctx.fillRect(x + w*0.12, y + h*0.78, w*0.18, h*0.22);
    ctx.fillRect(x + w*0.62, y + h*0.72, w*0.18, h*0.28);
  } else if(frame === 2){
    ctx.fillRect(x + w*0.18, y + h*0.72, w*0.18, h*0.28);
    ctx.fillRect(x + w*0.58, y + h*0.78, w*0.18, h*0.22);
  } else {
    ctx.fillRect(x + w*0.15, y + h*0.75, w*0.18, h*0.25);
    ctx.fillRect(x + w*0.6, y + h*0.75, w*0.18, h*0.25);
  }
  // eye
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + w*0.78, y + h*0.08, w*0.06, h*0.06);
  ctx.fillStyle = '#000';
  ctx.fillRect(x + w*0.79, y + h*0.09, w*0.03, h*0.03);
}

// Main loop
function loop(ts){
  if(!lastTime) lastTime = ts;
  const dt = ts - lastTime;
  lastTime = ts;
  update(dt);
  draw();
  if(running && !paused) requestAnimationFrame(loop);
}

// Sound helper (safe play)
function playSound(s){
  if(!s) return;
  try{
    s.currentTime = 0;
    s.play().catch(()=>{});
  }catch(e){}
}

// Preload sounds and optional sprite
function preload(){
  overlay.classList.remove('hidden');
  overlay.textContent = 'Chargement des assets…';
  // load sounds
  Object.entries(soundFiles).forEach(([key, path])=>{
    const a = new Audio(path);
    sounds[key] = a;
    const onLoad = () => {
      assetsLoaded++;
      checkStart();
      a.removeEventListener('loadeddata', onLoad);
    };
    a.addEventListener('loadeddata', onLoad, { once: true });
    a.addEventListener('error', ()=>{
      // still count it to avoid blocking start
      assetsLoaded++;
      checkStart();
    }, { once: true });
  });

  // sprite optional
  sprite.addEventListener('load', ()=>{
    // verify width enough for frames
    if(sprite.naturalWidth >= spriteConfig.frameW * spriteConfig.frames && sprite.naturalHeight >= spriteConfig.frameH){
      useSprite = true;
    } else {
      useSprite = false;
    }
    assetsLoaded++;
    checkStart();
  }, { once: true });
  sprite.addEventListener('error', ()=>{
    useSprite = false;
    assetsLoaded++;
    checkStart();
  }, { once: true });
}

function checkStart(){
  overlay.textContent = `Chargement des assets… (${assetsLoaded}/${totalAssets})`;
  if(assetsLoaded >= totalAssets){
    overlay.classList.add('hidden');
    resetGame();
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
}

// Reset game state
function resetGame(){
  obstacles = [];
  spawnTimer = 0;
  spawnInterval = 1200;
  score = 0;
  gameSpeed = 6;
  player.frame = 0;
  resetPlayerSize();
  player.y = groundY - player.h;
  player.vy = 0;
  player.grounded = true;
  running = false; // wait for first Space to start scrolling
  paused = false;
  scoreEl.textContent = '0';
  bestEl.textContent = `Best: ${bestScore}`;
}

// Initialize
preload();

// Safety fallback: if assets take too long, start anyway after 2.5s
setTimeout(()=>{
  if(assetsLoaded === 0){
    overlay.classList.add('hidden');
    useSprite = false;
    resetGame();
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
}, 2500);
