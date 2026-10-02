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

  // Render every entry once. Filters change visibility on the same cards.
  const cards = $("#work-cards");
  const priority = new Map(FEATURED_ORDER.map((id, i) => [id, i]));
  const entries = [...ENTRIES].sort((a, b) =>
    (priority.get(a.id) ?? FEATURED_ORDER.length) - (priority.get(b.id) ?? FEATURED_ORDER.length));
  cards.innerHTML = entries.map((e, i) => cardHTML(e, i, false, true)).join("");
  const rendered = [...cards.querySelectorAll("[data-entry-id]")];
  const searchText = new Map(entries.map((e) => [e.id,
    [e.title, e.org, e.role, e.summary, e.status, CATEGORIES[e.category], ...(e.tech || [])].join(" ").toLowerCase()]));
  const byId = new Map(entries.map((e) => [e.id, e]));
  const hashCategories = { index: "all", featured: "featured", experience: "experience", research: "research", projects: "project", datasci: "datasci", awards: "award" };
  const categoryHashes = Object.fromEntries(Object.entries(hashCategories).map(([hash, category]) => [category, hash]));
  let cat = "all", q = "";
  const filters = $("#idx-filters");
  filters.innerHTML = [["all", "All"], ["featured", "Featured"], ...Object.entries(CATEGORIES)]
    .map(([k, v]) => `<button type="button" data-k="${k}" aria-controls="work-cards" aria-pressed="${k === "all"}">${esc(v)}</button>`).join("");

  function apply() {
    let count = 0;
    rendered.forEach((card) => {
      const e = byId.get(card.dataset.entryId);
      const categoryMatch = cat === "all" || (cat === "featured" ? priority.has(e.id) : e.category === cat || (e.alsoIn || []).includes(cat));
      const matches = categoryMatch && (!q || searchText.get(e.id).includes(q));
      card.hidden = !matches;
      if (matches) count++;
    });
    filters.querySelectorAll("button").forEach((button) => {
      const selected = button.dataset.k === cat;
      button.classList.toggle("on", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    $("#work-count").textContent = `${count} of ${entries.length} entries`;
    $("#work-empty").hidden = count > 0;
  }

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-k]");
    if (!button) return;
    cat = button.dataset.k;
    history.replaceState(null, "", `#${categoryHashes[cat]}`);
    apply();
  });
  $("#idx-search").addEventListener("input", (event) => {
    q = event.target.value.trim().toLowerCase();
    apply();
  });

  // Existing category links open the matching filter in the single list.
  function readHash() {
    const hash = location.hash.slice(1);
    if (!Object.hasOwn(hashCategories, hash)) return;
    cat = hashCategories[hash];
    q = "";
    $("#idx-search").value = "";
    apply();
    requestAnimationFrame(() => $("#index").scrollIntoView({ block: "start" }));
  }
  apply();
  readHash();
  window.addEventListener("hashchange", readHash);

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
