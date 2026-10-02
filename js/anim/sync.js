// TrackMyShuttle demo: the transactional outbox pattern, sanitized (no company data).
// A write and its outbox row commit together. A worker delivers to Airtable, retries failures,
// and an idempotency key stops a duplicate from being applied twice.
window.mountSync = function (el) {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const W = 760, H = 168;
  const N = { app: { x: 20, w: 120, label: "Hub app" }, pg: { x: 210, w: 170, label: "PostgreSQL" }, wk: { x: 450, w: 110, label: "Sync worker" }, at: { x: 630, w: 110, label: "Airtable" } };
  const BY = 50, BH = 70, MID = BY + BH / 2;
  const box = (n, extra = "") => `<g><rect x="${n.x}" y="${BY}" width="${n.w}" height="${BH}" rx="6" class="sy-box"/><text x="${n.x + n.w / 2}" y="${BY - 10}" text-anchor="middle" class="sy-lab">${n.label}</text>${extra}</g>`;
  const wire = (a, b) => `<line x1="${a.x + a.w}" x2="${b.x}" y1="${MID}" y2="${MID}" class="sy-wire"/>`;

  el.innerHTML = `
    <div class="demo">
      <div class="demo-head">
        <div><div class="fig">FIG. 03 / TrackMyShuttle</div><h3>Syncing PostgreSQL and Airtable</h3>
        <p>The Hub saves data in PostgreSQL, and staff also use Airtable. A transactional outbox queues changes for Airtable. The worker retries failed API requests, and idempotency checks stop it from applying the same change twice.</p></div>
      </div>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Animated diagram of a transactional outbox syncing PostgreSQL to Airtable">
        ${wire(N.app, N.pg)}${wire(N.pg, N.wk)}${wire(N.wk, N.at)}
        ${box(N.app, `<rect x="36" y="72" width="60" height="6" rx="3" class="sy-ui"/><rect x="36" y="86" width="88" height="6" rx="3" class="sy-ui"/><rect x="36" y="100" width="44" height="6" rx="3" class="sy-ui"/>`)}
        ${box(N.pg, `<text x="${N.pg.x + 12}" y="70" class="sy-small">records</text><text x="${N.pg.x + 96}" y="70" class="sy-small">outbox</text>
          <line x1="${N.pg.x + 85}" x2="${N.pg.x + 85}" y1="${BY + 8}" y2="${BY + BH - 8}" class="sy-wire"/>
          <g data-recs></g><g data-outbox></g>`)}
        ${box(N.wk, `<g data-gear transform="translate(${N.wk.x + N.wk.w / 2} ${MID})"><circle r="13" class="sy-gear"/><path d="M-13,0H13M0,-13V13M-9,-9L9,9M-9,9L9,-9" class="sy-gear"/><circle r="5" fill="#fff" stroke="none"/></g>`)}
        ${box(N.at, `<g data-rows></g>`)}
        <rect x="${N.pg.x - 8}" y="${BY - 28}" width="${N.pg.w + 16}" height="${BH + 38}" rx="8" class="sy-txn" data-txn/>
        <text x="${N.pg.x + N.pg.w / 2}" y="${BY + BH + 28}" text-anchor="middle" class="sy-small" data-txnlab opacity="0">one transaction</text>
        <circle r="7" class="sy-pkt" data-pkt opacity="0"/>
        <text class="sy-small" data-flag text-anchor="middle" opacity="0"></text>
      </svg>
      <div class="log" data-log>&nbsp;</div>
      <p class="demo-note">The production system also handles superseded updates, schema drift checks on stable field IDs, and a cursor rewind for incremental sync. Source code is private.</p>
    </div>`;

  const q = (s) => el.querySelector(s);
  const pkt = q("[data-pkt]"), log = q("[data-log]"), flag = q("[data-flag]"), gear = q("[data-gear]");
  let vis = true, recs = 0, atRows = 0, gearA = 0;
  whenVisible(el, (v) => (vis = v));

  const sleep = (ms) => new Promise((r) => setTimeout(r, still ? 0 : ms));
  async function tween(ms, fn) {
    if (still) return fn(1);
    const t0 = performance.now();
    let paused = 0;
    return new Promise((res) => {
      (function f(now) {
        if (!vis) { paused += 16; return setTimeout(() => requestAnimationFrame(f), 200); }
        const k = Math.min(1, (now - t0 - paused) / ms);
        fn(k < 0 ? 0 : k * k * (3 - 2 * k));
        k < 1 ? requestAnimationFrame(f) : res();
      })(t0);
    });
  }
  const say = (m) => (log.textContent = "> " + m);
  async function move(x1, x2, cls = "") {
    pkt.setAttribute("class", "sy-pkt " + cls); pkt.setAttribute("cy", MID); pkt.setAttribute("opacity", 1);
    await tween(700, (k) => pkt.setAttribute("cx", x1 + (x2 - x1) * k));
  }
  async function spin() { await tween(450, (k) => gear.setAttribute("transform", `translate(${N.wk.x + N.wk.w / 2} ${MID}) rotate(${gearA + k * 90})`)); gearA += 90; }
  async function show(text, x, cls) {
    flag.textContent = text; flag.setAttribute("x", x); flag.setAttribute("y", BY + BH + 28); flag.setAttribute("class", "sy-small " + cls); flag.setAttribute("opacity", 1);
    await sleep(1100); flag.setAttribute("opacity", 0);
  }
  function slot(group, i, x, cls) {
    const y = BY + 28 + (i % 3) * 12;
    let r = q(`[data-${group}] [data-i="${i % 3}"]`);
    if (!r) { q(`[data-${group}]`).insertAdjacentHTML("beforeend", `<rect data-i="${i % 3}" x="${x}" y="${y}" width="62" height="7" rx="3.5"/>`); r = q(`[data-${group}] [data-i="${i % 3}"]`); }
    r.setAttribute("class", cls);
  }

  async function write() {
    const i = recs++;
    say(`app saves change #${i + 1}`);
    await move(N.app.x + N.app.w, N.pg.x, "");
    pkt.setAttribute("opacity", 0);
    q("[data-txn]").classList.add("on"); q("[data-txnlab]").setAttribute("opacity", 1);
    slot("recs", i, N.pg.x + 12, "sy-row"); slot("outbox", i, N.pg.x + 96, "sy-row pending");
    say("record and outbox row commit together, or not at all");
    await sleep(1200);
    q("[data-txn]").classList.remove("on"); q("[data-txnlab]").setAttribute("opacity", 0);
    return i;
  }
  async function deliver(i, { fail = false, duplicate = false } = {}) {
    say("worker claims the pending outbox row");
    await move(N.pg.x + N.pg.w, N.wk.x, "pending"); pkt.setAttribute("opacity", 0); await spin();
    if (fail) {
      say("Airtable returns 429: rate limited");
      await move(N.wk.x + N.wk.w, N.at.x, "pending"); pkt.setAttribute("class", "sy-pkt bad");
      await show("429", N.at.x + N.at.w / 2, "bad");
      await move(N.at.x, N.wk.x + N.wk.w, "bad"); pkt.setAttribute("opacity", 0);
      say("row stays pending, retry after backoff"); await sleep(900); await spin();
    }
    say(`deliver with idempotency key chg-${i + 1}`);
    await move(N.wk.x + N.wk.w, N.at.x, "pending"); pkt.setAttribute("opacity", 0);
    slot("rows", atRows++, N.at.x + 24, "sy-row ok"); slot("outbox", i, N.pg.x + 96, "sy-row ok");
    say("applied, outbox row marked sent"); await sleep(900);
    if (duplicate) {
      say(`network hiccup: chg-${i + 1} gets sent a second time`);
      await spin(); await move(N.wk.x + N.wk.w, N.at.x, "dup");
      await show("key already seen: skipped", N.at.x + N.at.w / 2 - 30, "dup"); pkt.setAttribute("opacity", 0);
      say("duplicate ignored, Airtable still has one copy"); await sleep(900);
    }
  }

  (async function loop() {
    if (still) { const i = await write(); await deliver(i); say("write, outbox, deliver, mark sent"); return; }
    for (;;) {
      await deliver(await write());
      await deliver(await write(), { fail: true });
      await deliver(await write(), { duplicate: true });
      await sleep(1200);
    }
  })();
};
