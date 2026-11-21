"use client";

import { useEffect, useState } from "react";
import MatrixRain from "./MatrixRain";
import Home from "./Home";
import Lab from "./Lab";
import Game from "./Game";
import Runs from "./Runs";
import { type Page } from "@/lib/site";

const NAV: [Page, string][] = [
  ["home", "HOME"],
  ["lab", "CIRCUIT LAB"],
  ["game", "TREASURE HUNT"],
  ["runs", "HARDWARE RUNS"],
];

const PAGES: Page[] = ["home", "lab", "game", "runs"];

export default function Playground() {
  const [page, setPage] = useState<Page>("home");

  // Deep links (#lab, #game, #runs) so a section can be shared or reloaded.
  useEffect(() => {
    const read = () => {
      const hash = window.location.hash.replace("#", "");
      if (PAGES.includes(hash as Page)) setPage(hash as Page);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const go = (next: Page) => {
    setPage(next);
    window.history.replaceState(null, "", `#${next}`);
  };

  return (
    <>
      <MatrixRain />
      <main className="wrap">
        <nav className="nav" aria-label="Sections">
          {NAV.map(([key, label]) => (
            <button
              key={key}
              className={page === key ? "btn primary" : "btn"}
              aria-current={page === key ? "page" : undefined}
              onClick={() => go(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        {page === "home" && <Home go={go} />}
        {page === "lab" && <Lab />}
        {page === "game" && <Game />}
        {page === "runs" && <Runs />}

        <p className="footer-note">
          SIMULATOR ONLY. Real IBM hardware runs are documented in the repository notebooks.
        </p>
      </main>
    </>
  );
}
