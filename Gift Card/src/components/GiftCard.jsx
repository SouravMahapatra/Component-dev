import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { Check } from "lucide-react";

const spring = { type: "spring", stiffness: 300, damping: 30 };
const blurSwap = {
  initial: { opacity: 0, y: 8, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(6px)" },
  transition: { duration: 0.3 },
};

function Card({ holder, number, expiry, brand, activated }) {
  return (
    <div className="relative h-[170px] w-[270px] select-none overflow-hidden rounded-[18px] bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600 p-6 text-brand-900 shadow-[0_18px_40px_-14px_rgba(124,179,42,0.6)] ring-1 ring-inset ring-brand-600/30">
      {/* Gloss */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/0 to-transparent" />

      {/* Shine sweep once activated */}
      <AnimatePresence>
        {activated && (
          <motion.div
            className="pointer-events-none absolute inset-y-0 w-24 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            initial={{ x: -140 }}
            animate={{ x: 340 }}
            transition={{ duration: 0.9, ease: "easeInOut", delay: 0.15 }}
          />
        )}
      </AnimatePresence>

      <div className="relative flex items-start justify-between">
        <span className="h-5 w-5 rounded-full bg-white/80" />
        <span className="text-[22px] font-black italic tracking-tight">{brand}</span>
      </div>

      <div className="absolute inset-x-6 bottom-5 flex items-end justify-between font-mono">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-brand-900/60">{holder}</p>
          <p className="mt-1 text-[13px] tracking-wide">{number}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-brand-900/60">Exp.</p>
          <p className="mt-1 text-[13px] tracking-wide">{expiry}</p>
        </div>
      </div>
    </div>
  );
}

// Marching dotted outline around the card while it activates
function DottedRing({ done }) {
  return (
    <motion.svg
      // Card is 270×170; ring sits 9px outside it
      viewBox="0 0 288 188"
      className="pointer-events-none absolute -left-[9px] -top-[9px] h-[188px] w-[288px] overflow-visible text-brand-500"
      initial={{ opacity: 0, scale: 1.06 }}
      animate={{ opacity: done ? 0 : 1, scale: 1 }}
      transition={{ duration: 0.4, delay: done ? 0.2 : 0.25 }}
    >
      <motion.rect
        x="2"
        y="2"
        width="284"
        height="184"
        rx="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="0 10"
        animate={{ strokeDashoffset: [0, -20] }}
        transition={{ duration: 0.6, ease: "linear", repeat: Infinity }}
      />
    </motion.svg>
  );
}

// Fixed stage geometry so the card can glide between slots with transforms only
const CARD_H = 170;
const GAP = 24;
const TEXT_H = 56;
const ZONE_H = 190;
const TEXT_TOP = CARD_H + GAP;
const ZONE_TOP = TEXT_TOP + TEXT_H + GAP;
const CARD_IN_ZONE = ZONE_TOP + (ZONE_H - CARD_H) / 2;
const STAGE_H = ZONE_TOP + ZONE_H;
// Once the top slot is empty, lift the whole stage so it stays centered
const STAGE_LIFT = -(CARD_H + GAP) / 2;

export default function GiftCard({
  from = "Sourav",
  amount = "$100",
  holder = "Sourav Mahapatra",
  number = "5367 4567 8901 2345",
  expiry = "05/26",
  brand = "VISA",
  activationDelay = 2200,
  onActivated,
}) {
  // idle → activating → activated
  const [status, setStatus] = useState("idle");
  const [overZone, setOverZone] = useState(false);
  const zoneRef = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Tilt the card in the direction it's being flung
  const rotate = useSpring(useTransform(useVelocity(x), [-1200, 1200], [-6, 6]), {
    stiffness: 260,
    damping: 16, // low damping → the tilt wobbles back to level on release
  });

  useEffect(() => {
    if (status !== "activating") return;
    const t = setTimeout(() => {
      setStatus("activated");
      onActivated?.();
    }, activationDelay);
    return () => clearTimeout(t);
  }, [status, activationDelay, onActivated]);

  const isOverZone = (point) => {
    const r = zoneRef.current?.getBoundingClientRect();
    if (!r) return false;
    const px = point.x - window.scrollX;
    const py = point.y - window.scrollY;
    return px > r.left && px < r.right && py > r.top && py < r.bottom;
  };

  const settle = (toY) => {
    // Slightly under-damped so the card overshoots a touch and settles
    const glide = { type: "spring", stiffness: 320, damping: 20, mass: 0.9 };
    animate(x, 0, glide);
    animate(y, toY, glide);
  };

  const idle = status === "idle";

  return (
    <motion.div
      className="relative w-[300px] max-w-full"
      style={{ height: STAGE_H }}
      animate={{ y: idle ? 0 : STAGE_LIFT }}
      transition={{ type: "spring", stiffness: 200, damping: 30, delay: idle ? 0 : 0.1 }}
    >
      {/* Drop zone — fades away as the card settles into it */}
      <motion.div
        ref={zoneRef}
        animate={{
          scale: overZone ? 1.03 : 1,
          opacity: idle ? 1 : 0,
          backgroundColor: overZone ? "#f6fce9" : "#fcfcfc",
          borderColor: overZone ? "#c4e97c" : "#f0f0f0",
        }}
        transition={{ ...spring, opacity: { duration: 0.35 } }}
        style={{ top: ZONE_TOP, height: ZONE_H }}
        className="absolute left-[5px] flex w-[290px] items-center justify-center rounded-[28px] border-[6px]"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={overZone ? "release" : "drag"}
            {...blurSwap}
            transition={{ duration: 0.2 }}
            className={`text-[17px] ${overZone ? "font-medium text-brand-700" : "shimmer-text"}`}
          >
            {overZone ? "release to activate" : "drag to activate it"}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      {/* Message — sits between the two slots, so it ends up right above the card */}
      <div
        className="absolute inset-x-0 flex items-center justify-center text-center text-[17px] leading-relaxed"
        style={{ top: TEXT_TOP, height: TEXT_H }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {status === "idle" && (
            <motion.p key="idle" {...blurSwap}>
              You&apos;ve been gifted a giftcard from {from}.
            </motion.p>
          )}
          {status === "activating" && (
            <motion.p key="activating" {...blurSwap}>
              You are <span className="text-brand-700">activating</span> a {amount} digital giftcard.
            </motion.p>
          )}
          {status === "activated" && (
            <motion.p key="activated" {...blurSwap} className="flex items-center justify-center gap-2">
              Your {amount} giftcard is <span className="text-brand-700">active</span>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.2 }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-400 text-brand-900"
              >
                <Check size={13} strokeWidth={3} />
              </motion.span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* One card for the whole flow — dragged, then glided into the zone */}
      <motion.div
        drag={idle}
        dragMomentum={false}
        dragElastic={0.6}
        onDrag={(_, info) => setOverZone(isOverZone(info.point))}
        onDragEnd={(_, info) => {
          setOverZone(false);
          if (isOverZone(info.point)) {
            setStatus("activating");
            settle(CARD_IN_ZONE);
          } else {
            settle(0);
          }
        }}
        whileHover={idle ? { scale: 1.02 } : undefined}
        whileDrag={{ scale: 1.06, cursor: "grabbing" }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        // Bouncy scale-back when the card is let go
        transition={{ type: "spring", stiffness: 420, damping: 16 }}
        style={{ x, y, rotate, zIndex: 20 }}
        className={`absolute left-1/2 top-0 -ml-[135px] touch-none ${idle ? "cursor-grab" : ""}`}
      >
        <AnimatePresence>{!idle && <DottedRing done={status === "activated"} />}</AnimatePresence>
        <Card holder={holder} number={number} expiry={expiry} brand={brand} activated={status === "activated"} />
      </motion.div>
    </motion.div>
  );
}
