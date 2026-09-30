(function () {
  const id = new URLSearchParams(location.search).get("id");
  const e = ENTRIES.find((x) => x.id === id);
  const root = document.getElementById("project");
  if (!e) {
    root.innerHTML = `<div class="phead"><div class="wrap"><a class="back" href="index.html#index">← All work</a><h1>Entry not found</h1></div></div>`;
    return;
  }
  navGithub();
  document.title = `${e.title} | Anish Talla`;

  const block = (title, body) => (body ? `<div class="card block reveal"><h2>${title}</h2>${body}</div>` : "");
  const list = (arr) => (arr && arr.length ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
  const para = (t) => (t ? `<p>${esc(t)}</p>` : "");

  const evidence = (e.evidence || []).length
    ? `<ul class="evlist">${e.evidence.map((x) => `<li><span class="k ${(KIND[x.kind] || {}).cls || ""}">${esc({ code: "code", pr: "pr", live: "live", doc: "doc", paper: "pdf", note: "note" }[x.kind] || "")}</span>
        ${x.url ? `<a href="${x.url}" ${extAttrs(x.url)}>${esc(x.label)}</a>` : `<span>${esc(x.label)}</span>`}</li>`).join("")}</ul>`
    : `<p class="none">Nothing public to link yet. Email me and I can share more.</p>`;

  // The main evidence links also sit in the header as buttons, so they are hard to miss.
  const seen = new Set();
  const linked = (e.evidence || []).filter((x) => x.url);
  const preferred = linked.filter((x) => x.primary);
  const main = preferred.length ? preferred : linked.filter((x) => !seen.has(x.kind) && seen.add(x.kind)).slice(0, 2);
  const watch = e.videos && e.videos.length ? `<a class="btn light" href="#video"><span aria-hidden="true">▶</span> Watch video</a>` : "";
  const actions = main.length || watch ? `<div class="btns">${main.map((x, i) => `<a class="btn ${i ? "ghost" : "primary"}" href="${x.url}" ${extAttrs(x.url)}>${esc(x.label)} ↗</a>`).join("")}${watch}</div>` : "";

  const others = ENTRIES.filter((x) => x.category === e.category && x.id !== e.id && entryDestination(x)).slice(0, 4);

  root.innerHTML = `
    <div class="phead"><div class="wrap">
      <a class="back" href="index.html#${e.category === "project" ? "projects" : e.category === "award" ? "awards" : e.category}">← ${esc(CATEGORIES[e.category])}</a>
      <h1>${esc(e.title)}</h1>
      <div class="meta">${metaLine(e)}</div>
      <p class="sum">${esc(e.summary)}</p>
      ${actions}
    </div></div>
    <div class="wrap pbody">
      <div class="main">
        ${block("My contribution", para(e.contribution))}
        ${block("Results and status", list(e.outcomes))}
        ${e.videos && e.videos.length ? `<div class="vids${e.videos.length === 1 ? " one" : ""} reveal" id="video">${e.videos.map((v) => `<figure class="vid ${v.shape || ""}">
          <video src="${v.src}" poster="${v.poster || ""}" controls playsinline preload="none"></video>
          <figcaption><b>${esc(v.title)}</b>${v.text.split("\n\n").map((t) => `<p>${esc(t)}</p>`).join("")}</figcaption></figure>`).join("")}</div>` : ""}
        ${e.shots && e.shots.length ? `<div class="shots reveal">${e.shots.map((s) => `<img src="${s}" alt="${esc(e.title)} screenshot" loading="lazy">`).join("")}</div>` : ""}
        ${e.demo ? `<div class="reveal" id="demo-slot"></div>` : ""}
        ${e.glance ? `<div class="card block glance reveal"><h2>At a glance</h2><p>${esc(e.glance.text)}</p>
          <div class="bars">${e.glance.bars.map((b) => `<div class="bar"><span>${esc(b.label)}</span><i><u style="width:${b.value}%"></u></i><b>${b.value.toFixed(1)}%</b></div>`).join("")}</div>
          <p class="demo-note">${esc(e.glance.note)}</p></div>` : ""}
        ${block("The problem", para(e.problem))}
        ${block("How it works", list(e.details))}
        ${e.deliverables ? block("What I built", `<div class="deliv">${e.deliverables.map((d) => `<div><b>${esc(d.name)}</b>${esc(d.text)}</div>`).join("")}</div>`) : ""}
      </div>
      <aside class="side">
        <div class="card reveal"><h4>Evidence & links</h4>${evidence}</div>
        ${e.tech && e.tech.length ? `<div class="card reveal"><h4>Technologies</h4>${stack(e.tech)}</div>` : ""}
        ${others.length ? `<div class="card reveal"><h4>More in ${esc(CATEGORIES[e.category])}</h4><ul class="evlist">${others.map((o) => `<li><a href="${entryDestination(o)}" ${extAttrs(entryDestination(o))}>${esc(o.title)}</a></li>`).join("")}</ul></div>` : ""}
      </aside>
    </div>`;

  if (e.demo) mountDemo(e.demo, document.getElementById("demo-slot"));
  initReveal();
  // The page is rendered by script, so the browser cannot jump to #video on its own.
  if (location.hash === "#video") {
    const jump = () => document.getElementById("video")?.scrollIntoView({ block: "start" });
    requestAnimationFrame(jump);
    addEventListener("load", jump, { once: true });
  }
})();
