"use client";

import { useState } from "react";
import Histogram from "./Histogram";
import { buildFromText, runSim } from "@/lib/quantum";
import { GITHUB_URL, LINKEDIN_URL, NAME, REPO_URL, type Page } from "@/lib/site";

const STEPS = [
  ["01", "BUILD", "Pick a preset or click gates to assemble a quantum circuit."],
  ["02", "RUN", "A free local simulator runs your circuit 1,024 times."],
  ["03", "LEARN", "See the results as a chart, with a plain-English explanation."],
];

export default function Home({ go }: { go: (page: Page) => void }) {
  const [bellCounts] = useState(() => runSim(buildFromText("h 0\ncx 0 1", 2), 1024));

  return (
    <>
      <span className="hero-title">QUANTUM PLAYGROUND</span>
      <p className="tagline">
        &gt; Build quantum circuits. Hunt treasure with Grover&apos;s algorithm. Free, in your
        browser.
      </p>

      <div className="cta-row">
        <button className="btn" onClick={() => go("lab")}>
          ▶ ENTER THE LAB
        </button>
        <button className="btn" onClick={() => go("game")}>
          ▶ PLAY TREASURE HUNT
        </button>
      </div>

      <h3>&gt; HOW IT WORKS</h3>
      <div className="grid-3">
        {STEPS.map(([n, title, desc]) => (
          <div className="card" key={n}>
            <div className="step-n">{n}</div>
            <h4>{title}</h4>
            <p>{desc}</p>
          </div>
        ))}
      </div>

      <h3>&gt; LIVE DEMO: AN ENTANGLED PAIR</h3>
      <div className="grid-2">
        <Histogram counts={bellCounts} label="Bell state measurement results" />
        <div className="card">
          <h4>Bell state</h4>
          <p>
            Two gates (H, then CNOT) link two qubits. Only 00 and 11 ever appear, about half
            each: measuring one qubit instantly tells you the other.
          </p>
          <p className="small">Open the Circuit Lab to change the circuit yourself.</p>
        </div>
      </div>

      <h3>&gt; ABOUT</h3>
      <div className="card">
        <h4>{NAME}</h4>
        <p>
          B.Tech computer science student exploring quantum software. This app runs a quantum
          simulator in your browser; real IBM quantum hardware results are documented in the
          project repository.
        </p>
        <p>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>{" "}
          &nbsp;|&nbsp;{" "}
          <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
            LinkedIn
          </a>{" "}
          &nbsp;|&nbsp;{" "}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            Source code
          </a>
        </p>
      </div>
    </>
  );
}
