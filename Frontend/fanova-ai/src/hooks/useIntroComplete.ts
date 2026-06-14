"use client";

import { useCallback, useState } from "react";

const SESSION_KEY = "nha-phong-intro-seen";

export function useIntroComplete() {
  const [done, setDone] = useState(false);

  const markComplete = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage may be unavailable in some envs
    }
    setDone(true);
  }, []);

  return { done, markComplete };
}

export function hasSeenIntro(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}
