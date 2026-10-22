import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import Slider from "./components/Slider.jsx";

const initial = { rotation: 0, theme: 1, weight: 400 };

export default function App() {
  const [values, setValues] = useState(initial);
  const set = (key) => (v) => setValues((s) => ({ ...s, [key]: v }));

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

          <div className="relative flex flex-col gap-6">
            <Slider
              label="Rotation"
              value={values.rotation}
              onChange={set("rotation")}
              min={-180}
              max={180}
              ticks={8}
              format={(v) => `${v}°`}
            />
            <Slider
              label="Theme"
              value={values.theme}
              onChange={set("theme")}
              options={["Dark", "Light", "System"]}
            />
            <Slider
              label="Font Weight"
              value={values.weight}
              onChange={set("weight")}
              min={100}
              max={900}
              step={100}
              ticks={8}
            />
          </div>

          <motion.button
            type="button"
            onClick={() => setValues(initial)}
            whileTap={{ scale: 0.95 }}
            className="group absolute bottom-5 left-5 flex items-center gap-2 text-[15px] text-neutral-600 hover:text-neutral-900"
          >
            <RotateCcw size={16} className="transition-transform duration-300 group-hover:-rotate-90" />
            Reset
          </motion.button>
        </div>
      </div>
    </main>
  );
}
