"use client";

import { type Circuit } from "@/lib/quantum";

const LABEL: Record<string, string> = {
  h: "H",
  x: "X",
  y: "Y",
  z: "Z",
  s: "S",
  sdg: "S†",
  t: "T",
  tdg: "T†",
  rx: "Rx",
  ry: "Ry",
  rz: "Rz",
  cx: "X",
  cz: "Z",
  cy: "Y",
  swap: "SWAP",
  ccx: "X",
  mcx: "X",
};

export default function CircuitDiagram({ circuit }: { circuit: Circuit }) {
  const { nQubits, ops } = circuit;
  if (ops.length === 0) {
    return (
      <div className="note">
        Empty circuit: no gates yet, so every qubit stays in |0&gt;.
      </div>
    );
  }

  const padX = 52;
  const colW = 62;
  const wireH = 46;
  const topPad = 26;
  const W = padX * 2 + colW * ops.length + 16;
  const H = topPad * 2 + wireH * (nQubits - 1);
  const yOf = (q: number) => topPad + q * wireH;
  const gateW = 40;
  const gateH = 30;

  return (
    <div className="diagram-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ maxHeight: 260, display: "block" }}
        role="img"
        aria-label="Circuit diagram"
        preserveAspectRatio="xMinYMid meet"
      >
        {Array.from({ length: nQubits }, (_, q) => (
          <g key={`wire${q}`}>
            <text x={10} y={yOf(q) + 4} fill="#00b32d" fontSize="11">
              q{q}
            </text>
            <line
              x1={padX - 18}
              x2={W - 12}
              y1={yOf(q)}
              y2={yOf(q)}
              stroke="rgba(0,255,65,0.65)"
              strokeWidth="1.2"
            />
            <text x={W - 8} y={yOf(q) + 4} fill="#00b32d" fontSize="10">
              |0&gt;
            </text>
          </g>
        ))}

        {ops.map((op, i) => {
          const cx = padX + colW * i + colW / 2;
          const [a, b] = op.qubits;
          const label = LABEL[op.gate] ?? op.gate.toUpperCase();

          if (op.qubits.length === 1) {
            return (
              <g key={i}>
                <rect
                  x={cx - gateW / 2}
                  y={yOf(a) - gateH / 2}
                  width={gateW}
                  height={gateH}
                  rx="4"
                  fill="#020a02"
                  stroke="#00ff41"
                />
                <text
                  x={cx}
                  y={yOf(a) + 4}
                  fill="#00ff41"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {label}
                </text>
              </g>
            );
          }

          if (op.gate === "swap") {
            return (
              <g key={i}>
                <line
                  x1={cx}
                  x2={cx}
                  y1={yOf(a)}
                  y2={yOf(b)}
                  stroke="#00ff41"
                  strokeWidth="1.4"
                />
                {[a, b].map((q) => (
                  <g key={q}>
                    <line
                      x1={cx - 7}
                      x2={cx + 7}
                      y1={yOf(q) - 7}
                      y2={yOf(q) + 7}
                      stroke="#00ff41"
                      strokeWidth="1.8"
                    />
                    <line
                      x1={cx - 7}
                      x2={cx + 7}
                      y1={yOf(q) + 7}
                      y2={yOf(q) - 7}
                      stroke="#00ff41"
                      strokeWidth="1.8"
                    />
                  </g>
                ))}
              </g>
            );
          }

          const controls = op.qubits.slice(0, -1);
          const target = op.qubits[op.qubits.length - 1];
          return (
            <g key={i}>
              <line
                x1={cx}
                x2={cx}
                y1={Math.min(...op.qubits.map(yOf))}
                y2={Math.max(...op.qubits.map(yOf))}
                stroke="#00ff41"
                strokeWidth="1.4"
              />
              {controls.map((q) => (
                <circle key={q} cx={cx} cy={yOf(q)} r="4.5" fill="#00ff41" />
              ))}
              <rect
                x={cx - gateW / 2}
                y={yOf(target) - gateH / 2}
                width={gateW}
                height={gateH}
                rx="4"
                fill="#020a02"
                stroke="#00ff41"
              />
              <text
                x={cx}
                y={yOf(target) + 4}
                fill="#00ff41"
                fontSize="12"
                textAnchor="middle"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
