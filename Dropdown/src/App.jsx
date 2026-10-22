import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import Dropdown from "./components/Dropdown.jsx";

export default function App() {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl rounded-[28px] bg-neutral-100 p-2">
        <div className="relative flex h-[520px] items-center justify-center overflow-hidden rounded-[22px] border border-neutral-200 bg-neutral-50 px-4">
          {/* Subtle dot grid, fading out toward the edges */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(rgba(0,0,0,0.13) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
              maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%)",
            }}
          />
          {/* Fixed-height slot so the menu grows downward instead of re-centering */}
          <div className="-mt-32 h-[52px]">
            <Dropdown key={replayKey} />
          </div>

          <motion.button
            type="button"
            onClick={() => setReplayKey((k) => k + 1)}
            whileTap={{ scale: 0.95 }}
            className="group absolute bottom-5 left-5 flex items-center gap-2 text-[15px] text-neutral-600 hover:text-neutral-900"
          >
            <RotateCcw size={16} className="transition-transform duration-300 group-hover:-rotate-90" />
            Replay
          </motion.button>
        </div>
      </div>
    </main>
  );
}
