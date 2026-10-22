import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  useAnimationControls,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { Sun } from "lucide-react";

const KNOB_W = 62;
const KNOB_H = 50;
// How far past either end the knob stretches while you over-drag (0–1)
const RUBBER_BAND = 0.18;
const pressSpring = { type: "spring", stiffness: 420, damping: 22 };

const shake = {
  x: [0, -4, 4, -3, 3, -1.5, 1.5, 0],
  rotate: [0, -14, 12, -9, 7, -4, 2, 0],
  transition: { duration: 0.5, ease: "easeOut" },
};

export default function BrightnessSlider({ value, onChange, width = 232 }) {
  const trackRef = useRef(null);
  const [trackW, setTrackW] = useState(width);
  const [pressed, setPressed] = useState(false);
  const dragging = useRef(false);
  const lastValue = useRef(value);
  const lowIcon = useAnimationControls();
  const highIcon = useAnimationControls();

  useLayoutEffect(() => {
    const measure = () => setTrackW(trackRef.current.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, []);

  // Knob centre travels between half-a-knob from each end, so it never covers the icons
  const inset = KNOB_W / 2;
  const travel = Math.max(1, trackW - KNOB_W);
  const pxFor = (v) => inset + (v / 100) * travel;

  const target = useMotionValue(pxFor(value));
  const knobX = useSpring(target, { stiffness: 600, damping: 38, mass: 0.6 });
  const fillW = useTransform(knobX, (x) => Math.max(0, Math.min(trackW, x)));

  // Jelly: stretch along the direction of travel, squash the other way,
  // then wobble back on a loose spring when movement stops
  const speed = useTransform(useVelocity(knobX), (v) => Math.min(Math.abs(v), 2400));
  const jellyX = useSpring(useTransform(speed, [0, 2400], [1, 1.28]), { stiffness: 320, damping: 11 });
  const jellyY = useSpring(useTransform(speed, [0, 2400], [1, 0.82]), { stiffness: 320, damping: 11 });

  useEffect(() => {
    if (!dragging.current) target.set(pxFor(value));
  }, [value, trackW]);

  // Rattle the icon whenever the value lands on an end
  useEffect(() => {
    if (value === lastValue.current) return;
    if (value === 0) lowIcon.start(shake);
    if (value === 100) highIcon.start(shake);
    lastValue.current = value;
  }, [value]);

  const updateFromPointer = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const next = Math.round(Math.min(1, Math.max(0, (x - inset) / travel)) * 100);
    onChange?.(next);

    const end = pxFor(100);
    if (x > end) target.set(end + (x - end) * RUBBER_BAND);
    else if (x < inset) target.set(inset - (inset - x) * RUBBER_BAND);
    else target.set(pxFor(next));
  };

  const release = () => {
    dragging.current = false;
    setPressed(false);
    target.set(pxFor(value));
  };

  const onKeyDown = (e) => {
    const delta = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[e.key];
    if (e.key === "Home") onChange?.(0);
    else if (e.key === "End") onChange?.(100);
    else if (delta) onChange?.(Math.min(100, Math.max(0, value + delta)));
    else return;
    e.preventDefault();
  };

  return (
    <div className="flex items-center gap-6">
      <motion.span animate={lowIcon} className="flex text-neutral-500">
        <Sun size={20} strokeWidth={2.5} fill="currentColor" />
      </motion.span>

      <div
        role="slider"
        tabIndex={0}
        aria-label="Brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Synthetic events have no capturable pointer
          }
          dragging.current = true;
          setPressed(true);
          updateFromPointer(e);
        }}
        onPointerMove={(e) => dragging.current && updateFromPointer(e)}
        onPointerUp={release}
        onPointerCancel={release}
        // Generous hit area around the thin track
        className="relative flex h-14 cursor-pointer touch-none select-none items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-4"
        style={{ width }}
      >
        <div ref={trackRef} className="relative h-4 w-full overflow-hidden rounded-full bg-neutral-200">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-400 to-brand-500"
            style={{ width: fillW }}
          />
        </div>

        {/* Knob: solid white at rest, a squishy glass lens while held */}
        <motion.div
          className="pointer-events-none absolute top-1/2"
          style={{ x: knobX, left: -KNOB_W / 2, y: "-50%" }}
        >
          <motion.div
            animate={{ scale: pressed ? 1.12 : 1 }}
            transition={pressSpring}
          >
            <motion.div
              style={{ scaleX: jellyX, scaleY: jellyY, width: KNOB_W, height: KNOB_H }}
              animate={{
                // Clear glass while held — only the rim and reflections remain
                backgroundColor: pressed ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,1)",
                borderColor: pressed ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0)",
                boxShadow: pressed
                  ? // Chromatic dispersion pooled along the bottom edge: lime, leaf and pale-green fringes
                    "inset 3px -3px 5px -1px rgba(155,210,63,0.55), inset -3px -3px 5px -1px rgba(124,179,42,0.45), inset 0 -4px 6px -1px rgba(217,240,166,0.4), inset 0 2px 3px rgba(255,255,255,0.9), 0 8px 22px -10px rgba(124,179,42,0.45)"
                  : "inset 0 0 0 rgba(155,210,63,0), inset 0 0 0 rgba(124,179,42,0), inset 0 0 0 rgba(217,240,166,0), inset 0 0 0 rgba(255,255,255,0), 0 10px 24px -6px rgba(0,0,0,0.22)",
              }}
              // Ease into glass, but snap straight back to solid on release — a spring here lingers
              transition={pressed ? { duration: 0.25, ease: "easeOut" } : { duration: 0.1, ease: "easeOut" }}
              className="relative overflow-hidden rounded-full border"
            >
              {/* Iridescent rim: a spinning conic gradient masked down to a thin ring,
                  then faded out above the middle so it only catches the bottom edge */}
              <span
                className="pointer-events-none absolute inset-0"
                style={{
                  WebkitMaskImage: "linear-gradient(to top, #000 0%, #000 30%, transparent 62%)",
                  maskImage: "linear-gradient(to top, #000 0%, #000 30%, transparent 62%)",
                }}
              >
              <motion.span
                className="pointer-events-none absolute -inset-px rounded-full p-[1.5px]"
                style={{
                  background:
                    "conic-gradient(from var(--rim-angle), #9bd23f, #d9f0a6, #7cb32a, #c4e97c, #9bd23f)",
                  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
                initial={{ "--rim-angle": "0deg" }}
                animate={{ opacity: pressed ? 0.9 : 0, "--rim-angle": pressed ? "360deg" : "0deg" }}
                transition={{
                  opacity: { duration: pressed ? 0.2 : 0.08 },
                  "--rim-angle": pressed ? { duration: 2.4, ease: "linear", repeat: Infinity } : { duration: 0 },
                }}
              />
              </span>
              {/* Reflections: a crisp specular streak on top, a soft green bounce below */}
              <motion.span
                className="pointer-events-none absolute left-2.5 right-5 top-[3px] h-2.5 rounded-full bg-gradient-to-b from-white to-white/0"
                animate={{ opacity: pressed ? 0.95 : 0 }}
                transition={{ duration: pressed ? 0.2 : 0.08 }}
              />
              <motion.span
                className="pointer-events-none absolute bottom-[3px] left-5 right-3 h-2 rounded-full bg-gradient-to-t from-brand-300/70 to-transparent blur-[1px]"
                animate={{ opacity: pressed ? 1 : 0 }}
                transition={{ duration: pressed ? 0.2 : 0.08 }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <motion.span animate={highIcon} className="flex text-neutral-500">
        <Sun size={32} strokeWidth={2.5} fill="currentColor" />
      </motion.span>
    </div>
  );
}
