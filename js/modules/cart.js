/**
 * Cart management with localStorage persistence
 */

const STORAGE_KEY = 'novedades_nl_cart';

/** @type {Map<string, {product: object, quantity: number}>} */
let cart = new Map();

/** Listeners for cart changes */
const listeners = new Set();

function notify() {
  const snapshot = getCartItems();
  listeners.forEach((fn) => fn(snapshot));
}

function persist() {
  try {
    const data = Array.from(cart.entries()).map(([id, item]) => ({
      id,
      quantity: item.quantity,
      product: item.product,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not persist cart', e);
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return;
    cart.clear();
    data.forEach(({ id, quantity, product }) => {
      if (id && product && quantity > 0) {
        cart.set(id, { product, quantity });
      }
    });
  } catch (e) {
    console.warn('Could not load cart', e);
    cart.clear();
  }
}

// Load on init
load();

/**
 * Subscribe to cart changes
 * @param {(items: Array) => void} fn
 * @returns {() => void} unsubscribe
 */
export function onCartChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Get current cart items as array
 */
export function getCartItems() {
  return Array.from(cart.values()).map(({ product, quantity }) => ({
    ...product,
    quantity,
    subtotal: (Number(product.sale_price) || 0) * quantity,
  }));
}

/**
 * Total items count
 */
export function getCartCount() {
  let count = 0;
  cart.forEach(({ quantity }) => {
    count += quantity;
  });
  return count;
}

/**
 * Cart total amount
 */
export function getCartTotal() {
  let total = 0;
  cart.forEach(({ product, quantity }) => {
    total += (Number(product.sale_price) || 0) * quantity;
  });
  return total;
}

/**
 * Add product to cart
 * @param {object} product
 * @param {number} [qty=1]
 */
export function addToCart(product, qty = 1) {
  if (!product?.id) return;
  const existing = cart.get(product.id);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.set(product.id, { product: { ...product }, quantity: qty });
  }
  persist();
  notify();
}

/**
 * Set quantity for a product (0 removes it)
 */
export function setQuantity(productId, quantity) {
  if (quantity <= 0) {
    cart.delete(productId);
  } else {
    const item = cart.get(productId);
    if (item) {
      item.quantity = quantity;
    }
  }
  persist();
  notify();
}

/**
 * Remove item
 */
export function removeFromCart(productId) {
  cart.delete(productId);
  persist();
  notify();
}

/**
 * Clear entire cart
 */
export function clearCart() {
  cart.clear();
  persist();
  notify();
}

/**
 * Build a human-readable order summary for WhatsApp
 */
export function buildOrderSummary() {
  const items = getCartItems();
  if (!items.length) return '';

  const lines = [
    '🛒 *Pedido Novedades N&L*',
    '────────────────────',
    '',
  ];

  items.forEach((item, i) => {
    const price = Number(item.sale_price) || 0;
    lines.push(
      `${i + 1}. *${item.name}*`,
      `   Cantidad: ${item.quantity}`,
      `   Precio: $${price.toFixed(2)} c/u`,
      `   Subtotal: $${item.subtotal.toFixed(2)}`,
      ''
    );
  });

  const total = getCartTotal();
  lines.push('────────────────────');
  lines.push(`*TOTAL: $${total.toFixed(2)}*`);
  lines.push('');
  lines.push('¡Hola! Me interesa este pedido 😊');

  return lines.join('\n');
}

/**
 * Format price for display
 */
export function formatPrice(value) {
  const num = Number(value) || 0;
  return `$${num.toFixed(2)}`;
}
