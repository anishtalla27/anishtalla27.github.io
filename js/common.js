// Shared helpers for index.html and project.html
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Text colors group entries by state: done, active, early, private.
function statusClass(status) {
  return { shipped: "c-done", completed: "c-done", ongoing: "c-active", "in progress": "c-active", submitted: "c-active", accepted: "c-done",
    prototype: "c-early", concept: "c-early", "private code": "c-private" }[(status || "").toLowerCase()] || "";
}
const KIND = {
  code: { card: "code on GitHub", short: "code", cls: "k-code" },
  pr: { card: "pull requests on GitHub", short: "pull requests", cls: "k-pr" },
  live: { card: "live site", short: "live site", cls: "k-live" },
  doc: { card: "view evidence", short: "evidence", cls: "k-doc" },
  paper: { card: "paper (PDF)", short: "paper", cls: "k-paper" },
};
const extAttrs = (url) => (/^https?:|\.pdf$/.test(url) ? 'target="_blank" rel="noopener"' : "");

// Status, role, org and dates read as one plain line of text.
function metaLine(e) {
  const rest = [e.role, e.org, e.dates].filter(Boolean).map(esc).join(", ");
  const st = e.status ? `<span class="st ${statusClass(e.status)}">${esc(e.status.toLowerCase())}</span>` : "";
  return st + (st && rest ? " / " : "") + rest;
}

const stack = (arr, n) => (arr && arr.length ? `<p class="stack">${arr.slice(0, n || arr.length).map(esc).join(" · ")}${n && arr.length > n ? " · …" : ""}</p>` : "");

function firstLink(e) {
  return (e.evidence || []).find((x) => x.url && !x.url.startsWith("project.html"));
}

// Only offer a detail page when it contains material beyond the card summary.
function hasMoreContent(e) {
  return Boolean(e.problem || e.contribution || e.demo || e.glance ||
    (e.details || []).length || (e.outcomes || []).length ||
    (e.deliverables || []).length || (e.shots || []).length ||
    (e.evidence || []).filter((x) => x.url).length > 1);
}

function entryDestination(e) {
  if (hasMoreContent(e)) return `project.html?id=${e.id}`;
  const link = firstLink(e);
  return link ? link.url : null;
}

// The whole card opens the project page (stretched "Read more" link); the evidence note is its own link.
function cardHTML(e, i, big, compact = false) {
  const link = firstLink(e);
  const k = link && KIND[link.kind];
  const more = hasMoreContent(e);
  return `
  <article class="card reveal ${big ? "big" : ""} ${compact ? "compact" : ""}" style="--d:${(i % 3) * 70}ms">
    ${window.coverFor ? coverFor(e) : ""}
    ${compact ? '<div class="card-copy">' : ""}
    <h3>${esc(e.title)}</h3>
    <div class="meta">${metaLine(e)}</div>
    <p class="sum">${esc(e.summary)}</p>
    ${compact ? "" : stack(e.tech, big ? 8 : 5)}
    ${more || k || (e.videos && e.videos.length) ? `<div class="more">${more ? `<a class="go" href="project.html?id=${e.id}" aria-label="Read more about ${esc(e.title)}">Read more <span aria-hidden="true">→</span></a>` : ""}${e.videos && e.videos.length ? `<a class="vidlink" href="project.html?id=${e.id}#video"><span aria-hidden="true">▶</span> Watch video</a>` : ""}${k ? `<a class="ext ${k.cls}" href="${link.url}" ${extAttrs(link.url)}>${esc(link.label)} ↗</a>` : ""}</div>` : ""}
    ${compact ? "</div>" : ""}
  </article>`;
}

const GH_ICON = '<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';

// Adds the GitHub mark and label to the top bar on every page.
function navGithub() {
  const wrap = document.querySelector(".nav .wrap");
  if (wrap) wrap.insertAdjacentHTML("beforeend", `<a class="gh" href="${PROFILE.github}" target="_blank" rel="noopener">${GH_ICON}<span>GitHub</span></a>`);
  const nav = document.querySelector(".nav");
  const links = nav && nav.querySelector("ul");
  if (!links) return;
  links.id = "nav-links";
  const toggle = document.createElement("button");
  toggle.className = "nav-toggle";
  toggle.type = "button";
  toggle.textContent = "Menu";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", links.id);
  wrap.insertBefore(toggle, links);
  function closeMenu() {
    nav.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Menu";
  }
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
  });
  links.addEventListener("click", (event) => { if (event.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("menu-open")) { closeMenu(); toggle.focus(); }
  });
  document.addEventListener("click", (event) => { if (!nav.contains(event.target)) closeMenu(); });
}

function contactButtons(el, dark) {
  const alt = dark ? "ghost" : "light";
  el.innerHTML = `
    ${el.id === "hero-btns" ? '<a class="btn primary" href="#index">Browse all work</a>' : ""}
    <a class="btn ${el.id === "hero-btns" ? alt : "primary"}" href="${PROFILE.github}" target="_blank" rel="noopener">${GH_ICON}GitHub</a>
    <a class="btn ${alt}" data-resume href="${PROFILE.resume}" target="_blank" rel="noopener" hidden>Resume (PDF)</a>
    <a class="mail" href="mailto:${PROFILE.email}">${PROFILE.email}</a>`;
  // Only show the resume button once assets/resume.pdf actually exists.
  fetch(PROFILE.resume, { method: "HEAD" })
    .then((r) => { if (r.ok) el.querySelector("[data-resume]").hidden = false; })
    .catch(() => {});
}

function mountDemo(name, el) {
  const fn = { fretboard: window.mountFretboard, gripper: window.mountGripper, sync: window.mountSync }[name];
  if (fn && el) fn(el);
}

function initReveal() {
  const els = document.querySelectorAll(".reveal:not(.in)");
  if (reducedMotion || !("IntersectionObserver" in window)) return els.forEach((n) => n.classList.add("in"));
  const io = new IntersectionObserver((items) => {
    items.forEach((it) => { if (it.isIntersecting) { it.target.classList.add("in"); io.unobserve(it.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  els.forEach((n) => io.observe(n));
}

// Calls cb(true/false) as el enters or leaves the viewport, so animations can pause offscreen.
function whenVisible(el, cb) {
  if (!("IntersectionObserver" in window)) return cb(true);
  new IntersectionObserver((items) => cb(items[0].isIntersecting), { threshold: 0.05 }).observe(el);
}
