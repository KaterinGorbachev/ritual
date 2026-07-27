"use client";

// A transparent, 3D liquid-glass soap-bubble field. Derived from BubbleCanvas,
// but purpose-built to sit *behind* page content: no painting, no background
// wash, no toggle button — just glass bubbles drifting over whatever shows
// through. On the Services page it is fixed and centred so, as the reader
// scrolls, the bubbles peek through the gaps between the price containers.
//
// Client-only: it needs the DOM, a 2D canvas context, requestAnimationFrame and
// media queries, none of which exist in a Server Component.
import { useEffect, useRef } from "react";
import { useMotion } from "./MotionContext";

type Bubble = {
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
  drift: number;
  wobble: number;
  hue: number; // starting angle (rad) of the iridescent sweep — unique per bubble
  squash: number; // vertical squash so bubbles read as spheres seen slightly off-axis
};

type BubbleFieldProps = { className?: string };

export function BubbleField({ className = "" }: BubbleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The single global control: when animations are stopped, so is this canvas.
  const { off } = useMotion();

  // The loop lives in the effect closure; publish its controls and mirror `off`
  // into refs so the flag drives the loop without re-running the mount effect.
  const controlsRef = useRef<{ play: () => void; pause: () => void } | null>(null);
  const offRef = useRef(off);
  offRef.current = off;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let bubbles: Bubble[] = [];
    let raf = 0;
    let running = false;

    /** One bubble: wide size range so overlapping scales read as depth. */
    function makeBubble(seedAnywhere: boolean): Bubble {
      const r = 22 + Math.random() * 66;
      return {
        x: Math.random() * w,
        y: seedAnywhere ? Math.random() * h : h + r + Math.random() * h * 0.4,
        r,
        speed: 0.12 + Math.random() * 0.4 + r * 0.006,
        phase: Math.random() * Math.PI * 2,
        drift: 0.25 + Math.random() * 0.85,
        wobble: 0.004 + Math.random() * 0.009,
        hue: Math.random() * Math.PI * 2,
        squash: 0.9 + Math.random() * 0.1,
      };
    }

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Fewer, larger bubbles than the hero: this is ambient, not the main event.
      const target = Math.max(6, Math.min(16, Math.round((w * h) / 90000)));
      bubbles = Array.from({ length: target }, () => makeBubble(true));
      if (!running) draw();
    }

    // Salon palette for the iridescence: everything stays on the signature soft
    // pink (#ffadae ≈ hsl(359,100%,84%)). The hue is locked to a tiny warm band
    // around pink — a hair toward magenta at one end, never toward lilac, blue
    // or any cool hue. So the film only ever shimmers as soft pink.
    const HUE_PINK_LOW = 342; // warm rose end
    const HUE_PINK_HIGH = 358; // ≈ blush #ffadae end
    const HUE_SPAN = HUE_PINK_HIGH - HUE_PINK_LOW;

    /** Build an hsla colour from an angle in radians, remapped so the hue never
     * leaves the narrow pink band. The angle's sine drives a 0..1 position, so
     * bubbles still breathe within the pink — just no other colour appears. */
    function hsla(angleRad: number, alpha: number): string {
      const t = (Math.sin(angleRad) + 1) / 2; // 0..1, smooth and periodic
      const deg = HUE_PINK_LOW + t * HUE_SPAN;
      const sat = 88 + t * 8; // kept high so it reads as pink, not grey
      const light = 82 + t * 4; // pale, soft #ffadae range
      return `hsla(${deg}, ${sat}%, ${light}%, ${alpha})`;
    }

    /**
     * Draw one glass bubble with no image behind it — the 3D read has to come
     * entirely from shading. Layers, back to front:
     *   1. a soft cast shadow offset down-right (lifts the sphere off the page)
     *   2. a faint fill so the glass has body over any background
     *   3. spherical volume shading (bright top-left core → dark seated rim)
     *   4. a soft-pink iridescent film band peaking just inside the rim (screen)
     *   5. a soft-pink conic rim sweep right on the outline (screen)
     *   6. a broad specular sheen + a tiny sharp catch-light (the sun on glass)
     */
    function drawBubble(b: Bubble) {
      if (!ctx) return;
      const ry = b.r * b.squash;

      // 1. cast shadow — the single depth cue that most sells "floating glass"
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(b.x + b.r * 0.16, b.y + b.r * 0.2, b.r * 0.98, ry * 0.98, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,173,174,0.10)"; // soft blush shadow, no purple
      ctx.filter = "blur(10px)";
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.r, ry, 0, 0, Math.PI * 2);
      ctx.clip();

      // 2. faint glass body so the sphere exists over a transparent ground
      const body = ctx.createRadialGradient(
        b.x - b.r * 0.3,
        b.y - ry * 0.34,
        b.r * 0.05,
        b.x,
        b.y,
        b.r,
      );
      // More transparent than before so background shows through the glass.
      body.addColorStop(0.0, "rgba(255,255,255,0.12)");
      body.addColorStop(0.5, "rgba(255,220,224,0.03)"); // barely-there pink core
      body.addColorStop(1.0, "rgba(255,173,174,0.11)"); // soft blush #ffadae rim
      ctx.fillStyle = body;
      ctx.fillRect(b.x - b.r, b.y - ry, b.r * 2, ry * 2);

      // 3. spherical volume shading — bright offset core, dark seated rim
      const vg = ctx.createRadialGradient(
        b.x - b.r * 0.34,
        b.y - ry * 0.4,
        b.r * 0.06,
        b.x,
        b.y,
        b.r,
      );
      vg.addColorStop(0.0, "rgba(255,255,255,0.42)");
      vg.addColorStop(0.28, "rgba(255,255,255,0.04)");
      vg.addColorStop(0.75, "rgba(255,173,174,0.06)"); // soft pink, not purple
      vg.addColorStop(1.0, "rgba(188,21,113,0.12)"); // magenta seat — warm, no blue
      ctx.fillStyle = vg;
      ctx.fillRect(b.x - b.r, b.y - ry, b.r * 2, ry * 2);

      // 4. iridescent soap film, concentrated near the rim (luminous → screen)
      const shift = b.hue;
      ctx.globalCompositeOperation = "screen";
      const irid = ctx.createRadialGradient(b.x, b.y, b.r * 0.42, b.x, b.y, b.r);
      irid.addColorStop(0.0, "rgba(0,0,0,0)");
      irid.addColorStop(0.55, hsla(shift + 0.0, 0.1));
      irid.addColorStop(0.72, hsla(shift + 1.6, 0.18));
      irid.addColorStop(0.86, hsla(shift + 3.1, 0.26));
      irid.addColorStop(0.95, hsla(shift + 4.6, 0.3));
      irid.addColorStop(1.0, hsla(shift + 5.8, 0.14));
      ctx.fillStyle = irid;
      ctx.fillRect(b.x - b.r, b.y - ry, b.r * 2, ry * 2);
      ctx.globalCompositeOperation = "source-over";

      // 6a. broad specular sheen — the soft window of light on the top-left
      ctx.beginPath();
      ctx.ellipse(
        b.x - b.r * 0.36,
        b.y - ry * 0.42,
        b.r * 0.32,
        ry * 0.2,
        -0.6,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fill();

      // 6b. tiny sharp catch-light
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.12, b.y - ry * 0.56, b.r * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.fill();

      ctx.restore();

      // 5. soft-pink conic rim sweep — drawn unclipped, right on the outline
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const sweep = ctx.createConicGradient(shift, b.x, b.y);
      for (let i = 0; i <= 6; i++) {
        sweep.addColorStop(i / 6, hsla(shift + (i / 6) * Math.PI * 2, 0.24));
      }
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.r - 0.8, ry - 0.8, 0, 0, Math.PI * 2);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = sweep;
      ctx.shadowColor = "rgba(255,173,174,0.30)"; // soft pink glow, no purple
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      // Painter's order: draw largest (nearest) last so near glass overlaps far.
      const ordered = [...bubbles].sort((a, b) => a.r - b.r);
      for (const b of ordered) drawBubble(b);
    }

    function tick() {
      if (!ctx) return;
      for (const b of bubbles) {
        b.y -= b.speed;
        b.phase += b.wobble;
        b.x += Math.sin(b.phase) * b.drift;
        b.hue += 0.01;
        if (b.y + b.r < 0) Object.assign(b, makeBubble(false));
      }
      draw();
      raf = requestAnimationFrame(tick);
    }

    function play() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    }

    function pause() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    }

    controlsRef.current = { play, pause };

    // Save battery while the tab is hidden; resume if it was running — but never
    // resume against the global "off" flag.
    let wasRunning = false;
    function onVisibility() {
      if (document.hidden) {
        wasRunning = running;
        pause();
      } else if (wasRunning && !offRef.current) {
        play();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize);

    resize();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (offRef.current || reduce) draw(); // hold one still frame — no animation
    else play();

    return () => {
      pause();
      controlsRef.current = null;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Apply the global flag whenever it flips (no-op when already in that state).
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (off) controls.pause();
    else controls.play();
  }, [off]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none h-full w-full ${className}`}
      aria-hidden="true"
      data-testid="bubble-field"
    />
  );
}
