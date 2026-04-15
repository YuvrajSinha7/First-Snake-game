const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("high-score");
const gameOverlay = document.getElementById("game-overlay");
const startOverlay = document.getElementById("start-overlay");
const restartBtn = document.getElementById("restart-btn");
const startBtn = document.getElementById("start-btn");
const overlayScore = document.getElementById("overlay-score");
const overlayText = document.getElementById("overlay-text");

// Game Configuration
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE; // 400 / 20 = 20
let GAME_SPEED = 120; // ms

// Snake Configuration
let snake = [];
let snakeLength = 3;
let dx = 0;
let dy = -1;
let nextDx = 0;
let nextDy = -1;

// Food Configuration
let foodX = 0;
let foodY = 0;

// Game State
let lastRenderTime = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameOver = false;
let gameStarted = false;
let gameLoopRequest;

highScoreElement.textContent = highScore;

// Initialize
function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    snakeLength = 3;
    dx = 0;
    dy = -1;
    nextDx = 0;
    nextDy = -1;
    score = 0;
    GAME_SPEED = 120;
    scoreElement.textContent = score;
    gameOver = false;
    placeFood();
    
    // Initial draw before loop starts
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFood();
    drawSnake();
}

function startGame() {
    initGame();
    gameStarted = true;
    startOverlay.classList.add("hidden");
    gameOverlay.classList.add("hidden");
    gameLoopRequest = requestAnimationFrame(main);
}

function main(currentTime) {
    if (gameOver) {
        handleGameOver();
        return;
    }

    gameLoopRequest = requestAnimationFrame(main);

    const msSinceLastRender = (currentTime - lastRenderTime);
    if (msSinceLastRender < GAME_SPEED) return;

    lastRenderTime = currentTime;

    update();
    draw();
}

function update() {
    // Apply queued direction changes
    dx = nextDx;
    dy = nextDy;

    // Calculate new head position
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall collision
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver = true;
        return;
    }

    // Self collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver = true;
            return;
        }
    }

    // Add new head
    snake.unshift(head);

    // Food collision
    if (head.x === foodX && head.y === foodY) {
        score += 10;
        scoreElement.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        // Increase speed slightly
        if (GAME_SPEED > 50) GAME_SPEED -= 2; 
        
        placeFood();
    } else {
        // Remove tail if didn't eat
        snake.pop();
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add grid lines (subtle)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for(let i=0; i<=TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }

    drawFood();
    drawSnake();
}

function drawSnake() {
    snake.forEach((segment, index) => {
        // Use neon green for head, slightly darker for body
        if (index === 0) {
            // Head with glow
            ctx.fillStyle = "#4ade80"; 
            ctx.shadowColor = "#4ade80";
            ctx.shadowBlur = 10;
        } else {
            ctx.fillStyle = "#22c55e"; 
            ctx.shadowBlur = 0;
        }
        
        // Draw slightly smaller than grid size for gaps
        ctx.fillRect(
            segment.x * GRID_SIZE + 1, 
            segment.y * GRID_SIZE + 1, 
            GRID_SIZE - 2, 
            GRID_SIZE - 2
        );
        
        // Eyes for the head
        if (index === 0) {
            ctx.fillStyle = "#000";
            ctx.shadowBlur = 0;
            
            let eyeOffsetX1 = 0, eyeOffsetY1 = 0;
            let eyeOffsetX2 = 0, eyeOffsetY2 = 0;
            const eyeSize = 3;
            
            if (dx === 1) { // Right
                eyeOffsetX1 = GRID_SIZE - 6; eyeOffsetY1 = 4;
                eyeOffsetX2 = GRID_SIZE - 6; eyeOffsetY2 = GRID_SIZE - 4 - eyeSize;
            } else if (dx === -1) { // Left
                eyeOffsetX1 = 4; eyeOffsetY1 = 4;
                eyeOffsetX2 = 4; eyeOffsetY2 = GRID_SIZE - 4 - eyeSize;
            } else if (dy === -1) { // Up
                eyeOffsetX1 = 4; eyeOffsetY1 = 4;
                eyeOffsetX2 = GRID_SIZE - 4 - eyeSize; eyeOffsetY2 = 4;
            } else if (dy === 1) { // Down
                eyeOffsetX1 = 4; eyeOffsetY1 = GRID_SIZE - 6;
                eyeOffsetX2 = GRID_SIZE - 4 - eyeSize; eyeOffsetY2 = GRID_SIZE - 6;
            } else {
                // Same as Up layout if idle
                eyeOffsetX1 = 4; eyeOffsetY1 = 4;
                eyeOffsetX2 = GRID_SIZE - 4 - eyeSize; eyeOffsetY2 = 4;
            }
            
            ctx.fillRect(segment.x * GRID_SIZE + eyeOffsetX1, segment.y * GRID_SIZE + eyeOffsetY1, eyeSize, eyeSize);
            ctx.fillRect(segment.x * GRID_SIZE + eyeOffsetX2, segment.y * GRID_SIZE + eyeOffsetY2, eyeSize, eyeSize);
        }
    });
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

function drawFood() {
    ctx.fillStyle = "#f43f5e"; 
    ctx.shadowColor = "#f43f5e";
    ctx.shadowBlur = 15;
    
    // Draw food as a circle
    ctx.beginPath();
    ctx.arc(
        foodX * GRID_SIZE + GRID_SIZE / 2, 
        foodY * GRID_SIZE + GRID_SIZE / 2, 
        GRID_SIZE / 2 - 2, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
    ctx.closePath();
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

function placeFood() {
    let newFoodX, newFoodY;
    let onSnake;
    
    do {
        onSnake = false;
        newFoodX = Math.floor(Math.random() * TILE_COUNT);
        newFoodY = Math.floor(Math.random() * TILE_COUNT);
        
        for (let segment of snake) {
            if (segment.x === newFoodX && segment.y === newFoodY) {
                onSnake = true;
                break;
            }
        }
    } while (onSnake);
    
    foodX = newFoodX;
    foodY = newFoodY;
}

function handleGameOver() {
    cancelAnimationFrame(gameLoopRequest);
    gameOverlay.classList.remove("hidden");
    overlayScore.textContent = `Score: ${score}`;
    if (score >= highScore && score > 0) {
       overlayText.textContent = "New High Score!";
    } else {
       overlayText.textContent = "Game Over";
    }
}

// Controls
window.addEventListener("keydown", e => {
    if(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    
    if (!gameStarted && (e.key === 'Enter' || e.key === ' ')) {
       startGame();
       return;
    }
    
    if (gameOver && (e.key === 'Enter' || e.key === ' ')) {
       startGame();
       return;
    }

    switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
            if (dy !== 1) { nextDx = 0; nextDy = -1; }
            break;
        case "ArrowDown":
        case "s":
        case "S":
            if (dy !== -1) { nextDx = 0; nextDy = 1; }
            break;
        case "ArrowLeft":
        case "a":
        case "A":
            if (dx !== 1) { nextDx = -1; nextDy = 0; }
            break;
        case "ArrowRight":
        case "d":
        case "D":
            if (dx !== -1) { nextDx = 1; nextDy = 0; }
            break;
    }
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

initGame();
