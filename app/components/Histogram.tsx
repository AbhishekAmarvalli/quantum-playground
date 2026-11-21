"use client";

import { useId } from "react";
import { type Counts, sortedCounts } from "@/lib/quantum";

type Props = { counts: Counts; height?: number; label?: string };

/** Neon probability histogram, same look as the matplotlib version. */
export default function Histogram({ counts, height = 300, label = "Result histogram" }: Props) {
  const rawId = useId();
  const gid = `glow${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const items = sortedCounts(counts);
  if (items.length === 0) return null;

  const total = items.reduce((acc, it) => acc + it.count, 0) || 1;
  const W = 640;
  const H = height;
  const padL = 52;
  const padR = 14;
  const padT = 22;
  const padB = 42;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const slot = plotW / items.length;
  const barW = Math.min(66, slot * 0.62);
  const y = (p: number) => padT + plotH * (1 - p);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id={gid} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x={0} y={0} width={W} height={H} fill="#000000" />

      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(t)}
            y2={y(t)}
            stroke="rgba(0,255,65,0.18)"
            strokeDasharray="2 4"
          />
          <text x={padL - 8} y={y(t) + 4} fill="#00b32d" fontSize="10" textAnchor="end">
            {Math.round(t * 100)}%
          </text>
        </g>
      ))}

      <text
        x={14}
        y={padT + plotH / 2}
        fill="#00ff41"
        fontSize="10"
        textAnchor="middle"
        transform={`rotate(-90 14 ${padT + plotH / 2})`}
      >
        probability
      </text>

      {items.map((it, i) => {
        const p = it.count / total;
        const bx = padL + slot * i + (slot - barW) / 2;
        const by = y(p);
        return (
          <g key={it.key}>
            <rect
              x={bx}
              y={by}
              width={barW}
              height={Math.max(1, padT + plotH - by)}
              fill="#00ff41"
              stroke="#9dffb5"
              strokeWidth="1.2"
              filter={`url(#${gid})`}
            />
            <text
              x={bx + barW / 2}
              y={Math.max(padT + 10, by - 6)}
              fill="#9dffb5"
              fontSize="10"
              textAnchor="middle"
            >
              {Math.round(p * 100)}%
            </text>
            <text
              x={bx + barW / 2}
              y={H - padB + 20}
              fill="#b6ffc8"
              fontSize="12"
              textAnchor="middle"
            >
              {it.key}
            </text>
          </g>
        );
      })}

      <line x1={padL} x2={W - padR} y1={padT + plotH} y2={padT + plotH} stroke="#00ff41" />
      <line x1={padL} x2={padL} y1={padT} y2={padT + plotH} stroke="#00ff41" />
    </svg>
  );
}
