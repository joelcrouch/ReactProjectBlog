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
  starColor = "#ffee4b", // Default yellow from Thor Ragnarok palette
  starCount = 150,
  speed = 0.5,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>(0);

  // Initialize stars
  const initializeStars = (width: number, height: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.5, // Star size between 0.5 and 3
        speed: (Math.random() * 0.5 + 0.1) * speed, // Star speed variability
        opacity: Math.random() * 0.8 + 0.2, // Star opacity between 0.2 and 1
      });
    }
    starsRef.current = stars;
  };

  // Animation function
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw stars
    starsRef.current.forEach((star) => {
      // Twinkle effect - slightly vary opacity
      star.opacity = Math.max(
        0.2,
        Math.min(1, star.opacity + (Math.random() - 0.5) * 0.05)
      );

      // Draw star
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `${starColor}${Math.floor(star.opacity * 255)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.fill();

      // Move star
      star.y += star.speed;

      // Reset star if it moves off screen
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    });

    // Occasionally add shooting stars
    if (Math.random() < 0.01) {
      createShootingStar(ctx, canvas.width, canvas.height, starColor);
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  // Create shooting star effect
  const createShootingStar = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    color: string
  ) => {
    const x = Math.random() * width;
    const y = Math.random() * (height / 3); // Start in top third
    const length = Math.random() * 80 + 40; // Trail length
    const angle = Math.PI / 4 + (Math.random() * Math.PI) / 4; // Angle between PI/4 and PI/2

    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;

    // Create gradient for shooting star
    const gradient = ctx.createLinearGradient(x, y, endX, endY);
    gradient.addColorStop(0, `${color}00`); // Transparent at start
    gradient.addColorStop(0.4, `${color}cc`); // Semi-transparent in middle
    gradient.addColorStop(1, `${color}00`); // Transparent at end

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Initialize and handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions to match container
    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        initializeStars(canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
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
