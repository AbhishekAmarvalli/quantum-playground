"use client";

import { useEffect } from "react";

/** Matrix rain background, ported from the Streamlit build. */
export default function MatrixRain() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = document.createElement("canvas");
    canvas.id = "matrix-rain";
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontSize = 16;
    let drops: number[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drops = Array.from(
        { length: Math.floor(canvas.width / fontSize) },
        () => Math.random() * (canvas.height / fontSize),
      );
    };
    resize();

    const chars = "01|0>|1>psiphi".split("");
    let timer = 0;

    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff41";
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      timer = window.setTimeout(draw, 50);
    };
    timer = window.setTimeout(draw, 50);

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.clearTimeout(timer);
      canvas.remove();
    };
  }, []);

  return null;
}
