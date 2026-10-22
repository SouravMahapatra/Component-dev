import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const fillSpring = { stiffness: 520, damping: 26, mass: 0.7 };
const pressSpring = { type: "spring", stiffness: 500, damping: 22 };
// How far past either end the fill stretches while you over-drag (0–1)
const RUBBER_BAND = 0.14;
const HANDLE_INSET = 14;

// Step marker that ducks out of the way when the handle passes over it
function Dot({ x, fill }) {
  const opacity = useTransform(fill, (f) => (Math.abs(f - HANDLE_INSET - x) < 16 ? 0 : 1));
  const scale = useTransform(opacity, [0, 1], [0.4, 1]);
  return (
    <motion.span
      className="pointer-events-none absolute top-1/2 h-[5px] w-[5px] rounded-full bg-neutral-300"
      style={{ left: x, x: "-50%", y: "-50%", opacity, scale }}
    />
  );
}

export default function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  options, // pass an array of strings for a discrete slider
  ticks = 0, // number of evenly spaced dots between min and max
  format = (v) => v,
}) {
  if (options) {
    min = 0;
    max = options.length - 1;
    step = 1;
    format = (i) => options[i];
  }

  const trackRef = useRef(null);
  const labelRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [labelWidth, setLabelWidth] = useState(0);
  const [pressed, setPressed] = useState(false);
  // Ref mirror so pointermove sees the press immediately, before re-render
  const dragging = useRef(false);

  useLayoutEffect(() => {
    const measure = () => {
      setWidth(trackRef.current.offsetWidth);
      setLabelWidth(labelRef.current.offsetWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, []);

  // The fill never shrinks past the label + handle
  const minFill = labelWidth + 20 + 36;
  const pxFor = (v) => minFill + ((v - min) / (max - min)) * (width - minFill);

  const target = useMotionValue(0);
  const fill = useSpring(target, fillSpring);
  const handleX = useTransform(fill, (f) => f - HANDLE_INSET);

  useEffect(() => {
    if (!width) return;
    // Jump into place on first measure, spring on every change after
    if (target.get() === 0) fill.jump(pxFor(value));
    if (!pressed) target.set(pxFor(value));
  }, [value, width, labelWidth, pressed]);

  const updateFromPointer = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frac = Math.min(1, Math.max(0, (x - minFill) / (width - minFill)));
    const next = Math.round((min + frac * (max - min)) / step) * step;
    onChange?.(Number(next.toFixed(6)));

    // Snap to the stepped position, but rubber-band past the ends
    if (x > width) target.set(width + (x - width) * RUBBER_BAND);
    else if (x < minFill) target.set(minFill - (minFill - x) * RUBBER_BAND);
    else target.set(pxFor(next));
  };

  const release = () => {
    dragging.current = false;
    setPressed(false);
  };

  const onKeyDown = (e) => {
    const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (e.key === "Home") onChange?.(min);
    else if (e.key === "End") onChange?.(max);
    else if (dir) onChange?.(Math.min(max, Math.max(min, value + dir * step)));
    else return;
    e.preventDefault();
  };

  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => min + (i * (max - min)) / ticks).slice(
    1,
    -1
  );

  return (
    <motion.div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={String(format(value))}
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
      animate={{ scale: pressed ? 0.985 : 1 }}
      transition={pressSpring}
      className="relative h-12 w-96 max-w-full cursor-ew-resize touch-none select-none rounded-[10px] bg-neutral-100/80 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
    >
      {/* Fill */}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-[10px] border bg-white"
        style={{ width: fill }}
        animate={{
          borderColor: pressed ? "#c4e97c" : "#e5e5e5",
          boxShadow: pressed ? "0 4px 14px -6px rgba(124,179,42,0.3)" : "0 1px 2px rgba(0,0,0,0.03)",
        }}
        transition={pressSpring}
      />

      {/* Dots, skipping any that would sit under the value readout */}
      {width > 0 &&
        tickValues.map((v) =>
          pxFor(v) > minFill - 8 && pxFor(v) < width - 64 ? <Dot key={v} x={pxFor(v)} fill={fill} /> : null
        )}

      <span
        ref={labelRef}
        className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap text-[15px] text-neutral-500"
      >
        {label}
      </span>

      {/* Handle */}
      <motion.span
        className="pointer-events-none absolute top-1/2 w-[2px] rounded-full"
        style={{ left: handleX, y: "-50%" }}
        animate={{
          height: pressed ? 22 : 14,
          backgroundColor: pressed ? "#7cb32a" : "#d4d4d4",
        }}
        transition={pressSpring}
      />

      <motion.span
        className="pointer-events-none absolute right-5 top-1/2 font-mono text-[15px] tabular-nums text-neutral-900"
        style={{ y: "-50%", originX: 1 }}
        animate={{ scale: pressed ? 1.06 : 1 }}
        transition={pressSpring}
      >
        {format(value)}
      </motion.span>
    </motion.div>
  );
}
