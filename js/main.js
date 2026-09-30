(function () {
  const $ = (s) => document.querySelector(s);

  // hero
  $("#p-name").textContent = PROFILE.name;
  $("#p-tagline").textContent = PROFILE.tagline;
  $("#p-intro").textContent = PROFILE.intro;
  $("#p-school").textContent = PROFILE.school;
  navGithub();
  contactButtons($("#hero-btns"), true);
  contactButtons($("#foot-btns"), true);
  if (window.mountHero) mountHero($("#hero-canvas"));

  // cards
  const featured = document.querySelector("[data-featured]");
  featured.innerHTML = FEATURED_ORDER.map((id) => ENTRIES.find((e) => e.id === id)).filter(Boolean).map((e, i) => cardHTML(e, i)).join("");
  document.querySelectorAll("[data-cat]").forEach((grid) => {
    const cat = grid.dataset.cat;
    const big = grid.hasAttribute("data-big");
    grid.innerHTML = ENTRIES.filter((e) => e.category === cat || (e.alsoIn || []).includes(cat))
      .map((e, i) => cardHTML(e, i, big, true)).join("");
  });

  // demos
  document.querySelectorAll("[data-demo]").forEach((el) => mountDemo(el.dataset.demo, el));

  // index
  const rows = $("#idx-rows");
  rows.innerHTML = ENTRIES.map((e) => {
    const link = firstLink(e);
    const destination = entryDestination(e);
    const hay = [e.title, e.org, e.role, e.summary, e.status, ...(e.tech || [])].join(" ").toLowerCase();
    const k = link && KIND[link.kind];
    return `<div class="row" data-cat="${e.category} ${(e.alsoIn || []).join(" ")}" data-hay="${esc(hay)}">
      <div>${destination ? `<a class="t" href="${destination}" ${extAttrs(destination)}>${esc(e.title)} <span class="arr" aria-hidden="true">${hasMoreContent(e) ? "→" : "↗"}</span></a>` : `<span class="t">${esc(e.title)}</span>`}<div class="c">${esc(CATEGORIES[e.category])}</div>${e.videos && e.videos.length ? `<a class="vidlink" href="project.html?id=${e.id}#video">Watch video <span aria-hidden="true">→</span></a>` : ""}</div>
      <div class="s">${esc(e.summary)}</div>
      <span class="stt ${statusClass(e.status)}">${esc((e.status || "").toLowerCase())}</span>
      ${k ? `<a class="ev ${k.cls}" href="${link.url}" ${extAttrs(link.url)}>${k.short} ↗</a>` : `<span class="ev"></span>`}
    </div>`;
  }).join("") + `<div class="empty" hidden>No entries match.</div>`;

  let cat = "all", q = "";
  const filters = $("#idx-filters");
  filters.innerHTML = [["all", "All"], ...Object.entries(CATEGORIES)]
    .map(([k, v]) => `<button data-k="${k}" class="${k === "all" ? "on" : ""}">${esc(v)}</button>`).join("");
  function apply() {
    let n = 0;
    rows.querySelectorAll(".row").forEach((r) => {
      const ok = (cat === "all" || r.dataset.cat.split(" ").includes(cat)) && (!q || r.dataset.hay.includes(q));
      r.classList.toggle("hide", !ok);
      if (ok) n++;
    });
    rows.querySelector(".empty").hidden = n > 0;
  }
  filters.addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (!b) return;
    cat = b.dataset.k;
    filters.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    apply();
  });
  $("#idx-search").addEventListener("input", (ev) => { q = ev.target.value.trim().toLowerCase(); apply(); });

  // skills
  $("#skills-grid").innerHTML = SKILLS.map((s) => `<div class="reveal"><dt>${esc(s.area)}</dt><dd>${s.items.map(esc).join(", ")}</dd></div>`).join("");
  $("#academics-grid").innerHTML = ACADEMICS.map((s) => `<div class="reveal"><dt>${esc(s.area)}</dt><dd>${s.items.map(esc).join(", ")}</dd></div>`).join("");

  // nav state
  const nav = $("#nav");
  const links = [...nav.querySelectorAll("li a")];
  const secs = links.map((a) => document.querySelector(a.getAttribute("href")));
  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 40);
    const y = window.scrollY + 120;
    let cur = -1;
    secs.forEach((s, i) => { if (s && s.offsetTop <= y) cur = i; });
    links.forEach((a, i) => a.classList.toggle("active", i === cur));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  initReveal();
})();
