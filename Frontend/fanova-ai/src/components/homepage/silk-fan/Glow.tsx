"use client";

/**
 * A single soft radial plane, additive-blended, rendered inside HeroSilkStage's back canvas so
 * plain CSS layer stacking already puts it behind the SVG fan (there is no real 3D depth
 * compositing between the two canvases and the SVG -- see stageConfig.ts's glowConfig comment for
 * why its position is derived from the fan's own LIGHT vector).
 *
 * Built in a useEffect and mutated through a ref, same reasoning as GoldDust.tsx: mutating an
 * object returned from useMemo in a later effect trips this project's react-hooks/immutability
 * rule, since the compiler can no longer guarantee that value stays what the hook produced.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createDustTexture } from "./GoldDust";

export interface GlowProps {
  /** Hex color -- always sourced from silkFanPalette.ts by the caller, never hardcoded here. */
  color: string;
  offsetX: number;
  offsetY: number;
  z: number;
  radius: number;
  intensity: number;
}

interface GlowResources {
  geometry: THREE.PlaneGeometry;
  material: THREE.MeshBasicMaterial;
  texture: THREE.CanvasTexture;
  mesh: THREE.Mesh;
}

export default function Glow({ color, offsetX, offsetY, z, radius, intensity }: GlowProps) {
  const groupRef = useRef<THREE.Group>(null);
  const resourcesRef = useRef<GlowResources | null>(null);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const texture = createDustTexture(128);
    const geometry = new THREE.PlaneGeometry(radius, radius);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color: new THREE.Color(color),
      transparent: true,
      opacity: intensity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.position.set(offsetX, offsetY, z);

    resourcesRef.current = { geometry, material, texture, mesh };
    group.add(mesh);

    return () => {
      group.remove(mesh);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      resourcesRef.current = null;
    };
    // color/intensity are intentionally read only for this build's initial values -- later changes
    // are synced below without rebuilding the geometry/material/texture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius]);

  useEffect(() => {
    const mesh = resourcesRef.current?.mesh;
    if (mesh) mesh.position.set(offsetX, offsetY, z);
  }, [offsetX, offsetY, z]);

  useEffect(() => {
    const material = resourcesRef.current?.material;
    if (!material) return;
    material.color.set(color);
    // A plain-ref-held THREE.Material property write, not React state -- see the matching comment
    // in GoldDust.tsx for why react-hooks/immutability's cross-effect check doesn't apply here.
    // eslint-disable-next-line react-hooks/immutability
    material.opacity = intensity;
  }, [color, intensity]);

  return <group ref={groupRef} />;
}
