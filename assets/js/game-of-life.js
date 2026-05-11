// Tower Defense — background ambient game

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const interactionCanvas = document.getElementById('interactionCanvas');
const startButton = document.getElementById('startButton');
const drawButton  = document.getElementById('drawButton');
const clearButton = document.getElementById('clearButton');

// ── Constants ──────────────────────────────────────────────────────────────
const CELL          = 28;    // grid cell size in CSS px
const ENEMY_R       = 12;    // enemy half-size px
const ENEMY_SPEED   = 55;    // px/s
const ENEMY_HP      = 3;
const BULLET_SPEED  = 240;   // px/s
const TOWER_RANGE   = 180;   // px
const TOWER_FIRE_CD = 0.9;   // s between tower shots
const SPAWN_CD      = 1.4;   // s between spawn waves
const WAVE_BURST    = 3;
const WALL_MAX_HP   = 6;
const WALL_DMG_RATE = 1.2;   // HP/s dealt by one adjacent enemy

// ── State ─────────────────────────────────────────────────────────────────
let dpr = 1, cssW, cssH, cols, rows;
let grid    = [];   // 0=empty  1=wall  2=tower
let wallHP  = {};   // "r,c" → remaining HP
let enemies = [];   // {x, y, hp}
let bullets = [];   // {x, y, vx, vy}
let towerCD = {};   // "r,c" → s until next shot
let flowField  = {};  // "r,c" → {dr, dc} pointing toward target
let flowDirty  = true;
let isRunning  = false;
let isDrawMode = false;
let showTarget = false;
let flashAlpha = 0;
let spawnTimer = 0;
let lastTime   = 0;
let targetRow, targetCol, targetX, targetY;

let ptrCell      = null;
let ptrDragged   = false;
let lastDragCell = { row: -1, col: -1 };
let buttonRects  = [];

// ── Boot ───────────────────────────────────────────────────────────────────
function initialize() {
    resize();

    startButton.addEventListener('click', toggleGame);
    drawButton.addEventListener('click',  toggleDrawMode);
    clearButton.addEventListener('click', clearAll);
    document.getElementById('darkModeButton')?.addEventListener('click', () => setTimeout(drawFrame, 50));

    interactionCanvas.addEventListener('mousedown',  onDown);
    interactionCanvas.addEventListener('mousemove',  onMove);
    interactionCanvas.addEventListener('mouseup',    onUp);
    interactionCanvas.addEventListener('mouseleave', onUp);
    interactionCanvas.addEventListener('contextmenu', e => e.preventDefault());
    interactionCanvas.addEventListener('touchstart',  onDown, { passive: false });
    interactionCanvas.addEventListener('touchmove',   onMove, { passive: false });
    interactionCanvas.addEventListener('touchend',    onUp);
    interactionCanvas.addEventListener('touchcancel', onUp);

    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isDrawMode) toggleDrawMode(); });
    window.addEventListener('resize', () => { resize(); updateButtonRects(); });
    window.addEventListener('scroll', updateButtonRects, { passive: true });
    window.addEventListener('mousemove', handleHoverOverControls, { passive: true });

    updateButtonRects();
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

    // Target: midpoint between screen-center row and bottom row
    targetCol = Math.floor(cols / 2);
    targetRow = Math.floor((Math.floor(rows / 2) + (rows - 1)) / 2);
    targetX   = targetCol * CELL + (CELL - 1) / 2;
    targetY   = targetRow * CELL + (CELL - 1) / 2;

    flowDirty = true;
    drawFrame();
}

function updateButtonRects() {
    const pad = 6;
    buttonRects = [startButton, drawButton, clearButton].filter(Boolean).map(b => {
        const r = b.getBoundingClientRect();
        return { left: r.left - pad, right: r.right + pad, top: r.top - pad, bottom: r.bottom + pad };
    });
}

function ptInButtons(x, y) {
    return buttonRects.some(r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
}

function handleHoverOverControls(e) {
    if (!isDrawMode) return;
    interactionCanvas.style.pointerEvents = ptInButtons(e.clientX, e.clientY) ? 'none' : 'auto';
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

// ── Pointer events ─────────────────────────────────────────────────────────
function onDown(e) {
    if (!isDrawMode) return;
    e.preventDefault();
    const pt = getPoint(e);
    if (ptInButtons(pt.x, pt.y)) return;
    const cell = cellAt(e);
    if (!inGrid(cell.row, cell.col)) return;
    ptrCell = cell; ptrDragged = false; lastDragCell = { ...cell };
}
function onMove(e) {
    if (!isDrawMode || !ptrCell) return;
    e.preventDefault();
    const pt = getPoint(e);
    if (ptInButtons(pt.x, pt.y)) return;
    const cell = cellAt(e);
    if (!inGrid(cell.row, cell.col)) return;
    if (cell.row === lastDragCell.row && cell.col === lastDragCell.col) return;
    if (!ptrDragged) { setCell(ptrCell.row, ptrCell.col, 1); ptrDragged = true; }
    bresenham(lastDragCell, cell, (r, c) => setCell(r, c, 1));
    lastDragCell = { ...cell };
    drawFrame();
}
function onUp() {
    if (!isDrawMode || !ptrCell) { ptrCell = null; return; }
    if (!ptrDragged) {
        const { row, col } = ptrCell;
        if (inGrid(row, col)) { setCell(row, col, (grid[row][col] + 1) % 3); drawFrame(); }
    }
    ptrCell = null; ptrDragged = false; lastDragCell = { row: -1, col: -1 };
}

function setCell(r, c, val) {
    if (!inGrid(r, c)) return;
    if (r === targetRow && c === targetCol) return;
    const key = `${r},${c}`;
    grid[r][c] = val;
    if (val === 1) { if (wallHP[key] === undefined) wallHP[key] = WALL_MAX_HP; }
    else { delete wallHP[key]; if (val !== 2) delete towerCD[key]; }
    flowDirty = true;
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

// ── Pathfinding — Dijkstra from target, build flow field ───────────────────
function computeFlowField() {
    const INF = 1e9;
    const dist = {};
    // Simple priority queue using sorted array (grid is small ~2k–5k cells)
    const pq = [];
    const tKey = `${targetRow},${targetCol}`;
    dist[tKey] = 0;
    pq.push([0, targetRow, targetCol]);

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

    while (pq.length > 0) {
        pq.sort((a, b) => a[0] - b[0]);
        const [cost, r, c] = pq.shift();
        const key = `${r},${c}`;
        if (cost > (dist[key] ?? INF)) continue;

        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (!inGrid(nr, nc)) continue;
            const nKey = `${nr},${nc}`;
            // Cost to enter neighbor cell
            let moveCost;
            if (grid[nr][nc] === 1) {
                // Wall: time to destroy it + traverse
                const hp = wallHP[nKey] ?? WALL_MAX_HP;
                moveCost = hp / WALL_DMG_RATE + CELL / ENEMY_SPEED;
            } else {
                moveCost = CELL / ENEMY_SPEED;
            }
            const newCost = cost + moveCost;
            if (newCost < (dist[nKey] ?? INF)) {
                dist[nKey] = newCost;
                pq.push([newCost, nr, nc]);
            }
        }
    }

    // Build flow field: each cell points toward the neighbor with lowest dist
    flowField = {};
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (r === targetRow && c === targetCol) continue;
            const curDist = dist[`${r},${c}`] ?? INF;
            let bestDr = 0, bestDc = 0, bestDist = curDist;
            for (const [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (!inGrid(nr, nc)) continue;
                const nd = dist[`${nr},${nc}`] ?? INF;
                if (nd < bestDist) { bestDist = nd; bestDr = dr; bestDc = dc; }
            }
            if (bestDr !== 0 || bestDc !== 0) {
                flowField[`${r},${c}`] = { dr: bestDr, dc: bestDc };
            }
        }
    }
    flowDirty = false;
}

// ── Game control ───────────────────────────────────────────────────────────
function toggleGame() {
    isRunning = !isRunning;
    if (isRunning) {
        startButton.textContent = 'Pause';
        startButton.classList.add('active');
        showTarget = true;
        if (isDrawMode) toggleDrawMode();
        enemies = []; bullets = [];
        spawnTimer = SPAWN_CD; flashAlpha = 0;
        flowDirty = true;
        lastTime = performance.now();
        requestAnimationFrame(loop);
    } else {
        startButton.textContent = 'Initiate Attack';
        startButton.classList.remove('active');
    }
    drawFrame();
}

function toggleDrawMode() {
    isDrawMode = !isDrawMode;
    if (isDrawMode) {
        drawButton.textContent = 'Exit Draw Mode';
        drawButton.classList.add('active');
        interactionCanvas.classList.add('draw-mode');
        interactionCanvas.style.pointerEvents = 'auto';
        showTarget = true;
        if (isRunning) toggleGame();
    } else {
        drawButton.textContent = 'Draw Mode';
        drawButton.classList.remove('active');
        interactionCanvas.classList.remove('draw-mode');
        interactionCanvas.style.pointerEvents = 'none';
        if (!isRunning) showTarget = false;
    }
    drawFrame();
}

function clearAll() {
    if (isRunning) toggleGame();
    grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    wallHP = {}; enemies = []; bullets = []; towerCD = {};
    flowDirty = true; flashAlpha = 0; spawnTimer = 0;
    showTarget = false;
    drawFrame();
}

// ── Game loop ──────────────────────────────────────────────────────────────
function loop(ts) {
    if (!isRunning) return;
    const dt = Math.min((ts - lastTime) / 1000, 0.1);
    lastTime = ts;
    if (flowDirty) computeFlowField();
    update(dt);
    drawFrame();
    requestAnimationFrame(loop);
}

function update(dt) {
    spawnTimer += dt;
    if (spawnTimer >= SPAWN_CD) { spawnTimer = 0; for (let i = 0; i < WAVE_BURST; i++) spawnEnemy(); }

    for (let i = enemies.length - 1; i >= 0; i--) {
        moveEnemy(enemies[i], dt);
        const dx = enemies[i].x - targetX, dy = enemies[i].y - targetY;
        if (Math.abs(dx) < CELL && Math.abs(dy) < CELL) {
            enemies.splice(i, 1); flashAlpha = 1.0;
        }
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] !== 2) continue;
            const key = `${r},${c}`;
            towerCD[key] = (towerCD[key] ?? 0) - dt;
            if (towerCD[key] <= 0) {
                towerCD[key] = TOWER_FIRE_CD;
                const tx = c * CELL + (CELL - 1) / 2, ty = r * CELL + (CELL - 1) / 2;
                const en = nearestEnemy(tx, ty);
                if (en) {
                    const dx = en.x - tx, dy = en.y - ty;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    bullets.push({ x: tx, y: ty, vx: dx / d * BULLET_SPEED, vy: dy / d * BULLET_SPEED });
                }
            }
        }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.x < -10 || b.x > cssW + 10 || b.y < -10 || b.y > cssH + 10) { bullets.splice(i, 1); continue; }
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

function damageWall(r, c, dt) {
    if (!inGrid(r, c) || grid[r][c] !== 1) return;
    const key = `${r},${c}`;
    if (wallHP[key] === undefined) wallHP[key] = WALL_MAX_HP;
    wallHP[key] -= WALL_DMG_RATE * dt;
    if (wallHP[key] <= 0) {
        grid[r][c] = 0;
        delete wallHP[key];
        flowDirty = true; // wall destroyed → recompute paths
    }
}

function moveEnemy(en, dt) {
    const ec = Math.floor(en.x / CELL);
    const er = Math.floor(en.y / CELL);
    const flow = flowField[`${er},${ec}`];

    let nx, ny;
    if (flow) {
        // Steer toward center of next cell in flow direction
        const nextCX = (ec + flow.dc) * CELL + (CELL - 1) / 2;
        const nextCY = (er + flow.dr) * CELL + (CELL - 1) / 2;
        const dx = nextCX - en.x, dy = nextCY - en.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        nx = d > 0.5 ? dx / d : flow.dc;
        ny = d > 0.5 ? dy / d : flow.dr;

        // If flow points into a wall, attack it instead of moving
        const tr = er + flow.dr, tc = ec + flow.dc;
        if (inGrid(tr, tc) && grid[tr][tc] === 1) {
            damageWall(tr, tc, dt);
            return; // stand still and attack
        }
    } else {
        // Fallback: direct line to target
        const dx = targetX - en.x, dy = targetY - en.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1) return;
        nx = dx / d; ny = dy / d;
    }

    const step = ENEMY_SPEED * dt;
    let newX = en.x + nx * step;
    let newY = en.y + ny * step;

    // Physical wall collision (shouldn't happen with good flow field, but safety net)
    const nc = Math.floor(newX / CELL), nr = Math.floor(newY / CELL);
    if (inGrid(nr, nc) && grid[nr][nc] === 1) {
        damageWall(nr, nc, dt);
        newX = en.x; newY = en.y;
    }

    en.x = newX; en.y = newY;
}

function nearestEnemy(tx, ty) {
    let best = null, bestD2 = TOWER_RANGE * TOWER_RANGE;
    for (const en of enemies) {
        const dx = en.x - tx, dy = en.y - ty, d2 = dx * dx + dy * dy;
        if (d2 < bestD2) { bestD2 = d2; best = en; }
    }
    return best;
}

// ── Draw ───────────────────────────────────────────────────────────────────
function drawFrame() {
    ctx.clearRect(0, 0, cssW, cssH);
    const dark     = document.documentElement.getAttribute('data-theme') === 'dark';
    const wallFull = dark ? '#606060' : '#b8b8b8';
    const wallLow  = dark ? '#7a2020' : '#d08080';
    const innerCol = dark ? '#333'    : '#909090';
    const towerCol = '#ffce6b';
    const enemyCol = dark ? '#5dade2' : '#2e86c1'; // blue
    const bulletCol = '#ffce6b';

    // Walls & towers
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const v = grid[r][c];
            if (v === 1) {
                const hp = wallHP[`${r},${c}`] ?? WALL_MAX_HP;
                const t  = hp / WALL_MAX_HP;
                ctx.fillStyle  = lerpColor(wallLow, wallFull, t);
                ctx.globalAlpha = 0.4 + 0.6 * t;
                ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
                ctx.globalAlpha = 1;
            } else if (v === 2) {
                ctx.fillStyle = towerCol;
                ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
                ctx.fillStyle = innerCol;
                ctx.fillRect(c * CELL + 4, r * CELL + 4, CELL - 9, CELL - 9);
            }
        }
    }

    // Enemies — blue
    for (const en of enemies) {
        const t = en.hp / ENEMY_HP;
        ctx.globalAlpha = 0.55 + 0.45 * t;
        ctx.fillStyle   = enemyCol;
        ctx.fillRect(en.x - ENEMY_R, en.y - ENEMY_R, ENEMY_R * 2, ENEMY_R * 2);
    }
    ctx.globalAlpha = 1;

    // Bullets
    ctx.fillStyle = bulletCol;
    for (const b of bullets) ctx.fillRect(b.x - 2, b.y - 2, 4, 4);

    // Target (only when game is running or in draw mode)
    if (showTarget) {
        if (flashAlpha > 0) {
            ctx.strokeStyle = `rgba(255,0,0,${flashAlpha})`;
            ctx.lineWidth   = 2;
            ctx.beginPath();
            ctx.arc(targetX, targetY, CELL * 0.8 + (1 - flashAlpha) * CELL, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(targetCol * CELL, targetRow * CELL, CELL - 1, CELL - 1);
    }
}

function lerpColor(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ar = (pa >> 16) & 0xff, ag = (pa >> 8) & 0xff, ab = pa & 0xff;
    const br = (pb >> 16) & 0xff, bg = (pb >> 8) & 0xff, bb = pb & 0xff;
    return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;
}

window.onload = initialize;
