const dino = document.getElementById("dino");
const cactus = document.getElementById("cactus");
const bird = document.getElementById("bird");
const scoreBoard = document.getElementById("scoreBoard");
const highScoreBoard = document.getElementById("highScoreBoard");
const startScreen = document.getElementById("startScreen");

const jumpSound = document.getElementById("jumpSound");
const runSound = document.getElementById("runSound");
const gameOverSound = document.getElementById("gameOverSound");

let gameRunning = false;
let score = 0;
let highScore = 0;
let speed = 1.5;

document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        if (!gameRunning) startGame();
        jump();
    }
});

function startGame() {
    gameRunning = true;
    startScreen.style.display = "none";
    runSound.play();

    score = 0;
    speed = 1.5;

    cactus.style.right = "-60px";
    bird.style.right = "-80px";

    cactusMove();
    birdMove();
    scoreLoop();
}

function jump() {
    if (!dino.classList.contains("jump")) {
        dino.classList.add("jump");
        jumpSound.play();
        setTimeout(() => dino.classList.remove("jump"), 550);
    }
}

function cactusMove() {
    if (!gameRunning) return;

    cactus.style.transition = "none";
    cactus.style.right = "-60px";

    setTimeout(() => {
        cactus.style.transition = `right ${speed}s linear`;
        cactus.style.right = "950px";
    }, 50);

    setTimeout(cactusMove, speed * 1000);
}

function birdMove() {
    if (!gameRunning) return;

    bird.style.transition = "none";
    bird.style.right = "-80px";

    setTimeout(() => {
        bird.style.transition = `right ${speed + 0.5}s linear`;
        bird.style.right = "950px";
    }, 50);

    setTimeout(birdMove, (speed + 0.5) * 1000);
}

function scoreLoop() {
    if (!gameRunning) return;

    score++;
    scoreBoard.textContent = score;

    if (score % 200 === 0) speed = Math.max(0.8, speed - 0.1);

    checkCollision();

    requestAnimationFrame(scoreLoop);
}

function checkCollision() {
    const dinoRect = dino.getBoundingClientRect();
    const cactusRect = cactus.getBoundingClientRect();
    const birdRect = bird.getBoundingClientRect();

    if (isColliding(dinoRect, cactusRect) || isColliding(dinoRect, birdRect)) {
        gameOver();
    }
}

function isColliding(a, b) {
    return !(
        a.right < b.left ||
        a.left > b.right ||
        a.bottom < b.top ||
        a.top > b.bottom
    );
}

function gameOver() {
    gameRunning = false;
    runSound.pause();
    gameOverSound.play();

    if (score > highScore) {
        highScore = score;
        highScoreBoard.textContent = "Meilleur : " + highScore;
    }

    startScreen.textContent = "Game Over — ESPACE pour rejouer";
    startScreen.style.display = "block";
}
