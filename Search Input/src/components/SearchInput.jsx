import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";

const spring = { type: "spring", stiffness: 380, damping: 30 };

export default function SearchInput({
  placeholder = "Search components",
  onSearch,
  collapsedWidth = 256,
  expandedWidth = 340,
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  // ⌘K / Ctrl+K focuses the field
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const update = (next) => {
    setValue(next);
    onSearch?.(next);
  };

  const clear = () => {
    update("");
    inputRef.current?.focus();
  };

  const active = focused || value.length > 0;

  return (
    <motion.div
      // Entrance: grows out of a circle into the full pill
      initial={{ width: 52, opacity: 0, scale: 0.9, y: 8 }}
      animate={{
        width: active ? expandedWidth : collapsedWidth,
        opacity: 1,
        scale: 1,
        y: 0,
        // Same shadow count in every state so Framer can interpolate:
        // crisp border, soft halo ring (focus only), drop shadow
        boxShadow: focused
          ? "0 0 0 1px rgba(59,130,246,0.9), 0 0 0 5px rgba(59,130,246,0.18), 0 10px 30px -8px rgba(59,130,246,0.25)"
          : active
            ? "0 0 0 1px rgba(0,0,0,0.06), 0 0 0 0px rgba(23,23,23,0), 0 10px 30px -8px rgba(0,0,0,0.14)"
            : "0 0 0 1px rgba(0,0,0,0.03), 0 0 0 0px rgba(23,23,23,0), 0 6px 20px -10px rgba(0,0,0,0.10)",
      }}
      transition={{ ...spring, opacity: { duration: 0.25 } }}
      onClick={() => inputRef.current?.focus()}
      className="relative flex h-[52px] max-w-full cursor-text items-center overflow-hidden rounded-full bg-white"
    >
      <motion.span
        className="pointer-events-none absolute left-4 flex text-neutral-900"
        initial={{ rotate: -90, scale: 0.6 }}
        animate={{ rotate: focused ? -12 : 0, scale: focused ? 1.08 : 1 }}
        transition={spring}
      >
        <Search size={20} strokeWidth={2.25} />
      </motion.span>

      <input
        ref={inputRef}
        value={value}
        onChange={(e) => update(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            value ? update("") : inputRef.current?.blur();
          }
        }}
        aria-label={placeholder}
        className="peer h-full w-full bg-transparent pl-12 pr-11 text-[15px] text-neutral-900 outline-none"
      />

      {/* Animated placeholder: letters stagger in on mount, fade out when typing */}
      <AnimatePresence>
        {!value && (
          <motion.span
            className="pointer-events-none absolute left-12 whitespace-nowrap text-[15px] text-neutral-500"
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, x: 6, transition: { duration: 0.12 } }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.018, delayChildren: 0.25 } },
            }}
          >
            {placeholder.split("").map((char, i) => (
              <motion.span
                key={i}
                className="inline-block"
                variants={{
                  hidden: { opacity: 0, y: 4, filter: "blur(4px)" },
                  show: { opacity: 1, y: 0, filter: "blur(0px)" },
                }}
              >
                {char === " " ? " " : char}
              </motion.span>
            ))}
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {value && (
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
            aria-label="Clear search"
            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
            transition={spring}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
          >
            <X size={14} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
