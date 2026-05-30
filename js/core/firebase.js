// ==========================================
// NASTY — Firebase Core
// Replace with your Firebase project config
// ==========================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// ✅ REPLACE THIS with your Firebase project config
// Firebase Console → Project Settings → Your Apps → Web App → Config
const firebaseConfig = {
  apiKey: "AIzaSyBZQqau89IlAoQYgveWOnPCRlHbym1QQqM",
  authDomain: "nasty-33e29.firebaseapp.com",
  projectId: "nasty-33e29",
  storageBucket: "nasty-33e29.firebasestorage.app",
  messagingSenderId: "311773173321",
  appId: "1:311773173321:web:41cc05f48c3cba3fe65198"
};


// Safe init — won't crash if config is placeholder
let app, auth, db, storage;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY') {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } else {
    console.warn('[NASTY] Firebase config not set. Replace YOUR_API_KEY in js/core/firebase.js');
    // Create stub objects so imports don't throw
    auth = { currentUser: null, onAuthStateChanged: (cb) => { cb(null); return () => {}; } };
    db = null;
    storage = null;
  }
} catch(e) {
  console.error('[NASTY] Firebase init failed:', e.message);
  auth = { currentUser: null, onAuthStateChanged: (cb) => { cb(null); return () => {}; } };
  db = null;
  storage = null;
}

export { auth, db, storage };
export default app;
