// DOM Elements
const game = document.querySelector(".game");
const startScreen = document.querySelector(".start-screen");
const btnPlay = document.querySelector(".btn-play");
const kongContainer = document.querySelector(".kong-container");
const kong = document.querySelector(".kong");
const obstaculo = document.querySelector(".obstaculo");
const hog = document.querySelector(".hog");
const gameOver = document.querySelector(".game-over");
const btnReplay = document.getElementById("btn-replay");
const btnHome = document.getElementById("btn-home");
const jumpCounter = document.getElementById("jump-counter");
const scoreContainer = document.querySelector(".score-container");
const skyToucans = document.querySelectorAll(".tucano-sky");

// Game State Variables
let gameActive = false;
let temMontaria = false;
let hogAtivo = false;
let proximoHogTime = 0;
let jumpCount = 0;
let isJumping = false;
let isInvulnerable = false;
let loopId;

// Bounding box collision helper
const checkCollision = (rectA, rectB, padA = {}, padB = {}) => {
    const a = {
        left: rectA.left + (padA.left || 0),
        right: rectA.right - (padA.right || 0),
        top: rectA.top + (padA.top || 0),
        bottom: rectA.bottom - (padA.bottom || 0)
    };
    const b = {
        left: rectB.left + (padB.left || 0),
        right: rectB.right - (padB.right || 0),
        top: rectB.top + (padB.top || 0),
        bottom: rectB.bottom - (padB.bottom || 0)
    };

    return (
        a.left < b.right &&
        a.right > b.left &&
        a.top < b.bottom &&
        a.bottom > b.top
    );
};

// Check collision specifically for obstacles
const checkObstacleCollision = () => {
    const rectKong = kongContainer.getBoundingClientRect();
    const rectObstacle = obstaculo.getBoundingClientRect();
    
    // Apply visual paddings for a fair hitbox matching scaled up 155x155 Kong container
    const padKong = { left: 40, right: 40, top: 35, bottom: 5 };
    
    let padObstacle;
    if (obstaculo.src.includes('pedra.png')) {
        // Padded hitboxes for the larger 85x61 stone obstacle
        padObstacle = { left: 15, right: 15, top: 12, bottom: 0 };
    } else {
        // Padded hitboxes for the taller 65x68 toucan obstacle
        padObstacle = { left: 10, right: 10, top: 10, bottom: 0 };
    }
    
    return checkCollision(rectKong, rectObstacle, padKong, padObstacle);
};

// Check collision specifically for the hog mount
const checkHogCollision = () => {
    const rectKong = kongContainer.getBoundingClientRect();
    const rectHog = hog.getBoundingClientRect();
    
    // Apply paddings matching larger sizes
    const padKong = { left: 25, right: 25, top: 20, bottom: 5 };
    const padHog = { left: 10, right: 10, top: 10, bottom: 0 };
    
    return checkCollision(rectKong, rectHog, padKong, padHog);
};

// Randomize obstacle type (Tucano vs Pedra)
const randomizeObstacle = () => {
    const isTucano = Math.random() < 0.5;
    if (isTucano) {
        obstaculo.src = './assets/tucano.gif';
        obstaculo.style.width = '65px';
        obstaculo.style.height = '68px'; // Elongated vertically to compensate for not being widened
        obstaculo.style.transform = 'scaleX(-1)'; // Invert toucan so it flies forward
    } else {
        obstaculo.src = './assets/pedra.png';
        obstaculo.style.width = '85px'; // Scaled up size (previously 60px)
        obstaculo.style.height = '61px'; // Scaled up size (previously 43px)
        obstaculo.style.transform = 'none'; // Keep stone normal
    }
};

// Jump function
const jump = () => {
    if (isJumping || !gameActive) return;

    isJumping = true;
    jumpCount++;
    jumpCounter.textContent = jumpCount;

    if (temMontaria) {
        kongContainer.classList.add("pular-rider");
        setTimeout(() => {
            kongContainer.classList.remove("pular-rider");
            isJumping = false;
        }, 700); // Duration of rider jump (matches CSS animation)
    } else {
        kongContainer.classList.add("pular");
        setTimeout(() => {
            kongContainer.classList.remove("pular");
            isJumping = false;
        }, 550); // Duration of normal jump (matches CSS animation)
    }
};

// Handle equipping the mount
const coletarHog = () => {
    temMontaria = true;
    kong.src = './assets/kongrider.gif';
    
    // Deactivate hog
    hog.classList.remove("ativo");
    hogAtivo = false;
};

// Sacrifice the mount (triggered when hit while riding)
const perderMontaria = () => {
    temMontaria = false;
    kong.src = './assets/kong.gif';
    
    // Grant brief invulnerability blinking
    isInvulnerable = true;
    kong.classList.add("invulneravel");
    setTimeout(() => {
        kong.classList.remove("invulneravel");
        isInvulnerable = false;
    }, 1500);

    // Schedule next hog spawn
    proximoHogTime = Date.now() + 10000 + Math.random() * 8000;
};

// Main Game Loop
const gameLoop = () => {
    if (!gameActive) return;

    // 1. Spawning Hog Mount
    if (!temMontaria && !hogAtivo && Date.now() > proximoHogTime) {
        hogAtivo = true;
        hog.classList.add("ativo");
    }

    // 2. Obstacle Collision
    if (!isInvulnerable && checkObstacleCollision()) {
        if (temMontaria) {
            perderMontaria();
        } else {
            endGame();
            return;
        }
    }

    // 3. Hog Mount Collision
    if (hogAtivo && !temMontaria && checkHogCollision()) {
        coletarHog();
    }

    loopId = requestAnimationFrame(gameLoop);
};

// Game Over handler
const endGame = () => {
    gameActive = false;
    cancelAnimationFrame(loopId);

    // Pause all scrolling and element movements via CSS rule
    game.classList.add("paused");

    // Reset jump counter display to 0 immediately upon death ("redefinindo ao morrer")
    jumpCounter.textContent = '0';

    // Show dead kong asset
    kong.src = './assets/deadkong.gif';

    // Show Game Over Overlay
    gameOver.style.visibility = 'visible';
};

// Start Screen Transition helpers
const hideGameElements = () => {
    kongContainer.classList.add("hidden");
    obstaculo.classList.add("hidden");
    hog.classList.add("hidden");
    scoreContainer.classList.add("hidden");
    skyToucans.forEach(el => el.classList.add("hidden"));
};

const showGameElements = () => {
    kongContainer.classList.remove("hidden");
    obstaculo.classList.remove("hidden");
    hog.classList.remove("hidden");
    scoreContainer.classList.remove("hidden");
    skyToucans.forEach(el => el.classList.remove("hidden"));
};

// Restart Game / Start Run
const restart = () => {
    // Reset HUD
    jumpCounter.textContent = '0';
    gameOver.style.visibility = 'hidden';

    // Reset variables
    gameActive = true;
    temMontaria = false;
    hogAtivo = false;
    isJumping = false;
    isInvulnerable = false;
    jumpCount = 0;
    proximoHogTime = Date.now() + 8000 + Math.random() * 8000;

    // Remove classes and reset images
    game.classList.remove("paused");
    kongContainer.className = "kong-container";
    kong.className = "kong";
    kong.src = './assets/kong.gif';

    // Reset hog
    hog.classList.remove("ativo");

    // Force-restart the obstacle CSS animation
    obstaculo.style.animation = 'none';
    void obstaculo.offsetWidth; // Reflow to reset animation
    obstaculo.style.animation = ''; // Restores default stylesheet animation

    // Randomize first obstacle and run loop
    randomizeObstacle();
    
    cancelAnimationFrame(loopId);
    gameLoop();
};

// Go back to Home / Start Screen
const goHome = () => {
    gameOver.style.visibility = 'hidden';
    startScreen.classList.remove("hidden");
    hideGameElements();

    // Reset states completely
    gameActive = false;
    temMontaria = false;
    hogAtivo = false;
    isJumping = false;
    isInvulnerable = false;
    jumpCount = 0;
    jumpCounter.textContent = '0';

    // Remove animations/classes
    game.classList.remove("paused");
    kongContainer.className = "kong-container";
    kong.className = "kong";
    kong.src = './assets/kong.gif';
    hog.classList.remove("ativo");

    // Disable obstacle animation
    obstaculo.style.animation = 'none';

    // Cancel loop
    cancelAnimationFrame(loopId);
};

// Event Listeners
obstaculo.addEventListener("animationiteration", randomizeObstacle);

hog.addEventListener("animationend", () => {
    hog.classList.remove("ativo");
    hogAtivo = false;
    proximoHogTime = Date.now() + 10000 + Math.random() * 8000;
});

// Jump Controls
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.key === " ") {
        jump();
    }
});

document.addEventListener("touchstart", (e) => {
    // Prevent jumps when clicking buttons
    if (e.target !== btnReplay && e.target !== btnHome && e.target !== btnPlay) {
        jump();
    }
});

document.addEventListener("mousedown", (e) => {
    // Prevent jumps when clicking buttons
    if (e.target !== btnReplay && e.target !== btnHome && e.target !== btnPlay) {
        jump();
    }
});

// Button Click Event Listeners
btnPlay.addEventListener("click", () => {
    startScreen.classList.add("hidden");
    showGameElements();
    restart();
});

btnReplay.addEventListener("click", restart);
btnHome.addEventListener("click", goHome);

// Initial Setup: show start screen, hide game elements
hideGameElements();
obstaculo.style.animation = 'none';