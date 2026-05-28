// ==========================================
// NASTY — Shop Page Logic
// Firestore product loading + real-time filters
// ==========================================

import { db } from '../core/firebase.js';
import {
  collection, getDocs, query, where,
  orderBy, limit, startAfter, getCountFromServer
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { cart, showToast, debounce } from '../core/utils.js';

const PAGE_SIZE = 12;
let lastDoc = null;
let isLoading = false;
let hasMore = true;
let currentFilters = { category: null, minPrice: null, maxPrice: null, rating: 0, sale: false, sort: 'relevance' };

// ---- Build Firestore query ----
function buildQuery(filters, after = null) {
  const ref = collection(db, 'products');
  const constraints = [where('status', '==', 'active')];

  if (filters.category) constraints.push(where('category', '==', filters.category));
  if (filters.sale) constraints.push(where('isSale', '==', true));

  // Sort
  if (filters.sort === 'price_asc') constraints.push(orderBy('price', 'asc'));
  else if (filters.sort === 'price_desc') constraints.push(orderBy('price', 'desc'));
  else if (filters.sort === 'rating') constraints.push(orderBy('rating', 'desc'));
  else if (filters.sort === 'newest') constraints.push(orderBy('createdAt', 'desc'));
  else constraints.push(orderBy('createdAt', 'desc'));

  constraints.push(limit(PAGE_SIZE));
  if (after) constraints.push(startAfter(after));

  return query(ref, ...constraints);
}

// ---- Load products ----
export async function loadProducts(filters = currentFilters, reset = true) {
  if (isLoading) return;
  isLoading = true;

  const grid = document.getElementById('products-container');
  const loadBtn = document.getElementById('load-more-btn');

  if (reset) {
    lastDoc = null;
    hasMore = true;
    grid.innerHTML = skeletonHTML(PAGE_SIZE);
    currentFilters = { ...filters };
  }

  try {
    const q = buildQuery(filters, reset ? null : lastDoc);
    const snap = await getDocs(q);

    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    lastDoc = snap.docs[snap.docs.length - 1] || null;
    hasMore = snap.docs.length === PAGE_SIZE;

    if (reset) grid.innerHTML = '';

    if (!products.length && reset) {
      grid.innerHTML = emptyHTML();
    } else {
      products
        .filter(p => {
          if (filters.minPrice != null && p.price < filters.minPrice) return false;
          if (filters.maxPrice != null && p.price > filters.maxPrice) return false;
          if (filters.rating && p.rating < filters.rating) return false;
          return true;
        })
        .forEach(p => grid.insertAdjacentHTML('beforeend', productCardHTML(p)));
    }

    document.getElementById('result-count').textContent = grid.querySelectorAll('.product-card').length;
    if (loadBtn) loadBtn.style.display = hasMore ? 'block' : 'none';
  } catch (err) {
    console.warn('Firestore load failed, using mock data:', err.message);
    // Falls back gracefully — mock data is already in the HTML
  } finally {
    isLoading = false;
  }
}

// ---- Load next page ----
export async function loadNextPage() {
  if (!hasMore || isLoading) return;
  await loadProducts(currentFilters, false);
}

// ---- Product card HTML ----
function productCardHTML(p) {
  const inWish = new Set(JSON.parse(localStorage.getItem('nasty_wishlist') || '[]')).has(p.id);
  const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

  return `
    <div class="product-card reveal" onclick="window.location.href='product.html?id=${p.id}'">
      <div class="product-card-image">
        <img src="${p.image || p.images?.[0] || 'https://via.placeholder.com/400x300/111118/c9932a?text=NASTY'}"
             alt="${p.title}" loading="lazy"
             onerror="this.src='https://via.placeholder.com/400x300/111118/c9932a?text=NASTY'" />
        ${p.badge ? `<span class="product-card-badge ${p.badge === 'NEW' ? 'new' : p.badge === 'SALE' ? 'sale' : ''}">${p.badge}</span>` : ''}
        <div class="product-card-actions">
          <button class="card-action-btn ${inWish ? 'active' : ''}"
            onclick="event.stopPropagation(); toggleWishlist('${p.id}', this)" title="Wishlist">
            <i class="ti ti-heart"></i>
          </button>
          <button class="card-action-btn"
            onclick="event.stopPropagation(); quickAdd(${JSON.stringify(p).replace(/"/g, '&quot;')})" title="Quick add">
            <i class="ti ti-shopping-bag-plus"></i>
          </button>
        </div>
      </div>
      <div class="product-card-body">
        <div class="product-card-category">${p.category || ''}</div>
        <div class="product-card-title">${p.title}</div>
        <div class="product-card-price">
          <span class="price-current">$${p.price}</span>
          ${p.originalPrice ? `<span class="price-original">$${p.originalPrice}</span>` : ''}
          ${discount ? `<span style="font-size:10px;background:var(--ember);color:white;padding:2px 6px;border-radius:4px;font-weight:700">-${discount}%</span>` : ''}
        </div>
        <div class="product-card-rating">
          <span class="stars">${'★'.repeat(Math.floor(p.rating || 0))}${'☆'.repeat(5 - Math.floor(p.rating || 0))}</span>
          <span>${p.rating || 0} (${p.reviews || 0})</span>
        </div>
      </div>
      <div class="product-card-footer">
        <button class="add-to-cart-btn"
          onclick="event.stopPropagation(); quickAdd(${JSON.stringify(p).replace(/"/g, '&quot;')})">
          Add to Cart
        </button>
      </div>
    </div>`;
}

// ---- Wishlist toggle ----
export function toggleWishlist(id, btn) {
  const wl = new Set(JSON.parse(localStorage.getItem('nasty_wishlist') || '[]'));
  if (wl.has(id)) wl.delete(id); else wl.add(id);
  localStorage.setItem('nasty_wishlist', JSON.stringify([...wl]));
  btn.classList.toggle('active', wl.has(id));
  showToast(wl.has(id) ? 'Added to wishlist ♥' : 'Removed from wishlist', 'info');
}

// ---- Quick add to cart ----
export function quickAdd(product) {
  cart.add(product);
}

// ---- Skeletons ----
function skeletonHTML(count) {
  return Array(count).fill(0).map(() => `
    <div class="product-card" style="pointer-events:none">
      <div style="aspect-ratio:4/3;background:linear-gradient(90deg,var(--obsidian-3) 25%,var(--obsidian-4) 50%,var(--obsidian-3) 75%);background-size:200% 100%;animation:goldShimmer 1.5s linear infinite"></div>
      <div style="padding:1.25rem;display:flex;flex-direction:column;gap:8px">
        <div style="height:10px;width:40%;background:var(--obsidian-4);border-radius:4px"></div>
        <div style="height:14px;width:80%;background:var(--obsidian-4);border-radius:4px"></div>
        <div style="height:12px;width:30%;background:var(--obsidian-4);border-radius:4px"></div>
      </div>
    </div>`).join('');
}

function emptyHTML() {
  return `
    <div style="grid-column:1/-1;text-align:center;padding:5rem 2rem;color:var(--text-muted)">
      <div style="font-size:4rem;margin-bottom:1rem">🔮</div>
      <div style="font-family:var(--font-heading);font-size:15px;letter-spacing:.1em;margin-bottom:8px">No products found</div>
      <div style="font-size:13px">Try adjusting your filters</div>
    </div>`;
}

// ---- Expose to window for HTML onclick handlers ----
window.toggleWishlist = toggleWishlist;
window.quickAdd = quickAdd;
