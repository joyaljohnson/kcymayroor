// ============================================================
// KCYM Ayroor — shared site behavior
// (partials injection, nav, mobile menu, scroll-reveal, accordions)
// ============================================================

async function loadPartial(selector, url) {
  const host = document.querySelector(selector);
  if (!host) return;
  try {
    const res = await fetch(url);
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
  initMembershipDeepLink();
}

document.addEventListener("DOMContentLoaded", initSite);
