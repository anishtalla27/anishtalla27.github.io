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

  // Featured entries appear here only; all other entries use their primary category.
  const byId = new Map(ENTRIES.map((e) => [e.id, e]));
  const featuredIds = new Set(FEATURED_ORDER);
  document.querySelector("[data-featured]").innerHTML = FEATURED_ORDER
    .map((id) => byId.get(id)).filter(Boolean).map((e, i) => cardHTML(e, i)).join("");
  document.querySelectorAll("[data-category]").forEach((grid) => {
    const entries = ENTRIES.filter((e) => e.category === grid.dataset.category && !featuredIds.has(e.id));
    grid.innerHTML = entries.map((e, i) => cardHTML(e, i)).join("");
  });

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
