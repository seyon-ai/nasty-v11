// ==========================================
// NASTY — Product Page Logic
// Firestore product loading + reviews
// ==========================================

import { db } from '../core/firebase.js';
import {
  doc, getDoc, collection, addDoc,
  getDocs, query, orderBy, serverTimestamp, updateDoc, increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { cart, showToast } from '../core/utils.js';
import { getUser } from '../core/auth.js';

// ---- Load product by ID ----
export async function loadProduct(id) {
  try {
    const snap = await getDoc(doc(db, 'products', id));
    if (!snap.exists()) return null;
    // Increment view count
    await updateDoc(doc(db, 'products', id), { views: increment(1) }).catch(() => {});
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.warn('Firestore product load failed:', err.message);
    return null;
  }
}

// ---- Load reviews ----
export async function loadReviews(productId) {
  try {
    const q = query(
      collection(db, 'products', productId, 'reviews'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

// ---- Submit review ----
export async function submitReview(productId, { rating, body }) {
  const user = getUser();
  if (!user) { showToast('Sign in to leave a review', 'error'); return false; }

  try {
    await addDoc(collection(db, 'products', productId, 'reviews'), {
      userId: user.uid,
      name: user.displayName || 'Anonymous',
      avatar: user.displayName?.[0]?.toUpperCase() || '?',
      rating,
      body,
      createdAt: serverTimestamp()
    });

    // Update product avg rating
    const reviews = await loadReviews(productId);
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await updateDoc(doc(db, 'products', productId), {
      rating: Math.round(avg * 10) / 10,
      reviews: reviews.length
    }).catch(() => {});

    showToast('Review submitted! ✦', 'success');
    return true;
  } catch (err) {
    showToast('Failed to submit review', 'error');
    return false;
  }
}

// ---- Track browse history for AI personalization ----
export function trackBrowse(product) {
  try {
    const history = JSON.parse(localStorage.getItem('nasty_browse') || '[]');
    const entry = { id: product.id, title: product.title, category: product.category, ts: Date.now() };
    const filtered = history.filter(h => h.id !== product.id);
    localStorage.setItem('nasty_browse', JSON.stringify([entry, ...filtered].slice(0, 20)));
  } catch {}
}

// ---- Get browse history ----
export function getBrowseHistory() {
  try {
    return JSON.parse(localStorage.getItem('nasty_browse') || '[]');
  } catch { return []; }
}
