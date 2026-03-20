/* ════════════════════════════════════════════════════
   EL VAYON — elvayon.js  (v2)
   Filtros · Categoria→Filtro · Carrinho · QuickView
   GSAP · Parallax · Horários
   ════════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ════════════════════════════════════════════════════
   CUSTOM CURSOR
════════════════════════════════════════════════════ */
(function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const cur = document.getElementById('cursor');
  if (!cur) return;
  window.addEventListener('mousemove', e => {
    gsap.to(cur, { x: e.clientX, y: e.clientY, duration: 0.08, ease: 'none' });
  });
})();

/* ════════════════════════════════════════════════════
   HEADER compact on scroll
════════════════════════════════════════════════════ */
const header = document.getElementById('header');
ScrollTrigger.create({
  start: '80px top',
  onEnter:     () => header?.classList.add('compact'),
  onLeaveBack: () => header?.classList.remove('compact'),
});

/* ════════════════════════════════════════════════════
   NAV DRAWER
════════════════════════════════════════════════════ */
const burgerBtn   = document.getElementById('headerBurger');
const navDrawer   = document.getElementById('navDrawer');
const navOverlay  = document.getElementById('navOverlay');
const drawerClose = document.getElementById('drawerClose');

function openDrawer() {
  navDrawer?.classList.add('open');
  navOverlay?.classList.add('open');
  navOverlay?.removeAttribute('aria-hidden');
  burgerBtn?.classList.add('open');
  burgerBtn?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  if (!reduced) {
    gsap.fromTo(navDrawer.querySelectorAll('.nav-drawer__links a'),
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, stagger: 0.07, duration: 0.4, ease: 'power2.out', immediateRender: false }
    );
  }
}
function closeDrawer() {
  navDrawer?.classList.remove('open');
  navOverlay?.classList.remove('open');
  navOverlay?.setAttribute('aria-hidden', 'true');
  burgerBtn?.classList.remove('open');
  burgerBtn?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
burgerBtn?.addEventListener('click', openDrawer);
drawerClose?.addEventListener('click', closeDrawer);
navOverlay?.addEventListener('click', closeDrawer);
navDrawer?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

/* ════════════════════════════════════════════════════
   SEARCH BAR
════════════════════════════════════════════════════ */
const searchToggle = document.getElementById('searchToggle');
const searchBar    = document.getElementById('searchBar');
const searchClose  = document.getElementById('searchClose');
const searchInput  = document.getElementById('searchInput');

searchToggle?.addEventListener('click', () => {
  const open = searchBar.classList.toggle('open');
  searchBar.setAttribute('aria-hidden', String(!open));
  if (open) setTimeout(() => searchInput?.focus(), 350);
});
searchClose?.addEventListener('click', () => {
  searchBar?.classList.remove('open');
  searchBar?.setAttribute('aria-hidden', 'true');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    searchBar?.classList.remove('open');
    closeQV();
  }
});

/* ════════════════════════════════════════════════════
   PRODUCT FILTER SYSTEM
════════════════════════════════════════════════════ */
let currentFilter = 'all';

function applyFilter(filter, animate = true) {
  currentFilter = filter;

  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });

  const cards   = [...document.querySelectorAll('.prod-card')];
  const visible = cards.filter(c =>
    filter === 'all' || c.dataset.filter === filter
  );
  const hidden  = cards.filter(c =>
    filter !== 'all' && c.dataset.filter !== filter
  );

  // Hide non-matching immediately
  hidden.forEach(c => {
    c.classList.add('is-hidden');
    c.classList.remove('is-visible');
  });

  // Show matching with animation
  if (animate && !reduced) {
    visible.forEach((c, i) => {
      c.classList.remove('is-hidden');
      c.style.animationDelay = `${i * 0.05}s`;
      c.classList.remove('is-visible');
      // Force reflow to restart animation
      void c.offsetWidth;
      c.classList.add('is-visible');
    });
  } else {
    visible.forEach(c => {
      c.classList.remove('is-hidden');
      c.classList.add('is-visible');
    });
  }

  // Update count
  const countEl = document.getElementById('filterCount');
  if (countEl) {
    if (filter === 'all') {
      countEl.textContent = `A mostrar todos os ${cards.length} produtos`;
    } else {
      const label = filter.charAt(0).toUpperCase() + filter.slice(1);
      countEl.textContent = `${visible.length} ${visible.length === 1 ? 'produto' : 'produtos'} em ${label}`;
    }
  }

  // No results state
  const noResults = document.getElementById('noResults');
  if (noResults) noResults.hidden = visible.length > 0;
}

// Filter buttons click
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
});

/* ════════════════════════════════════════════════════
   CATEGORY → FILTER NAVIGATION
   "Explorar" button on each category card activates
   the matching filter and smooth-scrolls to products
════════════════════════════════════════════════════ */
document.querySelectorAll('.cat-card__link[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    const filterVal = btn.dataset.filter;

    // 1 — Apply the filter
    applyFilter(filterVal, false); // no animation yet, will animate on scroll arrive

    // 2 — Scroll to products section
    const section = document.getElementById('produtos');
    if (section) {
      const top = section.getBoundingClientRect().top + window.scrollY
                  - (header?.offsetHeight || 72) - 16;
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    }

    // 3 — After scroll settles, animate the visible cards in
    setTimeout(() => {
      if (reduced) return;
      const visible = [...document.querySelectorAll('.prod-card:not(.is-hidden)')];
      visible.forEach((c, i) => {
        c.style.animationDelay = `${i * 0.05}s`;
        c.classList.remove('is-visible');
        void c.offsetWidth;
        c.classList.add('is-visible');
      });

      // Pulse the section title
      gsap.fromTo('#produtosTitle',
        { opacity: 0.5, y: 6 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }
      );
    }, reduced ? 0 : 650);
  });
});

/* ════════════════════════════════════════════════════
   CART STATE
════════════════════════════════════════════════════ */
const cart = { items: [] };

function fmtPrice(kz) {
  return 'Kz ' + kz.toLocaleString('pt-AO');
}

function renderCart() {
  const itemsEl  = document.getElementById('cartItems');
  const emptyEl  = document.getElementById('cartEmpty');
  const footerEl = document.getElementById('cartFooter');
  const totalEl  = document.getElementById('cartTotal');
  const badge    = document.getElementById('cartBadge');
  if (!itemsEl) return;

  const count = cart.items.reduce((a, i) => a + i.qty, 0);
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
  }

  if (cart.items.length === 0) {
    itemsEl.innerHTML = '';
    if (emptyEl) { itemsEl.appendChild(emptyEl); emptyEl.style.display = 'flex'; }
    if (footerEl) footerEl.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (footerEl) footerEl.style.display = 'flex';

  itemsEl.innerHTML = cart.items.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item__img">
        <img src="${item.img}" alt="${item.name}" loading="lazy"/>
      </div>
      <div>
        <p class="cart-item__name">${item.name}</p>
        <p class="cart-item__price">${fmtPrice(item.price)} × ${item.qty}</p>
      </div>
      <button class="cart-item__rm" data-rm="${item.id}" aria-label="Remover ${item.name}">✕</button>
    </div>
  `).join('');

  itemsEl.querySelectorAll('[data-rm]').forEach(btn => {
    btn.addEventListener('click', () => {
      cart.items = cart.items.filter(i => i.id !== parseInt(btn.dataset.rm));
      renderCart();
    });
  });

  const total = cart.items.reduce((a, i) => a + i.price * i.qty, 0);
  if (totalEl) totalEl.textContent = fmtPrice(total);
}

function addToCart(card) {
  const id    = parseInt(card.dataset.id);
  const name  = card.dataset.name;
  const price = parseInt(card.dataset.price);
  const img   = card.dataset.img;
  const existing = cart.items.find(i => i.id === id);
  if (existing) existing.qty++;
  else cart.items.push({ id, name, price, img, qty: 1 });
  renderCart();

  const addBtn = card.querySelector('.prod-card__add');
  if (addBtn) {
    addBtn.textContent = '✓ Adicionado';
    addBtn.classList.add('added');
    setTimeout(() => {
      addBtn.textContent = '+ Adicionar';
      addBtn.classList.remove('added');
    }, 1800);
  }

  if (!reduced) {
    gsap.fromTo('#cartBadge', { scale: 1.6 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
  }
}

/* ════════════════════════════════════════════════════
   CART DRAWER OPEN / CLOSE
════════════════════════════════════════════════════ */
const cartDrawer = document.getElementById('cartDrawer');
const cartBg     = document.getElementById('cartOverlayBg');
const cartClose  = document.getElementById('cartClose');

function openCart()  { cartDrawer?.classList.add('open'); cartBg?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeCart() { cartDrawer?.classList.remove('open'); cartBg?.classList.remove('open'); document.body.style.overflow = ''; }

document.getElementById('cartToggle')?.addEventListener('click', openCart);
cartClose?.addEventListener('click', closeCart);
cartBg?.addEventListener('click', closeCart);

document.getElementById('cartWa')?.addEventListener('click', () => {
  if (!cart.items.length) return;
  const lines = cart.items.map(i => `• ${i.name} (${i.qty}x) — ${fmtPrice(i.price * i.qty)}`).join('\n');
  const total = cart.items.reduce((a, i) => a + i.price * i.qty, 0);
  const msg   = encodeURIComponent(
    `Olá! Gostaria de encomendar na El Vayon:\n\n${lines}\n\n*Total: ${fmtPrice(total)}*\n\nPoderia confirmar disponibilidade?`
  );
  window.open(`https://wa.me/244933301330?text=${msg}`, '_blank');
});

/* ════════════════════════════════════════════════════
   QUICK VIEW MODAL
════════════════════════════════════════════════════ */
const qvOverlay = document.getElementById('qvOverlay');
const qvModal   = document.getElementById('qvModal');
const qvClose   = document.getElementById('qvClose');

function openQV(card) {
  document.getElementById('qvImg').src           = card.dataset.img;
  document.getElementById('qvTitle').textContent = card.dataset.name;
  document.getElementById('qvCat').textContent   = card.dataset.cat;
  document.getElementById('qvDesc').textContent  = card.dataset.desc;
  document.getElementById('qvPrice').textContent = fmtPrice(parseInt(card.dataset.price));
  const waMsg = encodeURIComponent(`Olá! Tenho interesse em: *${card.dataset.name}* — ${fmtPrice(parseInt(card.dataset.price))}. Está disponível?`);
  document.getElementById('qvWa').href = `https://wa.me/244933301330?text=${waMsg}`;

  document.getElementById('qvAdd').onclick = () => { addToCart(card); closeQV(); openCart(); };

  qvOverlay?.classList.add('open');
  qvOverlay?.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
}
function closeQV() {
  qvOverlay?.classList.remove('open');
  qvOverlay?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
qvClose?.addEventListener('click', closeQV);
qvOverlay?.addEventListener('click', e => { if (e.target === qvOverlay) closeQV(); });

/* ════════════════════════════════════════════════════
   PRODUCT CARD EVENTS — bind all cards
════════════════════════════════════════════════════ */
function bindProductCards() {
  document.querySelectorAll('.prod-card').forEach(card => {
    card.querySelector('.prod-card__qv')?.addEventListener('click', e => {
      e.stopPropagation();
      openQV(card);
    });
    card.querySelector('.prod-card__add')?.addEventListener('click', e => {
      e.stopPropagation();
      addToCart(card);
    });
  });
}

/* ════════════════════════════════════════════════════
   HERO ENTRANCE
════════════════════════════════════════════════════ */
(function heroIn() {
  if (reduced) return;
  gsap.set(['.hero__eyebrow', '.hero__title', '.hero__sub', '.btn-hero'], { opacity: 0, y: 28 });
  const tl = gsap.timeline({ delay: 0.2 });
  tl.to('.hero__eyebrow', { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' })
    .to('.hero__title',   { opacity: 1, y: 0, duration: 0.9,  ease: 'power3.out' }, '-=0.3')
    .to('.hero__sub',     { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' }, '-=0.5')
    .to('.btn-hero',      { opacity: 1, y: 0, duration: 0.6,  ease: 'back.out(1.4)' }, '-=0.4');

  gsap.to('.hero__img', {
    yPercent: 18, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
  });
})();

/* ════════════════════════════════════════════════════
   SCROLL REVEAL HELPER
════════════════════════════════════════════════════ */
function rev(sel, from, to, trigger, start = 'top 85%') {
  if (reduced) return;
  const targets = typeof sel === 'string' ? [...document.querySelectorAll(sel)] : [sel];
  if (!targets.length) return;
  gsap.fromTo(targets,
    { ...from, immediateRender: false },
    { ...to, scrollTrigger: { trigger: trigger || targets[0], start, once: true } }
  );
}

function initScrollAnimations() {
  // Categories
  document.querySelectorAll('.cat-card').forEach((c, i) => {
    rev(c, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.65, delay: i * 0.1, ease: 'power2.out' }, c);
  });

  // Produtos section header
  rev('.produtos__header > *',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power2.out' },
    '.produtos__header'
  );

  // Sobre
  rev('.sobre__content > *',
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, stagger: 0.12, duration: 0.7, ease: 'power2.out' },
    '.sobre__content', 'top 80%'
  );
  rev('.sobre__pillar',
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, stagger: 0.12, duration: 0.55, ease: 'power2.out' },
    '.sobre__pillars', 'top 84%'
  );

  // Serviços
  document.querySelectorAll('.servico-card').forEach((c, i) => {
    rev(c, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, delay: i * 0.1, ease: 'power2.out' }, c);
  });

  // Depoimentos
  document.querySelectorAll('.dep-card').forEach((c, i) => {
    rev(c, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, delay: i * 0.1, ease: 'power2.out' }, c);
  });

  // Contactos
  rev('.contactos-info > *',
    { opacity: 0, x: -30 },
    { opacity: 1, x: 0, stagger: 0.12, duration: 0.65, ease: 'power3.out' },
    '.contactos-info', 'top 82%'
  );
  rev('.contactos-map',
    { opacity: 0, scale: 0.95 },
    { opacity: 1, scale: 1, duration: 0.75, ease: 'power2.out' },
    '.contactos-map', 'top 84%'
  );

  // Footer newsletter
  rev('.footer__newsletter > *',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power2.out' },
    '.footer__newsletter', 'top 84%'
  );

  // Sobre parallax
  if (!reduced) {
    gsap.to('.sobre__bg img', {
      yPercent: 15, ease: 'none',
      scrollTrigger: { trigger: '.sobre', start: 'top bottom', end: 'bottom top', scrub: 1.5 }
    });
  }
}

/* ════════════════════════════════════════════════════
   HORÁRIOS — highlight today
════════════════════════════════════════════════════ */
(function highlightToday() {
  const today = new Date().getDay();
  document.querySelectorAll('.horario-row').forEach(row => {
    const days = (row.dataset.days || '').split(',').map(Number);
    if (days.includes(today)) row.classList.add('today');
  });
})();

/* ════════════════════════════════════════════════════
   NEWSLETTER FORM
════════════════════════════════════════════════════ */
document.getElementById('newsletterForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const email  = document.getElementById('nlEmail')?.value.trim();
  const status = document.getElementById('nlStatus');
  if (!email || !email.includes('@')) {
    if (status) { status.textContent = 'Por favor insira um e-mail válido.'; status.style.color = '#C05B3A'; }
    return;
  }
  if (status) { status.textContent = '✓ Subscrito! Bem-vinda à família El Vayon.'; status.style.color = 'var(--gold)'; }
  document.getElementById('nlEmail').value = '';
  setTimeout(() => { if (status) status.textContent = ''; }, 4000);
});

/* ════════════════════════════════════════════════════
   SMOOTH SCROLL
════════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight || 72) - 12;
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    closeDrawer();
  });
});

/* ════════════════════════════════════════════════════
   WA FLOAT ENTRANCE
════════════════════════════════════════════════════ */
(function waEntrance() {
  const wa = document.querySelector('.wa-float');
  if (!wa || reduced) return;
  gsap.set(wa, { scale: 0, opacity: 0 });
  gsap.to(wa, { scale: 1, opacity: 1, duration: 0.55, delay: 2.5, ease: 'back.out(1.7)' });
})();

/* ════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════ */
bindProductCards();
renderCart();
applyFilter('all', false); // initialise filter state
initScrollAnimations();
