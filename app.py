import glob
import html
import json
import os
import random

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import streamlit as st
import streamlit.components.v1 as components
from qiskit.quantum_info import Statevector

from qplay import (build_from_text, run_sim, grover_circuit, grover_iterations,
                   render_snapshot, RUNS_DIR)

# ---------- edit these ----------
NAME = "Abhishek Amarvalli"
GITHUB_URL = "https://github.com/AbhishekAmarvalli"
LINKEDIN_URL = "https://www.linkedin.com/in/YOUR-HANDLE"
REPO_URL = GITHUB_URL + "/quantum-playground"
# --------------------------------

GREEN = "#00ff41"

st.set_page_config(page_title="Quantum Playground", page_icon="⚛️", layout="wide")

CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&display=swap');
:root{--g:#00ff41;--g-dim:#00b32d;--panel:rgba(0,14,2,.78);--txt:#b6ffc8;}
html,body{background:#000 !important;}
.stApp,[data-testid="stAppViewContainer"],[data-testid="stHeader"]{background:transparent !important;}
.stApp{position:relative;z-index:1;}
.stApp p,.stApp li,.stApp label,.stApp h1,.stApp h2,.stApp h3,.stApp h4,
.stApp textarea,.stApp input,.stApp button,.stApp code,
[data-testid="stMarkdownContainer"],[data-testid="stCaptionContainer"]
{font-family:'JetBrains Mono',monospace !important;}
#MainMenu,footer{visibility:hidden;}
h1,h2,h3,h4{color:var(--g) !important;text-shadow:0 0 8px rgba(0,255,65,.55);}
p,li,label{color:var(--txt);}
a{color:var(--g) !important;text-decoration:none;border-bottom:1px dashed var(--g);}

/* buttons */
.stButton > button{background:#020a02;color:var(--g);border:1px solid var(--g);
 border-radius:4px;min-height:44px;font-weight:600;letter-spacing:.04em;
 box-shadow:0 0 6px rgba(0,255,65,.45),inset 0 0 6px rgba(0,255,65,.12);transition:all .15s;}
.stButton > button:hover,.stButton > button:focus-visible{background:var(--g);color:#000;
 box-shadow:0 0 18px var(--g);}
.stButton > button[kind="primary"],.stButton > button[data-testid="stBaseButton-primary"]
{background:var(--g);color:#000;box-shadow:0 0 14px rgba(0,255,65,.8);}
.stButton > button:disabled{opacity:.35;box-shadow:none;}

/* inputs */
textarea,input,[data-baseweb="select"] > div{background:#020a02 !important;color:var(--g) !important;
 border:1px solid rgba(0,255,65,.6) !important;border-radius:4px !important;}

/* cards */
.card{border:1px solid rgba(0,255,65,.55);border-radius:6px;padding:1rem 1.1rem;
 background:var(--panel);box-shadow:0 0 10px rgba(0,255,65,.25);height:100%;}
.card h4{margin:.2rem 0 .4rem 0;}
.step-n{color:var(--g-dim);font-weight:800;font-size:1.4rem;}
.tagline{color:var(--txt);font-size:clamp(.85rem,2.2vw,1.1rem);margin:.4rem 0 1.2rem 0;}
.small{color:var(--g-dim);font-size:.8rem;}

/* hero typing */
.hero-title{display:block;font-weight:800;font-size:clamp(1.05rem,4.8vw,2.8rem);color:var(--g);
 white-space:nowrap;overflow:hidden;width:0;border-right:.12em solid var(--g);
 text-shadow:0 0 12px rgba(0,255,65,.8);
 animation:typing 2.2s steps(18,end) .2s forwards,blink .8s step-end infinite;}
@keyframes typing{from{width:0}to{width:18ch}}
@keyframes blink{50%{border-color:transparent}}

/* treasure boxes (reveal) */
.box-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem;margin:.6rem 0 1rem 0;}
.qbox{border:1px solid rgba(0,255,65,.6);border-radius:6px;padding:.9rem 0;text-align:center;
 background:var(--panel);color:var(--txt);opacity:0;transform:rotateY(90deg);
 animation:flip .5s ease forwards;}
.qbox .qicon{font-size:1.4rem;color:var(--g-dim);}
.qbox.treasure{border-color:var(--g);color:#000;background:var(--g);
 animation:flip .5s ease forwards,pulse 1.6s ease-in-out infinite;}
.qbox.treasure .qicon{color:#000;}
@keyframes flip{to{opacity:1;transform:rotateY(0)}}
@keyframes pulse{0%,100%{box-shadow:0 0 8px var(--g)}50%{box-shadow:0 0 28px var(--g)}}

@media (prefers-reduced-motion: reduce){
 .hero-title{animation:none;width:18ch;border-right:none;}
 .qbox{animation:none;opacity:1;transform:none;}
 .qbox.treasure{animation:none;}
}
</style>
"""
st.markdown(CSS, unsafe_allow_html=True)

RAIN_HTML = """
<script>
function rain(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var c = document.createElement('canvas'); c.id = 'matrix-rain';
  c.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none;opacity:0.18';
  document.body.appendChild(c);
  var ctx = c.getContext('2d'), fs = 16, drops = [];
  function resize(){
    c.width = window.innerWidth; c.height = window.innerHeight;
    drops = []; for (var i = 0; i < Math.floor(c.width / fs); i++) drops[i] = Math.random() * c.height / fs;
  }
  resize(); window.addEventListener('resize', resize);
  var chars = '01|0>|1>psi phi'.replace(/ /g, '').split('');
  setInterval(function(){
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#00ff41'; ctx.font = fs + 'px monospace';
    for (var i = 0; i < drops.length; i++){
      ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fs, drops[i] * fs);
      if (drops[i] * fs > c.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }, 50);
}
var p = window.parent.document;
if (!p.getElementById('matrix-rain-script')) {
  var s = p.createElement('script'); s.id = 'matrix-rain-script';
  s.textContent = '(' + rain.toString() + ')();';
  p.body.appendChild(s);
}
</script>
"""
components.html(RAIN_HTML, height=0)

PRESETS = {
    "Bell state (entanglement)": (2, "h 0\ncx 0 1"),
    "GHZ state (3 qubits)": (3, "h 0\ncx 0 1\ncx 1 2"),
    "Superposition": (1, "h 0"),
    "Interference (H-Z-H)": (1, "h 0\nz 0\nh 0"),
    "Grover search for 11": (2, "h 0\nh 1\ncz 0 1\nh 0\nh 1\nx 0\nx 1\ncz 0 1\nx 0\nx 1\nh 0\nh 1"),
}


# ---------- helpers ----------
def neon_hist(counts):
    items = sorted(counts.items())
    labels = [k for k, _ in items]
    total = sum(counts.values())
    vals = [v / total for _, v in items]
    fig, ax = plt.subplots(figsize=(6, 2.8))
    fig.patch.set_facecolor("#000000")
    ax.set_facecolor("#000000")
    bars = ax.bar(labels, vals, color=GREEN, edgecolor="#9dffb5", linewidth=1.2)
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + 0.02, f"{v:.0%}",
                ha="center", va="bottom", color="#9dffb5", fontsize=8)
    ax.set_ylim(0, 1.15)
    ax.tick_params(colors=GREEN)
    for sp in ax.spines.values():
        sp.set_color(GREEN)
    ax.set_ylabel("probability", color=GREEN)
    fig.tight_layout()
    return fig


def draw_circuit(qc):
    try:
        fig = qc.draw("mpl", style="iqp-dark")
    except Exception:
        fig = qc.draw("mpl")
    return fig


def show_fig(fig):
    st.pyplot(fig)
    plt.close(fig)


def explain(qc, counts):
    total = sum(counts.values())
    ranked = sorted(counts.items(), key=lambda kv: -kv[1])
    top, top_n = ranked[0]
    ops = qc.count_ops()
    text = f"The most common result was {top} ({top_n / total:.0%} of 1,024 runs). "
    if len(counts) == 1:
        text += "Only one outcome appeared, so this circuit is deterministic."
    elif "h" in ops and "cx" in ops and len(counts) == 2:
        text += ("Two perfectly correlated outcomes is the signature of entanglement: "
                 "measuring one qubit tells you the other.")
    elif len(counts) == 2 ** qc.num_qubits:
        text += "All outcomes are possible: the qubits are in an even superposition."
    else:
        text += "Quantum interference made some outcomes likely and others rare."
    return text


def math_lines(qc):
    sv = Statevector(qc)
    n = qc.num_qubits
    lines = []
    for i, a in enumerate(sv.data):
        if abs(a) > 1e-9:
            lines.append(f"|{format(i, f'0{n}b')}>  amplitude {a.real:+.4f}{a.imag:+.4f}j   "
                         f"probability {abs(a) ** 2:.4f}")
    return "\n".join(lines)


@st.cache_data
def landing_demo():
    qc = build_from_text("h 0\ncx 0 1", n=2)
    return run_sim(qc, shots=1024)


@st.cache_data(show_spinner=False)
def run_card_bytes(text, nq, shots):
    """PNG run card for the Lab's download button (simulator only)."""
    qc = build_from_text(text, n=nq)
    counts = run_sim(qc, shots=shots)
    return render_snapshot(qc, counts, source="simulator", shots=shots)


# ---------- state and callbacks ----------
def go(page):
    st.session_state.page = page


def load_preset():
    n, text = PRESETS[st.session_state.preset]
    st.session_state.nq = n
    st.session_state.circuit_text = text


def add_line(line):
    cur = st.session_state.circuit_text.rstrip("\n")
    st.session_state.circuit_text = (cur + "\n" + line).strip()


def add_1q(g):
    add_line(f"{g} {st.session_state.t1}")


def add_2q(g):
    add_line(f"{g} {st.session_state.c2} {st.session_state.t2}")


def undo_line():
    lines = [l for l in st.session_state.circuit_text.splitlines() if l.strip()]
    st.session_state.circuit_text = "\n".join(lines[:-1])


def clear_text():
    st.session_state.circuit_text = ""


def new_round():
    s = st.session_state
    boxes = [format(i, f"0{s.g_n}b") for i in range(2 ** s.g_n)]
    s.g_secret = random.choice(boxes)
    s.g_opened = []
    s.g_done = False
    s.g_found = False
    s.g_guesses = 0


def change_mode():
    s = st.session_state
    s.g_n = 2 if s.g_mode.startswith("2") else 3
    s.g_rounds = 0
    s.g_total = 0
    new_round()


def guess(b):
    s = st.session_state
    s.g_opened.append(b)
    s.g_guesses += 1
    if b == s.g_secret:
        s.g_found = True
        s.g_done = True
        s.g_rounds += 1
        s.g_total += s.g_guesses


def give_up():
    st.session_state.g_done = True


def init():
    defaults = dict(
        page="home", nq=2, circuit_text="h 0\ncx 0 1",
        preset="Bell state (entanglement)", shots=1024, t1=0, c2=0, t2=1,
        g_mode="2 qubits · 4 boxes", g_n=2, g_rounds=0, g_total=0,
    )
    for k, v in defaults.items():
        st.session_state.setdefault(k, v)
    if "g_secret" not in st.session_state:
        new_round()


# ---------- navigation ----------
def nav():
    items = [("home", "HOME"), ("lab", "CIRCUIT LAB"), ("game", "TREASURE HUNT"),
             ("runs", "HARDWARE RUNS")]
    cols = st.columns([1, 1, 1, 1, 1])
    for c, (key, label) in zip(cols, items):
        c.button(label, key=f"nav_{key}", on_click=go, args=(key,),
                 type="primary" if st.session_state.page == key else "secondary",
                 use_container_width=True)


# ---------- pages ----------
def landing():
    st.markdown('<div class="hero-title">QUANTUM PLAYGROUND</div>', unsafe_allow_html=True)
    st.markdown('<p class="tagline">&gt; Build quantum circuits. Hunt treasure with Grover\'s '
                'algorithm. Free, in your browser.</p>', unsafe_allow_html=True)
    b1, b2, _ = st.columns([1, 1, 2])
    b1.button("▶ ENTER THE LAB", key="cta_lab", on_click=go, args=("lab",), use_container_width=True)
    b2.button("▶ PLAY TREASURE HUNT", key="cta_game", on_click=go, args=("game",), use_container_width=True)

    st.markdown("### > HOW IT WORKS")
    steps = [
        ("01", "BUILD", "Pick a preset or click gates to assemble a quantum circuit."),
        ("02", "RUN", "A free local simulator runs your circuit 1,024 times."),
        ("03", "LEARN", "See the results as a chart, with a plain-English explanation."),
    ]
    for c, (n, t, d) in zip(st.columns(3), steps):
        c.markdown(f'<div class="card"><div class="step-n">{n}</div><h4>{t}</h4><p>{d}</p></div>',
                   unsafe_allow_html=True)

    st.markdown("### > LIVE DEMO: AN ENTANGLED PAIR")
    left, right = st.columns([1.2, 1])
    with left:
        show_fig(neon_hist(landing_demo()))
    with right:
        st.markdown('<div class="card"><h4>Bell state</h4>'
                    '<p>Two gates (H, then CNOT) link two qubits. Only 00 and 11 ever '
                    'appear, about half each: measuring one qubit instantly tells you the other.</p>'
                    '<p class="small">Open the Circuit Lab to change the circuit yourself.</p></div>',
                    unsafe_allow_html=True)

    st.markdown("### > ABOUT")
    st.markdown(
        f'<div class="card"><h4>{NAME}</h4>'
        f'<p>B.Tech computer science student exploring quantum software with Qiskit. '
        f'This app runs on a simulator; real IBM quantum hardware results are documented '
        f'in the project notebooks.</p>'
        f'<p><a href="{GITHUB_URL}" target="_blank">GitHub</a> &nbsp;|&nbsp; '
        f'<a href="{LINKEDIN_URL}" target="_blank">LinkedIn</a> &nbsp;|&nbsp; '
        f'<a href="{REPO_URL}" target="_blank">Source code</a></p></div>',
        unsafe_allow_html=True)


def lab():
    st.markdown("## > CIRCUIT LAB")
    s = st.session_state
    left, right = st.columns([1, 1.3])

    with left:
        st.selectbox("Preset", list(PRESETS), key="preset", on_change=load_preset)
        st.slider("Qubits", 1, 3, key="nq")
        qopts = list(range(s.nq))

        st.markdown("**Add a gate**")
        a, b = st.columns(2)
        a.selectbox("Target qubit", qopts, key="t1")
        b.write("")
        g_cols = st.columns(6)
        for c, g in zip(g_cols, ["h", "x", "y", "z", "s", "t"]):
            c.button(g.upper(), key=f"g1_{g}", on_click=add_1q, args=(g,), use_container_width=True)

        c1, c2 = st.columns(2)
        c1.selectbox("Control qubit", qopts, key="c2")
        c2.selectbox("Target qubit (2-qubit gates)", qopts, key="t2")
        t_cols = st.columns(3)
        for c, g in zip(t_cols, ["cx", "cz", "swap"]):
            c.button(g.upper(), key=f"g2_{g}", on_click=add_2q, args=(g,),
                     disabled=s.nq < 2, use_container_width=True)

        u, cl = st.columns(2)
        u.button("UNDO LAST", key="undo", on_click=undo_line, use_container_width=True)
        cl.button("CLEAR", key="clear", on_click=clear_text, use_container_width=True)

        st.text_area("Circuit text (editable, one gate per line)", key="circuit_text", height=170)
        st.selectbox("Shots", [256, 1024, 4096], index=1, key="shots")

    with right:
        st.markdown("**LIVE RESULT**")
        text = s.circuit_text
        if not text.strip():
            st.info("Pick a preset or click a gate to start.")
            return
        try:
            qc = build_from_text(text, n=s.nq)
            counts = run_sim(qc, shots=s.shots)
        except Exception as e:
            st.error(f"⚠ {e}")
            return
        show_fig(draw_circuit(qc))
        show_fig(neon_hist(counts))
        st.markdown(f'<div class="card"><h4>WHAT JUST HAPPENED</h4><p>{explain(qc, counts)}</p></div>',
                    unsafe_allow_html=True)
        st.download_button("⬇ DOWNLOAD RUN CARD (PNG)",
                           data=run_card_bytes(text, s.nq, s.shots),
                           file_name="quantum_run_card.png", mime="image/png", key="dl_card")
        st.image(run_card_bytes(text, s.nq, s.shots), caption="Run card (simulator) — screenshot of this run",
                 use_container_width=True)
        with st.expander("LEARN MORE: the math"):
            st.write("The state is a sum of amplitude × basis state. Probability is the amplitude "
                     "squared. Qiskit prints qubit 0 as the RIGHTMOST bit.")
            st.code(math_lines(qc))


def reveal_html(boxes, secret, opened):
    cells = []
    for i, b in enumerate(boxes):
        cls = "qbox treasure" if b == secret else "qbox"
        icon = "◆" if b == secret else ("✖" if b in opened else "·")
        cells.append(f'<div class="{cls}" style="animation-delay:{i * 0.12:.2f}s">'
                     f'<div class="qicon">{icon}</div>{b}</div>')
    return '<div class="box-grid">' + "".join(cells) + "</div>"


def game():
    s = st.session_state
    st.markdown("## > GROVER'S TREASURE HUNT")
    st.write("A treasure is hidden in one box. Click boxes to find it. Then Grover's quantum "
             "search algorithm finds it too, and we compare.")
    st.radio("Difficulty", ["2 qubits · 4 boxes", "3 qubits · 8 boxes"], key="g_mode",
             horizontal=True, on_change=change_mode)

    n = s.g_n
    boxes = [format(i, f"0{n}b") for i in range(2 ** n)]
    N = len(boxes)

    if not s.g_done:
        st.markdown("**Pick a box:**")
        for r in range(0, N, 4):
            for c, b in zip(st.columns(4), boxes[r:r + 4]):
                opened = b in s.g_opened
                c.button(f"✖ {b}" if opened else b, key=f"box_{b}", disabled=opened,
                         on_click=guess, args=(b,), use_container_width=True)
        st.button("ASK THE QUANTUM COMPUTER", key="giveup", on_click=give_up)
        st.caption(f"Guesses so far: {s.g_guesses}")
    else:
        st.markdown(reveal_html(boxes, s.g_secret, s.g_opened), unsafe_allow_html=True)
        counts = run_sim(grover_circuit(s.g_secret))
        top = max(counts, key=counts.get)
        p = counts[top] / sum(counts.values())
        k = grover_iterations(n)
        if s.g_found:
            you = f"You found it in {s.g_guesses} guess(es)."
        else:
            you = "You asked the quantum computer."
        st.markdown(
            f'<div class="card"><h4>RESULT</h4><p>{you} Grover\'s algorithm answered '
            f'<b>{top}</b> using {k} oracle call(s), with {p:.0%} confidence. '
            f'A classical search needs about {(N + 1) / 2:.1f} guesses on average.</p></div>',
            unsafe_allow_html=True)
        show_fig(neon_hist(counts))
        st.button("▶ NEW ROUND", key="newround", on_click=new_round)
        with st.expander("LEARN MORE: why Grover is faster"):
            st.write(f"Searching N unsorted items takes about N/2 guesses classically but only "
                     f"about (pi/4)·sqrt(N) oracle calls with Grover. Here N = {N}, so {k} call(s). "
                     "The oracle flips the sign (phase) of the target; the diffusion step reflects "
                     "every amplitude about the average, boosting the target and shrinking the rest.")
            show_fig(draw_circuit(grover_circuit(s.g_secret)))

    avg = (s.g_total / s.g_rounds) if s.g_rounds else 0
    st.caption(f"Rounds found: {s.g_rounds} | Your average guesses: {avg:.2f} | "
               f"Classical average: {(N + 1) / 2:.1f}")


def runs_gallery():
    st.markdown("## > HARDWARE RUNS")
    st.write("Result cards and dashboard screenshots captured while jobs ran on a real IBM "
             "quantum computer. These are saved images: this app never contacts IBM.")
    metas = []
    for jf in glob.glob(os.path.join(RUNS_DIR, "*.json")):
        try:
            with open(jf, encoding="utf-8") as f:
                m = json.load(f)
            m["_path"] = os.path.join(RUNS_DIR, m.get("image", ""))
            if m.get("source") == "hardware" and os.path.exists(m["_path"]):
                metas.append(m)
        except Exception:
            continue
    metas.sort(key=lambda m: m.get("timestamp", ""), reverse=True)
    if not metas:
        st.info("No hardware runs saved yet. Run notebooks/03_real_hardware.ipynb, "
                "then commit docs/hardware_runs/.")
        return
    for m in metas:
        kind = "DASHBOARD SCREENSHOT" if m.get("kind") == "dashboard" else "RUN CARD"
        st.markdown(
            f'<div class="card"><h4>{kind}</h4>'
            f'<p class="small">backend {html.escape(str(m.get("backend", "?")))} | '
            f'job {html.escape(str(m.get("job_id", "?")))} | '
            f'{html.escape(str(m.get("timestamp", "")))}</p>'
            f'<p>{html.escape(str(m.get("caption", "")))}</p></div>',
            unsafe_allow_html=True)
        st.image(m["_path"], use_container_width=True)


# ---------- main ----------
init()
nav()
page = st.session_state.page
if page == "home":
    landing()
elif page == "lab":
    lab()
elif page == "runs":
    runs_gallery()
else:
    game()
st.markdown('<p class="small">SIMULATOR ONLY. Real IBM hardware runs are documented in the '
            'repository notebooks.</p>', unsafe_allow_html=True)
