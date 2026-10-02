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

  // Each entry belongs to one section; secondary categories do not duplicate it.
  const priority = new Map(FEATURED_ORDER.map((id, i) => [id, i]));
  document.querySelectorAll("[data-category]").forEach((grid) => {
    const entries = ENTRIES.filter((e) => e.category === grid.dataset.category)
      .sort((a, b) => (priority.get(a.id) ?? FEATURED_ORDER.length) - (priority.get(b.id) ?? FEATURED_ORDER.length));
    grid.innerHTML = entries.map((e, i) => cardHTML(e, i)).join("");
  });

  // Old Featured links lead to the start of the work sections.
  function readHash() {
    if (location.hash === "#featured") {
      requestAnimationFrame(() => $("#index").scrollIntoView({ block: "start" }));
    }
  }
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
