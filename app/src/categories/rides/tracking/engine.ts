/**
 * The live-tracking 3D engine.
 *
 * A direct port of the canvas renderer, with every drawing call stripped out.
 * `step()` advances the simulation and returns a frame: a depth-sorted list of
 * flat-shaded polygons in screen space, plus the two map pins. Nothing here
 * imports React or React Native, so the same engine drives the Skia renderer,
 * the SVG renderer, and the unit tests.
 *
 * World axes: x across, y up, z forward. Sizes are "world units" — the road
 * grid is 36 units apart and the rider is about 8 units tall.
 */

export type StageKey = 'assigning' | 'assigned' | 'picked' | 'delivered';

export interface Stage {
  key: StageKey;
  title: string;
  body: string;
  etaMinutes: number;
  riderName: string;
  riderMeta: string;
  avatar: string;
  showActions: boolean;
  searching: boolean;
  progress: number;
}

export type CameraMode = 'follow' | 'route';

export interface Quad {
  /** Screen-space points, flattened: [x0, y0, x1, y1, ...] */
  points: number[];
  color: string;
  alpha: number;
  /** Camera-space depth, already sorted far-to-near. */
  depth: number;
}

export interface Pin {
  x: number;
  y: number;
  scale: number;
  color: string;
  label: string;
}

export interface Frame {
  /** The city, the road and the route. Drawn first. */
  world: Quad[];
  /** The courier. Drawn after the world so nothing pokes through him. */
  rider: Quad[];
  pins: Pin[];
  /** Screen position of the rider, for the pulse ring. */
  riderScreen: { x: number; y: number; radius: number } | null;
}

export interface EngineOptions {
  width: number;
  height: number;
  /** 'low' halves the tessellation and pulls the draw distance in. */
  quality?: 'high' | 'low';
  reduceMotion?: boolean;
}

/* ------------------------------------------------------------------ stages */

export const STAGES: Stage[] = [
  {
    key: 'assigning',
    title: 'Finding a rider near the darkstore',
    body: 'oneBuddy Darkstore is packing your order. We are matching you with a rider close by.',
    etaMinutes: 24,
    riderName: 'Looking for a rider',
    riderMeta: 'Usually takes under a minute',
    avatar: '··',
    showActions: false,
    searching: true,
    progress: 0,
  },
  {
    key: 'assigned',
    title: 'Imran is heading to oneBuddy Darkstore',
    body: 'Your rider is 4 minutes from oneBuddy Darkstore and will collect the order on arrival.',
    etaMinutes: 21,
    riderName: 'Imran Q.',
    riderMeta: '4.9 rating · TS 09 EK 4412',
    avatar: 'IQ',
    showActions: true,
    searching: false,
    progress: 0,
  },
  {
    key: 'picked',
    title: 'Picked up — on the way to you',
    body: 'Imran has your order and is riding to Lotus Residency. Follow the route below.',
    etaMinutes: 12,
    riderName: 'Imran Q.',
    riderMeta: '4.9 rating · TS 09 EK 4412',
    avatar: 'IQ',
    showActions: true,
    searching: false,
    progress: 0.62,
  },
  {
    key: 'delivered',
    title: 'Delivered — enjoy your groceries',
    body: 'Handed to you at the door at 8:41 PM. Rate Imran to help other customers.',
    etaMinutes: 0,
    riderName: 'Imran Q.',
    riderMeta: 'Delivered in 23 min',
    avatar: 'IQ',
    showActions: false,
    searching: false,
    progress: 1,
  },
];

/* ------------------------------------------------------------- city layout */

const BLOCK = 26;
const ROAD = 10;
const GRID = 5;
const STEP = BLOCK + ROAD;

interface Building {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  lit: number;
}

function seeded(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function buildCity(): Building[] {
  const palette = ['#D6E5D3', '#E4ECE2', '#CFDFCC', '#EBF4EA', '#DCE8DA', '#C6DBC2'];
  const out: Building[] = [];
  let i = 0;
  for (let gx = -GRID; gx <= GRID; gx++) {
    for (let gz = -GRID; gz <= GRID; gz++) {
      /* blocks sit between the roads, not on them */
      const cx = gx * STEP + STEP / 2;
      const cz = gz * STEP + STEP / 2;
      const perBlock = seeded(i) > 0.45 ? 2 : 1;
      for (let b = 0; b < perBlock; b++) {
        i++;
        const r1 = seeded(i * 3.7);
        const r2 = seeded(i * 8.1);
        const r3 = seeded(i * 5.3);
        const w = 7 + r1 * 8;
        const d = 7 + r2 * 8;
        const h = 8 + r3 * r3 * 46;
        out.push({
          x: cx + (r1 - 0.5) * Math.max(0, BLOCK - w - 4),
          z: cz + (r2 - 0.5) * Math.max(0, BLOCK - d - 4),
          w,
          d,
          h,
          color: palette[Math.floor(seeded(i * 11.3) * palette.length)],
          lit: seeded(i * 17.7),
        });
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------- route */

export const ROUTE = [
  { x: -2 * STEP, z: -2 * STEP },
  { x: -2 * STEP, z: -1 * STEP },
  { x: -1 * STEP, z: -1 * STEP },
  { x: -1 * STEP, z: 1 * STEP },
  { x: 1 * STEP, z: 1 * STEP },
  { x: 1 * STEP, z: 2 * STEP },
  { x: 2 * STEP, z: 2 * STEP },
];

export const PICKUP = ROUTE[0];
export const DROP = ROUTE[ROUTE.length - 1];

const SEG_LEN: number[] = [];
let ROUTE_LEN = 0;
for (let i = 0; i < ROUTE.length - 1; i++) {
  const len = Math.hypot(ROUTE[i + 1].x - ROUTE[i].x, ROUTE[i + 1].z - ROUTE[i].z);
  SEG_LEN.push(len);
  ROUTE_LEN += len;
}

function pointAt(t: number): { x: number; z: number; yaw: number } {
  const target = Math.max(0, Math.min(1, t)) * ROUTE_LEN;
  let acc = 0;
  for (let i = 0; i < SEG_LEN.length; i++) {
    if (acc + SEG_LEN[i] >= target) {
      const f = SEG_LEN[i] ? (target - acc) / SEG_LEN[i] : 0;
      const a = ROUTE[i];
      const b = ROUTE[i + 1];
      return {
        x: a.x + (b.x - a.x) * f,
        z: a.z + (b.z - a.z) * f,
        yaw: Math.atan2(b.x - a.x, b.z - a.z),
      };
    }
    acc += SEG_LEN[i];
  }
  const last = ROUTE[ROUTE.length - 1];
  const prev = ROUTE[ROUTE.length - 2];
  return { x: last.x, z: last.z, yaw: Math.atan2(last.x - prev.x, last.z - prev.z) };
}

/* ------------------------------------------------------------------ colour */

interface RGB {
  r: number;
  g: number;
  b: number;
}

const FOG: RGB = { r: 246, g: 250, b: 245 };
const KEY = { x: 0.34, y: 0.86, z: 0.38 };
const FILL = { x: -0.62, y: 0.18, z: -0.55 };

function shade(hex: string, mul: number): RGB {
  const n = parseInt(hex.slice(1), 16);
  return {
    r: Math.min(255, Math.round((n >> 16) * mul)),
    g: Math.min(255, Math.round(((n >> 8) & 255) * mul)),
    b: Math.min(255, Math.round((n & 255) * mul)),
  };
}

/** Two-light shading: warm key from above-front, cool rim from behind. */
function litShade(hex: string, nx: number, ny: number, nz: number, gloss = 1): RGB {
  const k = Math.max(0, nx * KEY.x + ny * KEY.y + nz * KEY.z);
  const f = Math.max(0, nx * FILL.x + ny * FILL.y + nz * FILL.z);
  return shade(hex, (0.6 + 0.62 * k + 0.26 * f) * gloss);
}

function normalise(a: number): number {
  let v = a;
  while (v > Math.PI) v -= Math.PI * 2;
  while (v < -Math.PI) v += Math.PI * 2;
  return v;
}

function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  return current + normalise(target - current) * (1 - Math.exp(-lambda * dt));
}

/* ============================================================== the engine */

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export class TrackingEngine {
  private width: number;
  private height: number;
  private low: boolean;
  private reduceMotion: boolean;

  private buildings = buildCity();

  private cam = { x: 0, y: 26, z: 40, yaw: 0, pitch: 0.44, fov: 300 };

  private progress = 0;
  private targetProgress = 0;
  private riderYaw = pointAt(0).yaw;
  private riderRoll = 0;
  private spin = 0;
  private lastProgress = 0;
  private elapsed = 0;
  /** The first frame snaps the camera instead of easing in from nowhere. */
  private primed = false;

  stageIndex = 0;
  cameraMode: CameraMode = 'follow';

  /** Filled per frame, then handed out. Reused so we do not churn arrays. */
  private world: Quad[] = [];
  private rider: Quad[] = [];
  private bucket: Quad[] = this.world;
  private fogLimit = 0.82;

  constructor(options: EngineOptions) {
    this.width = options.width;
    this.height = options.height;
    this.low = options.quality === 'low';
    this.reduceMotion = !!options.reduceMotion;
    this.setStage(0);
  }

  /** 0-1 along the route. Useful for progress bars and tests. */
  getProgress(): number {
    return this.progress;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  setStage(index: number): void {
    this.stageIndex = index;
    this.targetProgress = STAGES[index].progress;
    if (index === 0) {
      this.progress = 0;
      this.lastProgress = 0;
    }
  }

  setCameraMode(mode: CameraMode): void {
    this.cameraMode = mode;
  }

  /* ------------------------------------------------------------ projection */

  private project(p: Vec3): { x: number; y: number; z: number } {
    const dx = p.x - this.cam.x;
    const dy = p.y - this.cam.y;
    const dz = p.z - this.cam.z;
    const cy = Math.cos(this.cam.yaw);
    const sy = Math.sin(this.cam.yaw);
    const x1 = dx * cy - dz * sy;
    const z1 = dx * sy + dz * cy;
    const cp = Math.cos(this.cam.pitch);
    const sp = Math.sin(this.cam.pitch);
    /* positive pitch tilts the camera down towards the street */
    const y2 = dy * cp + z1 * sp;
    let z2 = z1 * cp - dy * sp;
    if (z2 < 1) z2 = 1;
    const s = this.cam.fov / z2;
    return { x: this.width / 2 + x1 * s, y: this.height / 2 - y2 * s, z: z2 };
  }

  private push(pts: Vec3[], color: RGB, alpha = 1): void {
    const points: number[] = [];
    let zsum = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = this.project(pts[i]);
      if (p.z <= 1.2) return; /* behind the camera: drop the face */
      points.push(p.x, p.y);
      zsum += p.z;
    }
    const z = zsum / pts.length;
    const f = Math.min(this.fogLimit, Math.max(0, (z - 45) / 190));
    const r = Math.round(color.r + (FOG.r - color.r) * f);
    const g = Math.round(color.g + (FOG.g - color.g) * f);
    const b = Math.round(color.b + (FOG.b - color.b) * f);
    this.bucket.push({ points, color: `rgb(${r},${g},${b})`, alpha, depth: z });
  }

  /* ----------------------------------------------------------------- world */

  private ground(cull: number): void {
    const half = STEP / 2;
    for (let gx = -GRID - 1; gx <= GRID + 1; gx++) {
      for (let gz = -GRID - 1; gz <= GRID + 1; gz++) {
        const cx = gx * STEP;
        const cz = gz * STEP;
        if (Math.hypot(cx - this.cam.x, cz - this.cam.z) > cull) continue;
        this.push(
          [
            { x: cx - half, y: 0, z: cz - half },
            { x: cx + half, y: 0, z: cz - half },
            { x: cx + half, y: 0, z: cz + half },
            { x: cx - half, y: 0, z: cz + half },
          ],
          shade('#E8F2E6', 1),
        );
        this.push(
          [
            { x: cx - half, y: 0.05, z: cz - ROAD / 2 },
            { x: cx + half, y: 0.05, z: cz - ROAD / 2 },
            { x: cx + half, y: 0.05, z: cz + ROAD / 2 },
            { x: cx - half, y: 0.05, z: cz + ROAD / 2 },
          ],
          shade('#404C43', 1),
        );
        this.push(
          [
            { x: cx - ROAD / 2, y: 0.06, z: cz - half },
            { x: cx + ROAD / 2, y: 0.06, z: cz - half },
            { x: cx + ROAD / 2, y: 0.06, z: cz + half },
            { x: cx - ROAD / 2, y: 0.06, z: cz + half },
          ],
          shade('#404C43', 1),
        );
        if (this.low) continue;
        for (let d = -1; d <= 1; d++) {
          const dz = cz + d * (half / 1.6);
          this.push(
            [
              { x: cx - 2.2, y: 0.08, z: dz - 0.35 },
              { x: cx + 2.2, y: 0.08, z: dz - 0.35 },
              { x: cx + 2.2, y: 0.08, z: dz + 0.35 },
              { x: cx - 2.2, y: 0.08, z: dz + 0.35 },
            ],
            shade('#889B8A', 1),
            0.75,
          );
        }
      }
    }
  }

  private routeRibbon(): void {
    const half = 1.5;
    const travelled = this.progress * ROUTE_LEN;
    let acc = 0;

    const strip = (ax: number, az: number, bx: number, bz: number, done: boolean) => {
      const dx = bx - ax;
      const dz = bz - az;
      const len = Math.hypot(dx, dz);
      if (len < 0.01) return;
      const nx = (-dz / len) * half;
      const nz = (dx / len) * half;
      this.push(
        [
          { x: ax + nx, y: 0.16, z: az + nz },
          { x: bx + nx, y: 0.16, z: bz + nz },
          { x: bx - nx, y: 0.16, z: bz - nz },
          { x: ax - nx, y: 0.16, z: az - nz },
        ],
        shade(done ? '#54B713' : '#A4C2A0', 1),
        done ? 0.95 : 0.65,
      );
    };

    for (let i = 0; i < ROUTE.length - 1; i++) {
      const a = ROUTE[i];
      const b = ROUTE[i + 1];
      const len = SEG_LEN[i];
      if (acc + len <= travelled) {
        strip(a.x, a.z, b.x, b.z, true);
      } else if (acc >= travelled) {
        strip(a.x, a.z, b.x, b.z, false);
      } else {
        /* the rider is inside this leg: split it exactly where they are */
        const f = (travelled - acc) / len;
        const mx = a.x + (b.x - a.x) * f;
        const mz = a.z + (b.z - a.z) * f;
        strip(a.x, a.z, mx, mz, true);
        strip(mx, mz, b.x, b.z, false);
      }
      acc += len;
    }
  }

  private box(b: Building): void {
    const x0 = b.x - b.w / 2;
    const x1 = b.x + b.w / 2;
    const z0 = b.z - b.d / 2;
    const z1 = b.z + b.d / 2;
    const y1 = b.h;
    const { cam } = this;
    /* only the faces turned towards the camera are worth building */
    if (cam.z > z1) {
      this.push(
        [
          { x: x0, y: 0, z: z1 },
          { x: x1, y: 0, z: z1 },
          { x: x1, y: y1, z: z1 },
          { x: x0, y: y1, z: z1 },
        ],
        shade(b.color, 1.05),
      );
    }
    if (cam.z < z0) {
      this.push(
        [
          { x: x1, y: 0, z: z0 },
          { x: x0, y: 0, z: z0 },
          { x: x0, y: y1, z: z0 },
          { x: x1, y: y1, z: z0 },
        ],
        shade(b.color, 0.88),
      );
    }
    if (cam.x > x1) {
      this.push(
        [
          { x: x1, y: 0, z: z0 },
          { x: x1, y: 0, z: z1 },
          { x: x1, y: y1, z: z1 },
          { x: x1, y: y1, z: z0 },
        ],
        shade(b.color, 0.98),
      );
    }
    if (cam.x < x0) {
      this.push(
        [
          { x: x0, y: 0, z: z1 },
          { x: x0, y: 0, z: z0 },
          { x: x0, y: y1, z: z0 },
          { x: x0, y: y1, z: z1 },
        ],
        shade(b.color, 0.82),
      );
    }
    this.push(
      [
        { x: x0, y: y1, z: z0 },
        { x: x1, y: y1, z: z0 },
        { x: x1, y: y1, z: z1 },
        { x: x0, y: y1, z: z1 },
      ],
      shade(b.color, 1.15),
    );

    if (b.h <= 12) return;
    const floors = Math.min(this.low ? 3 : 6, Math.floor(b.h / 8));
    const cols = this.low ? 2 : 3;
    const warm = shade('#FFF3C2', 1);
    const WW = 1.1;
    const WH = 1.5;
    for (let fl = 1; fl <= floors; fl++) {
      const fy = (fl * b.h) / (floors + 1) - WH / 2;
      for (let cn = 0; cn < cols; cn++) {
        if (((b.lit * 977 + fl * 61 + cn * 29) % 10) < 5.6) continue; /* that one is dark */
        const fx = x0 + ((cn + 1) * b.w) / (cols + 1);
        const fz = z0 + ((cn + 1) * b.d) / (cols + 1);
        if (cam.z > z1) {
          this.push(
            [
              { x: fx - WW / 2, y: fy, z: z1 + 0.05 },
              { x: fx + WW / 2, y: fy, z: z1 + 0.05 },
              { x: fx + WW / 2, y: fy + WH, z: z1 + 0.05 },
              { x: fx - WW / 2, y: fy + WH, z: z1 + 0.05 },
            ],
            warm,
            0.95,
          );
        }
        if (cam.x > x1) {
          this.push(
            [
              { x: x1 + 0.05, y: fy, z: fz - WW / 2 },
              { x: x1 + 0.05, y: fy, z: fz + WW / 2 },
              { x: x1 + 0.05, y: fy + WH, z: fz + WW / 2 },
              { x: x1 + 0.05, y: fy + WH, z: fz - WW / 2 },
            ],
            warm,
            0.8,
          );
        }
        if (cam.x < x0) {
          this.push(
            [
              { x: x0 - 0.05, y: fy, z: fz + WW / 2 },
              { x: x0 - 0.05, y: fy, z: fz - WW / 2 },
              { x: x0 - 0.05, y: fy + WH, z: fz - WW / 2 },
              { x: x0 - 0.05, y: fy + WH, z: fz + WW / 2 },
            ],
            warm,
            0.8,
          );
        }
      }
    }
  }

  /* -------------------------------------------------------------- the rider

     A courier in a red cap and shirt on a yellow scooter, built from
     ellipsoids and tubes. Local space is the scooter's own: x across, y up,
     z forward. Everything goes through rot()/w2(), so the whole figure yaws
     with the road and rolls into the corners. */

  private drawRider(px: number, pz: number, yaw: number, roll: number, bob: number): void {
    const c = Math.cos(yaw);
    const sn = Math.sin(yaw);
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);
    const { cam } = this;
    const lat = this.low ? 3 : 4;
    const lon = this.low ? 6 : 8;

const RIDER_SCALE = 0.70;

    const rot = (lx: number, ly: number, lz: number): Vec3 => {
      const rx = lx * cr - ly * sr;
      const ry = lx * sr + ly * cr;
      return { x: rx * c + lz * sn, y: ry, z: lz * c - rx * sn };
    };
    const w2 = (lx: number, ly: number, lz: number): Vec3 => {
      const d = rot(lx * RIDER_SCALE, ly * RIDER_SCALE, lz * RIDER_SCALE);
      return { x: px + d.x, y: bob + d.y, z: pz + d.z };
    };
    const facing = (pts: Vec3[], n: Vec3): boolean =>
      (cam.x - pts[0].x) * n.x + (cam.y - pts[0].y) * n.y + (cam.z - pts[0].z) * n.z > 0;

    /* ground shadow and headlight pool belong to the world, not the rider —
       sorted with him they end up drawn over his own wheels */
    const keep = this.bucket;
    this.bucket = this.world;
    const shadow: Vec3[] = [];
    for (let a = 0; a < 12; a++) {
      const t = (a / 12) * Math.PI * 2;
      shadow.push({
        x: px + (Math.cos(t) * 2.0 * c + Math.sin(t) * 4.2 * sn) * RIDER_SCALE,
        y: 0.12,
        z: pz + (Math.sin(t) * 4.2 * c - Math.cos(t) * 2.0 * sn) * RIDER_SCALE,
      });
    }
    this.push(shadow, shade('#9BB098', 1), 0.45);
    if (!this.reduceMotion) {
      const glow: Vec3[] = [];
      for (let g = 0; g < 12; g++) {
        const gt = (g / 12) * Math.PI * 2;
        const along = (7.5 + Math.sin(gt) * 5.5) * RIDER_SCALE;
        glow.push({
          x: px + (Math.cos(gt) * 2.6 * c) * RIDER_SCALE + along * sn,
          y: 0.14,
          z: pz + along * c - (Math.cos(gt) * 2.6 * sn) * RIDER_SCALE,
        });
      }
      this.push(glow, shade('#54B713', 1), 0.15);
    }
    this.bucket = keep;

    /* an ellipsoid; `boxy` squares it off for the insulated bag and panels */
    const ball = (
      lx: number,
      ly: number,
      lz: number,
      rx: number,
      ry: number,
      rz: number,
      color: string,
      gloss = 1,
      latN = lat,
      lonN = lon,
      boxy = 0,
    ): void => {
      const pw = boxy ? 1 / (1 + 2 * boxy) : 1;
      const sq = (u: number): number => (pw === 1 ? u : (u < 0 ? -1 : 1) * Math.pow(Math.abs(u), pw));
      for (let i = 0; i < latN; i++) {
        const t0 = (i / latN) * Math.PI;
        const t1 = ((i + 1) / latN) * Math.PI;
        for (let j = 0; j < lonN; j++) {
          const f0 = (j / lonN) * Math.PI * 2;
          const f1 = ((j + 1) / lonN) * Math.PI * 2;
          const n: number[][] = [
            [Math.sin(t0) * Math.cos(f0), Math.cos(t0), Math.sin(t0) * Math.sin(f0)],
            [Math.sin(t0) * Math.cos(f1), Math.cos(t0), Math.sin(t0) * Math.sin(f1)],
            [Math.sin(t1) * Math.cos(f1), Math.cos(t1), Math.sin(t1) * Math.sin(f1)],
            [Math.sin(t1) * Math.cos(f0), Math.cos(t1), Math.sin(t1) * Math.sin(f0)],
          ];
          const pts: Vec3[] = [];
          let mx = 0;
          let my = 0;
          let mz = 0;
          for (let k = 0; k < 4; k++) {
            pts.push(w2(lx + sq(n[k][0]) * rx, ly + sq(n[k][1]) * ry, lz + sq(n[k][2]) * rz));
            mx += n[k][0];
            my += n[k][1];
            mz += n[k][2];
          }
          const wn = rot(mx / 4, my / 4, mz / 4);
          if (!facing(pts, wn)) continue;
          this.push(pts, litShade(color, wn.x, wn.y, wn.z, gloss));
        }
      }
    };

    /* a tube between two local points: arms, legs, bars */
    const tube = (
      ax: number,
      ay: number,
      az: number,
      bx: number,
      by: number,
      bz: number,
      r: number,
      color: string,
      sides = 8,
      caps = false,
    ): void => {
      let dx = bx - ax;
      let dy = by - ay;
      let dz = bz - az;
      const len = Math.hypot(dx, dy, dz) || 1;
      dx /= len;
      dy /= len;
      dz /= len;
      let ux = -dy;
      let uy = dx;
      let uz = 0;
      if (Math.hypot(ux, uy, uz) < 0.001) {
        ux = 1;
        uy = 0;
        uz = 0;
      }
      const ul = Math.hypot(ux, uy, uz);
      ux /= ul;
      uy /= ul;
      uz /= ul;
      const vx = dy * uz - dz * uy;
      const vy = dz * ux - dx * uz;
      const vz = dx * uy - dy * ux;
      for (let i = 0; i < sides; i++) {
        const a0 = (i / sides) * Math.PI * 2;
        const a1 = ((i + 1) / sides) * Math.PI * 2;
        const n0 = [
          ux * Math.cos(a0) + vx * Math.sin(a0),
          uy * Math.cos(a0) + vy * Math.sin(a0),
          uz * Math.cos(a0) + vz * Math.sin(a0),
        ];
        const n1 = [
          ux * Math.cos(a1) + vx * Math.sin(a1),
          uy * Math.cos(a1) + vy * Math.sin(a1),
          uz * Math.cos(a1) + vz * Math.sin(a1),
        ];
        const pts = [
          w2(ax + n0[0] * r, ay + n0[1] * r, az + n0[2] * r),
          w2(ax + n1[0] * r, ay + n1[1] * r, az + n1[2] * r),
          w2(bx + n1[0] * r, by + n1[1] * r, bz + n1[2] * r),
          w2(bx + n0[0] * r, by + n0[1] * r, bz + n0[2] * r),
        ];
        const wn = rot((n0[0] + n1[0]) / 2, (n0[1] + n1[1]) / 2, (n0[2] + n1[2]) / 2);
        if (!facing(pts, wn)) continue;
        this.push(pts, litShade(color, wn.x, wn.y, wn.z));
      }
      if (caps) {
        ball(ax, ay, az, r, r, r, color, 1, 2, 6);
        ball(bx, by, bz, r, r, r, color, 1, 2, 6);
      }
    };

    /* a wheel: tread band, sidewall, hub and three spokes that turn */
    const wheel = (lx: number, ly: number, lz: number, r: number, width: number, color: string, hub: string): void => {
      const SIDES = this.low ? 8 : 10;
      for (let i = 0; i < SIDES; i++) {
        const a0 = (i / SIDES) * Math.PI * 2;
        const a1 = ((i + 1) / SIDES) * Math.PI * 2;
        const p0 = [Math.sin(a0) * r, Math.cos(a0) * r];
        const p1 = [Math.sin(a1) * r, Math.cos(a1) * r];
        const pts = [
          w2(lx - width / 2, ly + p0[1], lz + p0[0]),
          w2(lx - width / 2, ly + p1[1], lz + p1[0]),
          w2(lx + width / 2, ly + p1[1], lz + p1[0]),
          w2(lx + width / 2, ly + p0[1], lz + p0[0]),
        ];
        const wn = rot(0, (p0[1] + p1[1]) / 2 / r, (p0[0] + p1[0]) / 2 / r);
        if (!facing(pts, wn)) continue;
        this.push(pts, litShade(color, wn.x, wn.y, wn.z));
      }
      for (let side = -1; side <= 1; side += 2) {
        const x = lx + side * (width / 2 + 0.01);
        const face: Vec3[] = [];
        for (let k = 0; k < SIDES; k++) {
          const a = (k / SIDES) * Math.PI * 2 * side;
          face.push(w2(x, ly + Math.cos(a) * r, lz + Math.sin(a) * r));
        }
        const fn = rot(side, 0, 0);
        if (!facing(face, fn)) continue;
        this.push(face, litShade(color, fn.x, fn.y, fn.z));
        const cap: Vec3[] = [];
        for (let q = 0; q < SIDES; q++) {
          const b = (q / SIDES) * Math.PI * 2 * side;
          cap.push(w2(x + side * 0.02, ly + Math.cos(b) * r * 0.42, lz + Math.sin(b) * r * 0.42));
        }
        this.push(cap, litShade(hub, fn.x, fn.y, fn.z, 1.15));
        for (let sp = 0; sp < 3; sp++) {
          const ang = this.spin + sp * ((Math.PI * 2) / 3);
          const ca = Math.cos(ang);
          const sa = Math.sin(ang);
          const t = 0.09;
          this.push(
            [
              w2(x + side * 0.03, ly + ca * r * 0.35 - sa * t, lz + sa * r * 0.35 + ca * t),
              w2(x + side * 0.03, ly + ca * r * 0.35 + sa * t, lz + sa * r * 0.35 - ca * t),
              w2(x + side * 0.03, ly + ca * r * 0.92 + sa * t, lz + sa * r * 0.92 - ca * t),
              w2(x + side * 0.03, ly + ca * r * 0.92 - sa * t, lz + ca * r * 0.92 + ca * t),
            ],
            litShade(hub, fn.x, fn.y, fn.z, 0.95),
          );
        }
      }
    };

    const GREEN = '#54B713';
    const GREEN_DK = '#3E8A0E';
    const SKIN = '#E8B48A';
    const HAIR = '#3A2A22';
    const JEANS = '#2E382E';
    const SHOE = '#FFFFFF';
    const TYRE = '#283028';
    const CHROME = '#D2DED0';
    const DARK = '#182017';

    /* scooter */
    wheel(0, 1.15, 2.95, 1.15, 0.62, TYRE, CHROME);
    wheel(0, 1.15, -2.65, 1.15, 0.78, TYRE, CHROME);
    ball(0, 2.65, 2.95, 0.5, 0.6, 1.1, GREEN);
    ball(0, 3.25, 2.05, 1.4, 1.75, 0.95, GREEN, 1, lat + 1, lon + 3, 0.35);
    ball(0, 1.95, 2.15, 1.2, 1.15, 0.8, GREEN);
    ball(0, 2.2, 0.5, 1.15, 0.9, 1.6, GREEN, 1, lat + 1, lon + 2, 0.3);
    ball(0, 1.4, 0.4, 1.0, 0.32, 1.7, DARK, 1, lat, lon, 0.5);
    ball(0, 2.45, -1.35, 1.25, 1.15, 2.0, GREEN, 1, lat + 1, lon + 3, 0.25);
    ball(0, 3.35, -1.45, 1.0, 0.45, 1.4, DARK, 1, lat, lon + 1, 0.4);
    ball(0, 2.1, -2.7, 1.0, 0.9, 0.85, GREEN_DK);
    ball(0, 3.65, 3.0, 0.44, 0.44, 0.3, '#FFF6D8', 1.4);
    ball(0, 3.65, 2.85, 0.56, 0.56, 0.22, GREEN_DK);
    tube(-1.3, 4.1, 2.4, 1.3, 4.1, 2.4, 0.1, DARK);
    tube(-1.35, 4.1, 2.4, -0.98, 4.1, 2.4, 0.17, DARK, 7);
    tube(1.35, 4.1, 2.4, 0.98, 4.1, 2.4, 0.17, DARK, 7);
    tube(0, 3.6, 2.45, 0, 4.1, 2.4, 0.13, CHROME, 7);
    tube(-1.18, 4.15, 2.4, -1.38, 4.72, 2.35, 0.055, CHROME, 6);
    tube(1.18, 4.15, 2.4, 1.38, 4.72, 2.35, 0.055, CHROME, 6);
    ball(-1.4, 4.8, 2.35, 0.19, 0.19, 0.07, DARK, 1, 3, 7);
    ball(1.4, 4.8, 2.35, 0.19, 0.19, 0.07, DARK, 1, 3, 7);

    /* legs */
    tube(-0.6, 3.5, -0.6, -0.72, 2.85, 0.85, 0.37, JEANS, 8, true);
    tube(0.6, 3.5, -0.6, 0.72, 2.85, 0.85, 0.37, JEANS, 8, true);
    tube(-0.74, 2.85, 0.85, -0.8, 1.9, 1.05, 0.32, JEANS, 8, true);
    tube(0.74, 2.85, 0.85, 0.8, 1.9, 1.05, 0.32, JEANS, 8, true);
    ball(-0.82, 1.62, 1.3, 0.36, 0.3, 0.6, SHOE, 1, lat, lon + 1, 0.4);
    ball(0.82, 1.62, 1.3, 0.36, 0.3, 0.6, SHOE, 1, lat, lon + 1, 0.4);

    /* body */
    ball(0, 3.8, -0.7, 0.88, 0.6, 0.78, JEANS);
    ball(0, 4.75, -0.5, 0.92, 1.05, 0.8, GREEN, 1, lat + 1, lon + 3);
    ball(0, 5.45, -0.45, 1.0, 0.46, 0.82, GREEN);
    tube(-0.88, 5.3, -0.45, -1.16, 4.75, 0.9, 0.3, GREEN, 8, true);
    tube(-1.16, 4.75, 0.9, -1.24, 4.35, 2.3, 0.26, GREEN, 8, true);
    tube(0.88, 5.3, -0.45, 1.16, 4.75, 0.9, 0.3, GREEN, 8, true);
    tube(1.16, 4.75, 0.9, 1.24, 4.35, 2.3, 0.26, GREEN, 8, true);
    ball(-1.26, 4.25, 2.42, 0.3, 0.28, 0.32, SKIN);
    ball(1.26, 4.25, 2.42, 0.3, 0.28, 0.32, SKIN);

    /* head — deliberately oversized, which is what makes him read as a
       friendly character rather than a scale model */
    tube(0, 5.75, -0.45, 0, 6.1, -0.44, 0.27, SKIN, 7);
    ball(0, 6.85, -0.4, 0.92, 0.98, 0.88, SKIN, 1, lat + 2, lon + 4);
    ball(0, 6.95, -1.05, 0.8, 0.72, 0.3, HAIR);
    ball(-0.9, 6.85, -0.4, 0.16, 0.26, 0.2, SKIN, 1, 3, 7);
    ball(0.9, 6.85, -0.4, 0.16, 0.26, 0.2, SKIN, 1, 3, 7);
    ball(-0.32, 6.92, 0.5, 0.085, 0.13, 0.07, '#2B2438', 1, 3, 7);
    ball(0.32, 6.92, 0.5, 0.085, 0.13, 0.07, '#2B2438', 1, 3, 7);
    ball(-0.35, 7.22, 0.4, 0.16, 0.05, 0.08, HAIR, 1, 3, 6);
    ball(0.35, 7.22, 0.4, 0.16, 0.05, 0.08, HAIR, 1, 3, 6);
    ball(0, 6.78, 0.52, 0.11, 0.11, 0.12, '#DFA377', 1, 3, 7);
    ball(0, 6.45, 0.46, 0.22, 0.05, 0.08, '#B9705A', 1, 3, 6);
    ball(0, 7.5, -0.4, 0.93, 0.5, 0.9, GREEN, 1, lat + 1, lon + 3);
    ball(0, 7.3, 0.35, 0.72, 0.1, 0.5, GREEN_DK, 1, 3, 9, 0.4);

    /* the insulated delivery bag */
    ball(0, 5.15, -1.55, 1.05, 1.25, 0.6, GREEN, 1, lat + 1, lon + 2, 0.85);
    ball(0, 5.15, -2.15, 0.85, 1.0, 0.12, GREEN_DK, 1, 3, 8, 0.85);
    ball(0, 6.35, -1.55, 0.8, 0.16, 0.5, GREEN_DK, 1, 3, 8, 0.6);
    tube(-0.6, 5.9, -1.2, -0.62, 4.6, -0.9, 0.12, GREEN_DK, 6);
    tube(0.6, 5.9, -1.2, 0.62, 4.6, -0.9, 0.12, GREEN_DK, 6);
  }

  private pin(world: { x: number; z: number }, color: string, label: string): Pin | null {
    const p = this.project({ x: world.x, y: 0, z: world.z });
    if (p.z <= 2) return null;
    return {
      x: p.x,
      y: p.y,
      scale: Math.max(0.5, Math.min(1.05, 230 / p.z)),
      color,
      label,
    };
  }

  /* ------------------------------------------------------------------ step */

  /**
   * Advance by `dt` seconds and build the frame.
   *
   * The smoothing is exponential rather than `x += (target - x) * dt * k`, so
   * it converges at the same rate whatever the refresh rate — a 120Hz panel
   * and a 60Hz panel land in the same place.
   */
  step(dt: number): Frame {
    const clamped = Math.min(0.05, Math.max(0, dt));
    this.elapsed += clamped;

    this.progress = damp(this.progress, this.targetProgress, 0.7, clamped);
    if (this.stageIndex === 2) {
      this.targetProgress = Math.min(0.94, this.targetProgress + clamped * 0.007);
    }

    const point = pointAt(this.progress);


    /* the route turns at right angles; easing the heading lets him sweep
       round a corner over about half a second instead of snapping */
    const prevYaw = this.riderYaw;
    this.riderYaw = dampAngle(this.riderYaw, point.yaw, 3.2, clamped);
    const rate = clamped > 0 ? normalise(this.riderYaw - prevYaw) / clamped : 0;
    this.riderRoll = damp(this.riderRoll, Math.max(-0.34, Math.min(0.34, rate * 0.55)), 4.5, clamped);
    const bob = this.reduceMotion ? 0 : Math.sin(this.elapsed * 3.85) * 0.045;
    this.spin += (this.progress - this.lastProgress) * ROUTE_LEN * 0.85;
    this.lastProgress = this.progress;

    const { cam } = this;
    if (this.cameraMode === 'follow') {
      /* a front three-quarter, so his face and the front of the scooter show */
      const ahead = 14;
      const up = 15;
      const side = 25;
      const wantX = point.x + Math.sin(this.riderYaw) * ahead + Math.cos(this.riderYaw) * side;
      const wantZ = point.z + Math.cos(this.riderYaw) * ahead - Math.sin(this.riderYaw) * side;
      const lambda = this.primed ? 1.9 : 1e6;
      cam.x = damp(cam.x, wantX, lambda, clamped);
      cam.z = damp(cam.z, wantZ, lambda, clamped);
      cam.y = damp(cam.y, up, lambda, clamped);
      cam.yaw = dampAngle(cam.yaw, Math.atan2(point.x - cam.x, point.z - cam.z), this.primed ? 2.4 : 1e6, clamped);
      cam.pitch = damp(cam.pitch, 0.34, this.primed ? 2.0 : 1e6, clamped);
      cam.fov = damp(cam.fov, this.width * 0.88, this.primed ? 2.0 : 1e6, clamped);
    } else {
      const midX = (PICKUP.x + DROP.x) / 2;
      const midZ = (PICKUP.z + DROP.z) / 2;
      const sway = this.reduceMotion ? 0 : Math.sin(this.elapsed / 9) * 0.1;
      cam.x = damp(cam.x, midX, 1.4, clamped);
      cam.z = damp(cam.z, midZ - 135, 1.4, clamped);
      cam.y = damp(cam.y, 150, 1.4, clamped);
      cam.yaw = dampAngle(cam.yaw, sway, 1.4, clamped);
      cam.pitch = damp(cam.pitch, 0.8, 1.4, clamped);
      cam.fov = damp(cam.fov, this.width * 0.92, 1.4, clamped);
    }

    this.primed = true;

    /* ---- build the frame ---- */
    this.world = [];
    this.rider = [];
    this.bucket = this.world;

    const cull = this.cameraMode === 'route' ? (this.low ? 260 : 330) : this.low ? 130 : 175;
    this.ground(cull);
    this.fogLimit = 0.2;
    this.routeRibbon();
    this.fogLimit = 0.82;

    for (let i = 0; i < this.buildings.length; i++) {
      const b = this.buildings[i];
      const dist = Math.hypot(b.x - cam.x, b.z - cam.z);
      if (dist > cull + 20 || (this.cameraMode === 'follow' && dist < 11)) continue;
      this.box(b);
    }

    this.bucket = this.rider;
    this.drawRider(point.x, point.z, this.riderYaw, this.riderRoll, bob);
    this.bucket = this.world;

    this.world.sort((a, b) => b.depth - a.depth);
    this.rider.sort((a, b) => b.depth - a.depth);

    const pins: Pin[] = [];
    const pickup = this.pin(PICKUP, '#FF602E', 'oneBuddy Darkstore');
    const drop = this.pin(DROP, '#54B713', 'Lotus Residency');
    if (pickup) pins.push(pickup);
    if (drop) pins.push(drop);

    const rp = this.project({ x: point.x, y: 0.2 * 0.70, z: point.z });
    const riderScreen = rp.z > 2 ? { x: rp.x, y: rp.y, radius: (300 / rp.z) * 0.70 } : null;

    return { world: this.world, rider: this.rider, pins, riderScreen };
  }
}
