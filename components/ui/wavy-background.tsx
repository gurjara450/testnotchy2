"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { createNoise3D } from "simplex-noise";

export interface WavyBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  backgroundFill?: string;
  lineColor?: string;
  waveWidth?: number;
  waveOpacity?: number;
  blur?: number;
  speed?: "slow" | "fast";
}

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  backgroundFill,
  lineColor = "white",
  waveWidth,
  waveOpacity,
  blur = 10,
  speed = "fast",
  ...props
}: WavyBackgroundProps) => {
  const noise = createNoise3D();
  let w = 0,
    h = 0,
    nt = 0,
    i = 0,
    x = 0;
  let ctx: CanvasRenderingContext2D | null = null,
    canvas: HTMLCanvasElement | null = null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getSpeed = () => {
    switch (speed) {
      case "slow":
        return 0.001;
      case "fast":
        return 0.002;
      default:
        return 0.001;
    }
  };

  const init = useCallback(() => {
    canvas = canvasRef.current;
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    if (!ctx) return;

    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    ctx.strokeStyle = lineColor;
    nt = 0;
    ctx.lineWidth = waveWidth || 50;
    
    if (backgroundFill) {
      ctx.fillStyle = backgroundFill;
      ctx.fillRect(0, 0, w, h);
    }
  }, [backgroundFill, lineColor, waveWidth]);

  const drawWave = (n: number) => {
    if (!ctx) return;
    nt += getSpeed();
    for (i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      for (x = 0; x < w; x += 5) {
        const y = noise(x / 800, 0.3 * i, nt) * 100;
        ctx.lineTo(x, h / 2 + y);
      }
      ctx.stroke();
    }
  };

  const render = useCallback(() => {
    if (!ctx) return;
    ctx.fillStyle = backgroundFill || "black";
    ctx.globalAlpha = waveOpacity || 0.5;
    ctx.fillRect(0, 0, w, h);
    drawWave(5);
    requestAnimationFrame(render);
  }, [backgroundFill, waveOpacity]);

  useEffect(() => {
    init();
    render();
    window.addEventListener("resize", init);

    return () => {
      window.removeEventListener("resize", init);
    };
  }, [init, render]);

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    // I'm sorry but i have got to support it on safari.
    setIsSafari(
      typeof window !== "undefined" &&
        navigator.userAgent.includes("Safari") &&
        !navigator.userAgent.includes("Chrome")
    );
  }, []);

  return (
    <div
      className={cn(
        "h-screen flex flex-col items-center justify-center",
        containerClassName
      )}
    >
      <canvas
        className="absolute inset-0 z-0"
        ref={canvasRef}
        id="canvas"
        style={{
          ...(isSafari ? { filter: `blur(${blur}px)` } : {}),
        }}
      ></canvas>
      <div className={cn("relative z-10", className)} {...props}>
        {children}
      </div>
    </div>
  );
};
