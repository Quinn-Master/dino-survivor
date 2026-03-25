// Dino Survivor - script.js
// Assumptions:
// - assets/dino-sprite.png exists (4 frames horizontal, each 88x94 by default)
// - assets/dino-runner_run.mp3, assets/gameover.mp3, assets/jump.mp3 exist

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const skinBtn = document.getElementById('skinBtn');
const restartBtn = document.getElementById('restartBtn');
const overlay = document.getElementById('overlay');

const W = canvas.width;
const H = canvas.height;

let lastTime = 0;
let gameSpeed = 6;
let gravity = 0.9;
let running = false;
let score = 0;

// Sprite and sounds
const sprite = new Image();
sprite.src = 'assets/dino-sprite.png';

const sounds = {
  run: new Audio('assets/dino-runner_run.mp3'),
  hit: new Audio('assets/gameover.mp3'),
  jump: new Audio('assets/jump.mp3')
};

// Sprite configuration (adjust frameW/frameH if your frames differ)
const spriteConfig = {
  frames: 4,
  frameW: 88,
  frameH: 94,
  orientation: 'horizontal' // horizontal sheet with 4 frames side-by-side
};

// Player object
const player = {
  x: 50,
  y: H - spriteConfig.frameH * 0.6 - 20,
  vy: 0,
  w: spriteConfig.frameW * 0.6,
  h: spriteConfig.frameH * 0.6,
  grounded: true,
  frame: 0,
  frameTimer: 0,
  frameInterval: 100,
  skinIndex: 0
};

function resetPlayerSize(){
  player.w = spriteConfig.frameW * 0.6;
  player.h = spriteConfig.frameH * 0.6;
  player.y = H - player.h - 20;
}
resetPlayerSize();

// Ground and obstacles
const groundY = H - 20;
let obstacles = [];
let spawnTimer = 0;
let spawnInterval = 1200;

// Spawn obstacle
function spawnObstacle(){
  const h = 20 + Math.random()*40;
  const w = 18 + Math.random()*30;
  obstacles.push({
    x: W + 20,
    y: groundY - h,
    w, h
  });
}

// Input
document.addEventListener('keydown', e=>{
  if(e.code === 'Space' || e.code === 'ArrowUp'){
    e.preventDefault();
    jump();
  }
  if(e.code === 'KeyP'){ running = !running; }
});
canvas.addEventListener('click', jump);
skinBtn.addEventListener('click', ()=>{ player.skinIndex = (player.skinIndex + 1) % spriteConfig.frames; });
restartBtn.addEventListener('click', ()=>{ resetGame(); });

// Jump
function jump(){
  if(!running) return;
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

// Score sound throttle
let lastScorePing = 0;

// Update loop
function update(dt){
  if(!running) return;

  // physics
  player.vy += gravity;
  player.y += player.vy;
  if(player.y + player.h >= groundY){
    player.y = groundY - player.h;
    player.vy = 0;
    player.grounded = true;
  }

  // animate frames
  player.frameTimer += dt;
  if(player.frameTimer > player.frameInterval){
    player.frameTimer = 0;
    player.frame = (player.frame + 1) % spriteConfig.frames;
  }

  // obstacles spawn
  spawnTimer += dt;
  if(spawnTimer > spawnInterval){
    spawnTimer = 0;
    spawnInterval = 900 + Math.random()*900;
    spawnObstacle();
  }

  // move obstacles and check collisions
  for(let i=obstacles.length-1;i>=0;i--){
    obstacles[i].x -= gameSpeed;
    if(obstacles[i].x + obstacles[i].w < -50) obstacles.splice(i,1);
    if(rectsCollide(player, obstacles[i])){
      // hit
      playSound(sounds.hit);
      running = false;
      setTimeout(()=>{ resetGame(); }, 800);
    }
  }

  // score increases with time and speed
  score += dt * 0.01 * (gameSpeed/6);
  const newScore = Math.floor(score);
  scoreEl.textContent = newScore;

  // play run sound loop softly while running
  if(!sounds.run.paused){
    // keep it playing
  } else {
    // start looped run sound at low volume
    sounds.run.loop = true;
    sounds.run.volume = 0.25;
    sounds.run.play().catch(()=>{});
  }

  // optional score ping every 100 points
  if(newScore > 0 && newScore % 100 === 0 && newScore !== lastScorePing){
    lastScorePing = newScore;
    // no score sound provided by user; could use run or jump as placeholder
  }
}

// Reset game
function resetGame(){
  obstacles = [];
  score = 0;
  running = true;
  gameSpeed = 6;
  spawnInterval = 1200;
  player.y = H - player.h - 20;
  player.vy = 0;
  player.grounded = true;
  player.frame = 0;
  lastTime = performance.now();
}

// Draw
function draw(){
  // clear
  ctx.clearRect(0,0,W,H);

  // background
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(0,0,W,H);

  // ground
  ctx.fillStyle = '#e9e9e9';
  ctx.fillRect(0, groundY, W, H-groundY);

  // obstacles
  ctx.fillStyle = '#333';
  obstacles.forEach(o=>{
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });

  // draw player from sprite sheet
  const sx = player.frame * spriteConfig.frameW;
  const sy = 0;
  const dw = player.w;
  const dh = player.h;
  ctx.drawImage(sprite, sx, sy, spriteConfig.frameW, spriteConfig.frameH, player.x, player.y, dw, dh);

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(player.x + dw/2, groundY + 6, dw/2, 6, 0, 0, Math.PI*2);
  ctx.fill();
}

// Main loop
function loop(ts){
  const dt = ts - lastTime;
  lastTime = ts;
  update(dt);
  draw();
  if(running) requestAnimationFrame(loop);
}

// Sound helper
function playSound(s){
  try{
    s.currentTime = 0;
    s.play();
  }catch(e){}
}

// Preload assets and start
let assetsLoaded = 0;
const totalAssets = 1 + Object.keys(sounds).length; // 1 image + n sounds

sprite.onload = () => { assetsLoaded++; checkStart(); };
sprite.onerror = () => { overlay.textContent = 'Erreur chargement image'; };

Object.values(sounds).forEach(s => {
  // canplaythrough may not fire for some browsers; use loadeddata as fallback
  const onLoad = () => { assetsLoaded++; checkStart(); s.removeEventListener('canplaythrough', onLoad); s.removeEventListener('loadeddata', onLoad); };
  s.addEventListener('canplaythrough', onLoad, { once: true });
  s.addEventListener('loadeddata', onLoad, { once: true });
  s.addEventListener('error', ()=>{ /* ignore individual sound errors */ }, { once: true });
});

function checkStart(){
  if(assetsLoaded >= totalAssets){
    overlay.classList.add('hidden');
    // start game loop
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  } else {
    overlay.classList.remove('hidden');
    overlay.textContent = `Chargement des assets… (${assetsLoaded}/${totalAssets})`;
  }
}

// If assets never load, allow manual start after 3s
setTimeout(()=>{
  if(!running && assetsLoaded > 0){
    overlay.classList.add('hidden');
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
}, 3000);
