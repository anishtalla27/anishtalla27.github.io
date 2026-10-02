// Adaptive gripper demo: an illustration of the experiment design (not measured data).
// A parallel-jaw gripper holds an object, the object starts to slip, the vibration channel spikes,
// the controller detects it and tightens the grip.
window.mountGripper = function (el) {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.innerHTML = `
    <div class="demo">
      <div class="demo-head">
        <div><div class="fig">FIG. 02 / Adaptive grasping research</div><h3>Testing slip detection</h3>
        <p>I am studying whether inexpensive force and vibration sensors can detect slip early enough for a gripper to recover. This animation shows the planned control loop.</p></div>
      </div>
      <canvas height="300"></canvas>
      <div class="log" data-log>&nbsp;</div>
      <p class="demo-note">This animation illustrates the experiment design using synthetic signals. It does not show measurements from my apparatus.</p>
    </div>`;
  const canvas = el.querySelector("canvas"), ctx = canvas.getContext("2d"), log = el.querySelector("[data-log]");
  const CYCLE = 10, T_GRIP = 1, T_SLIP = 4, T_DETECT = 4.22, T_HOLD = 4.7, T_RELEASE = 8.6, WINDOW = 6;
  let w, h, dpr, vis = true, t0 = performance.now(), lastMsg = "";

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = w < 560 ? 520 : 300;
    canvas.style.height = h + "px";
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // deterministic noise so the traces are a pure function of time
  const noise = (t, k) => Math.sin(t * 91.7 * k) * 0.5 + Math.sin(t * 37.3 * k + 1.3) * 0.3 + Math.sin(t * 173.1 * k + 0.4) * 0.2;
  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

  function force(t) { // 0..1
    if (t < 0) return 0;
    let f = 0.5 * ease(t / T_GRIP);
    if (t > T_SLIP) f -= 0.14 * ease((t - T_SLIP) / 0.2);
    if (t > T_DETECT) f += 0.44 * ease((t - T_DETECT) / (T_HOLD - T_DETECT));
    if (t > T_RELEASE) f *= 1 - ease((t - T_RELEASE) / 0.8);
    return Math.max(0, f + noise(t, 1) * 0.012);
  }
  function vib(t) { // -1..1
    let a = 0.04;
    if (t > T_SLIP && t < T_HOLD + 0.2) a += 0.85 * Math.exp(-Math.pow((t - (T_SLIP + 0.28)) / 0.22, 2));
    if (t > T_GRIP - 0.1 && t < T_GRIP + 0.25) a += 0.3 * Math.exp(-Math.pow((t - T_GRIP) / 0.08, 2));
    return noise(t, 2.3) * a;
  }
  function slipY(t) { // px the object has slid
    if (t < T_SLIP) return 0;
    if (t > T_RELEASE) return 22 * (1 - ease((t - T_RELEASE) / 0.8));
    return 22 * ease((t - T_SLIP) / (T_HOLD - T_SLIP));
  }

  function drawGripper(t, gw) {
    const cx = gw / 2, top = 28;
    const closed = ease(t / T_GRIP) * (1 - ease((t - T_RELEASE) / 0.8));
    const squeeze = t > T_DETECT ? ease((t - T_DETECT) / (T_HOLD - T_DETECT)) * (1 - ease((t - T_RELEASE) / 0.8)) : 0;
    const objW = 64 - squeeze * 5, open = 34;
    const jawX = objW / 2 + open * (1 - closed);
    const oy = 118 + slipY(t);

    // mount, rail, rack
    ctx.fillStyle = "#0b1f3a";
    ctx.fillRect(cx - 12, top - 28, 24, 30);
    ctx.beginPath(); ctx.roundRect(cx - 86, top, 172, 18, 4); ctx.fill();
    ctx.strokeStyle = "#3c5680"; ctx.lineWidth = 1;
    for (let i = -80; i <= 80; i += 8) { ctx.beginPath(); ctx.moveTo(cx + i, top + 12); ctx.lineTo(cx + i, top + 18); ctx.stroke(); }
    // pinion
    ctx.save(); ctx.translate(cx, top + 9); ctx.rotate(closed * 2.2 + squeeze * 0.4);
    ctx.fillStyle = "#1d6bff"; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke();
    ctx.restore();

    // object
    ctx.fillStyle = "#f5a524";
    ctx.beginPath(); ctx.roundRect(cx - objW / 2, oy, objW, 96, 10); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(cx - objW / 2 + 8, oy + 12, 5, 60);
    // reference tick marks for the camera ground truth
    ctx.strokeStyle = "#c5cedc"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(14, 118); ctx.lineTo(gw - 14, 118); ctx.stroke(); ctx.setLineDash([]);

    // jaws with sensor pads
    for (const dir of [-1, 1]) {
      const x = cx + dir * jawX;
      ctx.fillStyle = "#24344d";
      ctx.beginPath(); ctx.roundRect(dir < 0 ? x - 16 : x, top + 18, 16, 170, 4); ctx.fill();
      ctx.fillStyle = t > T_DETECT && t < T_RELEASE ? "#12946a" : "#1d6bff";
      ctx.fillRect(dir < 0 ? x - 4 : x, 128, 4, 56);
    }
    ctx.fillStyle = "#5f6f86"; ctx.font = '11px "IBM Plex Mono", ui-monospace, monospace'; ctx.textAlign = "left";
    ctx.fillText("FSR + piezo", 14, 160); ctx.fillText("sensor pads", 14, 174);
    ctx.fillText("camera ref.", 14, 112);
    if (slipY(t) > 1) { ctx.fillStyle = "#d64545"; ctx.fillText(`slip ${slipY(t).toFixed(0)} px`, gw - 86, 112); }
  }

  function drawTraces(t, x0, yOff) {
    const pw = w - x0 - 8, rows = [{ y: yOff + 30, hh: 100, name: "FORCE  (FSR)", col: "#1d6bff", fn: (tt) => 1 - force(tt) / 1.0 }, { y: yOff + 166, hh: 100, name: "VIBRATION  (piezo)", col: "#12946a", fn: (tt) => 0.5 - vib(tt) * 0.5 }];
    ctx.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    for (const r of rows) {
      ctx.fillStyle = "#fbfcfe"; ctx.strokeStyle = "#e3e9f2"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.rect(x0, r.y, pw, r.hh); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#eef2f8";
      for (let i = 1; i < 6; i++) { const gx = x0 + (pw * i) / 6; ctx.beginPath(); ctx.moveTo(gx, r.y); ctx.lineTo(gx, r.y + r.hh); ctx.stroke(); }
      for (let i = 1; i < 4; i++) { const gy = r.y + (r.hh * i) / 4; ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x0 + pw, gy); ctx.stroke(); }
      ctx.fillStyle = "#5f6f86"; ctx.textAlign = "left"; ctx.fillText(r.name, x0 + 8, r.y + 15);

      ctx.strokeStyle = r.col; ctx.lineWidth = 1.6; ctx.beginPath();
      const N = Math.floor(pw / 1.5);
      for (let i = 0; i <= N; i++) {
        const tt = t - WINDOW + (WINDOW * i) / N;
        const v = tt < 0 ? r.fn(-1) : r.fn(tt);
        const px = x0 + (pw * i) / N, py = r.y + 6 + v * (r.hh - 12);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();

      // event markers
      for (const [te, label, col] of [[T_SLIP, "slip starts", "#d64545"], [T_DETECT, "detected", "#0b1f3a"]]) {
        if (t < te || t - te > WINDOW) continue;
        const px = x0 + pw * (1 - (t - te) / WINDOW);
        ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(px, r.y); ctx.lineTo(px, r.y + r.hh); ctx.stroke(); ctx.setLineDash([]);
        if (r === rows[1]) { ctx.fillStyle = col; ctx.textAlign = te === T_SLIP ? "right" : "left"; ctx.fillText(label, px + (te === T_SLIP ? -5 : 5), r.y + r.hh - 8); }
      }
    }
  }

  function say(t) {
    const msg = t < T_GRIP ? "closing: vision sets the initial jaw opening"
      : t < T_SLIP ? "holding: force steady, vibration quiet"
      : t < T_DETECT ? "object starts to slip: vibration spikes, force sags"
      : t < T_HOLD ? "slip detected: tightening grip"
      : t < T_RELEASE ? "recovered: holding at higher force"
      : "release";
    if (msg !== lastMsg) { log.textContent = "> " + msg; lastMsg = msg; }
  }

  function frame(now) {
    const t = still ? 5.4 : ((now - t0) / 1000) % CYCLE;
    ctx.clearRect(0, 0, w, h);
    const narrow = w < 560;
    const gw = narrow ? w : 300;
    drawGripper(t, gw);
    drawTraces(t, narrow ? 4 : gw + 16, narrow ? 222 : 0);
    say(t);
    if (vis && !still) requestAnimationFrame(frame);
  }

  size();
  window.addEventListener("resize", () => { size(); if (still) frame(0); });
  whenVisible(canvas, (v) => { const was = vis; vis = v; if (v && (!was || still)) requestAnimationFrame(frame); });
  requestAnimationFrame(frame);
};
