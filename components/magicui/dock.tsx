"use client";

import React, { useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DockProps extends VariantProps<typeof dockVariants> {
  className?: string;
  magnification?: number;
  distance?: number;
  direction?: "top" | "middle" | "bottom";
  children: React.ReactNode;
}

const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

export const dockVariants = cva(
  "supports-backdrop-blur:bg-white/10 supports-backdrop-blur:dark:bg-black/10 mx-auto mt-8 flex h-[58px] w-max gap-2 rounded-2xl border p-2 backdrop-blur-md",
);

export interface DockIconProps {
  magnification?: number;
  distance?: number;
  mouseX?: MotionValue<number>;
  className?: string;
  children?: React.ReactNode;
}

function useMousePosition() {
  return useMotionValue(0);
}

export const DockIcon = ({
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  mouseX = useMousePosition(),
  className,
  children,
}: DockIconProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const distanceFromMouse = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const scale = useSpring(
    useTransform(distanceFromMouse, [-distance, 0, distance], [1, magnification / 30, 1]),
    {
      mass: 0.1,
      stiffness: 150,
      damping: 12,
    }
  );

  return (
    <motion.div
      ref={ref}
      style={{ scale }}
      className={cn("aspect-square rounded-full", className)}
    >
      {children}
    </motion.div>
  );
}; 