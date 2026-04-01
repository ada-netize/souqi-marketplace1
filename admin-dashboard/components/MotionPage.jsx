"use client";

import { motion } from "framer-motion";

export default function MotionPage({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="grid"
    >
      {children}
    </motion.div>
  );
}
