"use client";

import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
  width?: "fit-content" | "100%";
}

export const ScrollReveal = ({
  children,
  delay = 0,
  direction = "up",
  className,
  width = "100%",
  ...props
}: ScrollRevealProps) => {
  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
    none: { x: 0, y: 0 },
  };

  return (
    <div style={{ width }} className="overflow-hidden">
      <motion.div
        variants={{
          hidden: {
            opacity: 0,
            ...directions[direction],
          },
          visible: {
            opacity: 1,
            x: 0,
            y: 0,
          },
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        transition={{
          duration: 0.8,
          delay: delay,
          type: "spring",
          bounce: 0.3,
        }}
        className={cn("w-full", className)}
        {...props}
      >
        {children}
      </motion.div>
    </div>
  );
};
