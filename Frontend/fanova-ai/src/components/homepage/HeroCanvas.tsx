"use client";

import React, {
  useRef,
  useEffect,
  useMemo,
  Suspense,
  Component,
  type ReactNode,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─── Fan constants ─── */
const N_RIBS = 14;
const SPREAD = 2.62; // ~150° total arc
const RIB_H = 2.72;
const RIB_W = 0.046;
const RIB_D = 0.011;

/* ─── Error boundary for WebGL / canvas failures ─── */
class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/* ─── Decorative arc ─── */
function FanArc({
  radius,
  color,
  opacity,
}: {
  radius: number;
  color: string;
  opacity: number;
}) {
  const lineObj = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= 80; i++) {
      const a = Math.PI / 2 + SPREAD / 2 - SPREAD * (i / 80);
      pts.push(Math.cos(a) * radius, Math.sin(a) * radius, 0);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
    });
    return new THREE.Line(geo, mat);
  }, [radius, color, opacity]);

  useEffect(() => {
    return () => {
      (lineObj.geometry as THREE.BufferGeometry).dispose();
      (lineObj.material as THREE.Material).dispose();
    };
  }, [lineObj]);

  return <primitive object={lineObj} />;
}

/* ─── Fan group with mouse-driven rotation ─── */
function FanGroup() {
  const groupRef = useRef<THREE.Group>(null!);
  const mouse = useRef({ x: 0, y: 0 });
  const smooth = useRef({ rotX: 0.06, rotY: -0.06 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const ribs = useMemo(() => {
    // Premium ice-blue center → clean white edges, matched to new deep-navy Hero
    const cCenter = new THREE.Color("#DCEAF7"); // ice-blue — crisp and luminous
    const cEdge   = new THREE.Color("#FFFFFF");  // pure white tips
    const eCenter = new THREE.Color("#08337D");  // brand primary emissive base
    const eEdge   = new THREE.Color("#4A74A7");  // soft blue emissive edge

    return Array.from({ length: N_RIBS }, (_, i) => {
      const t = i / (N_RIBS - 1);
      const angle = SPREAD * (t - 0.5);
      const centeredness = 1 - 4 * (t - 0.5) ** 2;

      const ribColor      = cCenter.clone().lerp(cEdge, 1 - centeredness);
      const emissiveColor = eCenter.clone().lerp(eEdge, 1 - centeredness);
      const colorHex      = `#${ribColor.getHexString()}`;
      const emissiveHex   = `#${emissiveColor.getHexString()}`;
      const opacity       = 0.74 + (1 - centeredness) * 0.20;

      return { angle, colorHex, emissiveHex, opacity };
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const elapsed = state.clock.elapsedTime;
    const lerp = THREE.MathUtils.lerp;

    smooth.current.rotY = lerp(smooth.current.rotY, mouse.current.x * 0.22, 0.038);
    smooth.current.rotX = lerp(smooth.current.rotX, 0.06 + mouse.current.y * 0.11, 0.038);

    groupRef.current.rotation.x = smooth.current.rotX;
    groupRef.current.rotation.y = smooth.current.rotY;
    groupRef.current.rotation.z = Math.sin(elapsed * 0.25) * 0.013;
  });

  return (
    <group ref={groupRef} position={[0.2, -0.15, 0]}>
      {ribs.map((rib, i) => (
        <group key={i} rotation={[0, 0, rib.angle]}>
          <mesh position={[0, RIB_H / 2, 0]}>
            <boxGeometry args={[RIB_W, RIB_H, RIB_D]} />
            <meshStandardMaterial
              color={rib.colorHex}
              emissive={rib.emissiveHex}
              metalness={0.52}
              roughness={0.20}
              transparent
              opacity={rib.opacity}
            />
          </mesh>
        </group>
      ))}

      {/* Concentric arcs */}
      <FanArc radius={RIB_H * 0.97} color="#FFFFFF"  opacity={0.52} />
      <FanArc radius={RIB_H * 0.70} color="#DCEAF7"  opacity={0.40} />
      <FanArc radius={RIB_H * 0.42} color="#4A74A7"  opacity={0.28} />

      {/* Pivot */}
      <mesh position={[0, 0, 0.02]}>
        <sphereGeometry args={[0.068, 20, 20]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#4A74A7"
          metalness={0.85}
          roughness={0.12}
        />
      </mesh>
    </group>
  );
}

/* ─── Exported canvas ─── */
export default function HeroCanvas() {
  return (
    <CanvasErrorBoundary>
      <Canvas
        camera={{ position: [-0.4, 0.6, 6.0], fov: 49 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        {/* Soft ambient — ice-blue tint */}
        <ambientLight intensity={0.78} color="#DCEAF7" />

        {/* Key light from upper-right: main shaping */}
        <directionalLight position={[3, 6, 5]} intensity={1.85} color="#FFFFFF" />

        {/* Fill light from left: reveals form */}
        <directionalLight position={[-3, 2, 3]} intensity={0.72} color="#4A74A7" />

        {/* Rim light: separates outer ribs from bg */}
        <directionalLight position={[-4, 0, 1.5]} intensity={0.50} color="#E8F2FC" />

        {/* Royal blue point glow behind fan — refined halo */}
        <pointLight position={[0.2, -0.1, 1.6]} intensity={0.65} color="#114F99" distance={7} decay={2} />

        <Suspense fallback={null}>
          <FanGroup />
        </Suspense>
      </Canvas>
    </CanvasErrorBoundary>
  );
}
