"use client";

// Liquid-glass soap bubbles drifting over Monet's garden. This is client-only:
// it needs the DOM, a 2D canvas context, requestAnimationFrame and event
// listeners, none of which exist in a Server Component. The server page just
// mounts <BubbleCanvas /> — all animation lives here.
import { useEffect, useRef } from "react";

// Images are served from /public at the site root.
const MONET_SRC = "/mone.jpg";

type Bubble = {
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
  drift: number;
  wobble: number;
  mag: number; // lens zoom factor — this is the "liquid glass" strength
  hue: number; // starting angle (rad) of the rainbow sweep — makes each bubble unique
};

type BubbleCanvasProps = {
  className?: string;
};

export function BubbleCanvas({ className = "" }: BubbleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- mutable animation state, kept in the effect closure ---
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let bubbles: Bubble[] = [];
    let bg: { s: number; dx: number; dy: number; dw: number; dh: number } | null = null;
    let raf = 0;
    let running = false;
    let imgReady = false;

    const img = new Image();

    /** Create one bubble with randomised size, speed, wobble and magnification. */
    function makeBubble(seedTop: boolean): Bubble {
      const r = 16 + Math.random() * 46; // wider range = more volume
      return {
        x: Math.random() * w,
        y: seedTop ? Math.random() * h : h + r + Math.random() * h * 0.5,
        r,
        speed: 0.18 + Math.random() * 0.55 + r * 0.008,
        phase: Math.random() * Math.PI * 2,
        drift: 0.3 + Math.random() * 1.0,
        wobble: 0.005 + Math.random() * 0.01,
        mag: 1.18 + Math.random() * 0.22,
        hue: Math.random() * Math.PI * 2,
      };
    }

    /** Cover-fit the painting to the canvas box. */
    function coverFit() {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const s = Math.max(w / iw, h / ih);
      const dw = iw * s;
      const dh = ih * s;
      return { s, dx: (w - dw) / 2, dy: (h - dh) / 2, dw, dh };
    }

    /** Size the canvas to its box, accounting for device pixel ratio. */
    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (imgReady) bg = coverFit();
      const target = Math.max(10, Math.min(26, Math.round((w * h) / 26000)));
      bubbles = Array.from({ length: target }, () => makeBubble(true));
      if (!running) draw();
    }

    /** Paint the Monet as the background (cover fit), or a lilac fallback. */
    function drawBackground() {
      if (!ctx) return;
      if (imgReady && bg) ctx.drawImage(img, bg.dx, bg.dy, bg.dw, bg.dh);
      else {
        ctx.fillStyle = "#FCAEC2";
        ctx.fillRect(0, 0, w, h);
      }
    }

    /**
     * Draw one bubble: a magnified slice of the painting (the Apple-style
     * liquid-glass lens) plus spherical shading, a specular highlight and an
     * iridescent soap rim. The magnification keeps the point under the bubble's
     * centre fixed and zooms everything around it, which reads as glass.
     */
    function drawBubble(b: Bubble) {
      if (!ctx) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.clip();

      // --- liquid-glass lens: redraw the painting, magnified about the centre ---
      if (imgReady && bg) {
        const m = b.mag;
        const dw2 = bg.dw * m;
        const dh2 = bg.dh * m;
        const dx2 = b.x - (b.x - bg.dx) * m;
        const dy2 = b.y - (b.y - bg.dy) * m;
        ctx.drawImage(img, dx2, dy2, dw2, dh2);

        // brighter, more-magnified rim ring = stronger refraction at the edge
        ctx.save();
        ctx.globalAlpha = 0.55;
        const mr = m * 1.35;
        const dwr = bg.dw * mr;
        const dhr = bg.dh * mr;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.arc(b.x, b.y, b.r * 0.82, 0, Math.PI * 2, true); // annulus near the rim
        ctx.clip("evenodd");
        ctx.drawImage(img, b.x - (b.x - bg.dx) * mr, b.y - (b.y - bg.dy) * mr, dwr, dhr);
        ctx.restore();
      }

      // --- spherical volume shading ---
      const vg = ctx.createRadialGradient(
        b.x - b.r * 0.32,
        b.y - b.r * 0.38,
        b.r * 0.08,
        b.x,
        b.y,
        b.r,
      );
      vg.addColorStop(0.0, "rgba(255,255,255,0.34)");
      vg.addColorStop(0.32, "rgba(255,255,255,0.04)");
      vg.addColorStop(0.78, "rgba(106,13,173,0.05)");
      vg.addColorStop(1.0, "rgba(26,26,26,0.22)"); // darker rim seats the sphere
      ctx.fillStyle = vg;
      ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);

      // --- iridescent film: a radial rainbow band concentrated near the rim ---
      // Soap-film interference makes the colours appear where the film is seen
      // at a glancing angle, i.e. toward the edge. This band fades in from the
      // centre and peaks just inside the rim. `screen` keeps it luminous, like
      // light rather than paint. b.hue rotates the palette so bubbles differ
      // and slowly shift as they drift.
      ctx.globalCompositeOperation = "screen";
      const shift = b.hue;
      const irid = ctx.createRadialGradient(b.x, b.y, b.r * 0.45, b.x, b.y, b.r);
      irid.addColorStop(0.0, "rgba(0,0,0,0)");
      irid.addColorStop(0.55, hsla(shift + 0.0, 0.15));
      irid.addColorStop(0.72, hsla(shift + 1.6, 0.28));
      irid.addColorStop(0.85, hsla(shift + 3.1, 0.38));
      irid.addColorStop(0.95, hsla(shift + 4.6, 0.42));
      irid.addColorStop(1.0, hsla(shift + 5.8, 0.2));
      ctx.fillStyle = irid;
      ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      ctx.globalCompositeOperation = "source-over";

      // soft specular sheen (top-left) — the sun catching the film
      ctx.beginPath();
      ctx.ellipse(b.x - b.r * 0.34, b.y - b.r * 0.4, b.r * 0.3, b.r * 0.18, -0.6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fill();

      // tiny sharp catch-light
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.12, b.y - b.r * 0.55, b.r * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fill();

      ctx.restore();

      // --- rainbow rim sweep: a conic gradient stroked around the edge ---
      // A full-spectrum sweep so the "sun playing in the bubble" reads as
      // separate colour arcs. Drawn unclipped so it sits right on the outline.
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const sweep = ctx.createConicGradient(shift, b.x, b.y);
      for (let i = 0; i <= 6; i++) {
        sweep.addColorStop(i / 6, hsla(shift + (i / 6) * Math.PI * 2, 0.35));
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r - 0.8, 0, Math.PI * 2);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = sweep;
      ctx.shadowColor = "rgba(106,13,173,0.30)";
      ctx.shadowBlur = 24;
      ctx.stroke();
      ctx.restore();

      // crisp white inner highlight ring, to seat the rim
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r - 1.4, 0, Math.PI * 2);
      ctx.lineWidth = 0;
      ctx.strokeStyle = "rgba(255,255,255,0.0)";
      ctx.stroke();
      ctx.restore();
    }

    /**
     * Build an `hsla` colour from an angle in radians. The angle maps to hue,
     * so adding to it rotates through the full rainbow. Saturation/lightness
     * are tuned for a bright, sunlit-film look.
     */
    function hsla(angleRad: number, alpha: number): string {
      const deg = ((angleRad * 180) / Math.PI) % 360;
      return `hsla(${deg}, 95%, 70%, ${alpha})`;
    }

    /** Render one static frame (background + bubbles). */
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      drawBackground();
      for (const b of bubbles) drawBubble(b);
    }

    /** Advance positions, then render one animated frame. */
    function tick() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      drawBackground();
      for (const b of bubbles) {
        b.y -= b.speed;
        b.phase += b.wobble;
        b.x += Math.sin(b.phase) * b.drift;
        b.hue += 0.012; // rotate the rainbow so the film shimmers as it rises
        if (b.y + b.r < 0) Object.assign(b, makeBubble(false)); // respawn below
        drawBubble(b);
      }
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

    // Save battery: pause while the tab is hidden, resume if it was playing.
    let wasRunning = false;
    function onVisibility() {
      if (document.hidden) {
        wasRunning = running;
        pause();
      } else if (wasRunning) {
        play();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize);

    // Start the animation (or hold a still frame for reduced motion). Called
    // whether or not the painting loads, so the bubbles always animate.
    function start() {
      resize();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        pause();
        draw();
      } else {
        play();
      }
    }

    // Load the painting, then start. On error we still start — bubbles just
    // drift over the lilac fallback wash instead of the Monet.
    img.onload = () => {
      imgReady = true;
      start();
    };
    img.onerror = () => start();
    img.src = MONET_SRC;

    // Cleanup on unmount / locale change: stop the loop and drop listeners.
    return () => {
      pause();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      img.onload = null;
      img.onerror = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
      data-testid="bubble-canvas"
    />
  );
}
