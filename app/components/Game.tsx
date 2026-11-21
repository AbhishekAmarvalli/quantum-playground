"use client";

import { useMemo, useState } from "react";
import CircuitDiagram from "./CircuitDiagram";
import Histogram from "./Histogram";
import { groverCircuit, groverIterations, runSim } from "@/lib/quantum";

type GameState = {
  n: number;
  secret: string;
  opened: string[];
  done: boolean;
  found: boolean;
  guesses: number;
  rounds: number;
  total: number;
};

const boxesFor = (n: number) =>
  Array.from({ length: 2 ** n }, (_, i) => i.toString(2).padStart(n, "0"));

const newRound = (n: number): GameState => {
  const boxes = boxesFor(n);
  return {
    n,
    secret: boxes[Math.floor(Math.random() * boxes.length)],
    opened: [],
    done: false,
    found: false,
    guesses: 0,
    rounds: 0,
    total: 0,
  };
};

export default function Game() {
  const [game, setGame] = useState<GameState>(() => newRound(2));
  const boxes = boxesFor(game.n);
  const N = boxes.length;

  const guess = (box: string) =>
    setGame((prev) => {
      if (prev.done || prev.opened.includes(box)) return prev;
      const opened = [...prev.opened, box];
      const guesses = prev.guesses + 1;
      if (box === prev.secret) {
        return {
          ...prev,
          opened,
          guesses,
          found: true,
          done: true,
          rounds: prev.rounds + 1,
          total: prev.total + guesses,
        };
      }
      return { ...prev, opened, guesses };
    });

  const grover = useMemo(() => {
    if (!game.done) return null;
    const circuit = groverCircuit(game.n, game.secret);
    const counts = runSim(circuit);
    const entries = Object.entries(counts);
    const [top, topN] = entries.sort((a, b) => b[1] - a[1])[0];
    const total = entries.reduce((acc, [, v]) => acc + v, 0) || 1;
    return { circuit, counts, top, topP: topN / total, calls: groverIterations(game.n) };
  }, [game.done, game.n, game.secret]);

  const avg = game.rounds ? game.total / game.rounds : 0;
  const classical = (N + 1) / 2;

  return (
    <>
      <h2>&gt; GROVER&apos;S TREASURE HUNT</h2>
      <p>
        A treasure is hidden in one box. Click boxes to find it. Then Grover&apos;s quantum search
        algorithm finds it too, and we compare.
      </p>

      <div className="radio-row" role="radiogroup" aria-label="Difficulty">
        {[
          ["2", "2 qubits · 4 boxes"],
          ["3", "3 qubits · 8 boxes"],
        ].map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name="difficulty"
              checked={game.n === Number(value)}
              onChange={() => setGame(newRound(Number(value)))}
            />
            {label}
          </label>
        ))}
      </div>

      {!game.done ? (
        <>
          <p>
            <strong>Pick a box:</strong>
          </p>
          <div className="box-grid">
            {boxes.map((b) => {
              const opened = game.opened.includes(b);
              return (
                <button
                  key={b}
                  className="qbox"
                  disabled={opened}
                  aria-label={opened ? `Box ${b}, already guessed` : `Guess box ${b}`}
                  onClick={() => guess(b)}
                >
                  <div className="qicon">{opened ? "✖" : "·"}</div>
                  {b}
                </button>
              );
            })}
          </div>
          <button className="btn" onClick={() => setGame((p) => ({ ...p, done: true }))}>
            ASK THE QUANTUM COMPUTER
          </button>
          <p className="caption">Guesses so far: {game.guesses}</p>
        </>
      ) : (
        <>
          <div className="box-grid">
            {boxes.map((b, i) => {
              const treasure = b === game.secret;
              const opened = game.opened.includes(b);
              return (
                <div
                  key={b}
                  className={treasure ? "qbox treasure" : "qbox"}
                  style={{ animationDelay: `${i * 0.12}s` }}
                >
                  <div className="qicon">{treasure ? "◆" : opened ? "✖" : "·"}</div>
                  {b}
                </div>
              );
            })}
          </div>

          {grover && (
            <>
              <div className="card">
                <h4>RESULT</h4>
                <p>
                  {game.found
                    ? `You found it in ${game.guesses} guess(es).`
                    : "You asked the quantum computer."}{" "}
                  Grover&apos;s algorithm answered <b>{grover.top}</b> using {grover.calls} oracle
                  call(s), with {Math.round(grover.topP * 100)}% confidence. A classical search
                  needs about {classical.toFixed(1)} guesses on average.
                </p>
              </div>
              <Histogram counts={grover.counts} label="Grover measurement results" />
              <button
                className="btn"
                style={{ marginTop: "0.8rem" }}
                onClick={() => setGame((p) => newRound(p.n))}
              >
                ▶ NEW ROUND
              </button>

              <details className="expander">
                <summary>LEARN MORE: WHY GROVER IS FASTER</summary>
                <p>
                  Searching N unsorted items takes about N/2 guesses classically but only about
                  (π/4)·√N oracle calls with Grover. Here N = {N}, so {grover.calls} call(s). The
                  oracle flips the sign (phase) of the target; the diffusion step reflects every
                  amplitude about the average, boosting the target and shrinking the rest.
                </p>
                <CircuitDiagram circuit={grover.circuit} />
              </details>
            </>
          )}
        </>
      )}

      <p className="caption">
        Rounds found: {game.rounds} | Your average guesses: {avg.toFixed(2)} | Classical
        average: {classical.toFixed(1)}
      </p>
    </>
  );
}
