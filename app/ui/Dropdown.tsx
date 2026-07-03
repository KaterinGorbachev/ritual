"use client";

import { useEffect, useRef } from "react";

export function Dropdown({
  children,
  className = "",
  ...props
}: React.ComponentProps<"details">) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onPointerDown(e: PointerEvent) {
      if (el!.open && !el!.contains(e.target as Node)) {
        el!.open = false;
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && el!.open) {
        el!.open = false;
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={ref} className={className} {...props}>
      {children}
    </details>
  );
}
