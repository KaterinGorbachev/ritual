"use client";

// THE Ritual bubble. One implementation, one look, every page.
//
// This is the salon's signature animation: liquid-glass soap bubbles, locked to
// the brand pink (#ffadae), drifting upward. Both the home hero and the Services
// page render *this* component — there is deliberately no second bubble
// implementation, because two of them drifted apart once already (different
// shading, different palette, one rainbow and one pink) and stopped reading as
// the same company.
//
// Two props adapt it to its ground without changing the bubbles:
//   • `backdrop` — an image URL. With one, the canvas paints that image, washes
//     it with the brand tint, runs the reveal ramp, and the bubbles refract it
//     (the "liquid glass" lens). Without one, the canvas is transparent and the
//     bubbles drift over whatever the page puts behind them.
//   • `density` — "hero" (denser, smaller: the main event) or "ambient"
//     (sparser, larger: sits behind text). Tuning only; the per-bubble drawing
//     is byte-identical either way.
//   • `still` — draw one frame and stop. The bubbles are drawn by exactly the
//     same code, they just don't drift. Used on Services, where the field sits
//     behind body text the reader is trying to read: the hero is the one place
//     the bubbles move.
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
  mag: number; // lens zoom factor — the "liquid glass" strength (backdrop only)
  hue: number; // starting angle (rad) of the iridescent sweep — unique per bubble
  squash: number; // vertical squash so bubbles read as spheres seen slightly off-axis
};

/** Per-page tuning. The bubbles look the same; there are just more/smaller ones
 *  in the hero and fewer/larger ambient ones behind page content. */
const DENSITY = {
  hero: { divisor: 26000, min: 10, max: 26, rMin: 16, rSpan: 46 },
  ambient: { divisor: 90000, min: 6, max: 16, rMin: 22, rSpan: 66 },
} as const;

type BubbleCanvasProps = {
  className?: string;
  /** Image to paint behind the bubbles and refract through them. Omit for a
   *  transparent canvas that sits over page content. */
  backdrop?: string;
  /** How many bubbles, and how large. Defaults to the ambient field. */
  density?: keyof typeof DENSITY;
  /** Draw a single still frame instead of animating. Same bubbles, no drift. */
  still?: boolean;
};

export function BubbleCanvas({
  className = "",
  backdrop,
  density = "ambient",
  still = false,
}: BubbleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The single global control: when animations are stopped, so is this canvas.
  const { off } = useMotion();

  // The loop lives in the effect closure below; it publishes its play/pause
  // handles here so the global flag can drive it without remounting.
  const controlsRef = useRef<{ play: () => void; pause: () => void } | null>(null);

  // Mirror `off` into a ref so the loop-owning effect (which must not re-run on
  // toggle) can read the current value inside its start/visibility handlers.
  // Seeded from the first render, then kept in step from an effect — writing a
  // ref during render is not allowed, and this effect is declared before the
  // loop's so it commits first on every update.
  const offRef = useRef(off);
  useEffect(() => {
    offRef.current = off;
  }, [off]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tune = DENSITY[density];

    // --- mutable animation state, kept in the effect closure ---
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let bubbles: Bubble[] = [];
    let bg: { s: number; dx: number; dy: number; dw: number; dh: number } | null = null;
    let raf = 0;
    let running = false;
    let imgReady = false;

    // --- reveal ramp (backdrop only) ---
    // The backdrop must not appear as-is: it fades from transparent to full over
    // REVEAL_MS once the image is ready, and the bubbles only start drawing part
    // way through, so the image reads first and they arrive on top of it. The
    // ramp lives here rather than in CSS because the canvas paints the image
    // and the bubbles into the same layer — a CSS opacity animation on the
    // element would reveal both together and couldn't stagger them.
    //
    // With no backdrop there is nothing to reveal, so the ramp starts finished
    // and the bubbles are visible from the first frame.
    const REVEAL_MS = 900;
    const BUBBLES_AT = 0.55; // fraction of the ramp elapsed before bubbles begin
    let revealStart = 0;
    let revealT = backdrop ? 0 : 1; // 0 → 1

    const img = new Image();

    /** Create one bubble with randomised size, speed, wobble and magnification. */
    function makeBubble(seedAnywhere: boolean): Bubble {
      const r = tune.rMin + Math.random() * tune.rSpan;
      return {
        x: Math.random() * w,
        y: seedAnywhere ? Math.random() * h : h + r + Math.random() * h * 0.5,
        r,
        speed: 0.15 + Math.random() * 0.48 + r * 0.007,
        phase: Math.random() * Math.PI * 2,
        drift: 0.28 + Math.random() * 0.92,
        wobble: 0.0045 + Math.random() * 0.0095,
        mag: 1.18 + Math.random() * 0.22,
        hue: Math.random() * Math.PI * 2,
        squash: 0.9 + Math.random() * 0.1,
      };
    }

    /** Cover-fit the backdrop to the canvas box. */
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
      const target = Math.max(
        tune.min,
        Math.min(tune.max, Math.round((w * h) / tune.divisor)),
      );
      bubbles = Array.from({ length: target }, () => makeBubble(true));
      if (!running) draw();
    }

    // --- the brand palette ---
    // Everything stays on the signature soft pink (#ffadae ≈ hsl(359,100%,84%)).
    // The hue is locked to a tiny warm band around pink — a hair toward magenta
    // at one end, never toward lilac, blue or any cool hue. So the film only
    // ever shimmers as soft pink, on every page. This lock is the single most
    // recognisable part of the animation: do not widen the band.
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

    /** Paint the backdrop (cover fit), or a blush fallback, then wash the brand
     * tint over it. Both are scaled by the reveal ramp, so the image fades up
     * instead of appearing fully formed. At revealT === 1 the alpha is a no-op
     * and the frame is identical to an unramped one.
     *
     * With no backdrop this does nothing at all: the canvas stays transparent
     * and the page's own background shows through between the bubbles. */
    function drawBackground() {
      if (!ctx || !backdrop) return;
      ctx.save();
      ctx.globalAlpha = revealT;
      if (imgReady && bg) ctx.drawImage(img, bg.dx, bg.dy, bg.dw, bg.dh);
      else {
        ctx.fillStyle = "#FCAEC2";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.restore();
      // Blush tint over the whole backdrop. `multiply` keeps the image's
      // shadows and detail while pulling everything toward the brand pink; drop
      // it to "source-over" for a flatter, more opaque wash. Ramped alongside
      // the image so the wash arrives with it rather than ahead of it.
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = revealT;
      ctx.fillStyle = "rgba(255,173,174,0.17)";
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    /**
     * Draw one glass bubble. THIS is the company pattern — every page runs this
     * exact function, so any change here changes the brand everywhere. Layers,
     * back to front:
     *   1. a soft blush cast shadow offset down-right (lifts it off the page)
     *   2. the liquid-glass lens: a magnified slice of the backdrop, if any
     *   3. a faint fill so the glass has body over any background
     *   4. spherical volume shading (bright top-left core → magenta seated rim)
     *   5. a soft-pink iridescent film band peaking just inside the rim (screen)
     *   6. a soft-pink conic rim sweep right on the outline (screen)
     *   7. a broad specular sheen + a tiny sharp catch-light (the sun on glass)
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

      // 2. liquid-glass lens: redraw the backdrop, magnified about the centre.
      // The magnification keeps the point under the bubble's centre fixed and
      // zooms everything around it, which reads as glass. Skipped entirely when
      // there is no backdrop — there is nothing to refract.
      if (imgReady && bg) {
        const m = b.mag;
        ctx.drawImage(
          img,
          b.x - (b.x - bg.dx) * m,
          b.y - (b.y - bg.dy) * m,
          bg.dw * m,
          bg.dh * m,
        );

        // brighter, more-magnified rim ring = stronger refraction at the edge
        ctx.save();
        ctx.globalAlpha = 0.55;
        const mr = m * 1.35;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.r, ry, 0, 0, Math.PI * 2);
        ctx.ellipse(b.x, b.y, b.r * 0.82, ry * 0.82, 0, 0, Math.PI * 2, true); // annulus
        ctx.clip("evenodd");
        ctx.drawImage(
          img,
          b.x - (b.x - bg.dx) * mr,
          b.y - (b.y - bg.dy) * mr,
          bg.dw * mr,
          bg.dh * mr,
        );
        ctx.restore();
      }

      // 3. faint glass body so the sphere exists over a transparent ground
      const body = ctx.createRadialGradient(
        b.x - b.r * 0.3,
        b.y - ry * 0.34,
        b.r * 0.05,
        b.x,
        b.y,
        b.r,
      );
      body.addColorStop(0.0, "rgba(255,255,255,0.12)");
      body.addColorStop(0.5, "rgba(255,220,224,0.03)"); // barely-there pink core
      body.addColorStop(1.0, "rgba(255,173,174,0.11)"); // soft blush #ffadae rim
      ctx.fillStyle = body;
      ctx.fillRect(b.x - b.r, b.y - ry, b.r * 2, ry * 2);

      // 4. spherical volume shading — bright offset core, warm seated rim
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

      // 5. iridescent soap film, concentrated near the rim (luminous → screen).
      // Soap-film interference makes the colours appear where the film is seen
      // at a glancing angle, i.e. toward the edge. `screen` keeps it luminous,
      // like light rather than paint. b.hue rotates the palette so bubbles
      // differ and slowly shift as they drift — always within the pink band.
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

      // 7a. broad specular sheen — the soft window of light on the top-left
      ctx.beginPath();
      ctx.ellipse(b.x - b.r * 0.36, b.y - ry * 0.42, b.r * 0.32, ry * 0.2, -0.6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fill();

      // 7b. tiny sharp catch-light
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.12, b.y - ry * 0.56, b.r * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.fill();

      ctx.restore();

      // 6. soft-pink conic rim sweep — drawn unclipped, right on the outline
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

    /** Draw every bubble in painter's order: largest (nearest) last, so near
     *  glass overlaps far glass. */
    function drawBubbles(alpha: number) {
      if (!ctx) return;
      const ordered = [...bubbles].sort((a, b) => a.r - b.r);
      if (alpha >= 1) {
        for (const b of ordered) drawBubble(b);
        return;
      }
      // save/restore is required, not cosmetic: drawBubble sets its own
      // globalAlpha for the rim ring, which would clobber a bare assignment
      // here. Wrapping lets the two alphas multiply, which is what a fade
      // should do.
      ctx.save();
      ctx.globalAlpha = alpha;
      for (const b of ordered) drawBubble(b);
      ctx.restore();
    }

    /** Render one static frame (background + bubbles) at the current ramp.
     * Deliberately does NOT force the ramp to its end: resize() calls this on
     * every start (before play()), so doing so here would skip the reveal
     * entirely. Settling the ramp is pause()'s job — that is the point which
     * actually means "this user is not getting an animation". */
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      drawBackground();
      drawBubbles(bubbleAlpha());
    }

    /** Bubbles fade in over the tail of the reveal ramp, once the backdrop has
     *  read. With no backdrop revealT is already 1, so this is always 1. */
    function bubbleAlpha() {
      return Math.max(0, Math.min(1, (revealT - BUBBLES_AT) / (1 - BUBBLES_AT)));
    }

    /** Advance positions, then render one animated frame. */
    function tick() {
      if (!ctx) return;

      // Ease-out ramp, matching the feel of the site's CSS transitions. The
      // revealStart check matters: the loop can be started by the global toggle
      // before the image has loaded, and measuring against 0 would make the
      // elapsed time enormous and snap the backdrop straight to full opacity.
      if (revealT < 1 && revealStart) {
        const raw = Math.min(1, (performance.now() - revealStart) / REVEAL_MS);
        revealT = 1 - Math.pow(1 - raw, 3);
      }

      for (const b of bubbles) {
        b.y -= b.speed;
        b.phase += b.wobble;
        b.x += Math.sin(b.phase) * b.drift;
        b.hue += 0.011; // rotate the film so it shimmers as the bubble rises
        if (b.y + b.r < 0) Object.assign(b, makeBubble(false)); // respawn below
      }

      ctx.clearRect(0, 0, w, h);
      drawBackground();
      drawBubbles(bubbleAlpha());

      raf = requestAnimationFrame(tick);
    }

    function play() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    }

    // No `if (!running) return` guard here: on a reduced-motion start, start()
    // calls pause() while running is already false, and that call is exactly
    // the one that has to settle the ramp — bailing early would leave those
    // users with a permanently transparent canvas.
    function pause() {
      running = false;
      cancelAnimationFrame(raf);
      // Stopping mid-reveal must not strand the canvas half-transparent: the
      // ramp is animation, and this is the path for users who are not getting
      // one (reduced motion, the global stop button, a hidden tab). Jump to the
      // finished picture. A tab hidden mid-fade therefore comes back to the
      // completed image rather than resuming a fade nobody watched.
      revealT = 1;
      draw(); // hold the current frame rather than leaving a half-cleared canvas
    }

    controlsRef.current = { play, pause };

    // Save battery: pause while the tab is hidden, resume if it was playing.
    // A tab hidden while globally stopped stays stopped, because `wasRunning`
    // is false. Coming back never overrides the global "off" flag.
    let wasRunning = false;
    function onVisibility() {
      if (document.hidden) {
        wasRunning = running;
        pause();
      } else if (wasRunning && !offRef.current && !still) {
        play();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize);

    // Start the animation (or hold a still frame). Called whether or not the
    // backdrop loads, so the bubbles always animate. Runs only when the user
    // has not globally stopped motion and does not prefer reduced motion.
    // A still canvas takes the same path as a stopped one: settle the reveal
    // ramp and hold one frame. `still` is a design decision rather than a user
    // preference, so unlike reduced motion it is never overridden by the global
    // resume button.
    function start() {
      resize();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (still || offRef.current || reduce) {
        pause();
        draw();
      } else {
        play();
      }
    }

    // Cleanup flag, read by the async image callbacks below.
    let cancelled = false;

    /** Begin the reveal and the loop. Idempotent — onload and the decode() fast
     * path can both reach here, and restarting the ramp would visibly rewind
     * the fade, hence the revealStart guard. */
    function onReady(loaded: boolean) {
      if (cancelled) return;
      if (loaded) imgReady = true;
      if (!revealStart) revealStart = performance.now();
      start();
    }

    if (backdrop) {
      // Load the backdrop, then start. On error we still start — bubbles just
      // drift over the blush fallback wash instead of the image.
      //
      // Assigning onload *after* src is deliberate and safe: the load task is
      // queued on the event loop even for a memory-cache hit, so it cannot fire
      // synchronously during the assignment.
      img.decoding = "async";
      img.onload = () => onReady(true);
      img.onerror = () => onReady(false);
      img.src = backdrop;

      // Fast path: a cached image can already be `complete` the moment src is
      // assigned. decode() then guarantees the bitmap is ready before the first
      // drawImage, keeping a decode stall out of the opening animation frame.
      if (img.complete && img.naturalWidth > 0) {
        img.decode().then(
          () => onReady(true),
          () => onReady(false),
        );
      }
    } else {
      // Nothing to load: the canvas is transparent, so start immediately.
      start();
    }

    // Cleanup on unmount / locale change: stop the loop and drop listeners.
    return () => {
      cancelled = true;
      pause();
      controlsRef.current = null;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      img.onload = null;
      img.onerror = null;
    };
  }, [backdrop, density, still]);

  // Apply the global flag whenever it flips. `play()`/`pause()` are no-ops when
  // already in the target state. Resuming is the user's explicit choice, so it
  // wins over reduced-motion (which only sets the initial state in `start()`).
  // A still canvas has no loop to resume, so the resume half is skipped for it —
  // otherwise pressing "resume animations" would start the Services field
  // drifting, which is the one thing `still` exists to prevent.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (off) controls.pause();
    else if (!still) controls.play();
  }, [off, still]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none h-full w-full ${className}`}
      aria-hidden="true"
      data-testid="bubble-canvas"
    />
  );
}
