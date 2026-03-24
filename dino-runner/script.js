// Étape 13 + sons

const dino = document.getElementById("dino");
const cactus = document.getElementById("cactus");
const bird = document.getElementById("bird");
const scoreBoard = document.getElementById("scoreBoard");
const game = document.getElementById("game");
const startScreen = document.getElementById("startScreen");

// Sons
const jumpSound = document.getElementById("jumpSound");
const runSound = document.getElementById("runSound");
const gameOverSound = document.getElementById("gameOverSound");

let isJumping = false;
let isGameOver = false;
let isStarted = false;

let cactusPosition = 900;
let birdPosition = 1200;

let speed = 5;

let score = 0;
let bestScore = localStorage.getItem("bestScore") || 0;

scoreBoard.innerHTML = `Score : 0<br>Best : ${bestScore}`;

// Écran Game Over
const gameOverScreen = document.createElement("div");
gameOverScreen.id = "gameOverScreen";
gameOverScreen.innerHTML = `
    <div>GAME OVER</div>
    <button id="restartBtn">Rejouer</button>
`;
game.appendChild(gameOverScreen);

// Fonction de saut
function jump() {
    if (!isStarted || isJumping || isGameOver) return;

    isJumping = true;

    jumpSound.currentTime = 0;
    jumpSound.play();

    dino.classList.remove("run");
    dino.classList.add("jump");

    setTimeout(() => {
        dino.classList.remove("jump");
        if (!isGameOver) dino.classList.add("run");
        isJumping = false;
    }, 600);
}

// Choisir un cactus aléatoire
function randomCactus() {
    const types = ["cactus-small", "cactus-medium", "cactus-large"];
    const choice = types[Math.floor(Math.random() * types.length)];

    cactus.className = "";
    cactus.classList.add(choice);
}

// Choisir hauteur oiseau
function randomBirdHeight() {
    const heights = [80, 140];
    bird.style.bottom = heights[Math.floor(Math.random() * heights.length)] + "px";
}

// Mode nuit automatique
function updateNightMode() {
    if (score % 20 === 0 && score !== 0) {
        game.classList.toggle("night");
    }
}

// Mise à jour du score + difficulté
function updateScore() {
    score++;

    if (score % 5 === 0) {
        speed += 0.5;
    }

    updateNightMode();

    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("bestScore", bestScore);
    }

    scoreBoard.innerHTML = `Score : ${score}<br>Best : ${bestScore}`;
}

// Déplacement du cactus
function moveCactus() {
    if (!isStarted || isGameOver) return;

    cactusPosition -= speed;
    cactus.style.right = cactusPosition + "px";

    if (cactusPosition < -60) {
        cactusPosition = 900;
        randomCactus();
        updateScore();
    }

    requestAnimationFrame(moveCactus);
}

// Déplacement de l’oiseau
function moveBird() {
    if (!isStarted || isGameOver) return;

    birdPosition -= speed + 1;
    bird.style.right = birdPosition + "px";

    if (birdPosition < -80) {
        birdPosition = 1200;
        randomBirdHeight();
    }

    requestAnimationFrame(moveBird);
}

// Collision
function checkCollision() {
    if (!isStarted || isGameOver) return;

    const dinoRect = dino.getBoundingClientRect();
    const cactusRect = cactus.getBoundingClientRect();
    const birdRect = bird.getBoundingClientRect();

    const collideCactus =
        dinoRect.left < cactusRect.right &&
        dinoRect.right > cactusRect.left &&
        dinoRect.bottom > cactusRect.top &&
        dinoRect.top < cactusRect.bottom;

    const collideBird =
        dinoRect.left < birdRect.right &&
        dinoRect.right > birdRect.left &&
        dinoRect.bottom > birdRect.top &&
        dinoRect.top < birdRect.bottom;

    if (collideCactus || collideBird) {
        gameOver();
        return;
    }

    requestAnimationFrame(checkCollision);
}

// Game Over
function gameOver() {
    isGameOver = true;

    runSound.pause();
    gameOverSound.currentTime = 0;
    gameOverSound.play();

    dino.classList.remove("run");
    dino.style.filter = "grayscale(100%)";
    gameOverScreen.style.display = "flex";
}

// Démarrer le jeu
function startGame() {
    if (isStarted) return;

    isStarted = true;
    startScreen.style.display = "none";

    runSound.currentTime = 0;
    runSound.play();

    dino.classList.add("run");
    bird.classList.add("bird-fly");

    randomCactus();
    randomBirdHeight();

    moveCactus();
    moveBird();
    checkCollision();
}

// Restart
document.addEventListener("click", (event) => {
    if (event.target.id === "restartBtn") {
        location.reload();
    }
});

// Touches
document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        if (!isStarted) startGame();
        else jump();
    }

    if (event.code === "ArrowUp") {
        jump();
    }
});