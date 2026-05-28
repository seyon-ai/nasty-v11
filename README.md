# 🐉 NASTY Marketplace

The world's most immersive e-commerce platform. AI-powered. Dragon-guarded. Mythic + nature aesthetic.

---

## 🚀 Quick Deploy

### 1. Add your dragon GLB
Drop `dragon.glb` into `assets/models/dragon.glb` (max 25MB).
Get it free: https://sketchfab.com/3d-models/dragon-flying-78f809b98bbe426e94d4024dc894b206

### 2. Add Firebase config
Open `js/core/firebase.js` and replace the placeholder config with your Firebase project config.
Get it from: Firebase Console → Project Settings → Your Apps → Web App.

### 3. Push to GitHub
```bash
git init
git add .
git commit -m "NASTY — initial deploy"
git remote add origin https://github.com/YOUR_USERNAME/nasty-ecom.git
git push -u origin main
```

### 4. Deploy to Vercel
1. Go to vercel.com → New Project → Import your GitHub repo
2. Add these 3 environment variables:
   - `GROQ_API_KEY` → your Groq key (console.groq.com)
   - `HF_API_KEY` → your HuggingFace key (huggingface.co/settings/tokens)
   - `IMGBB_API_KEY` → your ImgBB key (api.imgbb.com)
3. Deploy — done ✦

---

## 📁 File Structure

```
nasty-ecom/
├── api/                    ← Vercel serverless (keeps keys server-side)
│   ├── groq.js             ← /api/groq endpoint
│   ├── huggingface.js      ← /api/huggingface endpoint
│   └── imgbb.js            ← /api/imgbb endpoint
│
├── assets/
│   └── models/
│       └── dragon.glb      ← ADD THIS (download from Sketchfab)
│
├── css/
│   ├── global.css          ← Variables, theme, navbar, typography
│   ├── animations.css      ← All keyframes + scroll reveal
│   └── components.css      ← Cards, buttons, chat, auth modal
│
├── js/
│   ├── core/
│   │   ├── firebase.js     ← Firebase init (add your config here)
│   │   ├── auth.js         ← Login, signup, verification, Google
│   │   ├── utils.js        ← Toast, cursor, cart helpers, router
│   │   └── store.js        ← Global state (cart, wishlist, session)
│   ├── ai/
│   │   ├── groq.js         ← Dragon chat, search intent, recommendations
│   │   ├── huggingface.js  ← Image classification + tagging
│   │   └── imgbb.js        ← Image upload
│   ├── scene/
│   │   ├── dragonScene.js  ← Three.js GLB loader + cinematic lighting
│   │   ├── lotus.js        ← Procedural lotus bloom (no GLB needed)
│   │   ├── particles.js    ← Ember, gold dust, smoke systems
│   │   └── intro.js        ← Cinematic sequence controller
│   └── pages/
│       ├── shop.js         ← Firestore product loading + filters
│       ├── product.js      ← Product detail + reviews
│       ├── seller.js       ← Seller CRUD + order management
│       └── admin.js        ← Platform stats + moderation
│
├── pages/
│   ├── shop.html           ← All-category browse + AI search
│   ├── product.html        ← Product detail + 3D gallery + AI recs
│   ├── cart.html           ← Cart with promo codes
│   ├── checkout.html       ← Full checkout flow + order confirmation
│   ├── seller.html         ← Seller dashboard + AI tools
│   ├── seller-products.html← Product management + AI listing writer
│   ├── seller-orders.html  ← Order fulfillment + tracking
│   ├── admin.html          ← Platform admin + AI insights
│   ├── account.html        ← Customer profile + orders + wishlist
│   └── login.html          ← Dedicated auth page
│
├── index.html              ← Cinematic landing (dragon + lotus + AI chat)
├── vercel.json             ← Routing config
└── .gitignore
```

---

## 🤖 AI Features

| Location | AI | Model |
|---|---|---|
| Dragon chat (landing) | Groq | Llama 3.3 70B |
| Search intent engine | Groq | Llama 3.3 70B |
| Product recommendations | Groq | Llama 3.3 70B |
| Seller listing writer | Groq | Llama 3.3 70B |
| Personalized feed | Groq | Llama 3.3 70B |
| Admin platform insights | Groq | Llama 3.3 70B |
| Product image tagging | HuggingFace | ViT-base-patch16 |
| Image uploads | ImgBB | CDN API |

---

## 🔥 Portals

| Portal | URL | Access |
|---|---|---|
| Storefront | `/` | Public |
| Shop | `/pages/shop.html` | Public |
| Product | `/pages/product.html?id=X` | Public |
| Cart | `/pages/cart.html` | Public |
| Checkout | `/pages/checkout.html` | Public |
| Account | `/pages/account.html` | Auth required |
| Login | `/pages/login.html` | Public |
| Seller | `/pages/seller.html` | Seller role |
| Admin | `/pages/admin.html` | Admin role |

---

## 🛡 Security

- API keys stored as Vercel env vars — never in client code
- All AI calls routed through `/api/*` serverless functions
- Firebase Auth handles all authentication
- Firestore Security Rules should be configured per your needs
- Email verification required before login

---

## 🎨 Customization

- **Colors**: edit CSS variables in `css/global.css` (`:root` block)
- **Fonts**: swap Google Fonts import in `css/global.css`
- **Dragon**: replace `assets/models/dragon.glb` with any GLB
- **Brand name**: find/replace "NASTY" across all HTML files
- **Firebase**: update `js/core/firebase.js` with your config

---

Built with 🔥 by NASTY × AugX Dev
