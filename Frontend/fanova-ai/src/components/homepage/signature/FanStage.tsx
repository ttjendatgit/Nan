"use client";

// The Hero's object. The layout reserves the fan's space with .sig-stage (2R wide, the rivet at
// its bottom centre); this component puts the fan in it.
// engine "svg" (the homepage since R20.2): the R20 SilkFan, chosen over the 3D fan on looks (see
// DECISIONS.md §30); three.js is never loaded. engine "gl" (lab): a canvas behind the copy renders
// the 3D fan (fan3d/FanScene, loaded lazily) so that its rivet lands exactly on the stage's
// rivet; without WebGL, or if the context is lost, it falls back to the SVG fan in the same place.

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import SignatureFan from "./SignatureFan";
import { NAN_PALETTE } from "../silk-fan/silkFanPalette";
import type { FanScene } from "./fan3d/FanScene";
import type { ImprintPhase } from "./useImprint";

type Mode = "pending" | "gl" | "svg";

/** Canvas fonts cannot read CSS variables: resolve var(--x) in a font stack to its value. */
export function cssFontStack(stack: string): string {
  const root = getComputedStyle(document.documentElement);
  return stack.replace(/var\((--[\w-]+)\)/g, (_, name: string) => root.getPropertyValue(name).trim() || "serif");
}

export default function FanStage({
  sectionRef,
  word,
  phase,
  foldRef,
  reprinted,
  engine = "svg",
  ns = "sig",
}: {
  sectionRef: RefObject<HTMLElement | null>;
  word: string;
  phase: ImprintPhase;
  foldRef: { current: number };
  reprinted: boolean;
  /** "svg" (default, the homepage since R20.2): the R20 SilkFan, no three.js is loaded.
   *  "gl": the 3D fan (fan3d/FanScene), kept in the lab for further work. */
  engine?: "svg" | "gl";
  /** class prefix of the Hero that hosts the stage (ns-gl, ns-stage, ns-stage-svg, ns-pivot) */
  ns?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FanScene | null>(null);
  const wordRef = useRef(word);
  const [mode, setMode] = useState<Mode>(engine === "svg" ? "svg" : "pending");

  useEffect(() => {
    wordRef.current = word;
  }, [word]);

  /* build the scene once; place it from the stage box on every resize */
  useEffect(() => {
    const canvas = canvasRef.current, stage = stageRef.current, section = sectionRef.current;
    if (engine === "svg" || !canvas || !stage || !section) return;
    let disposed = false;
    let ro: ResizeObserver | null = null;
    let onMove: ((e: PointerEvent) => void) | null = null;

    import("./fan3d/FanScene")
      .then(({ FanScene, webglAvailable }) => {
        if (disposed) return;
        if (!webglAvailable()) return setMode("svg");
        const fontFamily = cssFontStack(NAN_PALETTE.fontStack); // the R20 fan's foil face
        const scene = new FanScene(canvas, {
          reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          coarse: window.matchMedia("(pointer: coarse)").matches,
          fontFamily,
          foldRef,
          onLost: () => {
            sceneRef.current = null;
            setMode("svg");
          },
        });
        sceneRef.current = scene;
        /* the canvas covers the fan and the shadow it casts down and to the right, not the room */
        const place = () => {
          const s = section.getBoundingClientRect(), b = stage.getBoundingClientRect();
          const r = b.width / 2, px = b.left - s.left + r, py = b.bottom - s.top;
          const x0 = Math.max(0, px - 1.25 * r), y0 = Math.max(0, py - 1.25 * r);
          const x1 = Math.min(s.width, px + 1.75 * r), y1 = Math.min(s.height, py + 0.75 * r);
          Object.assign(canvas.style, { left: `${x0}px`, top: `${y0}px`, width: `${x1 - x0}px`, height: `${y1 - y0}px` });
          scene.setLayout(x1 - x0, y1 - y0, px - x0, py - y0, r);
        };
        place();
        ro = new ResizeObserver(place);
        ro.observe(section);
        ro.observe(stage);
        onMove = (e: PointerEvent) => {
          const s = section.getBoundingClientRect();
          scene.setPointer(((e.clientX - s.left) / s.width) * 2 - 1, ((e.clientY - s.top) / s.height) * 2 - 1);
        };
        section.addEventListener("pointermove", onMove, { passive: true });
        void scene.setWord(wordRef.current, true);
        setMode("gl");
      })
      .catch(() => {
        if (!disposed) setMode("svg");
      });

    return () => {
      disposed = true;
      ro?.disconnect();
      if (onMove) section.removeEventListener("pointermove", onMove);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [sectionRef, foldRef, engine]);

  /* a new word reprints the fan: it is folded shut by now, and re-opens with the word */
  useEffect(() => {
    void sceneRef.current?.setWord(word, true);
  }, [word]);
  useEffect(() => {
    if (phase === "printing") sceneRef.current?.wake();
  }, [phase]);

  return (
    <>
      {engine === "gl" && <canvas ref={canvasRef} aria-hidden="true" className={`${ns}-gl`} data-on={mode === "gl" || undefined} />}
      <div ref={stageRef} className={`${ns}-stage`} role="img" aria-label={`Quạt Nan mẫu, in chữ ${word}`}>
        {mode === "svg" && (
          <SignatureFan
            className={`${ns}-stage-svg`}
            word={word}
            foldRef={foldRef}
            reprinted={reprinted}
            style={{ "--tilt": "0deg" } as CSSProperties}
          />
        )}
        <span className={`${ns}-pivot`} data-fan-pivot />
      </div>
    </>
  );
}
