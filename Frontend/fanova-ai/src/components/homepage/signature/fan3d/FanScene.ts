// The Nan fan as a real 3D object (R20.1), in plain three.js (no React renderer).
//
// What is real geometry here: the leaf is 28 planar facets between 29 radial creases (valleys in
// front, mountains behind); a facet's depth follows the fold, √(a_flat² − a²)·r, so the pleats
// deepen as the fan closes and the closed fan is a stack of panels standing out of the plane. The
// bamboo sticks (14 inner, two guards) are tapered boxes pivoting on a metal rivet; their tails
// splay below it. A spotlight casts real shadows onto a wall behind the fan and onto the pleats.
//
// What is a texture: the leaf's colour, fibres, gilt edges and the printed word are drawn onto
// canvases in *flat-leaf* coordinates (the leaf laid out before pleating), so the word follows
// every fold exactly. The same layout drives a roughness/metalness map (foil and gilt are metal)
// and a bump map (the foil is pressed into the fibres). This is not a photographic asset: there
// is no scanned fabric, bamboo or foil, see DECISIONS.md §29 for what a designer would supply.
//
// Motion reuses SilkFan's opening path (silkFanMath openAngles/openGroup), so fold timing and
// feel match the SVG fan. The scene renders only when something changes (opening, folding,
// pointer, resize) and sleeps while off-screen.

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { openAngles, openGroup, type RibAngle } from "../../silk-fan/silkFanMath";

const DEG = Math.PI / 180;
const P = 28; // facets (14 pleats)
const NC = 6; // columns per facet (a soft bow, a round scallop)
const NR = 12; // rows from the inner to the outer edge
const R1 = 0.34; // inner edge of the leaf
const R2 = 1; // outer edge (the fan's radius is the scene unit)
const SCALLOP = 0.032;
const CREASE_SOFT = 0.55; // how far a crease normal bends towards its neighbour (0 sharp … 0.5 round)
const A_OPEN = (156 / P) * DEG; // a facet's projected angle when open (±78°)
const A_FLAT = A_OPEN / Math.cos(30 * DEG); // its width laid flat: open pleats lean 30°
const RM = 1.07; // radius covered by the leaf textures
const TEXT_R = 0.678;
const OPEN_MS = 2600;
const REOPEN_MS = 1500;
const ENTRANCE_DELAY_MS = 350;
const FOV = 22;

const CREASES: RibAngle[] = Array.from({ length: P + 1 }, (_, i) => ({ open: -78 + (i * 156) / P, k: i / P }));

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (v: number) => 1 - Math.pow(1 - v, 3);

export interface FanSceneOptions {
  reduced: boolean;
  /** touch devices: smaller textures and shadow map, no pointer response */
  coarse: boolean;
  fontFamily: string;
  foldRef: { current: number };
  onLost: () => void;
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function segment(word: string): string[] {
  const seg = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("vi", { granularity: "grapheme" }) : null;
  return seg ? Array.from(seg.segment(word), (s) => s.segment) : Array.from(word);
}

/** A tapered stick from −tail to len along +y, centred on x, `th` thick in z. */
function stickGeometry(tail: number, len: number, w0: number, w1: number, th: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(1, 1, 1, 1, 12, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const s = p.getY(i) + 0.5;
    p.setXYZ(i, p.getX(i) * (w0 + (w1 - w0) * s), -tail + s * (tail + len), p.getZ(i) * th);
  }
  g.computeVertexNormals();
  return g;
}

function bambooTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 512;
  const x = c.getContext("2d")!;
  const across = x.createLinearGradient(0, 0, 128, 0);
  across.addColorStop(0, "#d9bf8e");
  across.addColorStop(0.18, "#f2e6c8");
  across.addColorStop(0.7, "#f2e6c8");
  across.addColorStop(1, "#d9bf8e");
  x.fillStyle = across;
  x.fillRect(0, 0, 128, 512);
  // fibres run along the stick
  for (let k = 0; k < 260; k++) {
    const px = Math.random() * 128;
    x.strokeStyle = Math.random() < 0.55 ? "rgba(150,118,70,0.07)" : "rgba(255,250,236,0.10)";
    x.lineWidth = 0.6 + Math.random() * 1.2;
    x.beginPath();
    x.moveTo(px, Math.random() * 512);
    x.lineTo(px + (Math.random() - 0.5) * 2, Math.random() * 512);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The guards: the same bamboo, with R20's small inlaid diamonds along the face. */
function guardTexture(tail: number, len: number): THREE.CanvasTexture {
  const t = bambooTexture();
  const c = t.image as HTMLCanvasElement;
  const x = c.getContext("2d")!;
  for (const r of [0.11, 0.22, 0.44, 0.6, 0.77, 0.93]) {
    const y = (1 - (r + tail) / (tail + len)) * c.height;
    x.fillStyle = "#c6ad78";
    x.strokeStyle = "#8f7546";
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(64, y - 13);
    x.lineTo(73, y);
    x.lineTo(64, y + 13);
    x.lineTo(55, y);
    x.closePath();
    x.fill();
    x.stroke();
  }
  t.needsUpdate = true;
  return t;
}

export class FanScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  private root = new THREE.Group(); // placement + presentation tilt + pointer
  private motion = new THREE.Group(); // the opening path's turn, drift and scale
  private leafGeo = new THREE.BufferGeometry();
  private leafMat: THREE.MeshPhysicalMaterial;
  private sticks: { group: THREE.Group; tilt: THREE.Mesh; crease: number; kind: "front" | "inner" | "back"; z: number }[] = [];
  private key = new THREE.SpotLight("#fff4e2", 0, 0, 0.5, 0.95, 0);
  private wall: THREE.Mesh;
  private canvases: { color: HTMLCanvasElement; rm: HTMLCanvasElement; bump: HTMLCanvasElement };
  private textures: THREE.Texture[] = [];
  private disposables: { dispose: () => void }[] = [];
  private opts: FanSceneOptions;
  private size = 2048;
  private raf = 0;
  private visible = true;
  private io: IntersectionObserver | null = null;
  private dirty = true;
  private anim: { start: number; dur: number } | null = null;
  private animT = 0;
  private entranceStart = 0;
  private lastT = -1;
  private latch = false;
  private latchTimer = 0;
  private wordToken = 0;
  private word = "";
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  constructor(private canvas: HTMLCanvasElement, opts: FanSceneOptions) {
    this.opts = opts;
    this.size = opts.coarse ? 1024 : 2048;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping; // keeps the authored blues and champagne
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(0x000000, 0); // the room behind is CSS; this canvas holds the fan and its shadow
    canvas.addEventListener("webglcontextlost", this.onLost);

    // fill: a soft studio environment for reflections, low; the spotlight does the modelling
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = env;
    this.scene.environmentIntensity = 0.55;
    this.disposables.push(env);
    const hemi = new THREE.HemisphereLight("#b6c0f0", "#20180e", 0.35);
    this.scene.add(hemi);

    // the wall the fan stands before: invisible except for the shadow the fan casts on it
    const wallMat = new THREE.ShadowMaterial({ color: "#02030a", opacity: 0.22 });
    this.wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), wallMat);
    this.wall.receiveShadow = true;
    this.scene.add(this.wall);
    this.disposables.push(wallMat, this.wall.geometry);

    // key light: high on the left, in front; soft-edged pool, real shadows
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(opts.coarse ? 1024 : 2048, opts.coarse ? 1024 : 2048);
    this.key.shadow.bias = -0.0004;
    this.key.shadow.normalBias = 0.012;
    this.key.shadow.radius = 5;
    this.key.shadow.camera.near = 1;
    this.key.shadow.camera.far = 14;
    this.scene.add(this.key, this.key.target);

    // leaf
    this.canvases = {
      color: document.createElement("canvas"),
      rm: document.createElement("canvas"),
      bump: document.createElement("canvas"),
    };
    for (const c of Object.values(this.canvases)) c.width = c.height = this.size;
    const tex = (c: HTMLCanvasElement, srgb: boolean) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      this.textures.push(t);
      return t;
    };
    const rmTex = tex(this.canvases.rm, false);
    this.leafMat = new THREE.MeshPhysicalMaterial({
      map: tex(this.canvases.color, true),
      roughnessMap: rmTex, // G
      metalnessMap: rmTex, // B
      roughness: 1,
      metalness: 1,
      bumpMap: tex(this.canvases.bump, false),
      bumpScale: 0.35,
      sheen: 0.22,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color("#c4ceff"),
      side: THREE.DoubleSide,
    });
    this.buildLeafGeometry();
    const leaf = new THREE.Mesh(this.leafGeo, this.leafMat);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    this.motion.add(leaf);
    this.disposables.push(this.leafGeo, this.leafMat);

    // sticks: guards at the outer valleys, inner ribs behind each mountain
    const bamboo = bambooTexture();
    this.textures.push(bamboo);
    const bambooMat = new THREE.MeshPhysicalMaterial({ map: bamboo, roughness: 0.62, clearcoat: 0.1, clearcoatRoughness: 0.7 });
    const guardTail = 0.15, guardLen = R2 + 0.01;
    const guard = guardTexture(guardTail, guardLen);
    this.textures.push(guard);
    const guardMat = new THREE.MeshPhysicalMaterial({ map: guard, roughness: 0.6, clearcoat: 0.1, clearcoatRoughness: 0.7 });
    const guardGeo = stickGeometry(guardTail, guardLen, 0.016, 0.04, 0.009);
    const innerGeo = stickGeometry(0.135, R1 + 0.035, 0.012, 0.032, 0.006);
    this.disposables.push(bambooMat, guardMat, guardGeo, innerGeo);
    const addStick = (geo: THREE.BufferGeometry, crease: number, kind: "front" | "inner" | "back", z: number) => {
      const group = new THREE.Group();
      const tilt = new THREE.Mesh(geo, kind === "inner" ? bambooMat : guardMat);
      tilt.castShadow = true;
      tilt.receiveShadow = true;
      tilt.position.z = z;
      group.add(tilt);
      this.motion.add(group);
      this.sticks.push({ group, tilt, crease, kind, z });
    };
    addStick(guardGeo, P, "back", -0.032);
    for (let i = P - 1, k = 0; i >= 1; i -= 2, k++) addStick(innerGeo, i, "inner", -0.006 - k * 0.0016);
    addStick(guardGeo, 0, "front", 0.013);

    // the rivet
    // a flat gilt boss with a dark centre (R20's rivet), not a polished ball
    const metal = new THREE.MeshPhysicalMaterial({ color: "#c9b27e", metalness: 0.9, roughness: 0.42 });
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.023, 0.07, 40), metal);
    pin.rotation.x = Math.PI / 2;
    pin.position.z = -0.012;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.024, 0.008, 40), metal);
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 0.022;
    const dotMat = new THREE.MeshStandardMaterial({ color: "#1a2050", roughness: 0.6 });
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.008, 24), dotMat);
    dot.position.z = 0.0265;
    pin.castShadow = cap.castShadow = true;
    this.motion.add(pin, cap, dot);
    this.disposables.push(metal, dotMat, pin.geometry, cap.geometry, dot.geometry);

    this.root.add(this.motion);
    this.scene.add(this.root);

    if ("IntersectionObserver" in window) {
      this.io = new IntersectionObserver(([e]) => {
        const was = this.visible;
        this.visible = e.isIntersecting;
        if (this.visible && !was) this.start();
      });
      this.io.observe(canvas);
    }
  }

  // ── geometry ───────────────────────────────────────────────────────────────────────────────

  private buildLeafGeometry(): void {
    const perPanel = (NR + 1) * (NC + 1);
    const count = P * perPanel;
    this.leafGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const uv = new Float32Array(count * 2);
    const index: number[] = [];
    for (let i = 0; i < P; i++) {
      for (let j = 0; j <= NR; j++) {
        for (let c = 0; c <= NC; c++) {
          const v = i * perPanel + j * (NC + 1) + c;
          if (j < NR && c < NC) {
            const a = v, b = v + 1, d = v + NC + 1, e = v + NC + 2;
            index.push(a, b, e, a, e, d);
          }
          // uv from the flat leaf (the bump of the scallop is applied in place, see place())
          const w = c / NC;
          const r = this.rowRadius(j, (w + (i % 2)) / 2);
          const alpha = (i - P / 2 + w) * A_FLAT;
          uv[v * 2] = 0.5 + (r * Math.sin(alpha)) / (2 * RM);
          uv[v * 2 + 1] = 0.5 + (r * Math.cos(alpha)) / (2 * RM);
        }
      }
    }
    this.leafGeo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    this.leafGeo.setIndex(index);
  }

  /** radius of row j at position wp (0…1) across its pleat: the outer edge is scalloped */
  private rowRadius(j: number, wp: number): number {
    const s = j / NR;
    return (R1 + (R2 - R1) * s) * (1 + SCALLOP * Math.sin(Math.PI * wp) * s * s * s);
  }

  /** Poses the fan for opening progress t (0 folded … 1 open). */
  private place(t: number): void {
    const ang = openAngles(t, CREASES);
    const g = openGroup(t);
    this.motion.rotation.z = -g.rot * DEG;
    this.motion.position.y = -g.dy / 430;
    this.motion.scale.setScalar(g.sc);

    const depth: number[] = []; // per facet: √(a_flat² − a²)
    for (let i = 0; i < P; i++) {
      const a = Math.max(0, (ang[i + 1] - ang[i]) * DEG);
      depth.push(Math.sqrt(Math.max(0, A_FLAT * A_FLAT - a * a)));
    }
    const crease = (i: number) => (i % 2 === 0 ? 0 : (depth[i - 1] + depth[i]) / 2);
    const maxDepth = Math.max(...depth);

    const pos = this.leafGeo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < P; i++) {
      const t0 = ang[i] * DEG, t1 = ang[i + 1] * DEG;
      const s0 = Math.sin(t0), c0 = Math.cos(t0), s1 = Math.sin(t1), c1 = Math.cos(t1);
      const z0 = -crease(i), z1 = -crease(i + 1);
      const bow = 0.18 * depth[i];
      for (let j = 0; j <= NR; j++) {
        for (let c = 0; c <= NC; c++) {
          const w = c / NC;
          const r = this.rowRadius(j, (w + (i % 2)) / 2);
          const v = (i * (NR + 1) * (NC + 1) + j * (NC + 1) + c) * 3;
          arr[v] = r * (s0 + (s1 - s0) * w);
          arr[v + 1] = r * (c0 + (c1 - c0) * w);
          arr[v + 2] = r * (z0 + (z1 - z0) * w - bow * Math.sin(Math.PI * w));
        }
      }
    }
    pos.needsUpdate = true;
    this.leafGeo.computeVertexNormals();
    // soft folds: at a crease each facet's normal is bent 55% of the way towards the other's, so
    // light rolls over the crease instead of breaking on it, while each fold keeps a shadow side
    const nrm = (this.leafGeo.attributes.normal as THREE.BufferAttribute).array as Float32Array;
    const per = (NR + 1) * (NC + 1);
    for (let i = 0; i < P - 1; i++) {
      for (let j = 0; j <= NR; j++) {
        const a = (i * per + j * (NC + 1) + NC) * 3, b = ((i + 1) * per + j * (NC + 1)) * 3;
        const na = [nrm[a], nrm[a + 1], nrm[a + 2]], nb = [nrm[b], nrm[b + 1], nrm[b + 2]];
        for (const [o, self, other] of [[a, na, nb], [b, nb, na]] as const) {
          const x = self[0] + (other[0] - self[0]) * CREASE_SOFT;
          const y = self[1] + (other[1] - self[1]) * CREASE_SOFT;
          const z = self[2] + (other[2] - self[2]) * CREASE_SOFT;
          const m = Math.hypot(x, y, z) || 1;
          nrm[o] = x / m;
          nrm[o + 1] = y / m;
          nrm[o + 2] = z / m;
        }
      }
    }
    this.leafGeo.computeBoundingSphere();

    for (const s of this.sticks) {
      s.group.rotation.z = -ang[s.crease] * DEG;
      const back = s.kind === "back" ? maxDepth : s.kind === "inner" ? crease(s.crease) : 0;
      s.tilt.rotation.x = -Math.atan(back);
    }
  }

  // ── the leaf's surface ─────────────────────────────────────────────────────────────────────

  private paintLeaf(word: string): void {
    const S = this.size;
    const k = S / (2 * RM); // px per scene unit on the flat leaf
    const C = S / 2;
    const { color, rm, bump } = this.canvases;
    const cx = color.getContext("2d")!, rx = rm.getContext("2d")!, bx = bump.getContext("2d")!;

    // ground: indigo, a touch deeper towards the sticks, lighter towards the edge
    const g = cx.createRadialGradient(C, C, R1 * k, C, C, R2 * k);
    // R20's silk stops (NAN_PALETTE.silkStops), deeper towards the sticks
    g.addColorStop(0, "#101c5a");
    g.addColorStop(0.45, "#162679");
    g.addColorStop(0.85, "#1a2d8f");
    g.addColorStop(1, "#152473");
    cx.fillStyle = g;
    cx.fillRect(0, 0, S, S);
    rx.fillStyle = "rgb(0,214,0)"; // roughness .84: matte silk, no plastic gloss
    rx.fillRect(0, 0, S, S);
    bx.fillStyle = "rgb(128,128,128)";
    bx.fillRect(0, 0, S, S);

    // fibres: short strands at random angles, faint in colour, a little stronger in relief
    const n = Math.round((S * S) / 520);
    for (let q = 0; q < n; q++) {
      const rr = (R1 + Math.random() * (R2 - R1 + 0.04)) * k;
      const a = Math.random() * Math.PI * 2;
      const x = C + rr * Math.sin(a), y = C - rr * Math.cos(a);
      const d = Math.random() * Math.PI, len = (3 + Math.random() * 9) * (S / 2048);
      const dx = Math.cos(d) * len, dy = Math.sin(d) * len;
      const light = Math.random() < 0.5;
      cx.strokeStyle = light ? "rgba(170,186,255,0.05)" : "rgba(6,10,40,0.07)";
      bx.strokeStyle = light ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
      for (const ctx of [cx, bx]) {
        ctx.lineWidth = S / 2048;
        ctx.beginPath();
        ctx.moveTo(x - dx, y - dy);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
      }
    }

    // gilt edges: the outer rim and a fine line along the inner edge
    const ring = (r0: number, r1: number) => {
      for (const [ctx, style] of [
        [cx, "#c8b88f"],
        [rx, "rgb(0,72,255)"],
        [bx, "rgb(150,150,150)"],
      ] as const) {
        ctx.fillStyle = style;
        ctx.beginPath();
        ctx.arc(C, C, r1 * k, 0, Math.PI * 2);
        ctx.arc(C, C, r0 * k, 0, Math.PI * 2, true);
        ctx.fill();
      }
    };
    // the outer gilt follows the scalloped edge (one bump per pleat on the flat leaf)
    const edge = (alpha: number) => {
      const u = alpha / A_FLAT + P / 2;
      const wp = (((u % 2) + 2) % 2) / 2;
      return R2 * (1 + SCALLOP * Math.sin(Math.PI * wp));
    };
    for (const [ctx, style] of [
      [cx, "#c8b88f"],
      [rx, "rgb(0,72,255)"],
      [bx, "rgb(150,150,150)"],
    ] as const) {
      ctx.fillStyle = style;
      ctx.beginPath();
      const steps = 1400, span = (P / 2) * A_FLAT + 0.02;
      for (let q = 0; q <= steps; q++) {
        const a = -span + (2 * span * q) / steps, r = (edge(a) - 0.0045) * k;
        ctx[q ? "lineTo" : "moveTo"](C + r * Math.sin(a), C - r * Math.cos(a));
      }
      for (let q = steps; q >= 0; q--) {
        const a = -span + (2 * span * q) / steps, r = (edge(a) + 0.06) * k;
        ctx.lineTo(C + r * Math.sin(a), C - r * Math.cos(a));
      }
      ctx.closePath();
      ctx.fill();
    }
    ring(R1 - 0.012, R1 + 0.004);

    // the word: foil, set along the arc on the flat leaf, pressed into the fibres
    const glyphs = segment(word);
    const short = glyphs.length <= 4;
    let px = 0.3 * k;
    const font = (size: number) => `400 ${size}px ${this.opts.fontFamily}`;
    const track = () => px * (short ? 0.23 : 0.1);
    const widthAt = () => {
      cx.font = font(px);
      return glyphs.reduce((sum, ch) => sum + cx.measureText(ch).width, 0) + track() * (glyphs.length - 1);
    };
    const maxArc = TEXT_R * k * 1.62; // ±46° on the flat leaf ≈ ±40° when open
    const w0 = widthAt();
    if (w0 > maxArc) px *= maxArc / w0;
    const total = widthAt();
    const foil = cx.createLinearGradient(C - total / 2, C - TEXT_R * k - px, C + total / 2, C - TEXT_R * k + px);
    foil.addColorStop(0, "#a8956d");
    foil.addColorStop(0.45, "#e6dbc4");
    foil.addColorStop(1, "#9c875f");
    for (const ctx of [cx, rx, bx]) {
      ctx.font = font(px);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    }
    let along = -total / 2;
    for (const ch of glyphs) {
      const gw = cx.measureText(ch).width;
      const a = (along + gw / 2) / (TEXT_R * k);
      for (const [ctx, style] of [
        [cx, foil],
        [rx, "rgb(0,120,200)"],
        [bx, "rgb(92,92,92)"],
      ] as const) {
        ctx.save();
        ctx.translate(C, C);
        ctx.rotate(a);
        ctx.fillStyle = style;
        ctx.fillText(ch, 0, -TEXT_R * k);
        ctx.restore();
      }
      along += gw + track();
    }
    for (const t of this.textures) t.needsUpdate = true;
  }

  // ── public API ────────────────────────────────────────────────────────────────────────────

  /** Pixel layout of the canvas and where the fan's rivet and radius fall inside it. */
  setLayout(w: number, h: number, px: number, py: number, r: number): void {
    // sharp on retina, within a budget of ≈ 3.2 M rendered pixels
    const budget = Math.sqrt((this.opts.coarse ? 2.2e6 : 3.2e6) / Math.max(1, w * h));
    this.renderer.setPixelRatio(Math.max(1, Math.min(window.devicePixelRatio || 1, 2, budget)));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // camera on the canvas centre; at z = 0 one scene unit is exactly r pixels
    const dist = h / 2 / Math.tan((FOV / 2) * DEG) / r;
    this.camera.position.set(0, 0, dist);
    this.camera.near = Math.max(0.05, dist - 6);
    this.camera.far = dist + 20;
    this.camera.updateProjectionMatrix();
    const fx = (px - w / 2) / r, fy = -(py - h / 2) / r;
    this.root.position.set(fx, fy, 0);
    this.wall.position.set(0, 0, -0.32);
    this.key.position.set(fx - 1.5, fy + 2.4, 4.6);
    this.key.target.position.set(fx + 0.05, fy + 0.42, 0);
    this.dirty = true;
    this.start();
  }

  async setWord(word: string, animate: boolean): Promise<void> {
    if (word === this.word) return;
    const token = ++this.wordToken;
    try {
      await document.fonts.load(`400 100px ${this.opts.fontFamily}`, word);
    } catch {
      /* draw with what is available */
    }
    if (token !== this.wordToken) return;
    const first = this.word === "";
    this.word = word;
    this.paintLeaf(word);
    window.clearTimeout(this.latchTimer);
    this.latch = false;
    if (first) {
      this.entranceStart = performance.now() + ENTRANCE_DELAY_MS;
      if (this.opts.reduced || !animate) this.animT = 1;
      else this.anim = { start: this.entranceStart, dur: OPEN_MS };
    } else if (animate && !this.opts.reduced) {
      this.animT = 0;
      this.anim = { start: performance.now() + 40, dur: REOPEN_MS };
    }
    this.dirty = true;
    this.start();
  }

  /** Pointer in −1…1 over the hero; the fan turns a few degrees towards it. */
  setPointer(x: number, y: number): void {
    if (this.opts.reduced || this.opts.coarse) return;
    this.pointer.tx = x;
    this.pointer.ty = y;
    this.start();
  }

  /** Holds the fan at opening progress t (0 folded … 1 open); for inspecting the fold path. */
  pose(t: number): void {
    this.anim = null;
    this.animT = clamp01(t);
    this.entranceStart = -1e9;
    this.dirty = true;
    this.start();
  }

  /** The fold is driven from outside (useImprint); call when it starts so the loop picks it up. */
  wake(): void {
    this.start();
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    window.clearTimeout(this.latchTimer);
    this.io?.disconnect();
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    for (const t of this.textures) t.dispose();
    for (const d of this.disposables) d.dispose();
    this.key.shadow.map?.dispose();
    this.renderer.dispose();
  }

  // ── loop ──────────────────────────────────────────────────────────────────────────────────

  private onLost = (e: Event) => {
    e.preventDefault();
    this.dispose();
    this.opts.onLost();
  };

  private start(): void {
    if (!this.raf && this.visible) this.raf = requestAnimationFrame(this.frame);
  }

  private frame = () => {
    // one clock for everything (the animation starts are stamped with performance.now too)
    const now = performance.now();
    this.raf = 0;
    let busy = false;

    if (this.anim) {
      const p = clamp01((now - this.anim.start) / this.anim.dur);
      this.animT = p;
      if (p >= 1) this.anim = null;
      else busy = true;
    }
    // the fold (driven by useImprint): once shut, hold it shut until the new word arrives, so the
    // old word never flashes open between the fold and the reprint
    const fold = clamp01(this.opts.foldRef.current);
    if (fold >= 0.999 && !this.latch) {
      this.latch = true;
      this.latchTimer = window.setTimeout(() => {
        this.latch = false;
        this.start();
      }, 900);
    }
    if (fold > 0 && fold < 0.999) busy = true;
    const t = this.latch ? 0 : Math.min(this.animT, 1 - fold);

    const lp = this.pointer;
    lp.x += (lp.tx - lp.x) * 0.06;
    lp.y += (lp.ty - lp.y) * 0.06;
    if (Math.abs(lp.tx - lp.x) > 0.001 || Math.abs(lp.ty - lp.y) > 0.001) busy = true;
    this.root.rotation.set(-0.05 + lp.y * 0.035, 0.16 + lp.x * 0.07, 0);

    // the room light comes up with the entrance
    const e = this.opts.reduced ? 1 : easeOut(clamp01((now - this.entranceStart) / 1600));
    if (e < 1) busy = true;
    this.key.intensity = 1.7 * (0.3 + 0.7 * e);

    if (Math.abs(t - this.lastT) > 1e-5 || busy || this.dirty) {
      if (Math.abs(t - this.lastT) > 1e-5 || this.lastT < 0) this.place(t);
      this.lastT = t;
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
    }
    if (busy || this.latch || fold > 0) this.start();
  };
}
