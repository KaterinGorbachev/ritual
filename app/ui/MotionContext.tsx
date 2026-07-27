"use client";

// One global "animations off" flag, shared across the whole page. Every
// animator on the site — the two soap-bubble canvases and all CSS
// animation/transition — treats this exactly like `prefers-reduced-motion`, so
// a single control stops everything. The flag is the sole source of truth.
//
// Two coordinated outputs from the same boolean:
//   1. `off` / `toggle`, consumed by the canvases via `useMotion()`.
//   2. a `motion-off` class on <html>, which drives the CSS half (see
//      globals.css) and forces slide-in content visible.
//
// The choice is persisted to localStorage so it survives client navigation
// (each route remounts the layout and its canvases).
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "ritual:motion-off";

type MotionValue = { off: boolean; toggle: () => void };

// Default is a no-op "on" so a component rendered outside the provider (e.g. an
// isolated test) still works — it just never stops.
const MotionContext = createContext<MotionValue>({ off: false, toggle: () => {} });

export function MotionProvider({ children }: { children: React.ReactNode }) {
  // Start "on" on the server and first client paint, then hydrate the stored
  // choice in an effect. Reading localStorage during render would mismatch SSR.
  const [off, setOff] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") setOff(true);
  }, []);

  // Mirror the flag onto <html> (the CSS half) and persist it.
  useEffect(() => {
    document.documentElement.classList.toggle("motion-off", off);
    localStorage.setItem(STORAGE_KEY, off ? "1" : "0");
  }, [off]);

  const toggle = useCallback(() => setOff((v) => !v), []);

  return <MotionContext value={{ off, toggle }}>{children}</MotionContext>;
}

export function useMotion() {
  return useContext(MotionContext);
}
