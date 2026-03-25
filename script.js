// --- Préchargement résilient ---
const soundFiles = ['dino-runner_run.mp3','gameover.mp3','jump.mp3'];
const sounds = {};
let assetsLoaded = 0;
const totalAssets = 1 + soundFiles.length; // 1 image + n sons

sprite.onload = () => {
  console.log('sprite loaded');
  assetsLoaded++;
  checkStart();
};
sprite.onerror = () => {
  console.error('Erreur chargement sprite');
  assetsLoaded++;
  checkStart();
};

soundFiles.forEach(name => {
  const s = new Audio('assets/' + name);
  sounds[name.split('.')[0]] = s;
  const onLoad = () => {
    console.log(name + ' loaded');
    assetsLoaded++;
    checkStart();
    s.removeEventListener('loadeddata', onLoad);
  };
  s.addEventListener('loadeddata', onLoad, { once: true });
  s.addEventListener('error', () => {
    console.warn('Erreur chargement son', name);
    assetsLoaded++;
    checkStart();
  }, { once: true });
});

// Fallback : démarrer après 2.5s même si certains sons n'ont pas déclenché loadeddata
setTimeout(() => {
  if (!running && assetsLoaded > 0) {
    console.warn('Fallback start: assetsLoaded=', assetsLoaded);
    overlay.classList.add('hidden');
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
}, 2500);

function checkStart(){
  overlay.textContent = `Chargement des assets… (${assetsLoaded}/${totalAssets})`;
  if(assetsLoaded >= totalAssets){
    overlay.classList.add('hidden');
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
}
