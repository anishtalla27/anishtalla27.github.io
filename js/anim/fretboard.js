// StringMap demo: a simplified version of the app's fingering engine, running for real in the browser.
// For each note, list every playable (string, fret), then use dynamic programming to choose the cheapest route.
window.mountFretboard = function (el) {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const OPEN = [64, 59, 55, 50, 45, 40]; // high E first, like tablature
  const NAMES = ["e", "B", "G", "D", "A", "E"];
  const FRETS = 12;
  const MELODY = [64, 67, 69, 71, 72, 71, 69, 67, 64, 62, 60, 62, 64];
  // finger: moving within a four-fret hand span. shift: moving the whole hand. open strings are "free" unless strict.
  const PROFILES = {
    beginner: { label: "Beginner", finger: 0.3, shift: 3, string: 0.4, high: 1.5, low: 0, open: -1.5 },
    position: { label: "Stay in position", finger: 0.1, shift: 8, string: 0.2, high: 0, low: 0.9, open: 3 },
    minimal: { label: "Minimal movement", finger: 1, shift: 1, string: 0.1, high: 0, low: 0, open: 0, strict: true },
  };

  const candidates = (midi) => OPEN.map((o, s) => ({ s, f: midi - o })).filter((c) => c.f >= 0 && c.f <= FRETS);
  const nodeCost = (c, w) => w.high * Math.max(0, c.f - 4) + w.low * (c.f > 0 ? Math.max(0, 5 - c.f) : 0) + (c.f === 0 ? w.open : 0);
  function stepCost(a, b, w) {
    const move = !w.strict && (a.f === 0 || b.f === 0) ? 0 : Math.abs(a.f - b.f);
    return w.finger * Math.min(move, 3) + w.shift * Math.max(0, move - 3) + w.string * Math.abs(a.s - b.s);
  }

  function solve(w) {
    const layers = MELODY.map(candidates);
    let evals = 0;
    const best = layers.map((l) => l.map(() => ({ cost: Infinity, prev: -1 })));
    layers[0].forEach((c, j) => (best[0][j].cost = nodeCost(c, w)));
    for (let i = 1; i < layers.length; i++) {
      layers[i].forEach((c, j) => {
        layers[i - 1].forEach((p, k) => {
          evals++;
          const cost = best[i - 1][k].cost + stepCost(p, c, w) + nodeCost(c, w);
          if (cost < best[i][j].cost) best[i][j] = { cost, prev: k }; // strict <, so ties resolve the same way every time
        });
      });
    }
    let j = best[best.length - 1].reduce((m, b, idx, arr) => (b.cost < arr[m].cost ? idx : m), 0);
    const total = best[best.length - 1][j].cost;
    const path = [];
    for (let i = layers.length - 1; i >= 0; i--) { path.unshift(layers[i][j]); j = best[i][j].prev; }
    return { layers, path, total, evals };
  }

  // geometry
  const W = 760, H = 214, NUT = 64, FW = 54, TOP = 34, GAP = 28;
  const X = (f) => (f === 0 ? NUT - 24 : NUT + (f - 0.5) * FW);
  const Y = (s) => TOP + s * GAP;

  el.innerHTML = `
    <div class="demo">
      <div class="demo-head">
        <div><div class="fig">FIG. 01 / StringMap</div><h3>Choosing where to play each note</h3>
        <p>A note can have several positions on the guitar neck. The rings show the available positions, and the line shows the route chosen by dynamic programming. Choose a playing preference to see how the route changes.</p></div>
        <div class="seg" role="tablist">${Object.entries(PROFILES).map(([k, p], i) => `<button data-p="${k}" class="${i ? "" : "on"}">${p.label}</button>`).join("")}</div>
      </div>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Guitar fretboard showing the chosen fingering route">
        <rect x="${NUT}" y="${TOP - 12}" width="${FW * FRETS}" height="${GAP * 5 + 24}" fill="#fbfaf7" stroke="#e3e9f2"/>
        ${[3, 5, 7, 9].map((f) => `<circle cx="${X(f)}" cy="${Y(2.5)}" r="5" fill="#e6e3da"/>`).join("")}
        <circle cx="${X(12)}" cy="${Y(1.5)}" r="5" fill="#e6e3da"/><circle cx="${X(12)}" cy="${Y(3.5)}" r="5" fill="#e6e3da"/>
        ${Array.from({ length: FRETS + 1 }, (_, f) => `<line x1="${NUT + f * FW}" x2="${NUT + f * FW}" y1="${TOP - 12}" y2="${Y(5) + 12}" stroke="${f ? "#c5cedc" : "#0b1f3a"}" stroke-width="${f ? 1.5 : 4}"/>`).join("")}
        ${OPEN.map((_, s) => `<line x1="${NUT - 40}" x2="${NUT + FW * FRETS}" y1="${Y(s)}" y2="${Y(s)}" stroke="#8d99ad" stroke-width="${0.8 + s * 0.32}"/>
          <text x="10" y="${Y(s) + 4}" class="fb-lab">${NAMES[s]}</text>`).join("")}
        ${[3, 5, 7, 9, 12].map((f) => `<text x="${X(f)}" y="${H - 4}" text-anchor="middle" class="fb-lab">${f}</text>`).join("")}
        <g data-cands></g><polyline data-route fill="none" stroke="#1d6bff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.55"/><g data-path></g>
      </svg>
      <div class="readout">
        <span>Notes <b>${MELODY.length}</b></span><span>Playable positions <b data-r="cands">0</b></span>
        <span>Transitions scored <b data-r="evals">0</b></span><span>Route cost <b data-r="cost">0</b></span>
        <span>Frets used <b data-r="span">0</b></span>
        <button class="linkbtn" data-replay>Replay</button>
      </div>
      <p class="demo-note">This demo scores finger movement, hand shifts, string changes, and open strings. The app's engine also scores stretch and supports locked positions. Complexity is O(notes × candidates²).</p>
    </div>`;

  const gC = el.querySelector("[data-cands]"), gP = el.querySelector("[data-path]"), route = el.querySelector("[data-route]");
  const out = (k, v) => (el.querySelector(`[data-r="${k}"]`).textContent = v);
  let run = 0, current = "beginner";

  function play(profile) {
    current = profile;
    const token = ++run;
    const { layers, path, total, evals } = solve(PROFILES[profile]);
    const seen = new Set();
    gC.innerHTML = ""; gP.innerHTML = ""; route.setAttribute("points", "");
    out("cands", layers.reduce((n, l) => n + l.length, 0)); out("evals", evals); out("cost", total.toFixed(1));
    const used = path.filter((c) => c.f > 0).map((c) => c.f);
    out("span", used.length ? `${Math.min(...used)} to ${Math.max(...used)}` : "open");

    const pts = [], picks = {};
    const step = (i) => {
      if (token !== run) return;
      if (i >= path.length) return;
      layers[i].forEach((c) => {
        const k = c.s + ":" + c.f;
        if (seen.has(k)) return;
        seen.add(k);
        gC.insertAdjacentHTML("beforeend", `<circle class="fb-cand" cx="${X(c.f)}" cy="${Y(c.s)}" r="9"/>`);
      });
      const c = path[i];
      pts.push(`${X(c.f)},${Y(c.s)}`);
      route.setAttribute("points", pts.join(" "));
      // a position can be reused by later notes, so its marker lists every note number that lands there
      const pk = c.s + ":" + c.f;
      if (picks[pk]) {
        picks[pk].nums.push(i + 1);
        const t = picks[pk].el.querySelector("text");
        t.textContent = picks[pk].nums.join("·");
        t.setAttribute("class", "multi");
        picks[pk].el.querySelector("circle").setAttribute("r", 12);
      } else {
        gP.insertAdjacentHTML("beforeend", `<g class="fb-pick"><circle cx="${X(c.f)}" cy="${Y(c.s)}" r="10"/><text x="${X(c.f)}" y="${Y(c.s) + 3.5}" text-anchor="middle">${i + 1}</text></g>`);
        picks[pk] = { el: gP.lastElementChild, nums: [i + 1] };
      }
      if (still) step(i + 1); else setTimeout(() => step(i + 1), 260);
    };
    step(0);
  }

  el.querySelector(".seg").addEventListener("click", (ev) => {
    const b = ev.target.closest("button"); if (!b) return;
    el.querySelectorAll(".seg button").forEach((x) => x.classList.toggle("on", x === b));
    play(b.dataset.p);
  });
  el.querySelector("[data-replay]").addEventListener("click", () => play(current));

  // start the first run when the demo scrolls into view
  let started = false;
  const start = () => { if (!started) { started = true; play(current); } };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((it) => { if (it[0].isIntersecting) { start(); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
  } else start();
};
