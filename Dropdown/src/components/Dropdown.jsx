import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Check, ChevronDown, FileText, Home, LayoutDashboard, Settings } from "lucide-react";

const spring = { type: "spring", stiffness: 380, damping: 32 };

const defaultOptions = [
  { label: "Overview", icon: Home },
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Analytics", icon: BarChart3 },
  { label: "Reports", icon: FileText },
  { label: "Settings", icon: Settings },
];

export default function Dropdown({
  options = defaultOptions,
  defaultValue = options[0].label,
  onChange,
  width = 230,
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const openMenu = () => {
    setHighlighted(options.findIndex((o) => o.label === value));
    setOpen(true);
  };

  const select = (option) => {
    setValue(option);
    onChange?.(option);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlighted >= 0) select(options[highlighted].label);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    }
  };

  const current = options.find((o) => o.label === value) ?? options[0];
  const CurrentIcon = current.icon;

  return (
    <motion.div
      ref={rootRef}
      onKeyDown={onKeyDown}
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        boxShadow: open
          ? "0 0 0 1px rgba(0,0,0,0.04), 0 18px 40px -12px rgba(0,0,0,0.18)"
          : "0 0 0 1px rgba(0,0,0,0.03), 0 6px 20px -10px rgba(0,0,0,0.12)",
      }}
      transition={{ ...spring, opacity: { duration: 0.25 } }}
      style={{ width }}
      className="relative max-w-full overflow-hidden rounded-[22px] bg-white"
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-[52px] w-full items-center justify-between rounded-[22px] px-5 text-[15px] font-medium text-neutral-900 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-blue-500/70"
      >
        <span className="relative h-5 flex-1 overflow-hidden text-left">
          {/* Label slides when the value changes */}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value}
              className="absolute inset-0"
              initial={{ y: 14, opacity: 0, filter: "blur(3px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -14, opacity: 0, filter: "blur(3px)" }}
              transition={spring}
            >
              <span className="flex items-center gap-2.5">
                <CurrentIcon size={17} strokeWidth={2} className="text-neutral-500" />
                {value}
              </span>
            </motion.span>
          </AnimatePresence>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={spring} className="flex">
          <ChevronDown size={18} strokeWidth={2.25} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="menu"
            initial={{ height: 0, opacity: 0, filter: "blur(8px)" }}
            animate={{ height: "auto", opacity: 1, filter: "blur(0px)" }}
            // Collapse waits a beat so the items can blur out first
            exit={{
              height: 0,
              opacity: 0,
              filter: "blur(8px)",
              transition: { ...spring, delay: 0.08, opacity: { duration: 0.2, delay: 0.08 } },
            }}
            transition={{ ...spring, opacity: { duration: 0.2 }, filter: { duration: 0.3 } }}
            className="px-5"
          >
            <motion.ul
              role="listbox"
              className="pb-3 pt-2"
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{
                hidden: { transition: { staggerChildren: 0.025, staggerDirection: -1 } },
                show: { transition: { staggerChildren: 0.045, delayChildren: 0.06 } },
              }}
            >
              {options.map(({ label, icon: Icon }, i) => {
                const selected = label === value;
                return (
                  <motion.li
                    key={label}
                    role="option"
                    aria-selected={selected}
                    variants={{
                      hidden: { opacity: 0, y: -10, scale: 0.96, filter: "blur(6px)" },
                      show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
                    }}
                    transition={spring}
                    onClick={() => select(label)}
                    onMouseEnter={() => setHighlighted(i)}
                    className="relative cursor-pointer"
                  >
                    {/* Shared hover pill that glides between rows */}
                    {highlighted === i && (
                      <motion.span
                        layoutId="dropdown-highlight"
                        className="absolute inset-x-[-10px] inset-y-0.5 rounded-xl bg-neutral-100"
                        transition={spring}
                      />
                    )}
                    <motion.span
                      animate={{ x: highlighted === i ? 4 : 0 }}
                      transition={spring}
                      className={`relative flex h-[42px] items-center justify-between text-[15px] ${
                        selected ? "font-medium text-blue-600" : "text-neutral-800"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon
                          size={17}
                          strokeWidth={2}
                          className={selected ? "text-blue-600" : "text-neutral-400"}
                        />
                        {label}
                      </span>
                      <AnimatePresence>
                        {selected && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={spring}
                            className="mr-1 flex"
                          >
                            <Check size={16} strokeWidth={2.5} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.span>
                  </motion.li>
                );
              })}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
