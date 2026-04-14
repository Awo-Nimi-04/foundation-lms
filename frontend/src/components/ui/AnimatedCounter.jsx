import { AnimatePresence, motion } from "framer-motion";

export default function AnimatedCounter({ value, className = "" }) {
  return (
    <div className={`relative inline-block w-6 h-5 overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute left-0 top-0"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}