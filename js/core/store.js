// ==========================================
// NASTY — Global Store
// Reactive state for cart, wishlist, session
// ==========================================

import { showToast } from './utils.js';

// ---- Subscribers ----
const subscribers = { cart: [], wishlist: [], user: [] };

function notify(key, data) {
  subscribers[key]?.forEach(cb => cb(data));
}

export function subscribe(key, cb) {
  if (subscribers[key]) subscribers[key].push(cb);
}

// ==========================================
// CART STORE
// ==========================================
export const cartStore = {
  _key: 'nasty_cart',

  get() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]'); }
    catch { return []; }
  },

  save(items) {
    localStorage.setItem(this._key, JSON.stringify(items));
    notify('cart', items);
    this._updateBadge(items);
  },

  add(product) {
    const items = this.get();
    const idx = items.findIndex(i => i.id === product.id && i.selectedSize === product.selectedSize);
    if (idx > -1) {
      items[idx].qty = Math.min(99, items[idx].qty + (product.qty || 1));
    } else {
      items.push({ ...product, qty: product.qty || 1 });
    }
    this.save(items);
    showToast(`${product.title} added to cart 🛒`, 'success');
  },

  remove(id, size = null) {
    const items = this.get().filter(i => !(i.id === id && (!size || i.selectedSize === size)));
    this.save(items);
  },

  updateQty(id, qty, size = null) {
    if (qty < 1) { this.remove(id, size); return; }
    const items = this.get();
    const idx = items.findIndex(i => i.id === id && (!size || i.selectedSize === size));
    if (idx > -1) { items[idx].qty = Math.min(99, qty); this.save(items); }
  },

  clear() {
    this.save([]);
    showToast('Cart cleared', 'info');
  },

  total() {
    return this.get().reduce((s, i) => s + i.price * i.qty, 0);
  },

  count() {
    return this.get().reduce((s, i) => s + i.qty, 0);
  },

  _updateBadge(items) {
    const badges = document.querySelectorAll('#cart-badge, .cart-badge');
    const count = items.reduce((s, i) => s + i.qty, 0);
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  init() {
    this._updateBadge(this.get());
  }
};

// ==========================================
// WISHLIST STORE
// ==========================================
export const wishlistStore = {
  _key: 'nasty_wishlist',

  get() {
    try { return new Set(JSON.parse(localStorage.getItem(this._key) || '[]')); }
    catch { return new Set(); }
  },

  has(id) {
    return this.get().has(id);
  },

  toggle(id, productTitle = '') {
    const wl = this.get();
    const added = !wl.has(id);
    if (added) wl.add(id); else wl.delete(id);
    localStorage.setItem(this._key, JSON.stringify([...wl]));
    notify('wishlist', [...wl]);
    showToast(added ? `${productTitle || 'Item'} added to wishlist ♥` : 'Removed from wishlist', 'info');
    return added;
  },

  add(id) {
    const wl = this.get();
    wl.add(id);
    localStorage.setItem(this._key, JSON.stringify([...wl]));
    notify('wishlist', [...wl]);
  },

  remove(id) {
    const wl = this.get();
    wl.delete(id);
    localStorage.setItem(this._key, JSON.stringify([...wl]));
    notify('wishlist', [...wl]);
  },

  clear() {
    localStorage.removeItem(this._key);
    notify('wishlist', []);
  },

  count() {
    return this.get().size;
  }
};

// ==========================================
// USER SESSION STORE
// ==========================================
export const sessionStore = {
  _user: null,

  set(user) {
    this._user = user;
    notify('user', user);
    this._updateNavUI(user);
  },

  get() { return this._user; },

  isLoggedIn() { return !!this._user; },

  _updateNavUI(user) {
    const loginBtns = document.querySelectorAll('#nav-login-btn, .nav-login-btn');
    const userBtns = document.querySelectorAll('#nav-user-btn, .nav-user-btn');
    const avatars = document.querySelectorAll('#nav-user-avatar, .nav-user-avatar');

    if (user) {
      loginBtns.forEach(b => b.classList.add('hidden'));
      userBtns.forEach(b => b.classList.remove('hidden'));
      avatars.forEach(a => { a.textContent = user.displayName?.[0]?.toUpperCase() || '👤'; });
    } else {
      loginBtns.forEach(b => b.classList.remove('hidden'));
      userBtns.forEach(b => b.classList.add('hidden'));
    }
  }
};

// ==========================================
// BROWSE HISTORY (AI personalization)
// ==========================================
export const browseHistory = {
  _key: 'nasty_browse',

  get() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]'); }
    catch { return []; }
  },

  push(product) {
    const history = this.get().filter(h => h.id !== product.id);
    history.unshift({
      id: product.id,
      title: product.title,
      category: product.category,
      price: product.price,
      ts: Date.now()
    });
    localStorage.setItem(this._key, JSON.stringify(history.slice(0, 20)));
  },

  getCategories() {
    const history = this.get();
    const counts = {};
    history.forEach(h => { counts[h.category] = (counts[h.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([cat]) => cat);
  },

  clear() {
    localStorage.removeItem(this._key);
  }
};

// ==========================================
// SEARCH HISTORY
// ==========================================
export const searchHistory = {
  _key: 'nasty_searches',

  get() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]'); }
    catch { return []; }
  },

  push(query) {
    if (!query?.trim()) return;
    const history = this.get().filter(q => q !== query);
    history.unshift(query);
    localStorage.setItem(this._key, JSON.stringify(history.slice(0, 10)));
  },

  clear() { localStorage.removeItem(this._key); }
};

// Init on import
cartStore.init();
