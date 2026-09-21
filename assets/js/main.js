// ============================================================
// KCYM Ayroor — shared site behavior
// (partials injection, nav, mobile menu, scroll-reveal, accordions)
// ============================================================

async function loadPartial(selector, url) {
  const host = document.querySelector(selector);
  if (!host) return;
  try {
    const res = await fetch(url, { cache: "no-cache" });
    host.innerHTML = await res.text();
  } catch (e) {
    console.error("Failed to load partial", url, e);
  }
}

function currentPage() {
  let path = window.location.pathname.split("/").pop();
  if (path === "" || path === undefined) path = "index.html";
  return path.replace(".html", "") || "index";
}

function initNav() {
  const page = currentPage();
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const target = link.getAttribute("data-nav-link");
    const isActive = target === page || (target === "index" && page === "");
    if (isActive) {
      link.classList.add("bg-primary/10", "text-primary");
      link.classList.remove("text-muted-foreground");
    } else {
      link.classList.remove("bg-primary/10", "text-primary");
    }
  });

  const toggleBtn = document.getElementById("mobile-menu-toggle");
  const panel = document.getElementById("mobile-menu-panel");
  const iconMenu = document.getElementById("icon-menu");
  const iconClose = document.getElementById("icon-close");
  if (toggleBtn && panel) {
    toggleBtn.addEventListener("click", () => {
      const isOpen = panel.classList.toggle("open");
      iconMenu.classList.toggle("hidden", isOpen);
      iconClose.classList.toggle("hidden", !isOpen);
    });
  }
}

function initScrollReveal() {
  const els = Array.from(document.querySelectorAll("[data-reveal]")).filter(
    (el) => el.dataset.revealBound !== "1"
  );
  if (!els.length) return;
  els.forEach((el) => (el.dataset.revealBound = "1"));

  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in-view"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.getAttribute("data-reveal-delay") || 0;
          setTimeout(() => el.classList.add("in-view"), Number(delay));
          io.unobserve(el);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );
  els.forEach((el) => io.observe(el));

  // Auto-stagger direct siblings inside a [data-reveal-group]
  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      if (child.hasAttribute("data-reveal")) {
        child.setAttribute("data-reveal-delay", i * 70);
      }
    });
  });
}

function initAccordions() {
  document.querySelectorAll("[data-accordion-toggle]").forEach((btn) => {
    if (btn.dataset.accordionBound === "1") return; // avoid double-binding on repeat init calls
    btn.dataset.accordionBound = "1";
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-accordion-toggle");
      const content = document.getElementById(id);
      const chevron = btn.querySelector(".accordion-chevron");
      const isOpen = content.classList.toggle("open");
      if (chevron) chevron.classList.toggle("rotated", isOpen);
      const labelShow = btn.getAttribute("data-label-show");
      const labelHide = btn.getAttribute("data-label-hide");
      if (labelShow && labelHide) {
        const textNode = btn.querySelector("[data-accordion-label]");
        if (textNode) textNode.textContent = isOpen ? labelHide : labelShow;
      }
    });
  });
}

function initVerseTrigger() {
  const wrap = document.getElementById("verse-trigger-wrap");
  const btn = document.getElementById("verse-trigger");
  if (!wrap || !btn || wrap.dataset.bound === "1") return;
  wrap.dataset.bound = "1";

  function setOpen(open) {
    wrap.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  // Hover-to-open is handled purely in CSS (desktop/mouse). This click
  // handler is the fallback for touch devices, which have no hover state,
  // and also lets anyone toggle it closed again after opening via hover+click.
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(!wrap.classList.contains("open"));
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

function applyLanguage(lang) {
  const dict = (typeof I18N_ML !== "undefined" && I18N_ML) || {};
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    if (el.dataset.i18nEn === undefined) el.dataset.i18nEn = el.innerHTML;
    const key = el.getAttribute("data-i18n");
    el.innerHTML = lang === "ml" && dict[key] ? dict[key] : el.dataset.i18nEn;
  });
  const labels = (typeof ACCORDION_LABELS_ML !== "undefined" && ACCORDION_LABELS_ML) || {};
  document.querySelectorAll("[data-label-show]").forEach((btn) => {
    if (btn.dataset.labelShowEn === undefined) {
      btn.dataset.labelShowEn = btn.getAttribute("data-label-show");
      btn.dataset.labelHideEn = btn.getAttribute("data-label-hide");
    }
    const showText = lang === "ml" && labels[btn.dataset.labelShowEn] ? labels[btn.dataset.labelShowEn] : btn.dataset.labelShowEn;
    const hideText = lang === "ml" && labels[btn.dataset.labelHideEn] ? labels[btn.dataset.labelHideEn] : btn.dataset.labelHideEn;
    btn.setAttribute("data-label-show", showText);
    btn.setAttribute("data-label-hide", hideText);
    const labelEl = btn.querySelector("[data-accordion-label]");
    const content = document.getElementById(btn.getAttribute("data-accordion-toggle"));
    if (labelEl && content) labelEl.textContent = content.classList.contains("open") ? hideText : showText;
  });

  const toggle = document.getElementById("lang-toggle");
  if (toggle) toggle.textContent = lang === "ml" ? "മല" : "EN";
  document.documentElement.setAttribute("lang", lang === "ml" ? "ml" : "en");
  window.dispatchEvent(new CustomEvent("languagechange", { detail: { lang } }));
}

function initLanguageToggle() {
  const btn = document.getElementById("lang-toggle");
  if (!btn || btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  const stored = localStorage.getItem("lang") || "en";
  applyLanguage(stored);

  btn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("lang") === "ml" ? "en" : "ml";
    localStorage.setItem("lang", next);
    applyLanguage(next);
  });
}

function syncVerseWidgetsTheme(isDark) {
  document.querySelectorAll("daily-verse-widget").forEach((el) => {
    if (isDark) el.setAttribute("theme", "dark");
    else el.removeAttribute("theme");
  });
}

function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn || btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  syncVerseWidgetsTheme(document.documentElement.classList.contains("dark"));

  btn.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    syncVerseWidgetsTheme(isDark);
  });
}

function initMembershipDeepLink() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("membership") === "open") {
    const btn = document.querySelector('[data-accordion-toggle="membership-details"]');
    if (btn && !document.getElementById("membership-details").classList.contains("open")) {
      btn.click();
      setTimeout(() => {
        btn.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }
}

async function initSite() {
  await Promise.all([
    loadPartial("#site-header", "partials/header.html"),
    loadPartial("#site-footer", "partials/footer.html"),
  ]);
  initNav();
  initScrollReveal();
  initAccordions();
  initVerseTrigger();
  initThemeToggle();
  initLanguageToggle();
  initMembershipDeepLink();
}

document.addEventListener("DOMContentLoaded", initSite);
