import { useSyncExternalStore } from "react";

const subscribeNothing = () => () => {};

/**
 * false on the server and during hydration, true afterwards. State that depends on the browser
 * (scroll position, a chosen sample) only applies once this is true, so the server HTML and the
 * first client render always match.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNothing, () => true, () => false);
}
