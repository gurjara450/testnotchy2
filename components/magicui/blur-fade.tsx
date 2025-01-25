"use client";

import { useRef } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  UseInViewOptions,
  Variants,
} from "framer-motion";

type MarginType = UseInViewOptions["margin"];

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  inView?: boolean;
  inViewMargin?: MarginType;
  blur?: string;
}

export default function BlurFade({
  children,
  className,
  duration = 0.4,
  delay = 0,
  inView = false,
  inViewMargin = "-50px",
  blur = "6px",
}: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const isInView = !inView || inViewResult;

  const variants: Variants = {
    hidden: { 
      opacity: 0,
      filter: `blur(${blur})`,
      transform: 'translate3d(0,0,0)' // Force GPU acceleration
    },
    visible: { 
      opacity: 1,
      filter: `blur(0px)`,
      transform: 'translate3d(0,0,0)'
    },
  };

  return (
    <div style={{ position: 'relative' }}> {/* Stable wrapper */}
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          exit="hidden"
          variants={variants}
          transition={{
            delay: 0.04 + delay,
            duration,
            ease: "easeOut",
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
          className={className}
        >
          {children}
        </motion.div>
      </AnimatePresence>
      {/* Clone without animation to maintain size */}
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
