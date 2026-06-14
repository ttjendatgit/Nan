"use client";

import { useState, useEffect } from "react";
import FanIntro from "./FanIntro";

// Set to true to force intro every load in dev (for testing).
// Must be false in production.
const ALWAYS_SHOW_INTRO_IN_DEV = false;

function hasSeenIntro(): boolean {
  if (ALWAYS_SHOW_INTRO_IN_DEV && process.env.NODE_ENV === "development") {
    return false;
  }
  try {
    return sessionStorage.getItem("nha-phong-intro-seen") === "1";
  } catch {
    return false;
  }
}

export default function FanIntroWrapper() {
  // isChecking starts true on both server and client render.
  // The dark cover is included in the initial HTML, so the homepage
  // is never visible before we decide whether to show the intro.
  const [isChecking, setIsChecking] = useState(true);
  const [shouldShowIntro, setShouldShowIntro] = useState(false);

  useEffect(() => {
    const seen = hasSeenIntro();
    setShouldShowIntro(!seen);
    setIsChecking(false);
  }, []);

  // During SSR and the first client paint: render an opaque dark cover.
  // This prevents any homepage content flashing through.
  if (isChecking) {
    return (
      <div
        className="fixed inset-0 z-[9999]"
        style={{ background: "#080E1A" }}
        aria-hidden="true"
      />
    );
  }

  if (shouldShowIntro) {
    return <FanIntro onComplete={() => setShouldShowIntro(false)} />;
  }

  return null;
}
