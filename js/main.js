/**
 * Novedades N&L - Catalog App
 * Entry point
 */

import { fetchCategories, fetchProducts } from './modules/supabase.js';
import {
  addToCart,
  setQuantity,
  removeFromCart,
  getCartItems,
  getCartCount,
  getCartTotal,
  onCartChange,
  buildOrderSummary,
  formatPrice,
} from './modules/cart.js';
import {
  showToast,
  openCart,
  closeCart,
  openModal,
  closeModal,
  openSearch,
  closeSearch,
  escapeHtml,
  icons,
} from './modules/ui.js';

// ========== STATE ==========
let categories = [];
let products = [];
let filteredProducts = [];
let activeCategoryId = null;
let activeTag = null;
let searchQuery = '';
let isLoading = true;
let hasError = false;
let selectedProduct = null;
let detailQty = 1;

// Category name lookup
const categoryMap = new Map();

// WhatsApp group link
const WHATSAPP_GROUP = 'https://chat.whatsapp.com/FoCLYnqe8ux5YZIjE0BXWK?s=cl&p=a&mlu=4&ilr=4';

// ========== DOM REFS ==========
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ========== INIT ==========
async function init() {
  bindEvents();
  updateCartUI();
  onCartChange(updateCartUI);

  // Header scroll shadow
  window.addEventListener('scroll', () => {
    const header = $('#header');
    if (window.scrollY > 8) header?.classList.add('header--scrolled');
    else header?.classList.remove('header--scrolled');
  }, { passive: true });

  await loadData();
}

async function loadData() {
  isLoading = true;
  hasError = false;
  renderProducts(); // shows skeletons

  try {
    const [cats, prods] = await Promise.all([
      fetchCategories(),
      fetchProducts({ inStockOnly: true }),
    ]);

    categories = Array.isArray(cats) ? cats : [];
    products = Array.isArray(prods) ? prods : [];

    categoryMap.clear();
    categories.forEach((c) => categoryMap.set(c.id, c.name));

    applyFilters();
    renderCategories();
    renderTags();
    isLoading = false;
    hasError = false;
  } catch (err) {
    console.error('Error loading data:', err);
    isLoading = false;
    hasError = true;
    products = [];
    filteredProducts = [];
  }

  renderProducts();
}

function applyFilters() {
  let list = [...products];

  if (activeCategoryId) {
    list = list.filter((p) => p.category_id === activeCategoryId);
  }

  if (activeTag) {
    list = list.filter((p) => (p.tags || '').toLowerCase() === activeTag.toLowerCase());
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter((p) => (p.name || '').toLowerCase().includes(q));
  }

  filteredProducts = list;
}

// ========== RENDER ==========
const TAGS = [
  'Electrónica',
  'Hogar',
  'Ropa',
  'Herramientas',
  'Navideño',
  'Cocina',
  'Tecnología',
  'Otros',
];

function renderTags() {
  const container = $('#tags-scroll');
  if (!container) return;

  const allChip = `
    <button class="tag-chip ${!activeTag ? 'tag-chip--active' : ''}" data-tag="">
      Todas
    </button>
  `;

  const chips = TAGS
    .map(
      (tag) => `
    <button class="tag-chip ${activeTag === tag ? 'tag-chip--active' : ''}" data-tag="${escapeHtml(tag)}">
      ${escapeHtml(tag)}
    </button>
  `
    )
    .join('');

  container.innerHTML = allChip + chips;

  container.querySelectorAll('.tag-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTag = btn.dataset.tag || null;
      applyFilters();
      renderTags();
      renderProducts();
      $('#products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderCategories() {
  const container = $('#categories-scroll');
  if (!container) return;

  const allChip = `
    <button class="category-chip ${!activeCategoryId ? 'category-chip--active' : ''}" data-cat="">
      Todos
    </button>
  `;

  const chips = categories
    .map(
      (c) => `
    <button class="category-chip ${activeCategoryId === c.id ? 'category-chip--active' : ''}" data-cat="${escapeHtml(c.id)}">
      ${escapeHtml(c.name)}
    </button>
  `
    )
    .join('');

  container.innerHTML = allChip + chips;

  container.querySelectorAll('.category-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategoryId = btn.dataset.cat || null;
      applyFilters();
      renderCategories();
      renderProducts();
      // Smooth scroll to products
      $('#products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderProducts() {
  const grid = $('#products-grid');
  const countEl = $('#products-count');
  if (!grid) return;

  if (isLoading) {
    grid.innerHTML = Array.from({ length: 8 })
      .map(
        () => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-card__img"></div>
        <div class="skeleton-card__body">
          <div class="skeleton skeleton-card__line skeleton-card__line--title"></div>
          <div class="skeleton skeleton-card__line"></div>
          <div class="skeleton skeleton-card__line skeleton-card__line--price"></div>
        </div>
      </div>
    `
      )
      .join('');
    if (countEl) countEl.textContent = '';
    return;
  }

  if (hasError) {
    grid.innerHTML = `
      <div class="state-block" style="grid-column: 1 / -1">
        <div class="state-block__icon">${icons.wifiOff}</div>
        <h3 class="state-block__title">No se pudo cargar el catálogo</h3>
        <p class="state-block__text">Revisa tu conexión a internet e intenta de nuevo.</p>
        <button class="btn btn--primary" id="retry-btn">Reintentar</button>
      </div>
    `;
    $('#retry-btn')?.addEventListener('click', loadData);
    if (countEl) countEl.textContent = '';
    return;
  }

  if (filteredProducts.length === 0) {
    const msg = searchQuery || activeCategoryId || activeTag
      ? 'No encontramos productos con esos filtros.'
      : 'Aún no hay productos disponibles. ¡Vuelve pronto!';
    grid.innerHTML = `
      <div class="state-block" style="grid-column: 1 / -1">
        <div class="state-block__icon">${icons.package}</div>
        <h3 class="state-block__title">Sin productos</h3>
        <p class="state-block__text">${msg}</p>
        ${(searchQuery || activeCategoryId || activeTag) ? '<button class="btn btn--outline" id="clear-filters-btn">Limpiar filtros</button>' : ''}
      </div>
    `;
    $('#clear-filters-btn')?.addEventListener('click', () => {
      activeCategoryId = null;
      activeTag = null;
      searchQuery = '';
      const searchInput = $('#header-search-input');
      const mobileInput = $('#mobile-search-input');
      if (searchInput) searchInput.value = '';
      if (mobileInput) mobileInput.value = '';
      applyFilters();
      renderCategories();
      renderTags();
      renderProducts();
    });
    if (countEl) countEl.textContent = '0 productos';
    return;
  }

  if (countEl) {
    countEl.textContent = `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''}`;
  }

  grid.innerHTML = filteredProducts
    .map((p, i) => {
      const catName = categoryMap.get(p.category_id) || '';
      const img = p.image_url
        ? `<img class="product-card__img" src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy" data-fallback="1">`
        : `<div class="product-card__img--placeholder">${icons.image}</div>`;

      const isNew = isRecent(p.created_at);
      const units = Number(p.units_per_package) || 1;
      const packageLabel = units > 1 ? `<span class="product-card__package">Paquete de ${units} uds</span>` : '';

      return `
        <article class="product-card animate-fade-in-up" style="animation-delay: ${Math.min(i * 0.04, 0.4)}s" data-id="${escapeHtml(p.id)}">
          <div class="product-card__img-wrap">
            ${img}
            ${isNew ? '<span class="product-card__badge">Nuevo</span>' : ''}
            <button class="product-card__add" data-add="${escapeHtml(p.id)}" aria-label="Agregar al carrito">
              ${icons.plus}
            </button>
          </div>
          <div class="product-card__body">
            ${catName ? `<span class="product-card__category">${escapeHtml(catName)}</span>` : ''}
            <h3 class="product-card__name">${escapeHtml(p.name)}</h3>
            ${packageLabel}
            <p class="product-card__price">${formatPrice(p.sale_price)}${units > 1 ? ' / paquete' : ''}</p>
          </div>
        </article>
      `;
    })
    .join('');

  // Bind card clicks
  grid.querySelectorAll('.product-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-add]')) return;
      const id = card.dataset.id;
      const product = products.find((p) => p.id === id);
      if (product) openProductDetail(product);
    });
  });

  // Fallback for broken images
  grid.querySelectorAll('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', function () {
      const wrap = this.parentElement;
      if (wrap && !wrap.querySelector('.product-card__img--placeholder')) {
        wrap.innerHTML = `<div class="product-card__img--placeholder">${icons.image}</div>`;
      }
    });
  });

  grid.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.add;
      const product = products.find((p) => p.id === id);
      if (product) {
        addToCart(product, 1);
        showToast('Agregado al carrito', 'success');
        bounceCartBadge();
      }
    });
  });
}

function isRecent(createdAt) {
  if (!createdAt) return false;
  const date = new Date(createdAt);
  const days = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return days <= 14;
}

// ========== PRODUCT DETAIL ==========
function openProductDetail(product) {
  selectedProduct = product;
  detailQty = 1;

  const catName = categoryMap.get(product.category_id) || '';
  const modalBody = $('#modal-body');
  if (!modalBody) return;

  const imgHtml = product.image_url
    ? `<img class="product-detail__img" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}">`
    : `<div class="product-detail__img--placeholder">${icons.image}</div>`;

  const units = Number(product.units_per_package) || 1;
  const packageNote = units > 1 ? `<span class="product-detail__package">Paquete de ${units} unidades</span>` : '';

  modalBody.innerHTML = `
    <div class="product-detail__img-wrap">
      ${imgHtml}
    </div>
    <div class="product-detail__content">
      ${catName ? `<span class="product-detail__category">${escapeHtml(catName)}</span>` : ''}
      <h2 class="product-detail__name">${escapeHtml(product.name)}</h2>
      ${packageNote}
      <div class="product-detail__meta">
        ${product.brand ? `<span>Marca: <strong>${escapeHtml(product.brand)}</strong></span>` : ''}
        ${product.model ? `<span>Modelo: <strong>${escapeHtml(product.model)}</strong></span>` : ''}
        ${product.stock != null ? `<span>Stock: <strong>${product.stock}</strong></span>` : ''}
      </div>
      <p class="product-detail__price">${formatPrice(product.sale_price)}${units > 1 ? ' / paquete' : ''}</p>
      ${product.description ? `<p class="product-detail__desc">${escapeHtml(product.description)}</p>` : ''}
      <div class="product-detail__actions">
        <div class="product-detail__qty">
          <button type="button" id="detail-qty-minus" aria-label="Disminuir">${icons.minus}</button>
          <span id="detail-qty">${detailQty}</span>
          <button type="button" id="detail-qty-plus" aria-label="Aumentar">${icons.plus}</button>
        </div>
        <button class="btn btn--primary" id="detail-add-btn" style="flex:1">
          ${icons.cart}
          Agregar al carrito
        </button>
      </div>
    </div>
  `;

  $('#detail-qty-minus')?.addEventListener('click', () => {
    if (detailQty > 1) {
      detailQty--;
      const el = $('#detail-qty');
      if (el) el.textContent = detailQty;
    }
  });

  $('#detail-qty-plus')?.addEventListener('click', () => {
    detailQty++;
    const el = $('#detail-qty');
    if (el) el.textContent = detailQty;
  });

  $('#detail-add-btn')?.addEventListener('click', () => {
    if (selectedProduct) {
      addToCart(selectedProduct, detailQty);
      showToast(`Agregado ×${detailQty} al carrito`, 'success');
      bounceCartBadge();
      closeModal();
    }
  });

  openModal();
}

// ========== CART UI ==========
function updateCartUI() {
  const count = getCartCount();
  const badge = $('#cart-badge');
  if (badge) {
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.classList.toggle('cart-btn__badge--visible', count > 0);
  }

  renderCartItems();
}

function bounceCartBadge() {
  const badge = $('#cart-badge');
  if (!badge) return;
  badge.classList.remove('cart-btn__badge--bounce');
  void badge.offsetWidth;
  badge.classList.add('cart-btn__badge--bounce');
}

function renderCartItems() {
  const body = $('#cart-body');
  const footer = $('#cart-footer');
  if (!body) return;

  const items = getCartItems();

  if (items.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty__icon">${icons.bag}</div>
        <p class="cart-empty__title">Tu carrito está vacío</p>
        <p class="cart-empty__text">Agrega productos del catálogo para continuar.</p>
      </div>
    `;
    if (footer) footer.classList.add('hidden');
    return;
  }

  if (footer) footer.classList.remove('hidden');

  body.innerHTML = items
    .map((item) => {
      const img = item.image_url
        ? `<img class="cart-item__img" src="${escapeHtml(item.image_url)}" alt="">`
        : `<div class="cart-item__img cart-item__img--placeholder">${icons.image}</div>`;

      const units = Number(item.units_per_package) || 1;
      const packageNote = units > 1 ? `<span class="cart-item__package">Paquete de ${units} uds</span>` : '';

      return `
        <div class="cart-item" data-id="${escapeHtml(item.id)}">
          ${img}
          <div class="cart-item__info">
            <p class="cart-item__name">${escapeHtml(item.name)}</p>
            ${packageNote}
            <p class="cart-item__price">${formatPrice(item.sale_price)}${units > 1 ? ' / paq.' : ''}</p>
            <div class="cart-item__controls">
              <div class="cart-item__qty">
                <button type="button" data-qty-minus="${escapeHtml(item.id)}" aria-label="Menos">${icons.minus}</button>
                <span>${item.quantity}</span>
                <button type="button" data-qty-plus="${escapeHtml(item.id)}" aria-label="Más">${icons.plus}</button>
              </div>
              <button type="button" class="cart-item__remove" data-remove="${escapeHtml(item.id)}" aria-label="Eliminar">
                ${icons.trash}
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  // Bind qty / remove
  body.querySelectorAll('[data-qty-minus]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.qtyMinus;
      const item = getCartItems().find((i) => i.id === id);
      if (item) setQuantity(id, item.quantity - 1);
    });
  });

  body.querySelectorAll('[data-qty-plus]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.qtyPlus;
      const item = getCartItems().find((i) => i.id === id);
      if (item) setQuantity(id, item.quantity + 1);
    });
  });

  body.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.remove);
      showToast('Producto eliminado');
    });
  });

  // Total
  const totalEl = $('#cart-total-price');
  if (totalEl) totalEl.textContent = formatPrice(getCartTotal());
}

// ========== WHATSAPP ORDER ==========
const SELLERS = {
  luis: { name: 'Luis Arturo', phone: '528715118046' },
  norma: { name: 'Norma Padilla', phone: '528718450065' },
};

async function continueToWhatsApp() {
  const nameInput = $('#customer-name');
  const areaInput = $('#customer-area');
  const sellerSelect = $('#seller-select');

  const customerName = nameInput?.value.trim();
  const area = areaInput?.value.trim();
  const sellerKey = sellerSelect?.value;

  if (!customerName || !area || !sellerKey) {
    showToast('Completa nombre, área y vendedor', 'default');
    if (nameInput) nameInput.focus();
    return;
  }

  const summary = buildOrderSummary(customerName, area);
  if (!summary) {
    showToast('El carrito está vacío');
    return;
  }

  const seller = SELLERS[sellerKey];
  if (!seller) {
    showToast('Selecciona un vendedor válido');
    return;
  }

  const encodedMessage = encodeURIComponent(summary);
  const waUrl = `https://wa.me/${seller.phone}?text=${encodedMessage}`;

  // Open WhatsApp with prefilled message
  window.open(waUrl, '_blank', 'noopener,noreferrer');

  // Optional: clear form after sending (or keep for convenience)
  // nameInput.value = '';
  // areaInput.value = '';
  // sellerSelect.value = '';
}

// ========== EVENTS ==========
function bindEvents() {
  // Cart open/close
  $('#cart-btn')?.addEventListener('click', openCart);
  $('#cart-overlay')?.addEventListener('click', closeCart);
  $('#cart-close')?.addEventListener('click', closeCart);

  // Modal close
  $('#modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  $('#modal-close')?.addEventListener('click', closeModal);

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      closeModal();
      closeSearch();
    }
  });

  // Search desktop
  const headerSearch = $('#header-search-input');
  if (headerSearch) {
    let debounce;
    headerSearch.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        searchQuery = headerSearch.value;
        applyFilters();
        renderProducts();
      }, 280);
    });
  }

  // Mobile search
  $('#search-mobile-btn')?.addEventListener('click', openSearch);
  $('#search-overlay-close')?.addEventListener('click', closeSearch);

  const mobileSearch = $('#mobile-search-input');
  if (mobileSearch) {
    mobileSearch.addEventListener('input', () => {
      searchQuery = mobileSearch.value;
      applyFilters();
      renderProducts();
    });
    mobileSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        closeSearch();
        $('#products-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // WhatsApp CTA
  $('#whatsapp-order-btn')?.addEventListener('click', continueToWhatsApp);

  // Hero CTA scroll
  $('#hero-cta')?.addEventListener('click', (e) => {
    e.preventDefault();
    $('#products-section')?.scrollIntoView({ behavior: 'smooth' });
  });
}

// ========== BOOT ==========
document.addEventListener('DOMContentLoaded', init);
