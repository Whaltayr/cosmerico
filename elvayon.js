/* ═══════════════════════════════════════════════════
   EL VAYON — elvayon.js
   Nav · Cart · Filters · Services · GSAP · WhatsApp
   ═══════════════════════════════════════════════════ */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGSAP = typeof window.gsap !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
const canAnimate = hasGSAP && !reduced;

if (hasGSAP && hasScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

/* ════════════════════════════════════════════════════
   CART STATE  (shared across both pages via sessionStorage)
════════════════════════════════════════════════════ */
const CART_KEY = "elvayon_cart";
let cart = [];

function loadCart() {
  try {
    cart = JSON.parse(sessionStorage.getItem(CART_KEY)) || [];
  } catch {
    cart = [];
  }
}
function saveCart() {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function fmtKz(n) {
  return "Kz " + Number(n || 0).toLocaleString("pt-AO");
}
function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/* ── Add to cart ── */
function addToCart(card) {
  const id = Number.parseInt(card.dataset.id, 10);
  const name = card.dataset.name || "Produto";
  const price = Number.parseInt(card.dataset.price, 10);
  if (!Number.isFinite(id) || !Number.isFinite(price)) return;
  const img = card.dataset.img || card.querySelector("img")?.src || "";
  const cat = card.dataset.cat;
  const existing = cart.find((i) => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, img, cat, qty: 1 });
  }
  saveCart();
  renderCart();
  openCart();

  /* Feedback animation on button */
  const addBtn = card.querySelector('[data-action="add"]');
  if (addBtn) {
    const orig = addBtn.textContent;
    addBtn.textContent = "✓ Adicionado";
    addBtn.classList.add("added");
    setTimeout(() => {
      addBtn.textContent = orig;
      addBtn.classList.remove("added");
    }, 1800);
  }
  /* Badge bounce */
  if (canAnimate) {
    const badge = document.getElementById("cartFabBadge");
    if (badge)
      gsap.fromTo(
        badge,
        { scale: 1.8 },
        { scale: 1, duration: 0.4, ease: "back.out(3)" },
      );
    const navBadge = document.getElementById("navCartCount");
    if (navBadge)
      gsap.fromTo(
        navBadge,
        { scale: 1.8 },
        { scale: 1, duration: 0.4, ease: "back.out(3)" },
      );
  }
}

/* ── Render cart drawer ── */
function renderCart() {
  const itemsEl = document.getElementById("cartItems");
  const emptyEl = document.getElementById("cartEmpty");
  const footerEl = document.getElementById("cartFooter");
  const totalEl = document.getElementById("cartTotal");
  const fabBadge = document.getElementById("cartFabBadge");
  const navCount = document.getElementById("navCartCount");

  const totalCount = cart.reduce((a, i) => a + i.qty, 0);

  /* Update badges */
  [fabBadge, navCount].forEach((el) => {
    if (!el) return;
    el.textContent = totalCount;
    el.classList.toggle("show", totalCount > 0);
  });

  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = "";
    if (emptyEl) {
      itemsEl.appendChild(emptyEl);
      emptyEl.style.display = "flex";
    }
    if (footerEl) footerEl.style.display = "none";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";
  if (footerEl) footerEl.style.display = "flex";

  itemsEl.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item__img">
        <img src="${escapeHTML(item.img)}" alt="${escapeHTML(item.name)}" loading="lazy"/>
      </div>
      <div>
        <p class="cart-item__name">${escapeHTML(item.name)}</p>
        <p class="cart-item__price">${fmtKz(item.price)}</p>
        <div class="cart-item__qty">
          <button data-action="dec" data-id="${item.id}" aria-label="Diminuir quantidade">−</button>
          <span>${item.qty}</span>
          <button data-action="inc" data-id="${item.id}" aria-label="Aumentar quantidade">+</button>
        </div>
      </div>
      <button class="cart-item__rm" data-action="rm" data-id="${item.id}" aria-label="Remover ${escapeHTML(item.name)}">✕</button>
    </div>
  `,
    )
    .join("");

  /* Bind qty / remove buttons */
  itemsEl.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number.parseInt(btn.dataset.id, 10);
      const act = btn.dataset.action;
      const idx = cart.findIndex((i) => i.id === id);
      if (idx === -1) return;
      if (act === "inc") {
        cart[idx].qty++;
      } else if (act === "dec") {
        cart[idx].qty--;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
      } else if (act === "rm") {
        cart.splice(idx, 1);
      }
      saveCart();
      renderCart();
    });
  });

  const total = cart.reduce((a, i) => a + i.price * i.qty, 0);
  if (totalEl) totalEl.textContent = fmtKz(total);
}

/* ════════════════════════════════════════════════════
   CART DRAWER OPEN / CLOSE
════════════════════════════════════════════════════ */
const cartOverlay = document.getElementById("cartOverlay");
const cartDrawer = document.getElementById("cartDrawer");
const cartClose = document.getElementById("cartClose");
const cartFab = document.getElementById("cartFab");
const navCartBtn = document.getElementById("navCartBtn");

function openCart() {
  if (!cartDrawer || !cartOverlay) return;
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("open");
  cartOverlay.removeAttribute("aria-hidden");
  document.body.style.overflow = "hidden";
}
function closeCart() {
  cartDrawer?.classList.remove("open");
  cartOverlay?.classList.remove("open");
  cartOverlay?.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

cartFab?.addEventListener("click", openCart);
navCartBtn?.addEventListener("click", openCart);
cartClose?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeCart();
    menu?.classList.remove("open");
    burger?.classList.remove("open");
    burger?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
});

/* ── WhatsApp checkout ── */
document.getElementById("btnCheckout")?.addEventListener("click", () => {
  if (!cart.length) return;
  const name = (document.getElementById("clientName")?.value || "").trim();
  if (!name) {
    const input = document.getElementById("clientName");
    if (input) {
      input.focus();
      if (canAnimate)
        gsap.fromTo(
          input,
          { x: -6 },
          { x: 0, duration: 0.4, ease: "elastic.out(1,.4)", repeat: 2 },
        );
    }
    return;
  }
  const lines = cart
    .map((i) => `• ${i.name} (${i.qty}×) — ${fmtKz(i.price * i.qty)}`)
    .join("\n");
  const total = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const msg = encodeURIComponent(
    `Olá El Vayon! 👋\n\nO meu nome é *${name}* e gostaria de encomendar:\n\n${lines}\n\n*Total: ${fmtKz(total)}*\n\nPode confirmar disponibilidade e entrega? Obrigado!`,
  );
  window.open(`https://wa.me/244933301330?text=${msg}`, "_blank");
});

/* ════════════════════════════════════════════════════
   PRODUCT CARD EVENTS
════════════════════════════════════════════════════ */
function bindProductCards(scope = document) {
  scope.querySelectorAll(".prod-card").forEach((card) => {
    card
      .querySelector('[data-action="add"]')
      ?.addEventListener("click", (e) => {
        e.stopPropagation();
        addToCart(card);
      });
    card
      .querySelector('[data-action="quickadd"]')
      ?.addEventListener("click", (e) => {
        e.stopPropagation();
        addToCart(card);
      });
  });
}

/* ════════════════════════════════════════════════════
   NAV
════════════════════════════════════════════════════ */
const nav = document.getElementById("nav");
const burger = document.getElementById("navBurger");
const menu = document.getElementById("navMenu");

/* Scroll state */
if (hasScrollTrigger) {
  ScrollTrigger.create({
    start: "60px top",
    onEnter: () => nav?.classList.add("scrolled"),
    onLeaveBack: () => nav?.classList.remove("scrolled"),
  });
} else {
  const setNavState = () => nav?.classList.toggle("scrolled", window.scrollY > 60);
  setNavState();
  window.addEventListener("scroll", setNavState, { passive: true });
}

/* Burger toggle */
burger?.addEventListener("click", () => {
  const open = menu?.classList.toggle("open");
  burger.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", String(open));
  document.body.style.overflow = open ? "hidden" : "";

  if (canAnimate && open && menu) {
    gsap.fromTo(
      menu.querySelectorAll(".nav__link, .nav__cta-mobile"),
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.06,
        duration: 0.38,
        ease: "power2.out",
        immediateRender: false,
      },
    );
  }
});

/* Close on link click */
menu?.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    menu.classList.remove("open");
    burger?.classList.remove("open");
    burger?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }),
);

/* ════════════════════════════════════════════════════
   FILTER PILLS (home page bestsellers)
════════════════════════════════════════════════════ */
(function initHomeFilters() {
  const grid = document.getElementById("homeGrid");
  if (!grid) return;

  let activeCat = "all";
  let activeBrand = "all";

  function applyHomeFilter() {
    const cards = [...grid.querySelectorAll(".prod-card")];
    cards.forEach((card) => {
      const catMatch = activeCat === "all" || card.dataset.cat === activeCat;
      const brandMatch =
        activeBrand === "all" || card.dataset.brand === activeBrand;
      card.classList.toggle("hidden", !(catMatch && brandMatch));
    });
    if (canAnimate) {
      gsap.fromTo(
        cards.filter((c) => !c.classList.contains("hidden")),
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.06,
          duration: 0.4,
          ease: "power2.out",
          immediateRender: false,
        },
      );
    }
  }

  document
    .querySelectorAll('.filter-pill[data-filter-type="cat"]')
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll('.filter-pill[data-filter-type="cat"]')
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeCat = btn.dataset.value;
        applyHomeFilter();
      });
    });

  document
    .querySelectorAll('.filter-pill[data-filter-type="brand"]')
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll('.filter-pill[data-filter-type="brand"]')
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeBrand = btn.dataset.value;
        applyHomeFilter();
      });
    });
})();

/* ════════════════════════════════════════════════════
   PRODUTOS PAGE FILTERS
════════════════════════════════════════════════════ */
(function initPageFilters() {
  const grid = document.getElementById("produtosGrid");
  if (!grid) return;

  const PRODUCTS_PER_PAGE = 12;
  const noResults = document.getElementById("noResults");
  const countEl = document.getElementById("produtosCount");
  const clearBtn = document.getElementById("filtrosClear");
  const toggleBtn = document.getElementById("filtrosToggle");
  const sidebar = document.getElementById("filtrosSidebar");
  const countBadge = document.getElementById("filtrosCount");
  const pagination = document.createElement("nav");

  pagination.className = "prod-pagination";
  pagination.setAttribute("aria-label", "Paginação dos produtos");
  grid.insertAdjacentElement("afterend", pagination);

  let currentPage = 1;

  function getActiveFilters() {
    const cats = [...document.querySelectorAll('input[name="cat"]:checked')]
      .map((i) => i.value)
      .filter((v) => v !== "all");
    const brands = [
      ...document.querySelectorAll('input[name="brand"]:checked'),
    ].map((i) => i.value);
    const sort =
      document.querySelector('input[name="sort"]:checked')?.value || "default";
    return { cats, brands, sort };
  }

  function getFilteredSortedCards() {
    const { cats, brands, sort } = getActiveFilters();
    const cards = [...grid.querySelectorAll(".prod-card")];

    const visible = cards.filter((card) => {
      const catOk = cats.length === 0 || cats.includes(card.dataset.cat);
      const brandOk =
        brands.length === 0 || brands.includes(card.dataset.brand);
      return catOk && brandOk;
    });

    visible.sort((a, b) => {
      if (sort === "price-asc") {
        return Number.parseInt(a.dataset.price, 10) - Number.parseInt(b.dataset.price, 10);
      }
      if (sort === "price-desc") {
        return Number.parseInt(b.dataset.price, 10) - Number.parseInt(a.dataset.price, 10);
      }
      if (sort === "name") {
        return (a.dataset.name || "").localeCompare(b.dataset.name || "", "pt-AO");
      }
      return 0;
    });

    return { visible, totalCards: cards.length };
  }

  function renderPagination(totalPages) {
    pagination.innerHTML = "";
    pagination.hidden = totalPages <= 1;
    if (totalPages <= 1) return;

    const makeBtn = (label, page, options = {}) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "prod-pagination__btn";
      btn.textContent = label;
      btn.disabled = options.disabled || false;
      if (options.active) {
        btn.classList.add("active");
        btn.setAttribute("aria-current", "page");
      }
      btn.addEventListener("click", () => {
        currentPage = page;
        applyPageFilters({ keepPage: true, scrollToGrid: true });
      });
      return btn;
    };

    pagination.appendChild(
      makeBtn("Anterior", Math.max(1, currentPage - 1), {
        disabled: currentPage === 1,
      }),
    );

    const pages = [];
    for (let page = 1; page <= totalPages; page++) {
      const nearCurrent = Math.abs(page - currentPage) <= 1;
      const isEdge = page === 1 || page === totalPages;
      if (nearCurrent || isEdge) pages.push(page);
    }

    pages.forEach((page, index) => {
      if (index > 0 && page - pages[index - 1] > 1) {
        const dots = document.createElement("span");
        dots.className = "prod-pagination__dots";
        dots.textContent = "…";
        pagination.appendChild(dots);
      }
      pagination.appendChild(
        makeBtn(String(page), page, { active: page === currentPage }),
      );
    });

    pagination.appendChild(
      makeBtn("Próxima", Math.min(totalPages, currentPage + 1), {
        disabled: currentPage === totalPages,
      }),
    );
  }

  function applyPageFilters(options = {}) {
    const { cats, brands } = getActiveFilters();
    const { visible } = getFilteredSortedCards();
    const totalPages = Math.max(1, Math.ceil(visible.length / PRODUCTS_PER_PAGE));

    if (!options.keepPage) currentPage = 1;
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const pageCards = visible.slice(start, start + PRODUCTS_PER_PAGE);

    [...grid.querySelectorAll(".prod-card")].forEach((card) => {
      card.classList.add("hidden");
    });

    visible.forEach((card) => grid.appendChild(card));
    pageCards.forEach((card) => card.classList.remove("hidden"));

    const activeCount = cats.length + brands.length;
    if (countBadge) {
      countBadge.textContent = activeCount;
      countBadge.classList.toggle("show", activeCount > 0);
    }

    if (countEl) {
      if (visible.length === 0) {
        countEl.textContent = "";
      } else {
        const end = Math.min(start + PRODUCTS_PER_PAGE, visible.length);
        countEl.textContent = `A mostrar ${start + 1}–${end} de ${visible.length} produto${visible.length !== 1 ? "s" : ""}`;
      }
    }

    if (noResults) noResults.hidden = visible.length > 0;
    renderPagination(totalPages);

    if (options.scrollToGrid) {
      grid.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }

    if (canAnimate && pageCards.length) {
      gsap.fromTo(
        pageCards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.04,
          duration: 0.38,
          ease: "power2.out",
          immediateRender: false,
        },
      );
    }
  }

  document
    .querySelectorAll(
      'input[name="cat"], input[name="brand"], input[name="sort"]',
    )
    .forEach((input) => {
      input.addEventListener("change", () => applyPageFilters());
    });

  function clearFilters() {
    document.querySelectorAll('input[name="cat"]').forEach((i) => {
      i.checked = false;
    });
    document.querySelectorAll('input[name="brand"]').forEach((i) => {
      i.checked = false;
    });
    const defSort = document.querySelector(
      'input[name="sort"][value="default"]',
    );
    if (defSort) defSort.checked = true;
    currentPage = 1;
    applyPageFilters();
  }

  clearBtn?.addEventListener("click", clearFilters);
  document
    .getElementById("noResultsClear")
    ?.addEventListener("click", clearFilters);

  toggleBtn?.addEventListener("click", () => {
    const open = sidebar?.classList.toggle("mobile-open");
    toggleBtn.setAttribute("aria-expanded", String(!!open));
  });

  applyPageFilters();
})();

/* ════════════════════════════════════════════════════
   SERVICE PRICE MENUS (accordion)
════════════════════════════════════════════════════ */
document.querySelectorAll(".btn-precos").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("aria-controls");
    const target = document.getElementById(targetId);
    if (!target) return;

    const isOpen = !target.hidden;

    /* Close all others */
    document.querySelectorAll(".precos-menu").forEach((m) => {
      m.hidden = true;
    });
    document.querySelectorAll(".btn-precos").forEach((b) => {
      b.setAttribute("aria-expanded", "false");
    });

    if (!isOpen) {
      target.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      if (canAnimate) {
        gsap.fromTo(
          target,
          { opacity: 0, y: -10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out",
            immediateRender: false,
          },
        );
      }
    }
  });
});

/* ════════════════════════════════════════════════════
   HERO ENTRANCE ANIMATION
════════════════════════════════════════════════════ */
(function heroIn() {
  if (!canAnimate) return;
  const els = [".hero__tag", ".hero__title", ".hero__sub", ".hero__btns"];
  gsap.set(els, { opacity: 0, y: 28 });
  const tl = gsap.timeline({ delay: 0.15 });
  tl.to(".hero__tag", { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" })
    .to(
      ".hero__title",
      { opacity: 1, y: 0, duration: 0.85, ease: "power3.out" },
      "-=0.25",
    )
    .to(
      ".hero__sub",
      { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" },
      "-=0.45",
    )
    .to(
      ".hero__btns",
      { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" },
      "-=0.35",
    );

  /* Parallax */
  gsap.to(".hero__img:not(.hero__img--placeholder)", {
    yPercent: 18,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: 1.5,
    },
  });
})();

/* ════════════════════════════════════════════════════
   SCROLL REVEALS
════════════════════════════════════════════════════ */
function rev(sel, from, to, trigger, start = "top 88%") {
  if (!canAnimate) return;
  const targets =
    typeof sel === "string" ? [...document.querySelectorAll(sel)] : [sel];
  if (!targets.length) return;
  gsap.fromTo(
    targets,
    { ...from, immediateRender: false },
    {
      ...to,
      scrollTrigger: { trigger: trigger || targets[0], start, once: true },
    },
  );
}

(function initReveal() {
  /* Parceiros */
  rev(
    ".parceiros__header",
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
    ".parceiros",
  );

  /* Section heads */
  document.querySelectorAll(".section-head").forEach((el) => {
    rev(
      el,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
      el,
    );
  });

  /* Product cards */
  document.querySelectorAll(".prod-card").forEach((card, i) => {
    rev(
      card,
      { opacity: 0, y: 36 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: (i % 3) * 0.08,
        ease: "power2.out",
      },
      card,
    );
  });

  /* Service cards */
  document.querySelectorAll(".servico-card").forEach((card, i) => {
    rev(
      card,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.65, delay: i * 0.1, ease: "power2.out" },
      card,
    );
  });

  /* Gallery items */
  document.querySelectorAll(".galeria__item").forEach((el, i) => {
    rev(
      el,
      { opacity: 0, scale: 0.95 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        delay: i * 0.07,
        ease: "power2.out",
      },
      el,
    );
  });

  /* CTA */
  rev(
    ".cta-final__inner > *",
    { opacity: 0, y: 28 },
    { opacity: 1, y: 0, stagger: 0.1, duration: 0.65, ease: "power2.out" },
    ".cta-final__inner",
    "top 82%",
  );

  /* Page header (produtos.html) */
  rev(
    ".page-header__title, .page-header__sub",
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, stagger: 0.1, duration: 0.55, ease: "power2.out" },
    ".page-header",
    "top 95%",
  );
})();

/* ════════════════════════════════════════════════════
   WA FLOAT ENTRANCE
════════════════════════════════════════════════════ */
(function waIn() {
  const wa = document.querySelector(".wa-float");
  if (!wa || !canAnimate) return;
  gsap.set(wa, { scale: 0, opacity: 0 });
  gsap.to(wa, {
    scale: 1,
    opacity: 1,
    duration: 0.5,
    delay: 2,
    ease: "back.out(1.7)",
  });
})();

/* ════════════════════════════════════════════════════
   SMOOTH SCROLL for anchor links
════════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top =
      target.getBoundingClientRect().top +
      window.scrollY -
      (nav?.offsetHeight || 68) -
      10;
    window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
    /* Close mobile menu */
    menu?.classList.remove("open");
    burger?.classList.remove("open");
    burger?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  });
});

/* ════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════ */
loadCart();
renderCart();
bindProductCards();
