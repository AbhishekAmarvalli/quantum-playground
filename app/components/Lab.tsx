"use client";

import { useMemo, useState } from "react";
import CircuitDiagram from "./CircuitDiagram";
import Histogram from "./Histogram";
import { runCardDataUrl } from "./runCard";
import { buildFromText, explain, runSim, statevectorLines } from "@/lib/quantum";
import { PRESETS } from "@/lib/site";

const ONE_QUBIT = ["h", "x", "y", "z", "s", "t"] as const;
const TWO_QUBIT = ["cx", "cz", "swap"] as const;
const SHOTS = [256, 1024, 4096];

export default function Lab() {
  const [preset, setPreset] = useState("Bell state (entanglement)");
  const [nQubits, setNQubits] = useState(2);
  const [text, setText] = useState("h 0\ncx 0 1");
  const [shots, setShots] = useState(1024);
  const [target1, setTarget1] = useState(0);
  const [control, setControl] = useState(0);
  const [target2, setTarget2] = useState(1);

  const qopts = Array.from({ length: nQubits }, (_, i) => i);
  const t1 = Math.min(target1, nQubits - 1);
  const c2 = Math.min(control, nQubits - 1);
  const t2 = Math.min(target2, nQubits - 1);

  const loadPreset = (name: string) => {
    setPreset(name);
    const chosen = PRESETS[name];
    if (!chosen) return;
    setNQubits(chosen.n);
    setText(chosen.text);
  };

  const appendLine = (line: string) => {
    setText((cur) => `${cur.replace(/\s+$/, "")}\n${line}`.replace(/^\n/, ""));
  };

  const undo = () => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    setText(lines.slice(0, -1).join("\n"));
  };

  const result = useMemo(() => {
    if (!text.trim()) return { kind: "empty" as const };
    try {
      const circuit = buildFromText(text, nQubits);
      const counts = runSim(circuit, shots);
      return { kind: "ok" as const, circuit, counts };
    } catch (err) {
      return { kind: "error" as const, message: (err as Error).message };
    }
  }, [text, nQubits, shots]);

  const card = useMemo(() => {
    if (result.kind !== "ok") return "";
    if (typeof document === "undefined") return "";
    return runCardDataUrl(result.circuit, result.counts, shots);
  }, [result, shots]);

  return (
    <>
      <h2>&gt; CIRCUIT LAB</h2>
      <div className="lab-grid">
        <div className="stack">
          <div>
            <label className="field" htmlFor="preset">
              Preset
            </label>
            <select id="preset" value={preset} onChange={(e) => loadPreset(e.target.value)}>
              {Object.keys(PRESETS).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field" htmlFor="qubits">
              Qubits: {nQubits}
            </label>
            <input
              id="qubits"
              type="range"
              min={1}
              max={3}
              step={1}
              value={nQubits}
              onChange={(e) => setNQubits(Number(e.target.value))}
            />
          </div>

          <div>
            <p className="small">ADD A GATE</p>
            <label className="field" htmlFor="target1">
              Target qubit
            </label>
            <select id="target1" value={t1} onChange={(e) => setTarget1(Number(e.target.value))}>
              {qopts.map((q) => (
                <option key={q} value={q}>
                  q{q}
                </option>
              ))}
            </select>
            <div className="gate-row" style={{ marginTop: "0.5rem" }}>
              {ONE_QUBIT.map((g) => (
                <button className="btn" key={g} onClick={() => appendLine(`${g} ${t1}`)}>
                  {g.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="grid-2">
              <div>
                <label className="field" htmlFor="control">
                  Control qubit
                </label>
                <select
                  id="control"
                  value={c2}
                  onChange={(e) => setControl(Number(e.target.value))}
                >
                  {qopts.map((q) => (
                    <option key={q} value={q}>
                      q{q}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field" htmlFor="target2">
                  2-qubit target
                </label>
                <select
                  id="target2"
                  value={t2}
                  onChange={(e) => setTarget2(Number(e.target.value))}
                >
                  {qopts.map((q) => (
                    <option key={q} value={q}>
                      q{q}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="gate-row three" style={{ marginTop: "0.5rem" }}>
              {TWO_QUBIT.map((g) => (
                <button
                  className="btn"
                  key={g}
                  disabled={nQubits < 2}
                  onClick={() => appendLine(`${g} ${c2} ${t2}`)}
                >
                  {g.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-2">
            <button className="btn" onClick={undo}>
              UNDO LAST
            </button>
            <button className="btn" onClick={() => setText("")}>
              CLEAR
            </button>
          </div>

          <div>
            <label className="field" htmlFor="circuit">
              Circuit text (editable, one gate per line)
            </label>
            <textarea
              id="circuit"
              value={text}
              spellCheck={false}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div>
            <label className="field" htmlFor="shots">
              Shots
            </label>
            <select
              id="shots"
              value={shots}
              onChange={(e) => setShots(Number(e.target.value))}
            >
              {SHOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="stack">
          <p className="small">LIVE RESULT</p>

          {result.kind === "empty" && (
            <div className="note">Pick a preset or click a gate to start.</div>
          )}

          {result.kind === "error" && (
            <div className="note error">⚠ {result.message}</div>
          )}

          {result.kind === "ok" && (
            <>
              <CircuitDiagram circuit={result.circuit} />
              <Histogram
                counts={result.counts}
                label={`Measurement results for ${shots} shots`}
              />
              <div className="card">
                <h4>WHAT JUST HAPPENED</h4>
                <p>{explain(result.circuit, result.counts, shots)}</p>
              </div>

              <a className="btn wide" href={card} download="quantum_run_card.png">
                ⬇ DOWNLOAD RUN CARD (PNG)
              </a>
              {card && (
                <img className="run-image" src={card} alt="Run card for this simulation" />
              )}
              <p className="caption">Run card (simulator) — screenshot of this run</p>

              <details className="expander">
                <summary>LEARN MORE: THE MATH</summary>
                <p>
                  The state is a sum of amplitude × basis state. Probability is the amplitude
                  squared. Qubit 0 is the RIGHTMOST bit, as in Qiskit.
                </p>
                <pre className="code">{statevectorLines(result.circuit)}</pre>
              </details>
            </>
          )}
        </div>
      </div>
    </>
  );
}
