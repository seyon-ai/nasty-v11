// ==========================================
// NASTY — Auth Module
// Safe wrappers around Firebase Auth
// ==========================================

import { auth, db } from './firebase.js';
import { showToast } from './utils.js';

// Dynamically import Firebase auth functions only if auth is real
async function getFirebaseAuth() {
  if (!auth || !auth.currentUser === undefined) return null;
  try {
    return await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
  } catch { return null; }
}

async function getFirebaseFirestore() {
  if (!db) return null;
  try {
    return await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  } catch { return null; }
}

let currentUser = null;
const authCallbacks = [];

// Auth state listener
if (auth && typeof auth.onAuthStateChanged === 'function') {
  auth.onAuthStateChanged(user => {
    currentUser = user;
    authCallbacks.forEach(cb => cb(user));
    updateNavUI(user);
  });
}

export function onAuthChange(cb) { authCallbacks.push(cb); if (currentUser !== undefined) cb(currentUser); }
export function getUser() { return currentUser; }
export function isLoggedIn() { return !!currentUser; }

export async function signUp(name, email, password) {
  try {
    const fa = await getFirebaseAuth();
    if (!fa) return { success: false, error: 'Firebase not configured. Add your config to js/core/firebase.js' };
    const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = fa;
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await sendEmailVerification(cred.user);
    const ffs = await getFirebaseFirestore();
    if (ffs && db) {
      const { doc, setDoc, serverTimestamp } = ffs;
      await setDoc(doc(db, 'users', cred.user.uid), { uid: cred.user.uid, name, email, role: 'customer', wishlist: [], createdAt: serverTimestamp(), verified: false });
    }
    return { success: true, user: cred.user, needsVerification: true };
  } catch (err) { return { success: false, error: parseAuthError(err.code) }; }
}

export async function signIn(email, password) {
  try {
    const fa = await getFirebaseAuth();
    if (!fa) return { success: false, error: 'Firebase not configured. Add your config to js/core/firebase.js' };
    const { signInWithEmailAndPassword, signOut } = fa;
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!cred.user.emailVerified) {
      await signOut(auth);
      return { success: false, error: 'Please verify your email first.', needsVerification: true, email };
    }
    return { success: true, user: cred.user };
  } catch (err) { return { success: false, error: parseAuthError(err.code) }; }
}

export async function signInWithGoogle() {
  try {
    const fa = await getFirebaseAuth();
    if (!fa) return { success: false, error: 'Firebase not configured.' };
    const { GoogleAuthProvider, signInWithPopup } = fa;
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    const ffs = await getFirebaseFirestore();
    if (ffs && db) {
      const { doc, setDoc, getDoc, serverTimestamp } = ffs;
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (!snap.exists()) {
        await setDoc(doc(db, 'users', cred.user.uid), { uid: cred.user.uid, name: cred.user.displayName, email: cred.user.email, avatar: cred.user.photoURL, role: 'customer', wishlist: [], createdAt: serverTimestamp(), verified: true });
      }
    }
    return { success: true, user: cred.user };
  } catch (err) { return { success: false, error: parseAuthError(err.code) }; }
}

export async function resendVerification(email, password) {
  try {
    const fa = await getFirebaseAuth();
    if (!fa) return { success: false, error: 'Firebase not configured.' };
    const { signInWithEmailAndPassword, sendEmailVerification, signOut } = fa;
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    await signOut(auth);
    return { success: true };
  } catch (err) { return { success: false, error: parseAuthError(err.code) }; }
}

export async function resetPassword(email) {
  try {
    const fa = await getFirebaseAuth();
    if (!fa) return { success: false, error: 'Firebase not configured.' };
    const { sendPasswordResetEmail } = fa;
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (err) { return { success: false, error: parseAuthError(err.code) }; }
}

export async function logOut() {
  try {
    const fa = await getFirebaseAuth();
    if (!fa) return { success: true };
    const { signOut } = fa;
    await signOut(auth);
    showToast('Signed out', 'info');
    return { success: true };
  } catch { return { success: false }; }
}

export async function getUserProfile(uid) {
  try {
    const ffs = await getFirebaseFirestore();
    if (!ffs || !db) return null;
    const { doc, getDoc } = ffs;
    const snap = await getDoc(doc(db, 'users', uid || currentUser?.uid));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

function updateNavUI(user) {
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

function parseAuthError(code) {
  const map = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/invalid-credential': 'Invalid email or password.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
