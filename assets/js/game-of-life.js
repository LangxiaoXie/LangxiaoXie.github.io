// Tower Defense — background ambient game

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const interactionCanvas = document.getElementById('interactionCanvas');
const startButton = document.getElementById('startButton');
const drawButton = document.getElementById('drawButton');
const clearButton = document.getElementById('clearButton');

// ── Constants ──────────────────────────────────────────────────────────────
const CELL          = 12;    // grid cell size in CSS px
const ENEMY_R       = 4;     // enemy half-size px
const ENEMY_SPEED   = 55;    // px/s
const ENEMY_HP      = 3;
const BULLET_SPEED  = 220;   // px/s
const TOWER_RANGE   = 140;   // px
const TOWER_FIRE_CD = 0.9;   // seconds between shots per tower
const SPAWN_CD      = 1.4;   // seconds between spawns
const WAVE_BURST    = 3;     // enemies per spawn event

// ── State ─────────────────────────────────────────────────────────────────
let dpr = 1, cssW, cssH, cols, rows;
let grid = [];       // 0=empty  1=wall  2=tower
let enemies = [];    // {x, y, hp}
let bullets = [];    // {x, y, vx, vy}
let towerCD = {};    // "r,c" → seconds until next shot
let isRunning   = false;
let isDrawMode  = false;
let flashAlpha  = 0;
let spawnTimer  = 0;
let lastTime    = 0;
let targetX, targetY;

// pointer tracking
let ptrCell      = null;
let ptrDragged   = false;
let lastDragCell = { row: -1, col: -1 };
let controlsRect = null;

// ── Boot ───────────────────────────────────────────────────────────────────
function initialize() {
    resize();

    startButton.addEventListener('click', toggleGame);
    drawButton.addEventListener('click', toggleDrawMode);
    clearButton.addEventListener('click', clearAll);

    document.getElementById('darkModeButton')?.addEventListener('click', () => {
        setTimeout(drawFrame, 50);
    });

    interactionCanvas.addEventListener('mousedown',  onDown);
    interactionCanvas.addEventListener('mousemove',  onMove);
    interactionCanvas.addEventListener('mouseup',    onUp);
    interactionCanvas.addEventListener('mouseleave', onUp);
    interactionCanvas.addEventListener('contextmenu', e => e.preventDefault());

    interactionCanvas.addEventListener('touchstart',  onDown, { passive: false });
    interactionCanvas.addEventListener('touchmove',   onMove, { passive: false });
    interactionCanvas.addEventListener('touchend',    onUp);
    interactionCanvas.addEventListener('touchcancel', onUp);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isDrawMode) toggleDrawMode();
    });

    window.addEventListener('resize', () => { resize(); updateControlsRect(); });
    window.addEventListener('scroll', updateControlsRect, { passive: true });
    window.addEventListener('mousemove', handleHoverOverControls, { passive: true });

    updateControlsRect();
    drawFrame();
}

function resize() {
    dpr  = window.devicePixelRatio || 1;
    cssW = window.innerWidth;
    cssH = window.innerHeight;

    for (const cv of [canvas, interactionCanvas]) {
        cv.width  = Math.round(cssW * dpr);
        cv.height = Math.round(cssH * dpr);
        cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const newCols = Math.ceil(cssW / CELL);
    const newRows = Math.ceil(cssH / CELL);
    const old = grid;
    grid = Array.from({ length: newRows }, (_, r) =>
        Array.from({ length: newCols }, (_, c) => (old[r] && old[r][c]) || 0)
    );
    cols = newCols;
    rows = newRows;

    targetX = Math.round(cssW / 2);
    targetY = Math.round(cssH / 2);

    drawFrame();
}

function updateControlsRect() {
    const el = document.querySelector('.game-controls');
    if (el) controlsRect = el.getBoundingClientRect();
}

function handleHoverOverControls(e) {
    if (!isDrawMode || !controlsRect) return;
    const pad = 8;
    const over = e.clientX >= controlsRect.left - pad && e.clientX <= controlsRect.right  + pad &&
                 e.clientY >= controlsRect.top  - pad && e.clientY <= controlsRect.bottom + pad;
    interactionCanvas.style.pointerEvents = over ? 'none' : 'auto';
}

// ── Input helpers ──────────────────────────────────────────────────────────
function getPoint(e) {
    const t = e.touches;
    return t && t.length ? { x: t[0].clientX, y: t[0].clientY } : { x: e.clientX, y: e.clientY };
}

function cellAt(e) {
    const { x, y } = getPoint(e);
    const r = interactionCanvas.getBoundingClientRect();
    return { col: Math.floor((x - r.left) / CELL), row: Math.floor((y - r.top) / CELL) };
}

function inGrid(r, c) { return r >= 0 && r < rows && c >= 0 && c < cols; }

function inControls(pt) {
    if (!controlsRect) return false;
    return pt.x >= controlsRect.left && pt.x <= controlsRect.right &&
           pt.y >= controlsRect.top  && pt.y <= controlsRect.bottom;
}

// ── Pointer events ─────────────────────────────────────────────────────────
function onDown(e) {
    if (!isDrawMode) return;
    e.preventDefault();
    const pt = getPoint(e);
    if (inControls(pt)) return;
    const cell = cellAt(e);
    if (!inGrid(cell.row, cell.col)) return;
    ptrCell      = cell;
    ptrDragged   = false;
    lastDragCell = { ...cell };
}

function onMove(e) {
    if (!isDrawMode || !ptrCell) return;
    e.preventDefault();
    const pt = getPoint(e);
    if (inControls(pt)) return;
    const cell = cellAt(e);
    if (!inGrid(cell.row, cell.col)) return;
    if (cell.row === lastDragCell.row && cell.col === lastDragCell.col) return;

    if (!ptrDragged) {
        setCell(ptrCell.row, ptrCell.col, 1);
        ptrDragged = true;
    }
    bresenham(lastDragCell, cell, (r, c) => setCell(r, c, 1));
    lastDragCell = { ...cell };
    drawFrame();
}

function onUp() {
    if (!isDrawMode || !ptrCell) { ptrCell = null; return; }
    if (!ptrDragged) {
        // Single click: cycle empty→wall→tower→empty
        const { row, col } = ptrCell;
        if (inGrid(row, col)) {
            setCell(row, col, (grid[row][col] + 1) % 3);
            drawFrame();
        }
    }
    ptrCell    = null;
    ptrDragged = false;
    lastDragCell = { row: -1, col: -1 };
}

function setCell(r, c, val) {
    if (!inGrid(r, c)) return;
    grid[r][c] = val;
    if (val !== 2) delete towerCD[`${r},${c}`];
}

function bresenham(from, to, fn) {
    let { row: r0, col: c0 } = from;
    const { row: r1, col: c1 } = to;
    const dr = Math.abs(r1 - r0), dc = Math.abs(c1 - c0);
    const sr = r0 < r1 ? 1 : -1, sc = c0 < c1 ? 1 : -1;
    let err = dc - dr;
    while (true) {
        fn(r0, c0);
        if (r0 === r1 && c0 === c1) break;
        const e2 = 2 * err;
        if (e2 > -dr) { err -= dr; c0 += sc; }
        if (e2 <  dc) { err += dc; r0 += sr; }
    }
}

// ── Game control ───────────────────────────────────────────────────────────
function toggleGame() {
    isRunning = !isRunning;
    if (isRunning) {
        startButton.textContent = 'Pause';
        startButton.classList.add('active');
        if (isDrawMode) toggleDrawMode();
        enemies    = [];
        bullets    = [];
        spawnTimer = SPAWN_CD; // spawn immediately on start
        flashAlpha = 0;
        lastTime   = performance.now();
        requestAnimationFrame(loop);
    } else {
        startButton.textContent = 'Initiate Attack';
        startButton.classList.remove('active');
    }
}

function toggleDrawMode() {
    isDrawMode = !isDrawMode;
    if (isDrawMode) {
        drawButton.textContent = 'Exit Draw Mode';
        drawButton.classList.add('active');
        interactionCanvas.classList.add('draw-mode');
        interactionCanvas.style.pointerEvents = 'auto'; // clear any stale inline style
        if (isRunning) toggleGame();
    } else {
        drawButton.textContent = 'Draw Mode';
        drawButton.classList.remove('active');
        interactionCanvas.classList.remove('draw-mode');
        interactionCanvas.style.pointerEvents = 'none';
    }
}

function clearAll() {
    if (isRunning) toggleGame();
    grid      = Array.from({ length: rows }, () => Array(cols).fill(0));
    enemies   = [];
    bullets   = [];
    towerCD   = {};
    flashAlpha = 0;
    spawnTimer = 0;
    drawFrame();
}

// ── Game loop ──────────────────────────────────────────────────────────────
function loop(ts) {
    if (!isRunning) return;
    const dt = Math.min((ts - lastTime) / 1000, 0.1);
    lastTime = ts;
    update(dt);
    drawFrame();
    requestAnimationFrame(loop);
}

function update(dt) {
    // Spawn wave
    spawnTimer += dt;
    if (spawnTimer >= SPAWN_CD) {
        spawnTimer = 0;
        for (let i = 0; i < WAVE_BURST; i++) spawnEnemy();
    }

    // Move enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        moveEnemy(enemies[i], dt);
        const dx = enemies[i].x - targetX, dy = enemies[i].y - targetY;
        if (dx * dx + dy * dy < ENEMY_R * ENEMY_R) {
            enemies.splice(i, 1);
            flashAlpha = 1.0;
        }
    }

    // Towers fire
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] !== 2) continue;
            const key = `${r},${c}`;
            towerCD[key] = (towerCD[key] ?? 0) - dt;
            if (towerCD[key] <= 0) {
                towerCD[key] = TOWER_FIRE_CD;
                const tx = c * CELL + CELL / 2, ty = r * CELL + CELL / 2;
                const en = nearestEnemy(tx, ty);
                if (en) {
                    const dx = en.x - tx, dy = en.y - ty;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    bullets.push({ x: tx, y: ty, vx: dx / d * BULLET_SPEED, vy: dy / d * BULLET_SPEED });
                }
            }
        }
    }

    // Move bullets + hit detection
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < -10 || b.x > cssW + 10 || b.y < -10 || b.y > cssH + 10) {
            bullets.splice(i, 1); continue;
        }
        let hit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const en = enemies[j];
            const dx = b.x - en.x, dy = b.y - en.y;
            if (dx * dx + dy * dy < (ENEMY_R + 2) * (ENEMY_R + 2)) {
                if (--en.hp <= 0) enemies.splice(j, 1);
                hit = true; break;
            }
        }
        if (hit) bullets.splice(i, 1);
    }

    // Decay flash
    if (flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - dt * 2.5);
}

function spawnEnemy() {
    let x, y;
    const edge = Math.floor(Math.random() * 4);
    if      (edge === 0) { x = Math.random() * cssW; y = -ENEMY_R * 2; }
    else if (edge === 1) { x = cssW + ENEMY_R * 2;   y = Math.random() * cssH; }
    else if (edge === 2) { x = Math.random() * cssW; y = cssH + ENEMY_R * 2; }
    else                 { x = -ENEMY_R * 2;          y = Math.random() * cssH; }
    enemies.push({ x, y, hp: ENEMY_HP });
}

function moveEnemy(en, dt) {
    const dx = targetX - en.x, dy = targetY - en.y;
    const d  = Math.sqrt(dx * dx + dy * dy);
    if (d < 1) return;
    const nx = dx / d, ny = dy / d;
    const step = ENEMY_SPEED * dt;

    let newX = en.x + nx * step;
    let newY = en.y + ny * step;

    const nc = Math.floor(newX / CELL), nr = Math.floor(newY / CELL);
    if (inGrid(nr, nc) && grid[nr][nc] === 1) {
        const canSlideX = inGrid(Math.floor(en.y / CELL), Math.floor(newX / CELL)) &&
                          grid[Math.floor(en.y / CELL)][Math.floor(newX / CELL)] !== 1;
        const canSlideY = inGrid(Math.floor(newY / CELL), Math.floor(en.x / CELL)) &&
                          grid[Math.floor(newY / CELL)][Math.floor(en.x / CELL)] !== 1;
        if      (canSlideX && !canSlideY) newY = en.y;
        else if (canSlideY && !canSlideX) newX = en.x;
        else if (canSlideX)               newY = en.y;
        else {
            // fully blocked — try perpendicular nudge
            const px = en.x + ny * step, py = en.y - nx * step;
            const pr = Math.floor(py / CELL), pc = Math.floor(px / CELL);
            if (inGrid(pr, pc) && grid[pr][pc] !== 1) { newX = px; newY = py; }
            else { newX = en.x; newY = en.y; }
        }
    }

    en.x = newX;
    en.y = newY;
}

function nearestEnemy(tx, ty) {
    let best = null, bestD2 = TOWER_RANGE * TOWER_RANGE;
    for (const en of enemies) {
        const dx = en.x - tx, dy = en.y - ty;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) { bestD2 = d2; best = en; }
    }
    return best;
}

// ── Draw ───────────────────────────────────────────────────────────────────
function drawFrame() {
    ctx.clearRect(0, 0, cssW, cssH);

    const dark      = document.documentElement.getAttribute('data-theme') === 'dark';
    const wallColor = dark ? '#555' : '#c8c8c8';
    const innerCol  = dark ? '#333' : '#a8a8a8';
    const enemyCol  = dark ? '#c0392b' : '#c0392b'; // red-tinted enemies
    const bulletCol = '#ffce6b';

    // Walls & towers
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const v = grid[r][c];
            if (v === 1) {
                ctx.fillStyle = wallColor;
                ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
            } else if (v === 2) {
                ctx.fillStyle = bulletCol;
                ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
                ctx.fillStyle = innerCol;
                ctx.fillRect(c * CELL + 3, r * CELL + 3, CELL - 7, CELL - 7);
            }
        }
    }

    // Enemies — red squares with opacity by health
    for (const en of enemies) {
        const t = en.hp / ENEMY_HP;
        ctx.globalAlpha = 0.5 + 0.5 * t;
        ctx.fillStyle   = enemyCol;
        ctx.fillRect(en.x - ENEMY_R, en.y - ENEMY_R, ENEMY_R * 2, ENEMY_R * 2);
    }
    ctx.globalAlpha = 1;

    // Bullets
    ctx.fillStyle = bulletCol;
    for (const b of bullets) {
        ctx.fillRect(b.x - 1.5, b.y - 1.5, 3, 3);
    }

    // Target flash ring
    if (flashAlpha > 0) {
        ctx.strokeStyle = `rgba(255,0,0,${flashAlpha})`;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 4 + (1 - flashAlpha) * 12, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Target — 1 red pixel
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(targetX, targetY, 1, 1);
}

window.onload = initialize;
