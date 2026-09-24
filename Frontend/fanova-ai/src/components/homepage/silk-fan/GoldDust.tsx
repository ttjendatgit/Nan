"use client";

/**
 * Shared THREE.Points dust layer used by both canvases in HeroSilkStage (dense/small behind the
 * fan, sparse/big in front of it -- see stageConfig.ts for the per-layer numbers). One draw call
 * per layer: a single BufferGeometry, no per-particle mesh.
 *
 * Motion runs entirely on the GPU from a single `uTime` uniform (real elapsed seconds, not a frame
 * count) rather than rewriting the position buffer every frame on the CPU: each particle's vertical
 * position is `cycleBottom + mod(offset + time*speed*speedMul, cycleHeight)`, which drifts upward
 * and wraps back to the bottom on its own once it leaves [cycleBottom, cycleBottom+cycleHeight) --
 * exactly the "drift up, wrap at the edge" behavior asked for, without any JS-side per-frame
 * bookkeeping. Horizontal sway is a per-particle-phased sine on top of that.
 *
 * Size and opacity are each a per-particle random *factor* in [0,1) (aSizeFactor/aOpacityFactor),
 * baked once at build time, plus a pair of uMin/uMax uniforms -- the actual size/opacity is
 * `mix(uMin, uMax, factor)`. That split is what lets HeroSilkStage's tuning panel drag sizeRange/
 * opacityRange sliders live without rebuilding the particle buffer (per H2.5's own requirement):
 * only count/spreadX/spreadY/depthRange, which determine per-particle spawn position and count,
 * need a rebuild.
 *
 * The geometry/material/texture are built imperatively inside a single useEffect (not useMemo),
 * and later updates (uTime, color, speed, size/opacity range, blending...) go through the same ref
 * -- not through a value returned by a hook. Two things force this: the per-particle randomization
 * (Math.random) isn't allowed to run during render under this project's react-hooks/purity rule,
 * and mutating a useMemo-returned object from a later effect trips react-hooks/immutability. A ref
 * holding plain, non-hook-tracked THREE objects is exempt from both -- the same imperative-DOM-in-
 * an-effect shape SilkFan.tsx already uses.
 */

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { BlendingMode } from "./stageConfig";

export interface GoldDustProps {
  count: number;
  sizeRange: [number, number];
  opacityRange: [number, number];
  /** Spawn range along this layer's own camera-facing depth axis. */
  depthRange: [number, number];
  /** Base upward drift speed, world units/second. */
  speed: number;
  /** Hex color -- always sourced from silkFanPalette.ts by the caller, never hardcoded here. */
  color: string;
  spreadX: [number, number];
  spreadY: [number, number];
  swayAmplitude?: number;
  swayFrequency?: number;
  blending: BlendingMode;
  /** false under prefers-reduced-motion: particles render in their spawn positions and never move. */
  motionEnabled: boolean;
}

export function resolveBlending(mode: BlendingMode): THREE.Blending {
  return mode === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending;
}

/** A soft round dust texture, drawn on a canvas at runtime (no external image asset). Reused by
 * Glow.tsx for the same reason: both are "a soft radial falloff", just applied to points vs. a
 * plane. The texture stores only a white-to-transparent alpha falloff -- color is applied
 * separately (GoldDust: a shader uniform; Glow: the mesh material's own `color`). */
export function createDustTexture(sizePx = 64): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const r = sizePx / 2;
    const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.4, "rgba(255,255,255,0.55)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, sizePx, sizePx);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function randRange([min, max]: [number, number]): number {
  return min + Math.random() * (max - min);
}

const VERTEX_SHADER = /* glsl */ `
  attribute float aOffset;
  attribute float aSizeFactor;
  attribute float aOpacityFactor;
  attribute float aPhase;
  attribute float aSpeedMul;

  uniform float uTime;
  uniform float uSpeed;
  uniform float uCycleBottom;
  uniform float uCycleHeight;
  uniform float uSwayAmplitude;
  uniform float uSwayFrequency;
  uniform float uScale;
  uniform float uSizeMin;
  uniform float uSizeMax;

  varying float vOpacityFactor;

  void main() {
    float y = uCycleBottom + mod(aOffset + uTime * uSpeed * aSpeedMul, uCycleHeight);
    float x = position.x + uSwayAmplitude * sin(uTime * uSwayFrequency + aPhase);
    vec3 dustPosition = vec3(x, y, position.z);

    vOpacityFactor = aOpacityFactor;

    float size = mix(uSizeMin, uSizeMax, aSizeFactor);
    vec4 mvPosition = modelViewMatrix * vec4(dustPosition, 1.0);
    gl_PointSize = size * uScale / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacityMin;
  uniform float uOpacityMax;

  varying float vOpacityFactor;

  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    float opacity = mix(uOpacityMin, uOpacityMax, vOpacityFactor);
    gl_FragColor = vec4(uColor, tex.a * opacity);
  }
`;

interface DustResources {
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  texture: THREE.CanvasTexture;
  points: THREE.Points;
}

export default function GoldDust({
  count,
  sizeRange,
  opacityRange,
  depthRange,
  speed,
  color,
  spreadX,
  spreadY,
  swayAmplitude = 0.15,
  swayFrequency = 0.3,
  blending,
  motionEnabled,
}: GoldDustProps) {
  const groupRef = useRef<THREE.Group>(null);
  const resourcesRef = useRef<DustResources | null>(null);
  const frozenRef = useRef(false);

  const viewportHeight = useThree((state) => state.size.height);
  const pixelRatio = useThree((state) => state.viewport.dpr);

  // Build (and, on cleanup, tear down) the whole THREE.Points object. Deliberately a useEffect, not
  // useMemo: the per-particle randomization below needs to run once per real (re)build, not during
  // render. Only count/spreadX/spreadY/depthRange are deps -- they're the only things that change
  // per-particle spawn position or count, so they're the only things that justify a rebuild.
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const positions = new Float32Array(count * 3);
    const offsets = new Float32Array(count);
    const sizeFactors = new Float32Array(count);
    const opacityFactors = new Float32Array(count);
    const phases = new Float32Array(count);
    const speedMuls = new Float32Array(count);
    const cycleHeight = spreadY[1] - spreadY[0];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = randRange(spreadX);
      positions[i * 3 + 1] = 0; // unused -- the vertex shader computes y from aOffset/uTime
      positions[i * 3 + 2] = randRange(depthRange);
      offsets[i] = Math.random() * cycleHeight;
      sizeFactors[i] = Math.random();
      opacityFactors[i] = Math.random();
      phases[i] = Math.random() * Math.PI * 2;
      speedMuls[i] = 0.7 + Math.random() * 0.6;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aOffset", new THREE.BufferAttribute(offsets, 1));
    geometry.setAttribute("aSizeFactor", new THREE.BufferAttribute(sizeFactors, 1));
    geometry.setAttribute("aOpacityFactor", new THREE.BufferAttribute(opacityFactors, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute("aSpeedMul", new THREE.BufferAttribute(speedMuls, 1));

    const texture = createDustTexture(64);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uCycleBottom: { value: spreadY[0] },
        uCycleHeight: { value: cycleHeight },
        uSwayAmplitude: { value: swayAmplitude },
        uSwayFrequency: { value: swayFrequency },
        uScale: { value: viewportHeight * pixelRatio * 0.5 },
        uSizeMin: { value: sizeRange[0] },
        uSizeMax: { value: sizeRange[1] },
        uOpacityMin: { value: opacityRange[0] },
        uOpacityMax: { value: opacityRange[1] },
        uMap: { value: texture },
        uColor: { value: new THREE.Color(color) },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: resolveBlending(blending),
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;

    resourcesRef.current = { geometry, material, texture, points };
    group.add(points);

    return () => {
      group.remove(points);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      resourcesRef.current = null;
    };
    // speed/color/swayAmplitude/swayFrequency/sizeRange/opacityRange/blending/viewportHeight/
    // pixelRatio are intentionally read only for this build's *initial* uniform/material values --
    // their later changes are synced below without rebuilding the whole geometry/material/texture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, spreadX, spreadY, depthRange]);

  // The mutations below (these effects and useFrame) write into a THREE.ShaderMaterial that lives
  // in a plain ref, not React state -- a WebGL uniform/material property has to be updated
  // imperatively, every frame in uTime's case, which is fundamentally incompatible with treating it
  // as pure render output. react-hooks/immutability's cross-effect mutation check doesn't have a
  // way to know that `resourcesRef.current` is an intentional imperative escape hatch (the same
  // role SilkFan.tsx's whole render effect plays), so each write is individually justified and
  // disabled below.
  useEffect(() => {
    const material = resourcesRef.current?.material;
    if (!material) return;
    // eslint-disable-next-line react-hooks/immutability
    material.uniforms.uSpeed.value = speed;
    material.uniforms.uSwayAmplitude.value = swayAmplitude;
    material.uniforms.uSwayFrequency.value = swayFrequency;
    material.uniforms.uColor.value = new THREE.Color(color);
    material.uniforms.uSizeMin.value = sizeRange[0];
    material.uniforms.uSizeMax.value = sizeRange[1];
    material.uniforms.uOpacityMin.value = opacityRange[0];
    material.uniforms.uOpacityMax.value = opacityRange[1];
    material.blending = resolveBlending(blending);
  }, [speed, swayAmplitude, swayFrequency, color, sizeRange, opacityRange, blending]);

  useEffect(() => {
    const material = resourcesRef.current?.material;
    if (!material) return;
    // eslint-disable-next-line react-hooks/immutability
    material.uniforms.uScale.value = viewportHeight * pixelRatio * 0.5;
  }, [viewportHeight, pixelRatio]);

  useFrame((state) => {
    const material = resourcesRef.current?.material;
    if (!material) return;
    if (!motionEnabled) {
      // prefers-reduced-motion: leave uTime at its initial value forever, once. Particles then sit
      // motionless at their randomized spawn offsets instead of animating.
      if (!frozenRef.current) {
        // eslint-disable-next-line react-hooks/immutability
        material.uniforms.uTime.value = 0;
        frozenRef.current = true;
      }
      return;
    }
    material.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return <group ref={groupRef} />;
}
