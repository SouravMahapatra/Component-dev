import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useAnimationControls, useMotionValue } from "framer-motion";
import { Plus } from "lucide-react";

const dockSpring = { type: "spring", stiffness: 420, damping: 26, mass: 0.9 };
// Softer springs for the open/close flow so it glides rather than jolts
const widthSpring = { type: "spring", stiffness: 300, damping: 30, mass: 0.9 };
// Blur can't overshoot below 0, so it eases instead of springing
const itemSpring = { type: "spring", stiffness: 380, damping: 30, filter: { duration: 0.25 } };
// The blob is two pills on different springs inside a goo filter —
// the fast one leads, the slow one trails, and they melt together in between
const leadSpring = { type: "spring", stiffness: 650, damping: 38 };
const trailSpring = { type: "spring", stiffness: 210, damping: 20 };
const blurSwap = {
  initial: { opacity: 0, y: 6, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -6, filter: "blur(6px)" },
  transition: { duration: 0.25 },
};

function GooFilter() {
  return (
    <svg className="absolute h-0 w-0" aria-hidden>
      <defs>
        <filter id="dock-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
      </defs>
    </svg>
  );
}

function LiquidHighlight({ target }) {
  const lead = { x: useMotionValue(0), w: useMotionValue(0) };
  const trail = { x: useMotionValue(0), w: useMotionValue(0) };
  const placed = useRef(false);

  useLayoutEffect(() => {
    if (!target) return;
    if (!placed.current) {
      // First selection: appear in place, no travel
      [lead, trail].forEach((p) => {
        p.x.jump(target.x);
        p.w.jump(target.w);
      });
      placed.current = true;
      return;
    }
    animate(lead.x, target.x, leadSpring);
    animate(lead.w, target.w, leadSpring);
    animate(trail.x, target.x, trailSpring);
    animate(trail.w, target.w, trailSpring);
  }, [target?.x, target?.w]);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      style={{ filter: "url(#dock-goo)" }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={dockSpring}
    >
      {[lead, trail].map((p, i) => (
        <motion.span
          key={i}
          className="absolute inset-y-0 rounded-[18px] bg-brand-100"
          style={{ x: p.x, width: p.w }}
        />
      ))}
    </motion.div>
  );
}

export default function ActionDock({ options = ["Design", "Build", "Ship"], defaultOpen = true, onSelect }) {
  const [open, setOpen] = useState(defaultOpen);
  const [selected, setSelected] = useState(null);
  const [target, setTarget] = useState(null);
  const itemRefs = useRef({});
  const squash = useAnimationControls();

  const toggle = () => {
    setOpen((o) => !o);
    // Squash-and-stretch on every toggle, like a drop of liquid
    squash.start({
      scaleY: [1, 0.95, 1.02, 1],
      scaleX: [1, 1.03, 0.995, 1],
      transition: { duration: 0.55, ease: "easeOut" },
    });
  };

  const select = (option) => {
    const el = itemRefs.current[option];
    setTarget({ x: el.offsetLeft, w: el.offsetWidth });
    setSelected(option);
    onSelect?.(option);
  };

  const caption = !open ? "Click to expand" : selected ? `${selected} mode selected` : "Choose a mode";

  return (
    <div className="flex flex-col items-center gap-5">
      <GooFilter />

      <motion.div animate={squash}>
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1, borderRadius: open ? 30 : 34 }}
          transition={dockSpring}
          className="flex items-center overflow-hidden bg-white p-2 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.03)]"
        >
          <motion.button
            type="button"
            onClick={toggle}
            aria-label={open ? "Close dock" : "Open dock"}
            aria-expanded={open}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.88 }}
            transition={dockSpring}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] bg-brand-400 text-brand-900 shadow-[inset_0_0_0_1px_#9bd23f,inset_0_-2px_0_rgba(92,138,31,0.25)] outline-none focus-visible:ring-2 focus-visible:ring-brand-500/70 focus-visible:ring-offset-2"
          >
            <motion.span
              animate={{ rotate: open ? 135 : 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 18 }}
              className="flex"
            >
              <Plus size={22} strokeWidth={1.75} />
            </motion.span>
          </motion.button>

          {/* Options stay mounted; one width spring opens and closes them */}
          <motion.div
            initial={false}
            animate={open ? "show" : "hidden"}
            variants={{
              hidden: {
                width: 0,
                marginLeft: 0,
                transition: { ...widthSpring, staggerChildren: 0.025, staggerDirection: -1 },
              },
              show: {
                width: "auto",
                marginLeft: 4,
                transition: { ...widthSpring, staggerChildren: 0.05, delayChildren: 0.04 },
              },
            }}
            aria-hidden={!open}
            {...(!open && { inert: "" })}
            className="overflow-hidden"
          >
            <div className="relative flex w-max items-center">
              {/* Fades the moment the dock starts closing, not after the stagger */}
              <motion.div
                className="pointer-events-none absolute inset-0"
                initial={false}
                animate={{
                  opacity: open ? 1 : 0,
                  scale: open ? 1 : 0.85,
                  filter: open ? "blur(0px)" : "blur(4px)",
                }}
                transition={{ duration: open ? 0.3 : 0.15, ease: "easeOut" }}
              >
                {selected && <LiquidHighlight target={target} />}
              </motion.div>

              {options.map((option) => (
                <motion.button
                  key={option}
                  ref={(el) => (itemRefs.current[option] = el)}
                  type="button"
                  onClick={() => select(option)}
                  variants={{
                    hidden: { opacity: 0, x: -12, scale: 0.9, filter: "blur(6px)" },
                    show: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
                  }}
                  transition={itemSpring}
                  whileTap={{ scale: 0.94 }}
                  className={`relative h-[52px] rounded-[18px] px-5 text-[15px] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand-500/70 ${
                    selected === option
                      ? "font-semibold text-brand-900"
                      : "text-neutral-700 hover:text-neutral-950"
                  }`}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="h-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={caption} {...blurSwap} className="text-[15px] text-neutral-500">
            {caption}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
