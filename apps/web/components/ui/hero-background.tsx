"use client";

import { useEffect, useRef } from "react";

/**
 * Eluma Hero Background — grid pattern, floating orbs, and particles.
 * Renders purely decorative elements behind hero content.
 */
export function HeroBackground({ particleCount = 35 }: { particleCount?: number }) {
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;

    // Generate particles with random positions and timing
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement("div");
      p.className = "eluma-particle";
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.animationDelay = `${Math.random() * 6 + 1}s`;
      p.style.animationDuration = `${Math.random() * 4 + 3}s`;
      const size = Math.random() * 2 + 1;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      container.appendChild(p);
      particles.push(p);
    }

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, [particleCount]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Grid pattern with radial mask */}
      <div className="eluma-grid-masked" />

      {/* Floating orbs */}
      <div className="eluma-orb eluma-orb-1" />
      <div className="eluma-orb eluma-orb-2" />

      {/* Particles container */}
      <div ref={particlesRef} className="absolute inset-0 overflow-hidden" />
    </div>
  );
}
