"use client";

import React, { useEffect, useRef } from "react";

interface StarfieldProps {
  starColor?: string;
  starCount?: number;
  speed?: number;
  className?: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

const StarfieldBackground: React.FC<StarfieldProps> = ({
  starColor = "#ffee4b",
  starCount = 150,
  speed = 0.5,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>(0);

  // Create shooting star effect
  const createShootingStar = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    color: string
  ) => {
    const x = Math.random() * width;
    const y = Math.random() * (height / 3);
    const length = Math.random() * 80 + 40;
    const angle = Math.PI / 4 + (Math.random() * Math.PI) / 4;

    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;

    const gradient = ctx.createLinearGradient(x, y, endX, endY);
    gradient.addColorStop(0, `${color}00`);
    gradient.addColorStop(0.4, `${color}cc`);
    gradient.addColorStop(1, `${color}00`);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initializeStars = (width: number, height: number) => {
      const stars: Star[] = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2.5 + 0.5,
          speed: (Math.random() * 0.5 + 0.1) * speed,
          opacity: Math.random() * 0.8 + 0.2,
        });
      }
      starsRef.current = stars;
    };

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      starsRef.current.forEach((star) => {
        star.opacity = Math.max(
          0.2,
          Math.min(1, star.opacity + (Math.random() - 0.5) * 0.05)
        );

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `${starColor}${Math.floor(star.opacity * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.fill();

        star.y += star.speed;

        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      });

      if (Math.random() < 0.01) {
        createShootingStar(ctx, canvas.width, canvas.height, starColor);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        initializeStars(canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [starColor, starCount, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 z-0 ${className}`}
      style={{ pointerEvents: "none" }}
    />
  );
};

export default StarfieldBackground;
