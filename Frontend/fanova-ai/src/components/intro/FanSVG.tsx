import React from "react";

// ─── Geometry constants (also consumed by FanIntro for animation) ──────────
export const RIBS = 13;
export const FAN_SPREAD = 120;           // total spread in degrees
export const CENTER_ANGLE_DEG = -90;     // pointing straight up
export const START_ANGLE_DEG = CENTER_ANGLE_DEG - FAN_SPREAD / 2; // -150°
export const cx = 200;
export const cy = 305;
export const RIB_LENGTH = 215;
export const INNER_RADIUS = 50;

export function getRibAngle(i: number): number {
  return START_ANGLE_DEG + (FAN_SPREAD / (RIBS - 1)) * i;
}

function degToRad(d: number) {
  return (d * Math.PI) / 180;
}

function ribEndpoint(angleDeg: number) {
  const r = degToRad(angleDeg);
  return { x: cx + RIB_LENGTH * Math.cos(r), y: cy + RIB_LENGTH * Math.sin(r) };
}

function pivotPoint(angleDeg: number, radius: number) {
  const r = degToRad(angleDeg);
  return { x: cx + radius * Math.cos(r), y: cy + radius * Math.sin(r) };
}

function buildPaperPath(i: number): string {
  if (i >= RIBS - 1) return "";
  const a1 = getRibAngle(i);
  const a2 = getRibAngle(i + 1);
  const p1 = ribEndpoint(a1);
  const p2 = ribEndpoint(a2);
  const ip1 = pivotPoint(a1, INNER_RADIUS);
  const ip2 = pivotPoint(a2, INNER_RADIUS);
  const arc = (a2 - a1) > 180 ? 1 : 0;
  return [
    `M ${ip1.x.toFixed(2)} ${ip1.y.toFixed(2)}`,
    `L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${RIB_LENGTH} ${RIB_LENGTH} 0 ${arc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${ip2.x.toFixed(2)} ${ip2.y.toFixed(2)}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${arc} 0 ${ip1.x.toFixed(2)} ${ip1.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

// Full fan silhouette for clipping
function buildFanOutline(): string {
  const a1 = getRibAngle(0);
  const a2 = getRibAngle(RIBS - 1);
  const p1 = ribEndpoint(a1);
  const p2 = ribEndpoint(a2);
  const ip1 = pivotPoint(a1, INNER_RADIUS - 2);
  const ip2 = pivotPoint(a2, INNER_RADIUS - 2);
  return [
    `M ${ip1.x.toFixed(2)} ${ip1.y.toFixed(2)}`,
    `L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${RIB_LENGTH} ${RIB_LENGTH} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${ip2.x.toFixed(2)} ${ip2.y.toFixed(2)}`,
    `A ${INNER_RADIUS - 2} ${INNER_RADIUS - 2} 0 0 0 ${ip1.x.toFixed(2)} ${ip1.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

// Subtle fold crease inside a paper segment
function buildCreasePath(i: number, frac: number): string {
  if (i >= RIBS - 1) return "";
  const a1 = getRibAngle(i);
  const a2 = getRibAngle(i + 1);
  const aMid = a1 + (a2 - a1) * frac;
  const r = degToRad(aMid);
  const inner = { x: cx + (INNER_RADIUS + 10) * Math.cos(r), y: cy + (INNER_RADIUS + 10) * Math.sin(r) };
  const outer = { x: cx + (RIB_LENGTH - 18) * Math.cos(r), y: cy + (RIB_LENGTH - 18) * Math.sin(r) };
  return `M ${inner.x.toFixed(2)} ${inner.y.toFixed(2)} L ${outer.x.toFixed(2)} ${outer.y.toFixed(2)}`;
}

// ─── Types ─────────────────────────────────────────────────────────────────
export interface FanSVGProps {
  containerRef: React.RefObject<SVGSVGElement | null>;
  ribGroupsRef: React.MutableRefObject<(SVGGElement | null)[]>;
  paperGroupRef: React.RefObject<SVGGElement | null>;
  lightSweepRef: React.RefObject<SVGGElement | null>;
  pivotRef: React.RefObject<SVGGElement | null>;
  atmosphereRef: React.RefObject<SVGGElement | null>;
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function FanSVG({
  containerRef,
  ribGroupsRef,
  paperGroupRef,
  lightSweepRef,
  pivotRef,
  atmosphereRef,
}: FanSVGProps) {

  // Rib stroke colors: outer guard ribs darker, inner ribs warm gold
  function ribColor(i: number): string {
    if (i === 0 || i === RIBS - 1) return "#7A5C1E";      // outer guard: dark bamboo
    if (i === 1 || i === RIBS - 2) return "#9E7A2F";      // second guard: medium bamboo
    if (i === Math.floor(RIBS / 2)) return "#C4A87A";     // center: lighter accent
    return "#B8912A";                                      // standard inner ribs
  }

  function ribWidth(i: number): number {
    if (i === 0 || i === RIBS - 1) return 3.2;
    if (i === 1 || i === RIBS - 2) return 2.2;
    if (i === Math.floor(RIBS / 2)) return 1.8;
    return 1.4;
  }

  // Gradient IDs for paper segments
  const paperGradId = (i: number) => `paper-grad-${i % 2 === 0 ? "a" : "b"}`;

  return (
    <svg
      ref={containerRef}
      viewBox="0 0 400 360"
      width="506"
      height="462"
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* ── Soft drop shadow under pivot ── */}
        <filter id="shadow" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#000" floodOpacity="0.45" />
        </filter>

        {/* ── Pivot jewel glow ── */}
        <filter id="pivot-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* ── Rib sheen ── */}
        <filter id="rib-sheen" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* ── Soft ambient glow (wide outer spotlight behind fan) ── */}
        <radialGradient id="spotlight-grad" cx="50%" cy="48%" r="52%">
          <stop offset="0%"   stopColor="#C8DFFF" stopOpacity="0.18" />
          <stop offset="55%"  stopColor="#7BAFEA" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#080B30" stopOpacity="0"    />
        </radialGradient>

        {/* ── Tight cinematic core glow (concentrated center beam) ── */}
        <radialGradient id="spotlight-core" cx="50%" cy="54%" r="45%">
          <stop offset="0%"   stopColor="#D8EEFF" stopOpacity="0.22" />
          <stop offset="40%"  stopColor="#A8CCEF" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#080B30" stopOpacity="0"    />
        </radialGradient>

        {/* ── Paper segment gradient A (ivory / warm cream) ── */}
        <linearGradient id="paper-grad-a" x1={cx} y1={cy - 10} x2={cx} y2={cy - RIB_LENGTH}
          gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#E8DFD0" stopOpacity="0.55" />
          <stop offset="40%"  stopColor="#F3EDE4" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0.60" />
        </linearGradient>

        {/* ── Paper segment gradient B (cool ivory / very pale blue) ── */}
        <linearGradient id="paper-grad-b" x1={cx} y1={cy - 10} x2={cx} y2={cy - RIB_LENGTH}
          gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#D9E8F7" stopOpacity="0.45" />
          <stop offset="45%"  stopColor="#EAF2FB" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#F6F9FF" stopOpacity="0.55" />
        </linearGradient>

        {/* ── Subtle cross-hatch paper texture pattern ── */}
        <pattern id="paper-texture" x="0" y="0" width="7" height="7" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="7" y2="7" stroke="#C8B89A" strokeWidth="0.25" strokeOpacity="0.18" />
          <line x1="7" y1="0" x2="0" y2="7" stroke="#C8B89A" strokeWidth="0.18" strokeOpacity="0.10" />
        </pattern>

        {/* ── Light sweep gradient (horizontal shimmer) ── */}
        <linearGradient id="sweep-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0"    />
          <stop offset="35%"  stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="50%"  stopColor="#FFF8EC" stopOpacity="0.26" />
          <stop offset="65%"  stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"    />
        </linearGradient>

        {/* ── Metallic gold gradient for pivot ring ── */}
        <radialGradient id="pivot-metal" cx="38%" cy="32%" r="60%">
          <stop offset="0%"   stopColor="#F2D98A" />
          <stop offset="45%"  stopColor="#C49A28" />
          <stop offset="100%" stopColor="#7A5C1A" />
        </radialGradient>

        {/* ── Fan clip path ── */}
        <clipPath id="fan-clip">
          <path d={buildFanOutline()} />
        </clipPath>

        {/* ── Rib gradient (bamboo cane): warm → lighter toward tip ── */}
        <linearGradient id="rib-grad-center" x1={cx} y1={cy} x2={cx} y2={cy - RIB_LENGTH}
          gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#7A5018" />
          <stop offset="30%"  stopColor="#C49A28" />
          <stop offset="100%" stopColor="#DDB84A" />
        </linearGradient>
      </defs>

      {/* ── Atmosphere: ambient spotlight + core beam + shadow ── */}
      <g ref={atmosphereRef} style={{ opacity: 0 }}>
        {/* Wide soft outer halo */}
        <ellipse cx={cx} cy={cy - 75} rx={230} ry={200}
          fill="url(#spotlight-grad)" />
        {/* Tight cinematic core beam */}
        <ellipse cx={cx} cy={cy - 90} rx={150} ry={140}
          fill="url(#spotlight-core)" />
        {/* Ground shadow under pivot */}
        <ellipse cx={cx} cy={cy + 8} rx={28} ry={8}
          fill="#000" fillOpacity="0.35"
          filter="url(#shadow)" />
      </g>

      {/* ── Paper segments (behind ribs) ── */}
      <g ref={paperGroupRef} style={{ opacity: 0 }}>
        {/* Base fill panels */}
        {Array.from({ length: RIBS - 1 }, (_, i) => (
          <path
            key={`paper-${i}`}
            d={buildPaperPath(i)}
            fill={`url(#${paperGradId(i)})`}
            stroke="none"
          />
        ))}

        {/* Paper texture overlay clipped to fan */}
        <g clipPath="url(#fan-clip)">
          <rect x="0" y="0" width="400" height="360" fill="url(#paper-texture)" opacity="0.6" />
        </g>

        {/* Subtle outer arc highlight */}
        {Array.from({ length: RIBS - 1 }, (_, i) => {
          const a1 = getRibAngle(i);
          const a2 = getRibAngle(i + 1);
          const mid = (a1 + a2) / 2;
          const arcR = RIB_LENGTH - 4;
          const ps = pivotPoint(a1, arcR);
          const pe = pivotPoint(a2, arcR);
          const arc = (a2 - a1) > 180 ? 1 : 0;
          const d = `M ${ps.x.toFixed(2)} ${ps.y.toFixed(2)} A ${arcR} ${arcR} 0 ${arc} 1 ${pe.x.toFixed(2)} ${pe.y.toFixed(2)}`;
          void mid;
          return (
            <path key={`arc-${i}`} d={d}
              stroke="#E8DFC8" strokeWidth="0.6" strokeOpacity="0.35" fill="none" />
          );
        })}

        {/* Inner arc structural detail */}
        {(() => {
          const arcR = INNER_RADIUS + 22;
          const ps = pivotPoint(getRibAngle(0), arcR);
          const pe = pivotPoint(getRibAngle(RIBS - 1), arcR);
          return (
            <path
              d={`M ${ps.x.toFixed(2)} ${ps.y.toFixed(2)} A ${arcR} ${arcR} 0 0 1 ${pe.x.toFixed(2)} ${pe.y.toFixed(2)}`}
              stroke="#C4A870" strokeWidth="0.7" strokeOpacity="0.4" fill="none"
            />
          );
        })()}

        {/* Mid-crease fold lines for paper depth */}
        {Array.from({ length: RIBS - 1 }, (_, i) => (
          <g key={`crease-${i}`}>
            <path d={buildCreasePath(i, 0.38)} stroke="#C8B48A" strokeWidth="0.3" strokeOpacity="0.22" fill="none" />
            <path d={buildCreasePath(i, 0.62)} stroke="#C8B48A" strokeWidth="0.3" strokeOpacity="0.18" fill="none" />
          </g>
        ))}
      </g>

      {/* ── Ribs (over paper) ── */}
      {Array.from({ length: RIBS }, (_, i) => {
        const angle = getRibAngle(i);
        const end = ribEndpoint(angle);
        const isGuard = i === 0 || i === RIBS - 1;
        return (
          <g
            key={`rib-g-${i}`}
            ref={(el) => { ribGroupsRef.current[i] = el; }}
            style={{ opacity: 0 }}
          >
            {/* Main rib stroke */}
            <line
              x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke={isGuard ? "url(#rib-grad-center)" : ribColor(i)}
              strokeWidth={ribWidth(i)}
              strokeLinecap="round"
              filter={isGuard ? "url(#rib-sheen)" : undefined}
            />
            {/* Subtle highlight on guard ribs */}
            {isGuard && (
              <line
                x1={cx + 0.6} y1={cy - 0.6}
                x2={end.x + 0.6} y2={end.y - 0.6}
                stroke="#F0D88A" strokeWidth="0.6" strokeOpacity="0.4" strokeLinecap="round"
              />
            )}
          </g>
        );
      })}

      {/* ── Light sweep (slides across paper after opening) ── */}
      <g ref={lightSweepRef} clipPath="url(#fan-clip)" style={{ opacity: 0 }}>
        <rect x={cx - 240} y={cy - RIB_LENGTH - 10} width="160" height={RIB_LENGTH + 20}
          fill="url(#sweep-grad)"
        />
      </g>

      {/* ── Pivot jewel ── */}
      <g ref={pivotRef} style={{ opacity: 0 }} filter="url(#pivot-glow)">
        {/* Outer shadow halo */}
        <circle cx={cx} cy={cy} r={14} fill="#0A0F1C" fillOpacity="0.6" />
        {/* Gold ring */}
        <circle cx={cx} cy={cy} r={12} fill="url(#pivot-metal)" />
        {/* Inner darker ring */}
        <circle cx={cx} cy={cy} r={8.5} fill="#1A1208" fillOpacity="0.7" />
        {/* Gem center */}
        <circle cx={cx} cy={cy} r={6} fill="#B9C7F8" fillOpacity="0.85" />
        {/* Gem highlight */}
        <circle cx={cx - 1.8} cy={cy - 1.8} r={2.2} fill="#FFFFFF" fillOpacity="0.6" />
        {/* Tiny center dot */}
        <circle cx={cx} cy={cy} r={1.4} fill="#EAF3FF" fillOpacity="0.95" />
      </g>
    </svg>
  );
}
