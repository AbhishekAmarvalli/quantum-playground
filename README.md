# ⚛️ Quantum Playground

> Build quantum circuits. Hunt treasure with Grover's algorithm. Free, in your browser.

[![Open in Streamlit](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://quantum-playground.streamlit.app)

**Live app (Streamlit): <https://quantum-playground.streamlit.app>**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAbhishekAmarvalli%2Fquantum-playground)

The app is now also a static Next.js build that runs on Vercel, Netlify or any static host with no Python backend. Click the button above to deploy your own copy in one click (free); once deployed, send me the URL and I will add it here.

A dark, Matrix-green Streamlit app for learning quantum computing by doing: assemble circuits with gate buttons or plain text, watch the simulator run them live, and play a treasure hunt against Grover's search algorithm.

![Landing page](docs/screenshots/landing.png)

## What's inside

| Page | What it does |
| --- | --- |
| **Home** | Hero, a 3-step "how it works", a live Bell-state demo, and links to the author. |
| **Circuit Lab** | Presets, one-click gates (H, X, Y, Z, S, T, CX, CZ, SWAP), undo/clear, an editable circuit text box, 1–3 qubits, 256/1024/4096 shots. Diagram, histogram and a plain-English "What just happened" update live. Downloadable PNG run card. |
| **Treasure Hunt** | A treasure hides in one of 4 (or 8) boxes. Click boxes to search classically, then let Grover's algorithm find it with 1 oracle call (2 for 8 boxes) and compare. Staggered reveal animation, histogram, and a "why Grover is faster" explainer. |
| **Hardware Runs** | Saved run cards and IBM dashboard screenshots from real hardware jobs, newest first. Images only — the app never contacts IBM. Also shows one clearly-labeled simulator example, so the page is not empty before real runs are added. |

### Circuit Lab

![Circuit Lab](docs/screenshots/lab.png)

### Grover's Treasure Hunt

![Treasure Hunt](docs/screenshots/game.png)

### Phone layout

<img src="docs/screenshots/landing_mobile.png" alt="Landing page on a 390px phone" width="360">

### Simulator run card (downloadable PNG)

![Run card](docs/screenshots/run_card_example.png)

## Deploy to Vercel (or Netlify)

The Next.js version needs no server and no environment variables:

```bash
npm install
npm run build   # also copies docs/hardware_runs into public/
npm run start
```

Then either click **Deploy with Vercel** above, or run `npx vercel --prod` from the repo root. Hardware run images are picked up at build time from `docs/hardware_runs/`, so committing a new PNG + JSON there is enough to publish it.

## Run it locally

No install needed: try the live app at <https://quantum-playground.streamlit.app>.

For the Next.js version:

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Or run it on your machine:

```bash
pip install -r requirements.txt
streamlit run app.py
```

Then open <http://localhost:8501>.

Requirements: Python 3.12+, `streamlit`, `qiskit`, `qiskit-aer`, `matplotlib`, `pylatexenc`.

## Project structure

```
app.py                      Streamlit UI only (pages, styling, callbacks)
qplay.py                    All quantum logic (build_from_text, run_sim,
                            grover_circuit, grover_iterations, render_snapshot)
.streamlit/config.toml      Dark neon theme
docs/screenshots/           README screenshots
docs/hardware_runs/         Saved run cards / dashboard images + JSON metadata
```

Every circuit is simulated locally with Qiskit Aer. Nothing is sent anywhere except the JetBrains Mono stylesheet request to Google Fonts.

## Notes

- Qiskit prints qubit 0 as the **rightmost** bit, so the box labelled `10` is qubit 0 in state 0 and qubit 1 in state 1.
- Keep circuits at 3 qubits or fewer: diagrams stay readable and results are instant.
- The app is simulator-only. Real IBM hardware runs were done separately in notebooks and are shown as saved images on the **Hardware Runs** page.

## Author

**Abhishek Amarvalli** — B.Tech computer science student exploring quantum software with Qiskit.

[GitHub](https://github.com/AbhishekAmarvalli) · [LinkedIn](https://www.linkedin.com/in/abhishekamarvalli) · [Live app](https://quantum-playground.streamlit.app)
