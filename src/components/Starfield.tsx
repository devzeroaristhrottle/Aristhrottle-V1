"use client";

import React, { useEffect } from "react";

interface Props {
  speedFactor?: number;
  starColor?: [number, number, number];
  starCount?: number;
  gradientTopColor?: string;
  gradientMidColor?: string;
  gradientBottomColor?: string;
}

export default function Starfield(props: Props) {
  const {
    speedFactor = 0.05,
    starColor = [255, 255, 255],
    starCount = 5000,
    gradientTopColor = "#0d0d1a",
    gradientMidColor = "#220044",
    gradientBottomColor = "#000000",
  } = props;

  useEffect(() => {
    const canvas = document.getElementById("starfield") as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const setCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    setCanvasSize();
    window.onresize = setCanvasSize;

    const makeStars = (count: number) => {
      const stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * 1600 - 800,
          y: Math.random() * 900 - 450,
          z: Math.random() * 1000,
        });
      }
      return stars;
    };

    const stars = makeStars(starCount);

    const clear = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, gradientTopColor);
      gradient.addColorStop(0.5, gradientMidColor);
      gradient.addColorStop(1, gradientBottomColor);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const putPixel = (x: number, y: number, brightness: number) => {
      ctx.fillStyle = `rgba(${starColor[0]}, ${starColor[1]}, ${starColor[2]}, ${brightness})`;
      ctx.fillRect(x, y, 1, 1);
    };

    const moveStars = (distance: number) => {
      for (const s of stars) {
        s.z -= distance;
        if (s.z <= 1) s.z += 1000;
      }
    };

    let prevTime: number;

    const tick = (time: number) => {
      const elapsed = time - prevTime;
      prevTime = time;

      moveStars(elapsed * speedFactor);
      clear();

      const cx = width / 2;
      const cy = height / 2;

      for (const s of stars) {
        const x = cx + s.x / (s.z * 0.001);
        const y = cy + s.y / (s.z * 0.001);
        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const d = s.z / 1000.0;
        const b = 1 - d * d;
        putPixel(x, y, b);
      }

      requestAnimationFrame(tick);
    };

    const init = (time: number) => {
      prevTime = time;
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(init);

    return () => {
      window.onresize = null;
    };
  }, [
    starColor,
    gradientTopColor,
    gradientMidColor,
    gradientBottomColor,
    speedFactor,
    starCount,
  ]);

  return (
    <canvas
      id="starfield"
      style={{
        padding: 0,
        margin: 0,
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 0,
        opacity: 1,
        pointerEvents: "none",
        mixBlendMode: "screen",
        height: "100%",
      }}
    />
  );
}
