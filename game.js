'use strict';

const W = 80;
const H = 40;
const D = 80;
const CHUNK = 16;
const CHUNKS_X = W / CHUNK;
const CHUNKS_Z = D / CHUNK;
const WATER_LEVEL = 13;
const SAVE_KEY = 'arcraft-world-v1';

const AIR = 0;
const GRASS = 1;
const DIRT = 2;
const STONE = 3;
const COBBLE = 4;
const SAND = 5;
const LOG = 6;
const LEAVES = 7;
const PLANKS = 8;
const WATER = 9;
const BEDROCK = 10;
const CLOUD = 11;
const COAL = 12;
const IRON = 13;

const TILE = {
  grassTop: 0,
  grassSide: 1,
  dirt: 2,
  stone: 3,
  cobble: 4,
  sand: 5,
  logSide: 6,
  logTop: 7,
  leaves: 8,
  planks: 9,
  water: 10,
  bedrock: 11,
  cloud: 12,
  coal: 13,
  iron: 14
};

function six(tile) {
  return [tile, tile, tile, tile, tile, tile];
}

const INFO = [];
INFO[GRASS] = { name: 'Grama', icon: TILE.grassTop, tiles: [TILE.grassTop, TILE.dirt, TILE.grassSide, TILE.grassSide, TILE.grassSide, TILE.grassSide] };
INFO[DIRT] = { name: 'Terra', icon: TILE.dirt, tiles: six(TILE.dirt) };
INFO[STONE] = { name: 'Pedra', icon: TILE.stone, tiles: six(TILE.stone) };
INFO[COBBLE] = { name: 'Pedrinhas', icon: TILE.cobble, tiles: six(TILE.cobble) };
INFO[SAND] = { name: 'Areia', icon: TILE.sand, tiles: six(TILE.sand) };
INFO[LOG] = { name: 'Madeira', icon: TILE.logSide, tiles: [TILE.logTop, TILE.logTop, TILE.logSide, TILE.logSide, TILE.logSide, TILE.logSide] };
INFO[LEAVES] = { name: 'Folhas', icon: TILE.leaves, tiles: six(TILE.leaves) };
INFO[PLANKS] = { name: 'Tábuas', icon: TILE.planks, tiles: six(TILE.planks) };
INFO[WATER] = { name: 'Água', icon: TILE.water, tiles: six(TILE.water) };
INFO[BEDROCK] = { name: 'Pedra forte', icon: TILE.bedrock, tiles: six(TILE.bedrock) };
INFO[CLOUD] = { name: 'Nuvem', icon: TILE.cloud, tiles: six(TILE.cloud) };
INFO[COAL] = { name: 'Carvão', icon: TILE.coal, tiles: six(TILE.coal) };
INFO[IRON] = { name: 'Ferro', icon: TILE.iron, tiles: six(TILE.iron) };

const HOTBAR = [GRASS, DIRT, STONE, COBBLE, SAND, LOG, PLANKS, LEAVES, WATER];

const FACES = [
  { n: [0, 1, 0], s: 1, v: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], uv: [[0, 1], [1, 1], [1, 0], [0, 0]] },
  { n: [0, -1, 0], s: 0.5, v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], uv: [[0, 1], [1, 1], [1, 0], [0, 0]] },
  { n: [1, 0, 0], s: 0.66, v: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], uv: [[0, 0], [0, 1], [1, 1], [1, 0]] },
  { n: [-1, 0, 0], s: 0.66, v: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], uv: [[0, 0], [0, 1], [1, 1], [1, 0]] },
  { n: [0, 0, 1], s: 0.82, v: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], uv: [[0, 0], [1, 0], [1, 1], [0, 1]] },
  { n: [0, 0, -1], s: 0.82, v: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], uv: [[0, 0], [1, 0], [1, 1], [0, 1]] }
];

const SPLASHES = [
  'Um mundo feito de blocos.',
  'Constrói o que imaginar.',
  'Espaço duas vezes e você voa.',
  'Tem tesouro debaixo da terra.',
  'Cuidado para não cair da ilha!',
  'As árvores crescem sozinhas.',
  'Um bloco de cada vez.',
  'A água é só de brincadeira.',
  'Olha as nuvens lá em cima!',
  'O Arcraft é seu para explorar.'
];

const RADIUS = 0.29;
const HEIGHT = 1.8;
const EYE = 1.62;
const REACH = 6;

const canvas = document.getElementById('c');
const hud = document.getElementById('hud');
const overlay = document.getElementById('overlay');
const titleEl = document.getElementById('title');
const splashEl = document.getElementById('splash');
const subEl = document.getElementById('sub');
const statusEl = document.getElementById('status');
const seedEl = document.getElementById('seed');
const playBtn = document.getElementById('btn-play');
const newBtn = document.getElementById('btn-new');
const coordsEl = document.getElementById('coords');
const aimEl = document.getElementById('aim');
const modeEl = document.getElementById('mode');
const savedEl = document.getElementById('saved');
const heldEl = document.getElementById('held');
const hotbarEl = document.getElementById('hotbar');
const promptEl = document.getElementById('prompt');
const toastEl = document.getElementById('toast');

let seed = 1;
let blocks = new Uint8Array(W * H * D);
let original = new Uint8Array(W * H * D);
let sky = new Uint8Array(W * H * D);
const changes = new Map();
const dirty = new Set();
const chunkMeshes = [];

const player = {
  x: W / 2,
  y: 24,
  z: D / 2,
  yaw: 0.5,
  pitch: -0.28,
  vy: 0,
  flying: false
};
const spawn = { x: player.x, y: player.y, z: player.z, yaw: player.yaw };
let slot = 0;
let mode = 'menu';
let loading = true;
let pendingEnter = false;
let grounded = false;
let coyote = 0;
let bob = 0;
let bobPhase = 0;
let animTime = 0;
let breakCd = 0;
let placeCd = 0;
let lastSpace = 0;
let menuFocus = { x: W / 2, y: 18, z: D / 2 };
let target = null;
const keys = Object.create(null);
const touchMove = { x: 0, y: 0 };
const mouse = { left: false, right: false };
const particles = [];
const partScratch = [];

let gl;
let atlasCanvas;
let worldProg;
let skyProg;
let lineProg;
let uMvp;
let uCam;
let uFogColor;
let uFogNear;
let uFogFar;
let uCutoff;
let aPos;
let aUv;
let aShade;
let skyRes;
let skyTop;
let skyHorizon;
let skyForward;
let skyRight;
let skyUp;
let skyFov;
let skySun;
let skyUnder;
let lineMvp;
let lineColor;
let linePos;
let partBuf;
let lineBuf;
const lineVerts = new Float32Array(24 * 3);

function idx(x, y, z) {
  return x + z * W + y * W * D;
}

function hash2(x, z) {
  let n = Math.imul((x | 0) ^ (seed | 0), 374761393) + Math.imul((z | 0) ^ ((seed >>> 1) | 0), 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function hash3(x, y, z) {
  let n = Math.imul((x | 0) ^ (seed | 0), 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((z | 0) ^ (seed << 1), 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function fade(t) {
  return t * t * (3 - 2 * t);
}

function noise2(x, z) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = fade(x - x0);
  const tz = fade(z - z0);
  const v00 = hash2(x0, z0);
  const v10 = hash2(x0 + 1, z0);
  const v01 = hash2(x0, z0 + 1);
  const v11 = hash2(x0 + 1, z0 + 1);
  const a = v00 + (v10 - v00) * tx;
  const b = v01 + (v11 - v01) * tx;
  return a + (b - a) * tz;
}

function noise3(x, y, z) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const tx = fade(x - x0);
  const ty = fade(y - y0);
  const tz = fade(z - z0);
  let value = 0;
  for (let dz = 0; dz <= 1; dz++) {
    for (let dy = 0; dy <= 1; dy++) {
      for (let dx = 0; dx <= 1; dx++) {
        const weight = (dx ? tx : 1 - tx) * (dy ? ty : 1 - ty) * (dz ? tz : 1 - tz);
        value += weight * hash3(x0 + dx, y0 + dy, z0 + dz);
      }
    }
  }
  return value;
}

function texRand(x, y, salt) {
  let n = Math.imul((x + salt * 13) | 0, 374761393) + Math.imul((y + salt * 29) | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function terrainHeight(x, z) {
  const n1 = noise2(x * 0.035, z * 0.035);
  const n2 = noise2(x * 0.09 + 20, z * 0.09);
  const n3 = noise2(x * 0.2 + 4, z * 0.2);
  let h = 15 + (n1 - 0.5) * 14 + (n2 - 0.5) * 6 + (n3 - 0.5) * 2;
  h = Math.max(4, Math.min(H - 8, h | 0));
  return h;
}

function generate() {
  blocks.fill(0);
  const heights = new Uint16Array(W * D);
  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) heights[x + z * W] = terrainHeight(x, z);
  }

  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      const h = heights[x + z * W];
      const hl = heights[Math.max(0, x - 1) + z * W];
      const hr = heights[Math.min(W - 1, x + 1) + z * W];
      const hd = heights[x + Math.max(0, z - 1) * W];
      const hu = heights[x + Math.min(D - 1, z + 1) * W];
      const steep = Math.abs(hl - h) > 2 || Math.abs(hr - h) > 2 || Math.abs(hd - h) > 2 || Math.abs(hu - h) > 2;
      blocks[idx(x, 0, z)] = BEDROCK;
      for (let y = 1; y <= h; y++) {
        const depth = h - y;
        let id = STONE;
        if (depth === 0) {
          if (h <= WATER_LEVEL + 1) id = SAND;
          else if (steep) id = STONE;
          else id = GRASS;
        } else if (depth < 4) {
          if (h <= WATER_LEVEL + 1) id = SAND;
          else if (steep && depth < 2) id = STONE;
          else id = DIRT;
        } else {
          const n = hash3(x, y, z);
          if (y < 11 && n > 0.988) id = IRON;
          else if (y < 26 && n > 0.973) id = COAL;
        }
        blocks[idx(x, y, z)] = id;
      }
      if (h < WATER_LEVEL) {
        for (let y = h + 1; y <= WATER_LEVEL; y++) blocks[idx(x, y, z)] = WATER;
      }
    }
  }

  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      const h = heights[x + z * W];
      for (let y = 2; y < h - 2; y++) {
        const i = idx(x, y, z);
        const id = blocks[i];
        if (id !== STONE && id !== DIRT && id !== COAL && id !== IRON) continue;
        const n = noise3(x * 0.14, y * 0.18, z * 0.14);
        const n2 = noise3(x * 0.23 + 9, y * 0.3, z * 0.23 + 3);
        if (n > 0.74 || n2 > 0.82) blocks[i] = AIR;
      }
    }
  }

  const hasTree = new Uint8Array(W * D);
  for (let z = 2; z < D - 2; z++) {
    for (let x = 2; x < W - 2; x++) {
      const h = heights[x + z * W];
      if (h <= WATER_LEVEL + 2) continue;
      if (blocks[idx(x, h, z)] !== GRASS) continue;
      if (hash2(x + 99, z + 17) > 0.03) continue;
      let crowded = false;
      for (let dz = -4; dz <= 4 && !crowded; dz++) {
        for (let dx = -4; dx <= 4; dx++) {
          if (hasTree[x + dx + (z + dz) * W]) crowded = true;
        }
      }
      if (crowded) continue;
      hasTree[x + z * W] = 1;
      const trunk = 4 + ((hash2(x + 3, z + 8) * 3) | 0);
      for (let i = 1; i <= trunk; i++) {
        const y = h + i;
        if (y < H) blocks[idx(x, y, z)] = LOG;
      }
      const top = h + trunk;
      for (let dy = -2; dy <= 2; dy++) {
        const rad = dy === 2 ? 1 : 2;
        for (let dz = -rad; dz <= rad; dz++) {
          for (let dx = -rad; dx <= rad; dx++) {
            if (dx === 0 && dz === 0 && dy <= 0) continue;
            if (Math.abs(dx) === rad && Math.abs(dz) === rad && hash2(x + dx + dy, z + dz) > 0.62) continue;
            const bx = x + dx;
            const by = top + dy;
            const bz = z + dz;
            if (by < 0 || by >= H) continue;
            const bi = idx(bx, by, bz);
            if (blocks[bi] === AIR) blocks[bi] = LEAVES;
          }
        }
      }
    }
  }

  const cloudY = H - 6;
  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      const n = noise2(x * 0.05 + 30, z * 0.05 + 8);
      if (n < 0.64) continue;
      if (blocks[idx(x, cloudY, z)] === AIR) blocks[idx(x, cloudY, z)] = CLOUD;
      if (n > 0.74 && blocks[idx(x, cloudY + 1, z)] === AIR) blocks[idx(x, cloudY + 1, z)] = CLOUD;
    }
  }
}

function computeColumnLight(x, z) {
  let blocked = false;
  let throughWater = false;
  for (let y = H - 1; y >= 0; y--) {
    const i = idx(x, y, z);
    sky[i] = blocked ? 110 : throughWater ? 185 : 255;
    const id = blocks[i];
    if (id === WATER) throughWater = true;
    else if (id !== AIR && id !== LEAVES && id !== CLOUD) blocked = true;
  }
}

function computeAllLight() {
  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) computeColumnLight(x, z);
  }
}

function getBlock(x, y, z) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return AIR;
  return blocks[idx(x, y, z)];
}

function isSolidId(id) {
  return id !== AIR && id !== WATER && id !== CLOUD;
}

function isSolidAt(x, y, z) {
  if (x < 0 || z < 0 || x >= W || z >= D || y >= H) return false;
  if (y < 0) return true;
  return isSolidId(blocks[idx(x, y, z)]);
}

function isTargetable(id) {
  return id !== AIR && id !== CLOUD;
}

function hideFace(selfId, neighbor) {
  if (neighbor === AIR) return false;
  if (selfId === neighbor && (selfId === WATER || selfId === LEAVES || selfId === CLOUD)) return true;
  if (neighbor === WATER || neighbor === LEAVES || neighbor === CLOUD) return false;
  return true;
}

function sampleLight(x, y, z) {
  if (y >= H || x < 0 || z < 0 || x >= W || z >= D) return 1;
  if (y < 0) return 0.45;
  return sky[idx(x, y, z)] / 255;
}

function markChunk(x, z) {
  if (x < 0 || z < 0 || x >= W || z >= D) return;
  dirty.add((z >> 4) * CHUNKS_X + (x >> 4));
}

function markBlockDirty(x, z) {
  markChunk(x, z);
  markChunk(x - 1, z);
  markChunk(x + 1, z);
  markChunk(x, z - 1);
  markChunk(x, z + 1);
}

function markAllDirty() {
  dirty.clear();
  for (let i = 0; i < CHUNKS_X * CHUNKS_Z; i++) dirty.add(i);
}

function setBlock(x, y, z, id) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return false;
  const i = idx(x, y, z);
  if (blocks[i] === id) return false;
  blocks[i] = id;
  const key = x + ',' + y + ',' + z;
  if (id === original[i]) changes.delete(key);
  else changes.set(key, id);
  computeColumnLight(x, z);
  markBlockDirty(x, z);
  scheduleSave(true);
  return true;
}

function surfaceNear(x, z) {
  x = Math.max(0, Math.min(W - 1, Math.floor(x)));
  z = Math.max(0, Math.min(D - 1, Math.floor(z)));
  for (let y = H - 1; y >= 0; y--) {
    const id = blocks[idx(x, y, z)];
    if (id !== AIR && id !== CLOUD && id !== LEAVES) return y;
  }
  return 8;
}

function findSpawn() {
  const cx = (W / 2) | 0;
  const cz = (D / 2) | 0;
  for (let r = 0; r < 24; r++) {
    for (let a = 0; a < 10; a++) {
      const x = Math.max(1, Math.min(W - 2, cx + Math.round(Math.cos(a) * r)));
      const z = Math.max(1, Math.min(D - 2, cz + Math.round(Math.sin(a) * r)));
      let top = 0;
      for (let y = H - 1; y >= 0; y--) {
        if (isSolidId(blocks[idx(x, y, z)])) {
          top = y;
          break;
        }
      }
      const id = blocks[idx(x, top, z)];
      if ((id === GRASS || id === SAND) && getBlock(x, top + 1, z) === AIR && getBlock(x, top + 2, z) === AIR) {
        return { x: x + 0.5, y: top + 1, z: z + 0.5 };
      }
    }
  }
  return { x: W / 2, y: 30, z: D / 2 };
}

function placePlayer(pos, keepLook) {
  player.x = pos.x;
  player.y = pos.y;
  player.z = pos.z;
  player.vy = 0;
  if (!keepLook) {
    player.yaw = 0.6;
    player.pitch = -0.28;
    player.flying = false;
  }
}

function updateMenuFocus() {
  menuFocus = {
    x: player.x,
    y: surfaceNear(player.x, player.z) + 1.5,
    z: player.z
  };
}

function createWorld(nextSeed, saved) {
  seed = nextSeed >>> 0;
  changes.clear();
  blocks = new Uint8Array(W * H * D);
  sky = new Uint8Array(W * H * D);
  generate();
  original = blocks.slice();
  if (saved && saved.changes) {
    for (const change of saved.changes) {
      const x = change[0];
      const y = change[1];
      const z = change[2];
      const id = change[3];
      if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) continue;
      blocks[idx(x, y, z)] = id;
      changes.set(x + ',' + y + ',' + z, id);
    }
  }
  computeAllLight();
  const fresh = findSpawn();
  if (saved && saved.spawn) {
    spawn.x = saved.spawn.x;
    spawn.y = saved.spawn.y;
    spawn.z = saved.spawn.z;
    spawn.yaw = saved.spawn.yaw || 0.6;
  } else {
    spawn.x = fresh.x;
    spawn.y = fresh.y;
    spawn.z = fresh.z;
    spawn.yaw = 0.6;
  }
  if (saved && saved.player) {
    placePlayer(saved.player, true);
    player.yaw = saved.player.yaw || 0;
    player.pitch = saved.player.pitch || 0;
    player.flying = !!saved.player.flying;
    slot = saved.slot | 0;
    if (slot < 0 || slot >= HOTBAR.length) slot = 0;
  } else {
    placePlayer(fresh, false);
    slot = 0;
  }
  updateMenuFocus();
  markAllDirty();
  loading = true;
  playBtn.disabled = false;
  newBtn.disabled = true;
  statusEl.textContent = 'Preparando o seu mundo...';
  seedEl.textContent = 'Código do mundo ' + seed;
  selectSlot(slot);
}

function storageRead() {
  try {
    const local = localStorage.getItem(SAVE_KEY);
    if (local) return local;
  } catch (err) { /* private mode */ }
  try {
    return sessionStorage.getItem(SAVE_KEY);
  } catch (err) { /* ignore */ }
  return null;
}

function storageWrite(text) {
  try {
    localStorage.setItem(SAVE_KEY, text);
    return 'local';
  } catch (err) { /* quota or blocked */ }
  try {
    sessionStorage.setItem(SAVE_KEY, text);
    return 'session';
  } catch (err) { /* ignore */ }
  return '';
}

function storageClear() {
  try { localStorage.removeItem(SAVE_KEY); } catch (err) { /* ignore */ }
  try { sessionStorage.removeItem(SAVE_KEY); } catch (err) { /* ignore */ }
}

function save(announce) {
  const list = [];
  for (const [key, id] of changes) {
    const parts = key.split(',');
    list.push([+parts[0], +parts[1], +parts[2], id]);
  }
  const data = {
    v: 1,
    seed,
    spawn,
    slot,
    player: {
      x: player.x,
      y: player.y,
      z: player.z,
      yaw: player.yaw,
      pitch: player.pitch,
      flying: player.flying
    },
    changes: list
  };
  let text = '';
  try {
    text = JSON.stringify(data);
  } catch (err) {
    return false;
  }
  const where = storageWrite(text);
  if (!where) {
    if (announce) toast('Não consegui guardar o seu mundo.');
    return false;
  }
  if (announce) {
    savedEl.textContent = where === 'session' ? 'Guardei por agora' : 'Guardei!';
    savedEl.classList.add('show');
    clearTimeout(save.flash);
    save.flash = setTimeout(() => savedEl.classList.remove('show'), 1200);
  }
  return true;
}

let saveTimer = 0;
function scheduleSave(announce) {
  if (announce) scheduleSave.announce = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const tell = scheduleSave.announce;
    scheduleSave.announce = false;
    save(tell);
  }, 400);
}

function loadSave() {
  const raw = storageRead();
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || data.v !== 1 || !data.seed) return null;
    return data;
  } catch (err) {
    return null;
  }
}

function compile(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || 'shader');
  }
  return shader;
}

function link(vs, fs) {
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'link');
  }
  return program;
}

function initGL() {
  gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: true,
    powerPreference: 'high-performance'
  });
  if (!gl) throw new Error('Este navegador não conseguiu abrir o jogo.');

  worldProg = link(compile(gl.VERTEX_SHADER, `
    attribute vec3 aPos;
    attribute vec2 aUv;
    attribute float aShade;
    uniform mat4 uMvp;
    uniform vec3 uCam;
    varying vec2 vUv;
    varying float vShade;
    varying float vDist;
    void main() {
      gl_Position = uMvp * vec4(aPos, 1.0);
      vUv = aUv;
      vShade = aShade;
      vDist = length(aPos - uCam);
    }
  `), compile(gl.FRAGMENT_SHADER, `
    precision mediump float;
    uniform sampler2D uTex;
    uniform vec3 uFogColor;
    uniform float uFogNear;
    uniform float uFogFar;
    uniform float uCutoff;
    varying vec2 vUv;
    varying float vShade;
    varying float vDist;
    void main() {
      vec4 tex = texture2D(uTex, vUv);
      if (tex.a < uCutoff) discard;
      float fog = clamp((vDist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
      vec3 rgb = mix(tex.rgb * vShade, uFogColor, fog);
      gl_FragColor = vec4(rgb, tex.a);
    }
  `));
  uMvp = gl.getUniformLocation(worldProg, 'uMvp');
  uCam = gl.getUniformLocation(worldProg, 'uCam');
  uFogColor = gl.getUniformLocation(worldProg, 'uFogColor');
  uFogNear = gl.getUniformLocation(worldProg, 'uFogNear');
  uFogFar = gl.getUniformLocation(worldProg, 'uFogFar');
  uCutoff = gl.getUniformLocation(worldProg, 'uCutoff');
  aPos = gl.getAttribLocation(worldProg, 'aPos');
  aUv = gl.getAttribLocation(worldProg, 'aUv');
  aShade = gl.getAttribLocation(worldProg, 'aShade');

  skyProg = link(compile(gl.VERTEX_SHADER, `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `), compile(gl.FRAGMENT_SHADER, `
    precision mediump float;
    uniform vec2 uRes;
    uniform vec3 uTop;
    uniform vec3 uHorizon;
    uniform vec3 uForward;
    uniform vec3 uRight;
    uniform vec3 uUp;
    uniform float uFov;
    uniform vec3 uSun;
    uniform float uUnder;
    void main() {
      vec2 ndc = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
      float aspect = uRes.x / uRes.y;
      vec3 dir = normalize(uForward + uRight * ndc.x * uFov * aspect + uUp * ndc.y * uFov);
      float skyT = pow(clamp(dir.y * 0.5 + 0.5, 0.0, 1.0), 0.85);
      vec3 col = mix(uHorizon, uTop, skyT);
      float sun = pow(max(dot(dir, uSun), 0.0), 220.0);
      float halo = pow(max(dot(dir, uSun), 0.0), 6.0);
      col += vec3(1.0, 0.93, 0.72) * (sun + halo * 0.22) * (1.0 - uUnder);
      gl_FragColor = vec4(col, 1.0);
    }
  `));
  skyRes = gl.getUniformLocation(skyProg, 'uRes');
  skyTop = gl.getUniformLocation(skyProg, 'uTop');
  skyHorizon = gl.getUniformLocation(skyProg, 'uHorizon');
  skyForward = gl.getUniformLocation(skyProg, 'uForward');
  skyRight = gl.getUniformLocation(skyProg, 'uRight');
  skyUp = gl.getUniformLocation(skyProg, 'uUp');
  skyFov = gl.getUniformLocation(skyProg, 'uFov');
  skySun = gl.getUniformLocation(skyProg, 'uSun');
  skyUnder = gl.getUniformLocation(skyProg, 'uUnder');

  lineProg = link(compile(gl.VERTEX_SHADER, `
    attribute vec3 aPos;
    uniform mat4 uMvp;
    void main() { gl_Position = uMvp * vec4(aPos, 1.0); }
  `), compile(gl.FRAGMENT_SHADER, `
    precision mediump float;
    uniform vec4 uColor;
    void main() { gl_FragColor = uColor; }
  `));
  lineMvp = gl.getUniformLocation(lineProg, 'uMvp');
  lineColor = gl.getUniformLocation(lineProg, 'uColor');
  linePos = gl.getAttribLocation(lineProg, 'aPos');

  const skyBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  skyProg.buf = skyBuf;

  partBuf = gl.createBuffer();
  lineBuf = gl.createBuffer();
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.clearDepth(1);
}

function makeAtlas() {
  atlasCanvas = document.createElement('canvas');
  atlasCanvas.width = 64;
  atlasCanvas.height = 64;
  const g = atlasCanvas.getContext('2d');

  function paint(tile, fn) {
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = 16;
    tileCanvas.height = 16;
    const tg = tileCanvas.getContext('2d');
    fn(tg);
    g.drawImage(tileCanvas, (tile % 4) * 16, ((tile / 4) | 0) * 16);
  }

  function fillNoise(tg, colors, salt) {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = texRand(x, y, salt);
        tg.fillStyle = colors[(n * colors.length) | 0];
        tg.fillRect(x, y, 1, 1);
      }
    }
  }

  paint(TILE.grassTop, (tg) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = texRand(x, y, 1);
        let color = n > 0.82 ? '#3c7924' : n > 0.45 ? '#59a336' : '#73c24a';
        if (n > 0.975) color = '#efe06a';
        else if (texRand(x, y, 2) > 0.988) color = '#e56d8f';
        tg.fillStyle = color;
        tg.fillRect(x, y, 1, 1);
      }
    }
  });

  paint(TILE.grassSide, (tg) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dirt = y > 4 || (y > 2 && texRand(x, y, 3) > 0.45);
        const n = texRand(x, y, 4);
        tg.fillStyle = dirt
          ? (n > 0.55 ? '#8d6440' : '#6d4a30')
          : (n > 0.5 ? '#62aa3d' : '#4d8d2c');
        tg.fillRect(x, y, 1, 1);
      }
    }
  });

  paint(TILE.dirt, (tg) => fillNoise(tg, ['#6a4630', '#8a5d3c', '#7a5236', '#5b3b28'], 5));
  paint(TILE.stone, (tg) => fillNoise(tg, ['#8d8d8d', '#7a7a7a', '#6c6c6c', '#9a9a9a'], 6));
  paint(TILE.cobble, (tg) => {
    fillNoise(tg, ['#7d7d7d', '#6a6a6a', '#8f8f8f'], 7);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (texRand(x, y, 8) > 0.86) {
          tg.fillStyle = '#4e4e4e';
          tg.fillRect(x, y, 1, 1);
        }
      }
    }
  });
  paint(TILE.sand, (tg) => fillNoise(tg, ['#e6d59a', '#d9c788', '#f0e2ad', '#c9b56e'], 9));
  paint(TILE.logSide, (tg) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const stripe = x % 4 === 0;
        const n = texRand(x, y, 10);
        tg.fillStyle = stripe ? '#3f2c1c' : (n > 0.5 ? '#7a5a34' : '#654826');
        tg.fillRect(x, y, 1, 1);
      }
    }
  });
  paint(TILE.logTop, (tg) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dist = Math.hypot(x - 7.5, y - 7.5);
        let color = '#6b4e2c';
        if (dist > 6.4) color = '#3f2c1c';
        else if (dist > 4.2) color = '#b08a52';
        else if (dist < 2) color = '#d8b56e';
        tg.fillStyle = color;
        tg.fillRect(x, y, 1, 1);
      }
    }
  });
  paint(TILE.leaves, (tg) => {
    tg.clearRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (texRand(x, y, 11) < 0.22) continue;
        const n = texRand(x, y, 12);
        tg.fillStyle = n > 0.66 ? '#246b22' : n > 0.33 ? '#31862c' : '#43a33a';
        tg.fillRect(x, y, 1, 1);
      }
    }
  });
  paint(TILE.planks, (tg) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const band = (y / 4) | 0;
        let color = band % 2 ? '#d1ae68' : '#b9924c';
        if (x % 8 === 0 || y % 4 === 0) color = '#7c5d30';
        tg.fillStyle = color;
        tg.fillRect(x, y, 1, 1);
      }
    }
  });
  paint(TILE.water, (tg) => {
    tg.clearRect(0, 0, 16, 16);
    tg.fillStyle = 'rgba(48, 118, 196, 0.72)';
    tg.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (texRand(x, y, 13) > 0.86) {
          tg.fillStyle = 'rgba(186, 224, 255, 0.55)';
          tg.fillRect(x, y, 1, 1);
        }
      }
    }
  });
  paint(TILE.bedrock, (tg) => fillNoise(tg, ['#2a2a2a', '#3a3a3a', '#1a1a1a', '#4a4a4a'], 14));
  paint(TILE.cloud, (tg) => fillNoise(tg, ['#ffffff', '#f3f7ff', '#e4eef8'], 15));
  paint(TILE.coal, (tg) => {
    fillNoise(tg, ['#6e6e6e', '#7d7d7d', '#5c5c5c'], 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (texRand(x, y, 17) > 0.82) {
          tg.fillStyle = '#161616';
          tg.fillRect(x, y, 1, 1);
        }
      }
    }
  });
  paint(TILE.iron, (tg) => {
    fillNoise(tg, ['#8a8a8a', '#767676', '#9a9a9a'], 18);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (texRand(x, y, 19) > 0.84) {
          tg.fillStyle = texRand(x, y, 20) > 0.5 ? '#e6d2b0' : '#c4a888';
          tg.fillRect(x, y, 1, 1);
        }
      }
    }
  });

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return atlasCanvas.toDataURL();
}

function tileUV(tile, u, v) {
  const col = tile % 4;
  const row = (tile / 4) | 0;
  const pad = 0.5;
  const u0 = (col * 16 + pad) / 64;
  const u1 = (col * 16 + 16 - pad) / 64;
  const v1 = 1 - (row * 16 + pad) / 64;
  const v0 = 1 - (row * 16 + 16 - pad) / 64;
  return [u0 + (u1 - u0) * u, v0 + (v1 - v0) * v];
}

function pushFace(dest, x, y, z, size, face, tile, shade) {
  const tris = [0, 1, 2, 0, 2, 3];
  for (let i = 0; i < 6; i++) {
    const corner = face.v[tris[i]];
    const uvIn = face.uv[tris[i]];
    const uv = tileUV(tile, uvIn[0], uvIn[1]);
    dest.push(x + corner[0] * size, y + corner[1] * size, z + corner[2] * size, uv[0], uv[1], shade);
  }
}

function uploadMesh(mesh, kind, data) {
  let buffer = mesh[kind];
  if (!buffer) buffer = mesh[kind] = gl.createBuffer();
  mesh[kind + 'N'] = (data.length / 6) | 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
}

function buildChunk(key) {
  const cx = key % CHUNKS_X;
  const cz = (key / CHUNKS_X) | 0;
  const mesh = chunkMeshes[key];
  const solid = [];
  const water = [];
  const x0 = cx * CHUNK;
  const z0 = cz * CHUNK;
  for (let y = 0; y < H; y++) {
    for (let z = z0; z < z0 + CHUNK; z++) {
      for (let x = x0; x < x0 + CHUNK; x++) {
        const id = blocks[idx(x, y, z)];
        if (id === AIR) continue;
        const info = INFO[id];
        const dest = id === WATER ? water : solid;
        for (let f = 0; f < 6; f++) {
          const face = FACES[f];
          const nx = x + face.n[0];
          const ny = y + face.n[1];
          const nz = z + face.n[2];
          if (hideFace(id, getBlock(nx, ny, nz))) continue;
          const light = sampleLight(nx, ny, nz);
          const shade = face.s * (0.4 + 0.6 * light);
          pushFace(dest, x, y, z, 1, face, info.tiles[f], shade);
        }
      }
    }
  }
  uploadMesh(mesh, 'solid', solid);
  uploadMesh(mesh, 'water', water);
}

function buildSome() {
  const budget = loading ? 3 : 2;
  let built = 0;
  for (const key of dirty) {
    dirty.delete(key);
    buildChunk(key);
    built++;
    if (built >= budget) break;
  }
  if (loading) {
    const total = CHUNKS_X * CHUNKS_Z;
    statusEl.textContent = 'Preparando o seu mundo... ' + (total - dirty.size) + '/' + total;
    if (dirty.size === 0) {
      loading = false;
      statusEl.textContent = '';
      playBtn.disabled = false;
      newBtn.disabled = false;
      refreshMenu();
      if (pendingEnter) {
        pendingEnter = false;
        enterPlay();
      }
    }
  }
}

function initMeshes() {
  for (let cz = 0; cz < CHUNKS_Z; cz++) {
    for (let cx = 0; cx < CHUNKS_X; cx++) chunkMeshes.push({ cx, cz });
  }
}

function overlaps() {
  const minX = Math.floor(player.x - RADIUS);
  const maxX = Math.floor(player.x + RADIUS - 1e-4);
  const minY = Math.floor(player.y);
  const maxY = Math.floor(player.y + HEIGHT - 1e-4);
  const minZ = Math.floor(player.z - RADIUS);
  const maxZ = Math.floor(player.z + RADIUS - 1e-4);
  for (let y = minY; y <= maxY; y++) {
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        if (isSolidAt(x, y, z)) return true;
      }
    }
  }
  return false;
}

function sweep(axis, amount) {
  const prev = player[axis];
  if (!amount) return 1;
  let lo = 0;
  let hi = 1;
  let best = 0;
  for (let i = 0; i < 10; i++) {
    const t = (lo + hi) * 0.5;
    player[axis] = prev + amount * t;
    if (overlaps()) hi = t;
    else {
      best = t;
      lo = t;
    }
  }
  player[axis] = prev + amount * best;
  if (overlaps()) {
    player[axis] = prev;
    best = 0;
  }
  if (axis === 'y' && best < 0.999) {
    player.vy = 0;
    if (amount < 0) grounded = true;
  }
  return best;
}

function tryAxis(axis, amount, allowStep) {
  if (!amount) return;
  const ox = player.x;
  const oy = player.y;
  const oz = player.z;
  const traveled = sweep(axis, amount);
  if (!allowStep || traveled > 0.85) return;
  player.x = ox;
  player.y = oy + 1;
  player.z = oz;
  if (overlaps()) {
    player.y = oy;
    sweep(axis, amount);
    return;
  }
  const stepped = sweep(axis, amount);
  if (stepped <= traveled + 0.05) {
    player.x = ox;
    player.y = oy;
    player.z = oz;
    sweep(axis, amount);
  }
}

function bodyInWater() {
  const x = Math.floor(player.x);
  const z = Math.floor(player.z);
  return getBlock(x, Math.floor(player.y), z) === WATER || getBlock(x, Math.floor(player.y + 1), z) === WATER;
}

function getEye() {
  const sneak = keys.ShiftLeft || keys.ShiftRight;
  return {
    x: player.x,
    y: player.y + (sneak && !player.flying ? 1.35 : EYE) + bob,
    z: player.z
  };
}

function eyeInWater() {
  const eye = getEye();
  return getBlock(Math.floor(eye.x), Math.floor(eye.y), Math.floor(eye.z)) === WATER;
}

function respawn() {
  player.x = spawn.x;
  player.y = spawn.y;
  player.z = spawn.z;
  player.vy = 0;
  player.flying = false;
  toast('Você voltou para casa!');
}

function updatePlayer(dt) {
  if (keys.ArrowLeft) player.yaw -= 1.8 * dt;
  if (keys.ArrowRight) player.yaw += 1.8 * dt;
  if (keys.ArrowUp) player.pitch += 1.5 * dt;
  if (keys.ArrowDown) player.pitch -= 1.5 * dt;
  player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch));

  const wasGrounded = grounded;
  const sneak = keys.ShiftLeft || keys.ShiftRight;
  const sprint = keys.ControlLeft || keys.ControlRight;
  const water = bodyInWater();
  const fx = Math.sin(player.yaw);
  const fz = -Math.cos(player.yaw);
  const rx = Math.cos(player.yaw);
  const rz = Math.sin(player.yaw);
  let ix = 0;
  let iz = 0;
  if (keys.KeyW) iz += 1;
  if (keys.KeyS) iz -= 1;
  if (keys.KeyD) ix += 1;
  if (keys.KeyA) ix -= 1;
  ix += touchMove.x;
  iz -= touchMove.y;
  const len = Math.hypot(ix, iz);
  if (len) {
    ix /= len;
    iz /= len;
  }
  let speed = player.flying ? 12 : sneak ? 1.7 : sprint ? 7.5 : 4.8;
  if (water && !player.flying) speed *= 0.55;
  const dx = (rx * ix + fx * iz) * speed * dt;
  const dz = (rz * ix + fz * iz) * speed * dt;

  if (player.flying) {
    const vertical = (keys.Space ? 1 : 0) - (sneak ? 1 : 0);
    player.vy = vertical * 8;
  } else if (water) {
    player.vy -= 8 * dt;
    player.vy *= Math.exp(-3 * dt);
    if (keys.Space) player.vy += 16 * dt;
    player.vy = Math.max(-3.5, Math.min(4.5, player.vy));
  } else {
    player.vy -= 28 * dt;
    if (player.vy < -36) player.vy = -36;
  }

  grounded = false;
  tryAxis('x', dx, wasGrounded && !player.flying && !sneak && !water);
  tryAxis('z', dz, wasGrounded && !player.flying && !sneak && !water);
  sweep('y', player.vy * dt);

  if (overlaps()) {
    player.y += 0.25;
    if (player.y > H + 2) respawn();
  }
  if (player.y < -8) respawn();

  if (grounded) coyote = 0.12;
  else coyote = Math.max(0, coyote - dt);

  const moving = len > 0 && (grounded || player.flying);
  if (moving && grounded && !player.flying) {
    bobPhase += dt * (sprint ? 14 : 10);
    bob = Math.sin(bobPhase) * 0.045;
  } else {
    bob += (0 - bob) * Math.min(1, dt * 8);
  }
}

function basis(yaw, pitch) {
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const sy = Math.sin(yaw);
  const cy = Math.cos(yaw);
  const fx = sy * cp;
  const fy = sp;
  const fz = -cy * cp;
  let rx = -fz;
  let ry = 0;
  let rz = fx;
  const len = Math.hypot(rx, ry, rz) || 1;
  rx /= len;
  ry /= len;
  rz /= len;
  const ux = ry * fz - rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy - ry * fx;
  return { fx, fy, fz, rx, ry, rz, ux, uy, uz };
}

function raycast(maxDist) {
  const eye = getEye();
  const b = basis(player.yaw, player.pitch);
  const dx = b.fx;
  const dy = b.fy;
  const dz = b.fz;
  let x = Math.floor(eye.x);
  let y = Math.floor(eye.y);
  let z = Math.floor(eye.z);
  const stepX = dx < 0 ? -1 : 1;
  const stepY = dy < 0 ? -1 : 1;
  const stepZ = dz < 0 ? -1 : 1;
  const tDeltaX = dx === 0 ? 1e9 : Math.abs(1 / dx);
  const tDeltaY = dy === 0 ? 1e9 : Math.abs(1 / dy);
  const tDeltaZ = dz === 0 ? 1e9 : Math.abs(1 / dz);
  let tMaxX = dx === 0 ? 1e9 : (dx > 0 ? x + 1 - eye.x : eye.x - x) * tDeltaX;
  let tMaxY = dy === 0 ? 1e9 : (dy > 0 ? y + 1 - eye.y : eye.y - y) * tDeltaY;
  let tMaxZ = dz === 0 ? 1e9 : (dz > 0 ? z + 1 - eye.z : eye.z - z) * tDeltaZ;
  let face = [0, 0, 0];
  let dist = 0;
  for (let i = 0; i < 64; i++) {
    const id = getBlock(x, y, z);
    if (isTargetable(id)) return { x, y, z, id, face, dist };
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      if (tMaxX > maxDist) return null;
      x += stepX;
      dist = tMaxX;
      tMaxX += tDeltaX;
      face = [-stepX, 0, 0];
    } else if (tMaxY < tMaxZ) {
      if (tMaxY > maxDist) return null;
      y += stepY;
      dist = tMaxY;
      tMaxY += tDeltaY;
      face = [0, -stepY, 0];
    } else {
      if (tMaxZ > maxDist) return null;
      z += stepZ;
      dist = tMaxZ;
      tMaxZ += tDeltaZ;
      face = [0, 0, -stepZ];
    }
  }
  return null;
}

function burst(x, y, z, tile) {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: x + Math.random(),
      y: y + Math.random(),
      z: z + Math.random(),
      vx: (Math.random() - 0.5) * 3.2,
      vy: 1.5 + Math.random() * 3,
      vz: (Math.random() - 0.5) * 3.2,
      life: 0.45 + Math.random() * 0.35,
      tile
    });
  }
  while (particles.length > 80) particles.shift();
}

let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function beep(freq, dur, type, volume) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

function breakBlock() {
  const hit = raycast(REACH);
  if (!hit) return false;
  if (hit.id === BEDROCK) {
    toast('Essa pedra é forte demais!');
    return false;
  }
  setBlock(hit.x, hit.y, hit.z, AIR);
  burst(hit.x, hit.y, hit.z, INFO[hit.id].icon);
  beep(hit.id === WATER ? 480 : 90, 0.07, hit.id === WATER ? 'sine' : 'square', 0.035);
  return true;
}

function blockHitsPlayer(x, y, z) {
  return player.x + RADIUS > x && player.x - RADIUS < x + 1 &&
    player.y + HEIGHT > y && player.y < y + 1 &&
    player.z + RADIUS > z && player.z - RADIUS < z + 1;
}

function placeBlock() {
  const hit = raycast(REACH);
  if (!hit) return false;
  const x = hit.x + hit.face[0];
  const y = hit.y + hit.face[1];
  const z = hit.z + hit.face[2];
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return false;
  const current = getBlock(x, y, z);
  if (current !== AIR && current !== WATER) return false;
  const id = HOTBAR[slot];
  if (id !== WATER && blockHitsPlayer(x, y, z)) return false;
  setBlock(x, y, z, id);
  beep(id === WATER ? 520 : 190, 0.05, 'square', 0.03);
  return true;
}

function pickBlock() {
  const hit = raycast(REACH);
  if (!hit) return;
  const index = HOTBAR.indexOf(hit.id);
  if (index >= 0) selectSlot(index);
  else toast(INFO[hit.id].name + ' só aparece no mundo.');
}

function updateUse(dt) {
  breakCd -= dt;
  placeCd -= dt;
  const wantBreak = mouse.left || keys.KeyQ;
  const wantPlace = mouse.right || keys.KeyE;
  if (wantBreak && breakCd <= 0) {
    breakBlock();
    breakCd = 0.16;
  }
  if (wantPlace && placeCd <= 0) {
    if (placeBlock()) placeCd = 0.18;
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    p.vy -= 16 * dt;
    const ny = p.y + p.vy * dt;
    if (isSolidAt(Math.floor(p.x), Math.floor(ny), Math.floor(p.z))) p.vy *= -0.25;
    else p.y = ny;
    p.x += p.vx * dt;
    p.z += p.vz * dt;
  }
}

function mul(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[r] * b[c * 4] +
        a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] +
        a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

function viewMatrix(eye, yaw, pitch) {
  const b = basis(yaw, pitch);
  const out = new Float32Array(16);
  out[0] = b.rx;
  out[1] = b.ux;
  out[2] = -b.fx;
  out[4] = b.ry;
  out[5] = b.uy;
  out[6] = -b.fy;
  out[8] = b.rz;
  out[9] = b.uz;
  out[10] = -b.fz;
  out[12] = -(b.rx * eye[0] + b.ry * eye[1] + b.rz * eye[2]);
  out[13] = -(b.ux * eye[0] + b.uy * eye[1] + b.uz * eye[2]);
  out[14] = b.fx * eye[0] + b.fy * eye[1] + b.fz * eye[2];
  out[15] = 1;
  return out;
}

function lookYawPitch(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const yaw = Math.atan2(dx, -dz);
  const pitch = Math.atan2(dy, Math.hypot(dx, dz));
  return { yaw, pitch };
}

function resize() {
  const view = window.visualViewport;
  const width = view ? view.width : window.innerWidth;
  const height = view ? view.height : window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.style.left = ((view && view.offsetLeft) || 0) + 'px';
  canvas.style.top = ((view && view.offsetTop) || 0) + 'px';
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));
  if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
}

function bindWorldAttribs() {
  gl.enableVertexAttribArray(aPos);
  gl.enableVertexAttribArray(aUv);
  gl.enableVertexAttribArray(aShade);
  gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0);
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 24, 12);
  gl.vertexAttribPointer(aShade, 1, gl.FLOAT, false, 24, 20);
}

function drawBuffer(buffer, count) {
  if (!buffer || !count) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  bindWorldAttribs();
  gl.drawArrays(gl.TRIANGLES, 0, count);
}

function writeBox(x, y, z, expand) {
  const x0 = x - expand;
  const y0 = y - expand;
  const z0 = z - expand;
  const x1 = x + 1 + expand;
  const y1 = y + 1 + expand;
  const z1 = z + 1 + expand;
  const corners = [
    [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1],
    [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]
  ];
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  let i = 0;
  for (const edge of edges) {
    const a = corners[edge[0]];
    const b = corners[edge[1]];
    lineVerts[i++] = a[0];
    lineVerts[i++] = a[1];
    lineVerts[i++] = a[2];
    lineVerts[i++] = b[0];
    lineVerts[i++] = b[1];
    lineVerts[i++] = b[2];
  }
}

function cameraPose() {
  if (mode === 'play') {
    const eye = getEye();
    return { x: eye.x, y: eye.y, z: eye.z, yaw: player.yaw, pitch: player.pitch };
  }
  const ang = animTime * 0.18;
  const x = menuFocus.x + Math.sin(ang) * 22;
  const z = menuFocus.z + Math.cos(ang) * 22;
  const y = menuFocus.y + 12;
  const look = lookYawPitch({ x, y, z }, menuFocus);
  return { x, y, z, yaw: look.yaw, pitch: look.pitch };
}

function render() {
  const pose = cameraPose();
  const under = mode === 'play' && eyeInWater();
  const aspect = canvas.width / canvas.height;
  const fov = 72 * Math.PI / 180;
  const proj = perspective(fov, aspect, 0.08, 220);
  const view = viewMatrix([pose.x, pose.y, pose.z], pose.yaw, pose.pitch);
  const mvp = mul(proj, view);
  const b = basis(pose.yaw, pose.pitch);
  const fog = under ? [0.05, 0.25, 0.48] : [0.66, 0.84, 0.95];
  const top = under ? [0.02, 0.16, 0.38] : [0.34, 0.62, 0.92];

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.DEPTH_TEST);
  gl.useProgram(skyProg);
  gl.uniform2f(skyRes, canvas.width, canvas.height);
  gl.uniform3fv(skyTop, top);
  gl.uniform3fv(skyHorizon, fog);
  gl.uniform3f(skyForward, b.fx, b.fy, b.fz);
  gl.uniform3f(skyRight, b.rx, b.ry, b.rz);
  gl.uniform3f(skyUp, b.ux, b.uy, b.uz);
  gl.uniform1f(skyFov, Math.tan(fov / 2));
  const sunLen = Math.hypot(0.35, 0.82, 0.28);
  gl.uniform3f(skySun, 0.35 / sunLen, 0.82 / sunLen, 0.28 / sunLen);
  gl.uniform1f(skyUnder, under ? 1 : 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, skyProg.buf);
  const skyPos = gl.getAttribLocation(skyProg, 'aPos');
  gl.enableVertexAttribArray(skyPos);
  gl.vertexAttribPointer(skyPos, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1, 1);
  gl.useProgram(worldProg);
  gl.uniformMatrix4fv(uMvp, false, mvp);
  gl.uniform3f(uCam, pose.x, pose.y, pose.z);
  gl.uniform3fv(uFogColor, fog);
  gl.uniform1f(uFogNear, under ? 1 : 36);
  gl.uniform1f(uFogFar, under ? 16 : 78);
  gl.uniform1f(uCutoff, 0.5);
  gl.disable(gl.BLEND);
  gl.depthMask(true);
  for (const mesh of chunkMeshes) drawBuffer(mesh.solid, mesh.solidN);

  if (particles.length) {
    partScratch.length = 0;
    for (const p of particles) {
      const size = 0.12;
      for (const face of FACES) pushFace(partScratch, p.x, p.y, p.z, size, face, p.tile, Math.max(0.3, p.life));
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, partBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(partScratch), gl.DYNAMIC_DRAW);
    gl.uniform1f(uCutoff, 0.4);
    drawBuffer(partBuf, partScratch.length / 6);
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);
  gl.uniform1f(uCutoff, 0.08);
  const waterOrder = chunkMeshes.slice().sort((a, c) => {
    const da = (a.cx * CHUNK - pose.x) ** 2 + (a.cz * CHUNK - pose.z) ** 2;
    const dc = (c.cx * CHUNK - pose.x) ** 2 + (c.cz * CHUNK - pose.z) ** 2;
    return dc - da;
  });
  for (const mesh of waterOrder) drawBuffer(mesh.water, mesh.waterN);
  gl.depthMask(true);
  gl.disable(gl.BLEND);
  gl.disable(gl.POLYGON_OFFSET_FILL);

  if (mode === 'play' && target) {
    writeBox(target.x, target.y, target.z, 0.004);
    gl.useProgram(lineProg);
    gl.uniformMatrix4fv(lineMvp, false, mvp);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    gl.bufferData(gl.ARRAY_BUFFER, lineVerts, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(linePos);
    gl.vertexAttribPointer(linePos, 3, gl.FLOAT, false, 0, 0);
    gl.uniform4f(lineColor, 0, 0, 0, 1);
    gl.drawArrays(gl.LINES, 0, 24);
  }
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toastEl.classList.remove('show'), 1500);
}

function selectSlot(index) {
  slot = (index + HOTBAR.length) % HOTBAR.length;
  const slots = hotbarEl.children;
  for (let i = 0; i < slots.length; i++) slots[i].classList.toggle('selected', i === slot);
  heldEl.textContent = INFO[HOTBAR[slot]].name;
}

function refreshMenu() {
  const saved = !!storageRead();
  playBtn.textContent = mode === 'pause' || saved ? 'Continuar' : 'Jogar';
  titleEl.textContent = mode === 'pause' ? 'Pausa' : 'Arcraft';
  splashEl.hidden = mode === 'pause';
  subEl.hidden = mode === 'pause';
}

function showOverlay(next) {
  if (next === 'pause') updateMenuFocus();
  mode = next;
  overlay.hidden = false;
  hud.hidden = true;
  refreshMenu();
  releaseInput();
  if (document.pointerLockElement) document.exitPointerLock();
}

let surpriseShown = false;
function showSurprise() {
  if (surpriseShown) return;
  surpriseShown = true;
  const card = document.getElementById('surprise');
  card.hidden = false;
  card.classList.remove('out');
  requestAnimationFrame(() => card.classList.add('show'));
  clearTimeout(showSurprise.timer);
  showSurprise.timer = setTimeout(() => {
    card.classList.remove('show');
    card.classList.add('out');
    setTimeout(() => { card.hidden = true; }, 450);
  }, 4600);
}

function enterPlay() {
  if (loading) {
    pendingEnter = true;
    playBtn.disabled = true;
    playBtn.textContent = 'Entrando...';
    return;
  }
  mode = 'play';
  overlay.hidden = true;
  hud.hidden = false;
  showSurprise();
  ensureAudio();
  save(false);
  canvas.focus();
  if (!document.body.classList.contains('touch')) {
    try {
      const pending = canvas.requestPointerLock();
      if (pending && typeof pending.catch === 'function') pending.catch(() => {});
    } catch (err) { /* arrastar o mouse também olha */ }
  }
}

function lookBy(dx, dy) {
  player.yaw += dx * 0.0022;
  player.pitch -= dy * 0.0022;
  player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch));
}

function tapJump() {
  const now = performance.now();
  if (now - lastSpace < 280) {
    player.flying = !player.flying;
    player.vy = 0;
    toast(player.flying ? 'Você está voando!' : 'Você voltou para o chão.');
    lastSpace = 0;
  } else {
    lastSpace = now;
    if (!player.flying && (grounded || coyote > 0)) {
      player.vy = 8.6;
      grounded = false;
      coyote = 0;
      beep(140, 0.05, 'square', 0.02);
    }
  }
}

function releaseInput() {
  for (const key of Object.keys(keys)) keys[key] = false;
  mouse.left = false;
  mouse.right = false;
  touchMove.x = 0;
  touchMove.y = 0;
  const knob = document.getElementById('stick-knob');
  if (knob) knob.style.transform = '';
}

function hasProgress() {
  return changes.size > 0 || !!storageRead();
}

function requestNewWorld() {
  if (hasProgress() && !confirm('Quer um mundo novo? O de agora vai embora.')) return;
  releaseInput();
  storageClear();
  showOverlay('menu');
  pendingEnter = true;
  createWorld((Math.random() * 0x7fffffff) | 0, null);
}

function initUI(atlasURL) {
  splashEl.textContent = SPLASHES[(Math.random() * SPLASHES.length) | 0];
  hotbarEl.replaceChildren();
  HOTBAR.forEach((id, index) => {
    const button = document.createElement('div');
    button.className = 'slot';
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = String(index + 1);
    const icon = document.createElement('div');
    icon.className = 'icon';
    const tile = INFO[id].icon;
    const col = tile % 4;
    const row = (tile / 4) | 0;
    icon.style.backgroundImage = 'url(' + atlasURL + ')';
    icon.style.backgroundPosition = (col / 3) * 100 + '% ' + (row / 3) * 100 + '%';
    button.append(num, icon);
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectSlot(index);
    });
    hotbarEl.append(button);
  });
  selectSlot(0);
  playBtn.addEventListener('click', () => enterPlay());
  newBtn.addEventListener('click', () => requestNewWorld());
}

function initInput() {
  window.addEventListener('keydown', (event) => {
    keys[event.code] = true;
    if (mode !== 'play') return;
    if (event.code === 'Escape') {
      showOverlay('pause');
      return;
    }
    if (event.code === 'Space') event.preventDefault();
    if (event.code.startsWith('Arrow')) event.preventDefault();
    if (event.code === 'Space' && !event.repeat) tapJump();
    if (/^Digit[1-9]$/.test(event.code)) selectSlot(Number(event.code.slice(5)) - 1);
  });

  window.addEventListener('keyup', (event) => {
    keys[event.code] = false;
  });

  window.addEventListener('blur', releaseInput);

  let aimPress = null;
  let aimDrag = false;

  canvas.addEventListener('mousedown', (event) => {
    if (mode !== 'play') return;
    event.preventDefault();
    aimDrag = false;
    aimPress = { x: event.clientX, y: event.clientY, button: event.button };
    canvas.focus();
    if (!document.body.classList.contains('touch') && document.pointerLockElement !== canvas && canvas.requestPointerLock) {
      const pending = canvas.requestPointerLock();
      if (pending && typeof pending.catch === 'function') pending.catch(() => {});
    }
    if (document.pointerLockElement === canvas) {
      if (event.button === 0) mouse.left = true;
      if (event.button === 2) mouse.right = true;
      if (event.button === 1) pickBlock();
    }
  });

  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) mouse.left = false;
    if (event.button === 2) mouse.right = false;
    if (mode === 'play' && aimPress && aimPress.button === event.button && !aimDrag && document.pointerLockElement !== canvas) {
      if (event.button === 0) breakBlock();
      if (event.button === 2) placeBlock();
      if (event.button === 1) pickBlock();
    }
    if (event.buttons === 0) aimPress = null;
  });

  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  document.addEventListener('mousemove', (event) => {
    if (mode !== 'play') return;
    if (document.pointerLockElement === canvas) {
      lookBy(event.movementX, event.movementY);
      return;
    }
    if (!aimPress || event.buttons === 0) return;
    if (Math.hypot(event.clientX - aimPress.x, event.clientY - aimPress.y) > 3) aimDrag = true;
    lookBy(event.movementX, event.movementY);
  });

  window.addEventListener('wheel', (event) => {
    if (mode !== 'play') return;
    event.preventDefault();
    selectSlot(slot + (event.deltaY > 0 ? 1 : -1));
  }, { passive: false });

  window.addEventListener('resize', resize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resize);
    window.visualViewport.addEventListener('scroll', resize);
  }
  window.addEventListener('beforeunload', () => {
    if (mode === 'play' || changes.size) save(false);
  });
  setInterval(() => {
    if (mode === 'play' && !loading) save(false);
  }, 5000);

  initTouch();
}

function holdButton(el, down, up) {
  el.addEventListener('pointerdown', (event) => {
    if (mode !== 'play') return;
    event.preventDefault();
    event.stopPropagation();
    try { el.setPointerCapture(event.pointerId); } catch (err) { /* o dedo segue mesmo sem captura */ }
    down();
  });
  const end = (event) => {
    if (el.hasPointerCapture && el.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
    up();
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

function initTouch() {
  if (!document.body.classList.contains('touch')) return;

  document.addEventListener('touchmove', (event) => {
    if (mode === 'play') event.preventDefault();
  }, { passive: false });

  const zone = document.getElementById('stick-zone');
  const knob = document.getElementById('stick-knob');
  const max = 46;
  let stickId = null;
  let origin = null;

  function moveStick(event) {
    let dx = event.clientX - origin.x;
    let dy = event.clientY - origin.y;
    const dist = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(dist, max);
    dx = (dx / dist) * clamped;
    dy = (dy / dist) * clamped;
    touchMove.x = dx / max;
    touchMove.y = dy / max;
    knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  }

  zone.addEventListener('pointerdown', (event) => {
    if (mode !== 'play') return;
    event.preventDefault();
    event.stopPropagation();
    stickId = event.pointerId;
    try { zone.setPointerCapture(event.pointerId); } catch (err) { /* o dedo segue mesmo sem captura */ }
    const rect = zone.getBoundingClientRect();
    origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    moveStick(event);
  });
  zone.addEventListener('pointermove', (event) => {
    if (event.pointerId !== stickId) return;
    moveStick(event);
  });
  const endStick = (event) => {
    if (stickId == null || event.pointerId !== stickId) return;
    stickId = null;
    touchMove.x = 0;
    touchMove.y = 0;
    knob.style.transform = '';
  };
  zone.addEventListener('pointerup', endStick);
  zone.addEventListener('pointercancel', endStick);

  const look = document.getElementById('lookpad');
  const looks = new Map();
  look.addEventListener('pointerdown', (event) => {
    if (mode !== 'play') return;
    event.preventDefault();
    looks.set(event.pointerId, { x: event.clientX, y: event.clientY });
    try { look.setPointerCapture(event.pointerId); } catch (err) { /* o dedo segue mesmo sem captura */ }
  });
  look.addEventListener('pointermove', (event) => {
    const prev = looks.get(event.pointerId);
    if (!prev || mode !== 'play') return;
    const dx = event.clientX - prev.x;
    const dy = event.clientY - prev.y;
    prev.x = event.clientX;
    prev.y = event.clientY;
    player.yaw += dx * 0.0034;
    player.pitch -= dy * 0.0034;
    player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch));
  });
  const endLook = (event) => {
    looks.delete(event.pointerId);
  };
  look.addEventListener('pointerup', endLook);
  look.addEventListener('pointercancel', endLook);

  holdButton(document.getElementById('btn-jump'), () => {
    keys.Space = true;
    if (!player.flying && (grounded || coyote > 0)) {
      player.vy = 8.6;
      grounded = false;
      coyote = 0;
      beep(140, 0.05, 'square', 0.02);
    }
  }, () => { keys.Space = false; });

  holdButton(document.getElementById('btn-down'), () => { keys.ShiftLeft = true; }, () => { keys.ShiftLeft = false; });
  holdButton(document.getElementById('btn-break'), () => { mouse.left = true; }, () => { mouse.left = false; });
  holdButton(document.getElementById('btn-place'), () => { mouse.right = true; }, () => { mouse.right = false; });

  document.getElementById('btn-fly').addEventListener('pointerdown', (event) => {
    if (mode !== 'play') return;
    event.preventDefault();
    event.stopPropagation();
    player.flying = !player.flying;
    player.vy = 0;
    if (!player.flying) keys.ShiftLeft = false;
    toast(player.flying ? 'Você está voando!' : 'Você voltou para o chão.');
  });

  document.getElementById('btn-pause').addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (mode === 'play') showOverlay('pause');
  });
}

function updateHud() {
  if (mode !== 'play') return;
  coordsEl.textContent = (player.x | 0) + '  ' + (player.y | 0) + '  ' + (player.z | 0);
  aimEl.textContent = target ? INFO[target.id].name : '';
  modeEl.textContent = player.flying ? 'Voando' : 'Arcraft';
  modeEl.hidden = document.body.classList.contains('touch') && !player.flying;
  document.body.classList.toggle('flying', !!player.flying);
  const jumpBtn = document.getElementById('btn-jump');
  const flyBtn = document.getElementById('btn-fly');
  if (jumpBtn) jumpBtn.textContent = player.flying ? 'Subir' : 'Pular';
  if (flyBtn) flyBtn.textContent = player.flying ? 'Chão' : 'Voar';
  const surprising = !document.getElementById('surprise').hidden;
  const locked = document.pointerLockElement === canvas;
  promptEl.textContent = locked ? '' : 'Arraste o mouse para olhar. Clique para quebrar.';
  promptEl.classList.toggle('show', !surprising && !locked);
}

let last = 0;
let frameError = '';
function frame(now) {
  try {
    if (!last) last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    animTime += dt;
    buildSome();
    if (mode === 'play') {
      updatePlayer(dt);
      updateUse(dt);
      updateParticles(dt);
      target = raycast(REACH);
    } else {
      target = null;
    }
    render();
    updateHud();
  } catch (err) {
    if (frameError !== err.message) {
      frameError = err.message || 'erro';
      statusEl.textContent = 'O jogo parou: ' + frameError;
      overlay.hidden = false;
      hud.hidden = true;
    }
  }
  requestAnimationFrame(frame);
}

function boot() {
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (coarse || navigator.maxTouchPoints > 0) document.body.classList.add('touch');
  resize();
  try {
    initGL();
    const atlasURL = makeAtlas();
    initMeshes();
    initUI(atlasURL);
    initInput();
    const saved = loadSave();
    if (saved) createWorld(saved.seed, saved);
    else createWorld((Math.random() * 0x7fffffff) | 0, null);
    refreshMenu();
    requestAnimationFrame(frame);
  } catch (err) {
    statusEl.textContent = err.message || 'O jogo não conseguiu abrir.';
    playBtn.disabled = true;
    newBtn.disabled = true;
  }
}

boot();
