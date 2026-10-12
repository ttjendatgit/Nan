"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DUR_REVEAL, DUR_REVEAL_MOBILE, EASE_NAN, INSTANT, MOBILE_QUERY } from "@/lib/motionTokens";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds after the element enters the viewport. Keep a group's last delay at or under 0.4s. */
  delay?: number;
  /** Play once, the first time the element enters the viewport. */
  once?: boolean;
  /** Share of the element that must be visible before it reveals (0–1). */
  amount?: number;
}

/** 16px sits inside both the desktop (16–24px) and the mobile (12–16px) range, so the start state
 *  is the same on the server and in every viewport. */
const REVEAL_Y = 16;

function subscribeToMobile(onChange: () => void): () => void {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * Shared viewport reveal: opacity with a short upward translate, on the --ease-nan / --dur-reveal
 * tokens. Wraps its children in one block-level div, so it adds no spacing of its own; only
 * transform and opacity animate, so it never moves the layout around it.
 *
 * Hydration-safe reduced motion: the start state (`initial`) is identical on the server and the
 * client; only `animate` and the transition (neither rendered to the DOM) depend on the user's
 * preference. Under prefers-reduced-motion `animate` lands the element on its final state right
 * after hydration, in or out of the viewport, with no fade, delay or translate. Switching `initial` itself on that preference (`initial={reduce ? false : …}`) makes
 * the server HTML and the first client render disagree, which React reports as a hydration error.
 */
export default function Reveal({ children, className, delay = 0, once = true, amount = 0.25 }: RevealProps) {
  const reduce = useReducedMotion();
  const isMobile = useSyncExternalStore(subscribeToMobile, () => window.matchMedia(MOBILE_QUERY).matches, () => false);

  return (
    <motion.div
      initial={{ opacity: 0, y: REVEAL_Y }}
      whileInView={{ opacity: 1, y: 0 }}
      animate={reduce ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once, amount }}
      transition={reduce ? INSTANT : { duration: isMobile ? DUR_REVEAL_MOBILE : DUR_REVEAL, delay, ease: EASE_NAN }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
