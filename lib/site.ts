export type Page = "home" | "lab" | "game" | "runs";

export const NAME = "Abhishek Amarvalli";
export const GITHUB_URL = "https://github.com/AbhishekAmarvalli";
export const LINKEDIN_URL = "https://www.linkedin.com/in/abhishekamarvalli";
export const REPO_URL = `${GITHUB_URL}/quantum-playground`;

export const PRESETS: Record<string, { n: number; text: string }> = {
  "Bell state (entanglement)": { n: 2, text: "h 0\ncx 0 1" },
  "GHZ state (3 qubits)": { n: 3, text: "h 0\ncx 0 1\ncx 1 2" },
  Superposition: { n: 1, text: "h 0" },
  "Interference (H-Z-H)": { n: 1, text: "h 0\nz 0\nh 0" },
  "Grover search for 11": {
    n: 2,
    text: "h 0\nh 1\ncz 0 1\nh 0\nh 1\nx 0\nx 1\ncz 0 1\nx 0\nx 1\nh 0\nh 1",
  },
};
