/**
 * Quantum logic, ported from qplay.py so the browser version behaves the same.
 *
 * Bit ordering matches Qiskit: statevector index bit i is qubit i, and the
 * measured key is the index printed most-significant-first, so the RIGHTMOST
 * character of a key is qubit 0.
 */

export type Op = { gate: string; qubits: number[] };
export type Circuit = { nQubits: number; ops: Op[] };

type C = { re: number; im: number };
/** Row-major 2x2: [a00, a01, a10, a11] */
type Mat2 = [C, C, C, C];

const PI = Math.PI;
const c = (re: number, im = 0): C => ({ re, im });
const add = (a: C, b: C): C => ({ re: a.re + b.re, im: a.im + b.im });
const mul = (a: C, b: C): C => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

const S2 = 1 / Math.SQRT2;

function gateMatrix(name: string): Mat2 | null {
  const zero = c(0);
  switch (name) {
    case "h":
      return [c(S2), c(S2), c(S2), c(-S2)];
    case "x":
      return [zero, c(1), c(1), zero];
    case "y":
      return [zero, c(0, -1), c(0, 1), zero];
    case "z":
      return [c(1), zero, zero, c(-1)];
    case "s":
      return [c(1), zero, zero, c(0, 1)];
    case "sdg":
      return [c(1), zero, zero, c(0, -1)];
    case "t":
      return [c(1), zero, zero, c(Math.cos(PI / 4), Math.sin(PI / 4))];
    case "tdg":
      return [c(1), zero, zero, c(Math.cos(PI / 4), -Math.sin(PI / 4))];
    case "rx": {
      const a = PI / 4; // angle is a fixed pi/2, so theta/2 = pi/4
      const cs = Math.cos(a);
      const sn = Math.sin(a);
      return [c(cs), c(0, -sn), c(0, -sn), c(cs)];
    }
    case "ry": {
      const a = PI / 4;
      const cs = Math.cos(a);
      const sn = Math.sin(a);
      return [c(cs), c(-sn), c(sn), c(cs)];
    }
    case "rz": {
      const a = PI / 4;
      return [c(Math.cos(a), -Math.sin(a)), zero, zero, c(Math.cos(a), Math.sin(a))];
    }
    default:
      return null;
  }
}

const ONE_QUBIT = new Set([
  "h", "x", "y", "z", "s", "sdg", "t", "tdg", "rx", "ry", "rz",
]);

function assertQubit(q: number, n: number, raw: string) {
  if (!Number.isInteger(q) || q < 0 || q >= n) {
    throw new Error(`Invalid qubit "${raw}" for a ${n}-qubit circuit`);
  }
}

/** Parse one-gate-per-line text, mirroring qplay.build_from_text. */
export function buildFromText(text: string, n: number): Circuit {
  const ops: Op[] = [];
  for (const raw of (text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = parts.slice(1);
    const qubits = args.map((a) => {
      const v = Number(a);
      if (!Number.isInteger(v)) throw new Error(`Invalid qubit "${a}" in "${line}"`);
      return v;
    });
    const needs: Record<string, number> = {
      h: 1, x: 1, y: 1, z: 1, s: 1, sdg: 1, t: 1, tdg: 1,
      rx: 1, ry: 1, rz: 1,
      cx: 2, cnot: 2, cz: 2, cy: 2, swap: 2,
      ccx: 3, toffoli: 3,
    };
    const want = needs[name];
    if (!want) throw new Error(`Unknown gate: ${name}`);
    if (qubits.length < want) {
      throw new Error(`Gate ${name} needs ${want} qubit(s), got ${qubits.length}`);
    }
    const used = qubits.slice(0, want);
    used.forEach((q, i) => assertQubit(q, n, args[i]));
    ops.push({ gate: name === "cnot" ? "cx" : name === "toffoli" ? "ccx" : name, qubits: used });
  }
  return { nQubits: n, ops };
}

export type State = { re: Float64Array; im: Float64Array; n: number };

export function zeroState(n: number): State {
  const size = 1 << n;
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  re[0] = 1;
  return { re, im, n };
}

const bit = (x: number, q: number) => (x >> q) & 1;

function apply1(s: State, q: number, m: Mat2) {
  const stride = 1 << q;
  const { re, im } = s;
  for (let i = 0; i < re.length; i++) {
    if (i & stride) continue;
    const j = i | stride;
    const a0 = c(re[i], im[i]);
    const a1 = c(re[j], im[j]);
    const n0 = add(mul(m[0], a0), mul(m[1], a1));
    const n1 = add(mul(m[2], a0), mul(m[3], a1));
    re[i] = n0.re;
    im[i] = n0.im;
    re[j] = n1.re;
    im[j] = n1.im;
  }
}

function applyControlled(s: State, controls: number[], target: number, m: Mat2) {
  const cMask = controls.reduce((acc, q) => acc | (1 << q), 0);
  const tBit = 1 << target;
  const { re, im } = s;
  for (let i = 0; i < re.length; i++) {
    if ((i & cMask) !== cMask || i & tBit) continue;
    const j = i | tBit;
    const a0 = c(re[i], im[i]);
    const a1 = c(re[j], im[j]);
    const n0 = add(mul(m[0], a0), mul(m[1], a1));
    const n1 = add(mul(m[2], a0), mul(m[3], a1));
    re[i] = n0.re;
    im[i] = n0.im;
    re[j] = n1.re;
    im[j] = n1.im;
  }
}

function applySwap(s: State, a: number, b: number) {
  const ab = 1 << a;
  const bb = 1 << b;
  const { re, im } = s;
  for (let i = 0; i < re.length; i++) {
    const aSet = i & ab;
    const bSet = i & bb;
    if (aSet || !bSet) continue; // take each pair once: a=0, b=1
    const j = i ^ ab ^ bb;
    const tr = re[i], ti = im[i];
    re[i] = re[j];
    im[i] = im[j];
    re[j] = tr;
    im[j] = ti;
  }
}

function applyMultiX(s: State, controls: number[], target: number) {
  const cMask = controls.reduce((acc, q) => acc | (1 << q), 0);
  const tBit = 1 << target;
  const { re, im } = s;
  for (let i = 0; i < re.length; i++) {
    if ((i & cMask) !== cMask || i & tBit) continue;
    const j = i | tBit;
    const tr = re[i], ti = im[i];
    re[i] = re[j];
    im[i] = im[j];
    re[j] = tr;
    im[j] = ti;
  }
}

export function simulate(circuit: Circuit): State {
  const s = zeroState(circuit.nQubits);
  for (const op of circuit.ops) {
    const { gate, qubits } = op;
    if (ONE_QUBIT.has(gate)) {
      const m = gateMatrix(gate);
      if (!m) throw new Error(`Unknown gate: ${gate}`);
      apply1(s, qubits[0], m);
    } else if (gate === "cx") {
      applyMultiX(s, [qubits[0]], qubits[1]);
    } else if (gate === "cz") {
      applyControlled(s, [qubits[0]], qubits[1], gateMatrix("z")!);
    } else if (gate === "cy") {
      applyControlled(s, [qubits[0]], qubits[1], gateMatrix("y")!);
    } else if (gate === "swap") {
      applySwap(s, qubits[0], qubits[1]);
    } else if (gate === "ccx") {
      applyMultiX(s, [qubits[0], qubits[1]], qubits[2]);
    } else if (gate === "mcx") {
      applyMultiX(s, qubits.slice(0, -1), qubits[qubits.length - 1]);
    } else {
      throw new Error(`Unknown gate: ${gate}`);
    }
  }
  return s;
}

export type Counts = Record<string, number>;

export const stateKey = (index: number, n: number) =>
  index.toString(2).padStart(n, "0");

export function probabilities(s: State): { key: string; p: number }[] {
  const out: { key: string; p: number }[] = [];
  for (let i = 0; i < s.re.length; i++) {
    const p = s.re[i] * s.re[i] + s.im[i] * s.im[i];
    if (p > 1e-9) out.push({ key: stateKey(i, s.n), p });
  }
  return out;
}

/** Sample shot results, mirroring run_sim(shots). */
export function runSim(circuit: Circuit, shots = 1024): Counts {
  const probs = probabilities(simulate(circuit));
  const total = probs.reduce((acc, x) => acc + x.p, 0) || 1;
  const cumulative: number[] = [];
  let acc = 0;
  for (const { p } of probs) {
    acc += p / total;
    cumulative.push(acc);
  }
  const counts: Counts = {};
  for (let s = 0; s < shots; s++) {
    const r = Math.random();
    let idx = cumulative.findIndex((v) => r <= v);
    if (idx < 0) idx = probs.length - 1;
    const key = probs[idx].key;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function sortedCounts(counts: Counts) {
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

export function groverIterations(n: number): number {
  return Math.max(1, Math.trunc((PI / 4) * Math.sqrt(2 ** n)));
}

/** Mirror of qplay.grover_circuit: oracle phase flip + diffusion, k times. */
export function groverCircuit(nQubits: number, secret: string): Circuit {
  const n = nQubits;
  const bits = secret.split("").reverse(); // qubit 0 is the rightmost key character
  const ops: Op[] = [];
  const push = (gate: string, ...qubits: number[]) => ops.push({ gate, qubits });

  for (let i = 0; i < n; i++) push("h", i);

  for (let k = 0; k < groverIterations(n); k++) {
    for (let i = 0; i < n; i++) if (bits[i] === "0") push("x", i);
    if (n === 1) {
      push("z", 0);
    } else {
      push("h", n - 1);
      push("mcx", ...Array.from({ length: n - 1 }, (_, i) => i), n - 1);
      push("h", n - 1);
    }
    for (let i = 0; i < n; i++) if (bits[i] === "0") push("x", i);

    for (let i = 0; i < n; i++) push("h", i);
    for (let i = 0; i < n; i++) push("x", i);
    if (n === 1) {
      push("z", 0);
    } else {
      push("h", n - 1);
      push("mcx", ...Array.from({ length: n - 1 }, (_, i) => i), n - 1);
      push("h", n - 1);
    }
    for (let i = 0; i < n; i++) push("x", i);
    for (let i = 0; i < n; i++) push("h", i);
  }

  return { nQubits: n, ops };
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const fixed = (v: number) => `${v >= 0 ? "+" : "-"}${Math.abs(v).toFixed(4)}`;

/** Plain-English summary, mirroring app.explain with the real shot count. */
export function explain(circuit: Circuit, counts: Counts, shots: number): string {
  const entries = Object.entries(counts);
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1;
  const ranked = [...entries].sort((a, b) => b[1] - a[1]);
  const [top, topN] = ranked[0];
  const gates = new Set(circuit.ops.map((o) => o.gate));

  let text = `The most common result was ${top} (${pct(topN / total)} of ${shots.toLocaleString(
    "en-US",
  )} runs). `;
  if (entries.length === 1) {
    text += "Only one outcome appeared, so this circuit is deterministic.";
  } else if (gates.has("h") && gates.has("cx") && entries.length === 2) {
    text +=
      "Two perfectly correlated outcomes is the signature of entanglement: " +
      "measuring one qubit tells you the other.";
  } else if (entries.length === 2 ** circuit.nQubits) {
    text += "All outcomes are possible: the qubits are in an even superposition.";
  } else {
    text += "Quantum interference made some outcomes likely and others rare.";
  }
  return text;
}

/** Basis-state amplitudes, mirroring app.math_lines. */
export function statevectorLines(circuit: Circuit): string {
  const s = simulate(circuit);
  const lines: string[] = [];
  for (let i = 0; i < s.re.length; i++) {
    const re = s.re[i];
    const im = s.im[i];
    if (Math.hypot(re, im) <= 1e-9) continue;
    lines.push(
      `|${stateKey(i, s.n)}>  amplitude ${fixed(re)}${fixed(im)}j   probability ${(re * re + im * im).toFixed(4)}`,
    );
  }
  return lines.join("\n");
}
