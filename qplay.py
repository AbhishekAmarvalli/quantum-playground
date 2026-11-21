"""Quantum logic for the Quantum Playground.

All quantum code lives here so app.py stays UI-only.
"""
import io
import math
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator

GREEN = "#00ff41"

RUNS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docs", "hardware_runs")


def _gate(qc, name, args):
    name = name.lower()
    q = [int(x) for x in args]
    if name in ("h", "x", "y", "z", "s", "t", "sdg", "tdg"):
        getattr(qc, name)(q[0])
    elif name in ("rx", "ry", "rz"):
        # angle not parsed from simple text; default pi/2
        getattr(qc, name)(math.pi / 2, q[0])
    elif name == "cx" or name == "cnot":
        qc.cx(q[0], q[1])
    elif name == "cz":
        qc.cz(q[0], q[1])
    elif name == "cy":
        qc.cy(q[0], q[1])
    elif name == "swap":
        qc.swap(q[0], q[1])
    elif name == "ccx" or name == "toffoli":
        qc.ccx(q[0], q[1], q[2])
    else:
        raise ValueError(f"Unknown gate: {name}")


def build_from_text(text, n=2):
    qc = QuantumCircuit(int(n))
    for raw in (text or "").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        name = parts[0]
        args = parts[1:]
        _gate(qc, name, args)
    return qc


def run_sim(qc, shots=1024):
    sim_qc = qc.copy()
    if sim_qc.num_clbits == 0:
        sim_qc.measure_all()
    sim = AerSimulator()
    result = sim.run(sim_qc, shots=int(shots)).result()
    return result.get_counts()


def grover_iterations(n):
    n = int(n)
    k = int(math.pi / 4.0 * math.sqrt(2 ** n))
    return max(1, k)


def grover_circuit(secret):
    secret = str(secret).strip()
    n = len(secret)
    # Qiskit prints qubit 0 as the RIGHTMOST bit, so map the label right-to-left
    bits = list(reversed(secret))
    qc = QuantumCircuit(n)
    # initial superposition
    qc.h(range(n))
    for _ in range(grover_iterations(n)):
        # oracle: phase flip on |secret>
        for i, bit in enumerate(bits):
            if bit == "0":
                qc.x(i)
        if n == 1:
            qc.z(0)
        else:
            qc.h(n - 1)
            qc.mcx(list(range(n - 1)), n - 1)
            qc.h(n - 1)
        for i, bit in enumerate(bits):
            if bit == "0":
                qc.x(i)
        # diffusion
        qc.h(range(n))
        qc.x(range(n))
        if n == 1:
            qc.z(0)
        else:
            qc.h(n - 1)
            qc.mcx(list(range(n - 1)), n - 1)
            qc.h(n - 1)
        qc.x(range(n))
        qc.h(range(n))
    return qc


def render_snapshot(qc, counts, source="simulator", shots=1024):
    """Render a run card PNG (bytes) for the Lab's download button."""
    items = sorted(counts.items())
    labels = [k for k, _ in items]
    total = sum(counts.values()) or 1
    vals = [v / total for _, v in items]

    fig = plt.figure(figsize=(8, 6))
    fig.patch.set_facecolor("#000000")
    ax_c = fig.add_subplot(2, 1, 1)
    ax_c.set_facecolor("#000000")
    try:
        qc.draw("mpl", ax=ax_c, style="iqp-dark")
    except Exception:
        qc.draw("mpl", ax=ax_c)
    ax_c.set_title("Circuit", color=GREEN, fontsize=10)

    ax_h = fig.add_subplot(2, 1, 2)
    ax_h.set_facecolor("#000000")
    bars = ax_h.bar(labels, vals, color=GREEN, edgecolor="#9dffb5", linewidth=1.2)
    for b, v in zip(bars, vals):
        ax_h.text(b.get_x() + b.get_width() / 2, v + 0.02, f"{v:.0%}",
                  ha="center", va="bottom", color="#9dffb5", fontsize=8)
    ax_h.set_ylim(0, 1.15)
    ax_h.tick_params(colors=GREEN)
    for sp in ax_h.spines.values():
        sp.set_color(GREEN)
    ax_h.set_ylabel("probability", color=GREEN)
    ax_h.set_title(f"Results ({shots} shots, {source})", color=GREEN, fontsize=10)

    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", facecolor=fig.get_facecolor())
    plt.close(fig)
    buf.seek(0)
    return buf.getvalue()


# expose Statevector helper used by app? app imports math_lines locally; fine.
def statevector_lines(qc):
    sv = Statevector(qc)
    n = qc.num_qubits
    lines = []
    for i, a in enumerate(sv.data):
        if abs(a) > 1e-9:
            lines.append(f"|{format(i, f'0{n}b')}>  amplitude {a.real:+.4f}{a.imag:+.4f}j   "
                         f"probability {abs(a) ** 2:.4f}")
    return "\n".join(lines)
