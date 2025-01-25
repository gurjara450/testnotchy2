"use client";

import { cn } from "@/lib/utils";

type TColorProp = string | string[];

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: TColorProp;
  className?: string;
  children: React.ReactNode;
}

/**
 * @name Shine Border
 * @description It is an animated background border effect component with easy to use and configurable props.
 * @param borderRadius defines the radius of the border.
 * @param borderWidth defines the width of the border.
 * @param duration defines the animation duration to be applied on the shining border.
 * @param color a string or string array to define border color.
 * @param className defines the class name to be applied to the component.
 * @param children contains react node elements.
 */
export default function ShineBorder({
  borderRadius = 8,
  borderWidth = 2,
  duration = 14,
  color = "#000000",
  className,
  children,
}: ShineBorderProps) {
  return (
    <div
      style={
        {
          "--border-radius": `${borderRadius}px`,
          "--border-width": `${borderWidth}px`,
        } as React.CSSProperties
      }
      className={cn(
        "relative rounded-[--border-radius] isolate",
        className
      )}
    >
      <div
        style={
          {
            "--duration": `${duration}s`,
            "--mask-linear-gradient": `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            "--background-radial-gradient": `radial-gradient(transparent, transparent, ${
              Array.isArray(color) ? color.join(",") : color
            }, transparent, transparent)`,
          } as React.CSSProperties
        }
        className={cn(
          "absolute inset-0 rounded-[--border-radius] p-[--border-width] pointer-events-none",
          "before:absolute before:inset-0 before:rounded-[--border-radius]",
          "before:[background-image:var(--background-radial-gradient)] before:[background-size:300%_300%]",
          "before:[mask:var(--mask-linear-gradient)] before:animate-shine"
        )}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}