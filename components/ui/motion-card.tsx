"use client";

import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import React from "react";

interface MotionCardProps extends HTMLMotionProps<"div"> {
  className?: string;
  delay?: number;
  interactive?: boolean;
}

const springConfig = { type: "spring" as const, stiffness: 300, damping: 20 };

export function MotionCard({
  className,
  children,
  delay = 0,
  interactive = false,
  ...props
}: MotionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springConfig, delay }}
      whileHover={
        interactive
          ? {
              y: -4,
              scale: 1.01,
              transition: { type: "spring", stiffness: 400, damping: 25 },
            }
          : undefined
      }
      whileTap={
        interactive
          ? {
              scale: 0.98,
              transition: { type: "spring", stiffness: 400, damping: 25 },
            }
          : undefined
      }
      className={cn(
        "tarjeta overflow-hidden border border-border/50 bg-card/80 backdrop-blur-xl shadow-sutil transition-colors",
        interactive && "cursor-pointer hover:border-accent/40 hover:shadow-media",
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
