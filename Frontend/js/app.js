const API = '/api';
const CART_KEY = 'atelier-cart-v1';

const demoProducts = [
  { _id: 'demo-1', name: 'Forma ceramic vase', category: 'Home', description: 'A sculptural silhouette for a single stem or a quiet moment on its own. Hand-finished stoneware with a softly tactile glaze.', price: 48, compareAtPrice: 58, stock: 12, badge: 'Bestseller', featured: true, images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=85'], reviews: [] },
  { _id: 'demo-2', name: 'Daily ritual cup', category: 'Kitchen', description: 'Your first sip, made a little more special. A balanced, easy-to-hold cup in warm, natural clay.', price: 32, stock: 24, badge: 'New', featured: true, images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1000&q=85'], reviews: [] },
  { _id: 'demo-3', name: 'Arc desk lamp', category: 'Workspace', description: 'Focused light, softened by thoughtful form. A compact lamp that brings calm to your desk and bedside.', price: 124, stock: 7, badge: 'Limited', featured: true, images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85'], reviews: [] },
  { _id: 'demo-4', name: 'Still linen throw', category: 'Textiles', description: 'Washed European linen in a generous, layered weave. Beautifully breathable and made to soften with every use.', price: 86, stock: 15, images: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85'], reviews: [] },
  { _id: 'demo-5', name: 'Pebble incense holder', category: 'Home', description: 'A small grounding object shaped by river stones. Made from solid wood with a neat brass insert.', price: 26, stock: 31, images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1000&q=85'], reviews: [] },
  { _id: 'demo-6', name: 'Gather serving bowl', category: 'Kitchen', description: 'Room for the whole table. This generous serving bowl is carved and glazed by hand, so every piece is one of a kind.', price: 68, stock: 9, badge: 'Handmade', images: ['https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1000&q=85'], reviews: [] },
  { _id: 'demo-7', name: 'Everywhere tote', category: 'Accessories', description: 'A hardworking everyday carryall, cut from heavyweight organic cotton canvas with a considered inside pocket.', price: 38, stock: 40, images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=85'], reviews: [] },
  { _id: 'demo-8', name: 'Soft glow candle', category: 'Home', description: 'A gentle, grounding blend of cedar, fig leaf, and a little late afternoon sun. Poured in a reusable ceramic vessel.', price: 42, stock: 18, badge: 'Made in small batches', images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1000&q=85'], reviews: [] }
];

const state = {
  products: [], categories: [], selectedCategory: 'All', search: '', sort: 'featured', maxPrice: 250,
  cart: readCart(), user: null, apiOnline: false, checkoutStep: 1, checkoutAddress: null,
  order: null, adminTab: 'products', editingProduct: null, detailImage: 0, returnTo: null,
  settings: { taxRate: 0.08, shippingFee: 8, freeShippingThreshold: 100 }, analytics: null, charts: []
};

function readCart() {
  try { const value = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); updateCartCount(); }
function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function safeImage(value) {
  const url = String(value || '');
  if (url.startsWith('/uploads/') && !url.includes('..')) return escapeHTML(url);
  return /^https:\/\//i.test(url) ? escapeHTML(url) : 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=80';
}
function money(value) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0); }
function slugStatus(value) { return String(value || '').toLowerCase().replace(/\s+/g, '-'); }
function getProductId(product) { return product._id || product.id; }
function getImage(product, index = 0) { return product.images?.[index] || product.images?.[0] || ''; }
function productRating(product) {
  if (Number(product.rating) > 0) return Number(product.rating).toFixed(1);
  const reviews = product.reviews || [];
  return reviews.length ? (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1) : 'New';
}
function cartSubtotal() { return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0); }
function cartShipping() { return cartSubtotal() >= state.settings.freeShippingThreshold ? 0 : state.cart.length ? state.settings.shippingFee : 0; }
function cartTax() { return Math.round(cartSubtotal() * state.settings.taxRate * 100) / 100; }
function cartTotal() { return cartSubtotal() + cartTax() + cartShipping(); }

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: { ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}

function updateCartCount() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.querySelector('#cart-count');
  if (badge) { badge.textContent = count; badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); }
}

function showToast(message, type = 'success') {
  const region = document.querySelector('#toast-region');
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  const copy = document.createElement('span');
  copy.textContent = message;
  const close = document.createElement('button');
  close.type = 'button'; close.className = 'toast-close'; close.setAttribute('aria-label', 'Dismiss notification'); close.textContent = '×';
  close.addEventListener('click', () => toast.remove());
  toast.append(copy, close);
  region.append(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

async function boot() {
  document.querySelector('#year').textContent = new Date().getFullYear();
  updateCartCount();
  await Promise.all([loadUser(), loadCatalog()]);
  if (!location.hash && location.pathname === '/') location.hash = '#/';
  renderRoute();
  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('pointermove', onProductTilt, { passive: true });
  document.addEventListener('pointerout', resetProductTilt);
  window.addEventListener('hashchange', renderRoute);
}

async function loadUser() {
  try { const data = await api('/auth/me'); state.user = data.user; }
  catch { state.user = null; }
}

async function loadCatalog() {
  try {
    const [productData, categoryData, configData] = await Promise.all([api('/products?limit=60'), api('/products/categories'), api('/store-config')]);
    state.products = productData.products || [];
    state.categories = categoryData.categories || [];
    state.settings = { ...state.settings, ...(configData.settings || {}) };
    state.apiOnline = true;
  } catch {
    state.products = demoProducts;
    state.categories = [...new Set(demoProducts.map((product) => product.category))].sort();
    state.apiOnline = false;
  }
}

function routePath() {
  const route = location.hash ? location.hash.replace(/^#/, '') : location.pathname;
  return (route || '/').split('?')[0];
}
function renderRoute() {
  state.charts.forEach((chart) => chart.destroy());
  state.charts = [];
  const path = routePath();
  document.body.classList.toggle('portal-admin', path === '/admin' || path.startsWith('/admin/'));
  const isCustomerPortal = path === '/account' || path.startsWith('/account/') || path === '/dashboard' || path.startsWith('/dashboard/') || path === '/orders' || path.startsWith('/orders/');
  document.body.classList.toggle('portal-customer', isCustomerPortal);
  if (path.startsWith('/product/')) renderProduct(path.slice('/product/'.length));
  else if (path === '/login' || path === '/register') renderAuth(path === '/register');
  else if (path === '/checkout') renderCheckout();
  else if (path === '/account' || path.startsWith('/account/') || path === '/dashboard' || path.startsWith('/dashboard/')) renderAccount(path.split('/')[2] || 'overview');
  else if (path === '/orders' || path.startsWith('/orders/')) renderAccount(path.split('/')[2] || 'orders');
  else if (path === '/admin' || path.startsWith('/admin/')) renderAdmin(path.split('/')[2] || 'overview');
  else renderHome();
  const app = document.querySelector('#app');
  app.classList.remove('page-enter');
  void app.offsetWidth;
  app.classList.add('page-enter');
  document.querySelectorAll('.main-nav a').forEach((link) => link.classList.toggle('active', path === '/' && link.dataset.nav === 'shop'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filteredProducts() {
  let list = state.products.filter((product) => {
    const matchesCategory = state.selectedCategory === 'All' || product.category === state.selectedCategory;
    const query = state.search.trim().toLowerCase();
    const matchesSearch = !query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch && Number(product.price) <= state.maxPrice;
  });
  if (state.sort === 'priceAsc') list = [...list].sort((a, b) => a.price - b.price);
  if (state.sort === 'priceDesc') list = [...list].sort((a, b) => b.price - a.price);
  if (state.sort === 'newest') list = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  if (state.sort === 'rating') list = [...list].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  if (state.sort === 'featured') list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
  return list;
}

function renderProductCard(product) {
  const id = escapeHTML(getProductId(product));
  const rating = productRating(product);
  const isOut = Number(product.stock) <= 0;
  return `<article class="product-card">
    <div class="product-image-wrap">
      <a href="#/product/${id}" class="product-image-link" aria-label="View ${escapeHTML(product.name)}"><img loading="lazy" src="${safeImage(getImage(product))}" alt="${escapeHTML(product.name)}"></a>
      ${product.badge ? `<span class="product-badge">${escapeHTML(product.badge)}</span>` : ''}
      <button class="quick-add" data-action="add" data-id="${id}" ${isOut ? 'disabled' : ''}>${isOut ? 'Sold out' : 'Add to bag  +'}</button>
    </div>
    <div class="product-card-info"><div><a href="#/product/${id}"><h3>${escapeHTML(product.name)}</h3></a><p class="category">${escapeHTML(product.category)}</p><div class="rating-line"><span>★</span><span>${rating}${rating === 'New' ? '' : ` · ${(product.reviews || []).length}`}</span></div></div>
    <div class="product-price">${product.compareAtPrice ? `<span class="compare-price">${money(product.compareAtPrice)}</span>` : ''}${money(product.price)}</div></div>
  </article>`;
}

function renderGrid() {
  const grid = document.querySelector('#product-grid');
  if (!grid) return;
  const products = filteredProducts();
  grid.innerHTML = products.length ? products.map(renderProductCard).join('') : `<div class="empty-state"><div><h3>No pieces found</h3><p>Try another search or explore a different collection.</p></div></div>`;
  const resultCount = document.querySelector('#result-count');
  if (resultCount) resultCount.textContent = `${products.length} ${products.length === 1 ? 'piece' : 'pieces'} to explore`;
}

function renderHome() {
  const categoryButtons = ['All', ...state.categories].map((category) => `<button class="category-chip ${state.selectedCategory === category ? 'selected' : ''}" data-action="category" data-category="${escapeHTML(category)}">${escapeHTML(category)}</button>`).join('');
  document.querySelector('#app').innerHTML = `
    <section class="hero">
      <div class="hero-copy"><span class="eyebrow">Considered living · Collection 04</span><h1>Make room<br>for <em>good things.</em></h1><p>Thoughtfully chosen pieces that bring a little more intention, warmth, and ease to the everyday.</p><a class="button" href="#/" data-scroll="featured">Explore the collection <span class="arrow">↗</span></a></div>
      <div class="hero-visual"><span class="hero-index">EST. 2024 &nbsp; / &nbsp; OBJECTS FOR EVERYDAY</span><div class="hero-art"><img src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1100&q=88" alt="Sculptural ceramic objects in soft afternoon light"></div><div class="hero-note">Made with<br>intention <span>✳</span></div></div>
    </section>
    <section class="service-strip" aria-label="Store promises">
      <div class="service-item"><svg viewBox="0 0 24 24"><path d="M3 7h11v11H3zM14 11h4l3 3v4h-7z"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="17.5" cy="19" r="1.5"/></svg>Thoughtful shipping, always</div>
      <div class="service-item"><svg viewBox="0 0 24 24"><path d="M12 3v18M4.5 7.5h15M5 7.5l-3 6h6l-3-6Zm14 0-3 6h6l-3-6Z"/></svg>Small makers, big ideas</div>
      <div class="service-item"><svg viewBox="0 0 24 24"><path d="M12 21s8-4.3 8-11V5l-8-3-8 3v5c0 6.7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></svg>Materials made to last</div>
      <div class="service-item"><svg viewBox="0 0 24 24"><path d="M20.8 8.6c0 5.5-8.8 11-8.8 11s-8.8-5.5-8.8-11a4.5 4.5 0 0 1 8.8-1.3 4.5 4.5 0 0 1 8.8 1.3Z"/></svg>A little better by design</div>
    </section>
    <section class="section" id="featured"><div class="section-heading"><div><span class="eyebrow">The collection</span><h2>Find your new favorite.</h2></div><p id="result-count">A few good things, all in one place.</p></div>
      <div class="collection-tools"><div class="category-list">${categoryButtons}</div><div class="filter-tools"><label class="search-wrap"><svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.7"/><path d="m16 16 4.2 4.2"/></svg><input id="product-search" type="search" placeholder="Search the collection" value="${escapeHTML(state.search)}" aria-label="Search products"></label><select id="product-sort" aria-label="Sort products"><option value="featured" ${state.sort === 'featured' ? 'selected' : ''}>Featured</option><option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Newest</option><option value="priceAsc" ${state.sort === 'priceAsc' ? 'selected' : ''}>Price: low to high</option><option value="priceDesc" ${state.sort === 'priceDesc' ? 'selected' : ''}>Price: high to low</option><option value="rating" ${state.sort === 'rating' ? 'selected' : ''}>Top rated</option></select><label class="range-wrap">Up to ${money(state.maxPrice)}<input id="price-range" type="range" min="25" max="250" step="5" value="${state.maxPrice}" aria-label="Maximum price"></label></div></div>
      <div class="product-grid" id="product-grid">${state.products.length ? filteredProducts().map(renderProductCard).join('') : Array.from({ length: 4 }, () => '<div class="product-image-wrap skeleton"></div>').join('')}</div>
      ${state.apiOnline ? '' : '<div class="preview-note">You’re viewing the preview collection. Connect MongoDB and seed the database to enable accounts, live inventory, and checkout.</div>'}
    </section>
    <section class="editorial" id="about"><div class="editorial-card"><div class="editorial-image"><img loading="lazy" src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85" alt="Sunlit, calm living space with carefully chosen objects"></div><div class="editorial-copy"><span class="eyebrow">Less, but more meaningful</span><h2>Made for the life you actually live.</h2><p>We believe the everyday deserves a little care. Our collection brings together useful, lasting pieces from people who make things with thought and feeling.</p><a class="button secondary" href="#/" data-scroll="featured">Get to know the collection <span class="arrow">↗</span></a></div></div></section>`;
  updateCartCount();
}

async function renderProduct(id) {
  const appRoot = document.querySelector('#app');
  let product = state.products.find((item) => String(getProductId(item)) === id);
  if (state.apiOnline) {
    try { product = (await api(`/products/${encodeURIComponent(id)}`)).product; }
    catch (error) { if (!product) { appRoot.innerHTML = `<div class="page-shell"><div class="empty-state"><div><h3>Product unavailable</h3><p>${escapeHTML(error.message)}</p><a class="button secondary" href="#/">Back to shop</a></div></div></div>`; return; } }
  }
  if (!product) { appRoot.innerHTML = '<div class="page-shell"><div class="empty-state"><div><h3>We could not find that piece</h3><a class="button secondary" href="#/">Back to shop</a></div></div></div>'; return; }
  state.detailImage = Math.min(state.detailImage, Math.max(0, (product.images || []).length - 1));
  const rating = productRating(product);
  const stock = Number(product.stock);
  const images = (product.images?.length ? product.images : [getImage(product)]).slice(0, 5);
  appRoot.innerHTML = `<div class="page-shell"><div class="breadcrumbs"><a href="#/">Shop</a> &nbsp;/&nbsp; <a href="#/" data-scroll="featured">${escapeHTML(product.category)}</a> &nbsp;/&nbsp; ${escapeHTML(product.name)}</div>
    <div class="product-detail"><div class="gallery"><div class="gallery-thumbs">${images.map((image, index) => `<button class="gallery-thumb ${index === state.detailImage ? 'active' : ''}" data-action="gallery" data-index="${index}" aria-label="View image ${index + 1}"><img src="${safeImage(image)}" alt=""></button>`).join('')}</div><div class="gallery-main"><img src="${safeImage(images[state.detailImage])}" alt="${escapeHTML(product.name)}"></div></div>
    <div class="product-info"><span class="eyebrow">${escapeHTML(product.category)}${product.badge ? ` · ${escapeHTML(product.badge)}` : ''}</span><h1>${escapeHTML(product.name)}</h1><div class="rating-line"><span>★</span><span>${rating}${rating === 'New' ? ' · Be the first to review' : ` · ${(product.reviews || []).length} reviews`}</span></div><div class="detail-price">${product.compareAtPrice ? `<span class="compare-price">${money(product.compareAtPrice)}</span>` : ''}${money(product.price)}</div><div class="stock-line"><span class="stock-dot ${stock < 1 ? 'out' : ''}"></span>${stock > 0 ? `${stock < 6 ? 'Only ' : ''}${stock} in stock, ready to ship` : 'Currently out of stock'}</div><p class="product-description">${escapeHTML(product.description)}</p>
      <div class="detail-quantity"><div class="quantity-control"><button data-action="detail-qty" data-delta="-1" aria-label="Decrease quantity">−</button><span id="detail-qty">1</span><button data-action="detail-qty" data-delta="1" aria-label="Increase quantity">+</button></div><button class="button" data-action="add" data-id="${escapeHTML(getProductId(product))}" data-detail-add ${stock < 1 ? 'disabled' : ''}>Add to bag · ${money(product.price)}</button></div>
      <div class="detail-perks"><span>Complimentary shipping over $100</span><span>Thoughtfully packed, ready to gift</span><span>30-day returns, always easy</span></div></div></div>
    <section class="reviews"><span class="eyebrow">Kind words</span><h2>Notes from our community</h2>${(product.reviews || []).length ? `<div class="review-list">${product.reviews.map((review) => `<article class="review-card"><div class="rating-line">${'★'.repeat(Number(review.rating))}${'☆'.repeat(5 - Number(review.rating))}</div><strong>${escapeHTML(review.name || 'A customer')}</strong><p>${escapeHTML(review.comment)}</p></article>`).join('')}</div>` : '<p class="muted">No reviews yet. Your experience could be the first.</p>'}
      ${state.user && state.apiOnline ? `<form class="review-form" id="review-form" data-id="${escapeHTML(getProductId(product))}"><select name="rating" class="select-input" required><option value="">Your rating</option><option value="5">★★★★★ — Loved it</option><option value="4">★★★★ — Really good</option><option value="3">★★★ — It’s nice</option><option value="2">★★ — Could be better</option><option value="1">★ — Not for me</option></select><input class="form-field-input" name="comment" minlength="5" maxlength="600" placeholder="Share a little about your experience" required><button class="button" type="submit">Leave a note</button></form>` : !state.user && state.apiOnline ? '<p class="muted"><a class="text-button" href="#/login">Sign in</a> to leave a review.</p>' : ''}</section></div>`;
}

function renderAuth(register) {
  if (state.user) { location.hash = '#/account'; return; }
  const title = register ? 'A good place to start.' : 'Welcome back.';
  document.querySelector('#app').innerHTML = `<div class="page-shell"><div class="auth-layout"><div class="auth-art"><img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=85" alt="Natural textures and considered home details"><div class="auth-art-caption">A home for good things.</div></div><form class="auth-form" id="auth-form" data-mode="${register ? 'register' : 'login'}"><span class="eyebrow">${register ? 'Join our little community' : 'Your Atelier account'}</span><h1>${title}</h1><p>${register ? 'Create an account to save the pieces you love and keep an eye on every order.' : 'Sign in to see your orders and find your next favorite thing.'}</p><div class="form-error" id="auth-error"></div>${register ? '<div class="form-field"><label for="auth-name">Your name</label><input id="auth-name" name="name" autocomplete="name" minlength="2" required placeholder="Alex Morgan"></div>' : ''}<div class="form-field"><label for="auth-email">Email address</label><input id="auth-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com"></div><div class="form-field"><label for="auth-password">Password</label><div class="password-wrap"><input id="auth-password" name="password" type="password" autocomplete="${register ? 'new-password' : 'current-password'}" minlength="8" required placeholder="${register ? 'Create a strong password' : 'Your password'}"><button class="password-toggle" type="button" data-action="toggle-password" aria-label="Show password" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/></svg></button></div>${register ? '<ul class="password-checklist" id="password-checklist"><li data-rule="length"><span>○</span> At least 8 characters</li><li data-rule="upper"><span>○</span> One uppercase letter</li><li data-rule="lower"><span>○</span> One lowercase letter</li><li data-rule="number"><span>○</span> One number</li><li data-rule="special"><span>○</span> One special character (@ $ ! % * # ? &)</li></ul>' : ''}</div><button class="button full" type="submit" ${register ? 'disabled' : ''}>${register ? 'Create your account' : 'Sign in'} <span class="arrow">↗</span></button><div class="auth-switch">${register ? 'Already have an account?' : 'New to Atelier?'} <a class="text-button" href="#/${register ? 'login' : 'register'}">${register ? 'Sign in' : 'Create an account'}</a></div></form></div></div>`;
}

function passwordRules(value) {
  return { length: value.length >= 8, upper: /[A-Z]/.test(value), lower: /[a-z]/.test(value), number: /[0-9]/.test(value), special: /[@$!%*#?&]/.test(value) };
}

function updatePasswordChecklist(value) {
  const checklist = document.querySelector('#password-checklist');
  if (!checklist) return;
  const rules = passwordRules(value);
  Object.entries(rules).forEach(([rule, valid]) => {
    const row = checklist.querySelector(`[data-rule="${rule}"]`);
    row.classList.toggle('valid', valid);
    row.classList.toggle('invalid', Boolean(value) && !valid);
    row.querySelector('span').textContent = valid ? '✓' : value ? '✗' : '○';
  });
  const submit = document.querySelector('#auth-form button[type="submit"]');
  if (submit) submit.disabled = !Object.values(rules).every(Boolean);
}

function renderCart() {
  const root = document.querySelector('#overlay-root');
  if (!root.querySelector('.drawer-backdrop')) return;
  const backdrop = root.querySelector('.drawer-backdrop');
  backdrop.innerHTML = `<aside class="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping bag"><div class="drawer-header"><h2>Your bag <span style="color:#91968e;font-size:12px">(${state.cart.reduce((s,i)=>s+i.quantity,0)})</span></h2><button class="close-button" data-action="close-cart" aria-label="Close bag">×</button></div>${state.cart.length ? `<div class="cart-items">${state.cart.map((item) => `<div class="cart-row"><a href="#/product/${escapeHTML(item.id)}" data-action="cart-link"><img src="${safeImage(item.image)}" alt="${escapeHTML(item.name)}"></a><div><a href="#/product/${escapeHTML(item.id)}" data-action="cart-link"><h3>${escapeHTML(item.name)}</h3></a><span class="muted">${money(item.price)}</span><div class="cart-row-actions"><button data-action="cart-qty" data-id="${escapeHTML(item.id)}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-action="cart-qty" data-id="${escapeHTML(item.id)}" data-delta="1" aria-label="Increase quantity">+</button><button class="remove-link" data-action="remove-cart" data-id="${escapeHTML(item.id)}">Remove</button></div></div><span class="cart-row-price">${money(item.price * item.quantity)}</span></div>`).join('')}</div><div class="cart-summary"><div class="shipping-progress">${cartSubtotal() >= state.settings.freeShippingThreshold ? 'You unlocked complimentary shipping ✳' : `You’re ${money(state.settings.freeShippingThreshold - cartSubtotal())} away from complimentary shipping`}</div><div class="summary-line"><span>Subtotal</span><span>${money(cartSubtotal())}</span></div><div class="summary-line"><span>Estimated tax</span><span>${money(cartTax())}</span></div><div class="summary-line"><span>Shipping</span><span>${cartShipping() ? money(cartShipping()) : 'Complimentary'}</span></div><div class="summary-line total"><span>Estimated total</span><span>${money(cartTotal())}</span></div><button class="button full" data-action="checkout">Continue to checkout <span class="arrow">↗</span></button><p class="summary-note">Taxes and shipping are finalized at checkout.</p></div>` : `<div class="cart-empty"><strong>A little room for something good.</strong><p>Your bag is waiting for its first find.</p><button class="button secondary" data-action="close-cart">Explore the collection</button></div>`}</aside>`;
}

function openCart() {
  const root = document.querySelector('#overlay-root');
  root.innerHTML = '<div class="drawer-backdrop" data-action="backdrop"></div>';
  renderCart();
}

function closeCart() { document.querySelector('#overlay-root').innerHTML = ''; }

function addToCart(id, quantity = 1) {
  const product = state.products.find((item) => String(getProductId(item)) === String(id));
  if (!product) return showToast('That product is no longer available.', 'error');
  const existing = state.cart.find((item) => String(item.id) === String(id));
  const nextQuantity = (existing?.quantity || 0) + quantity;
  if (nextQuantity > Number(product.stock)) return showToast('That would be more than we have in stock.', 'error');
  if (existing) existing.quantity = nextQuantity;
  else state.cart.push({ id: String(id), name: product.name, category: product.category, image: getImage(product), price: Number(product.price), quantity });
  saveCart();
  showToast(`${product.name} added to your bag.`);
  if (document.querySelector('.drawer-backdrop')) renderCart();
}

function adjustCart(id, delta) {
  const item = state.cart.find((product) => product.id === String(id));
  if (!item) return;
  const product = state.products.find((entry) => String(getProductId(entry)) === item.id);
  const next = item.quantity + delta;
  if (next > (Number(product?.stock) || 99)) return showToast('That is all we currently have in stock.', 'error');
  if (next < 1) state.cart = state.cart.filter((entry) => entry.id !== item.id);
  else item.quantity = next;
  saveCart();
  renderCart();
}

function renderCheckout() {
  if (!state.user) { state.returnTo = '#/checkout'; location.hash = '#/login'; return; }
  if (!state.cart.length && !state.order) { location.hash = '#/'; showToast('Your bag is empty. Find a good thing first.'); return; }
  if (state.order) {
    const order = state.order;
    document.querySelector('#app').innerHTML = `<div class="page-shell"><div class="success-card"><div class="success-mark">✓</div><span class="eyebrow" style="justify-content:center">It’s on its way</span><h1>Thank you, ${escapeHTML(state.user.name.split(' ')[0])}.</h1><p>Your order is in good hands. We’ve sent a confirmation to ${escapeHTML(order.shippingAddress.email)}.</p><div class="success-order"><div class="summary-line"><span>Order number</span><strong>${escapeHTML(order.orderNumber)}</strong></div><div class="summary-line"><span>Order total</span><strong>${money(order.total)}</strong></div><div class="summary-line"><span>Payment</span><span>Mock payment · complete</span></div></div><a class="button" href="#/account">View your orders <span class="arrow">↗</span></a> &nbsp; <a class="text-button" href="#/">Keep exploring</a></div></div>`;
    return;
  }
  const step = state.checkoutStep;
  const steps = `<div class="stepper"><div class="step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}"><span class="step-number">${step > 1 ? '✓' : '1'}</span>Shipping</div><div class="step-line"></div><div class="step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}"><span class="step-number">${step > 2 ? '✓' : '2'}</span>Payment</div><div class="step-line"></div><div class="step ${step >= 3 ? 'active' : ''}"><span class="step-number">3</span>Confirmation</div></div>`;
  const address = state.checkoutAddress || { name: state.user.name, email: state.user.email, phone: '', address: '', city: '', region: '', postalCode: '', country: '' };
  let content = '';
  if (step === 1) content = `<div class="checkout-card"><h2>Where should we send it?</h2><form id="shipping-form"><div class="form-grid"><div class="form-field"><label>Full name</label><input name="name" autocomplete="name" required value="${escapeHTML(address.name)}"></div><div class="form-field"><label>Email address</label><input name="email" type="email" autocomplete="email" required value="${escapeHTML(address.email)}"></div></div><div class="form-field"><label>Phone number</label><input name="phone" type="tel" autocomplete="tel" required value="${escapeHTML(address.phone)}"></div><div class="form-field"><label>Street address</label><input name="address" autocomplete="street-address" required value="${escapeHTML(address.address)}" placeholder="House number and street"></div><div class="form-grid"><div class="form-field"><label>City</label><input name="city" autocomplete="address-level2" required value="${escapeHTML(address.city)}"></div><div class="form-field"><label>State / region</label><input name="region" autocomplete="address-level1" required value="${escapeHTML(address.region)}"></div></div><div class="form-grid"><div class="form-field"><label>Postal code</label><input name="postalCode" autocomplete="postal-code" required value="${escapeHTML(address.postalCode)}"></div><div class="form-field"><label>Country</label><input name="country" autocomplete="country-name" required value="${escapeHTML(address.country)}"></div></div><div class="checkout-actions"><a class="text-button" href="#/">← Back to shopping</a><button class="button" type="submit">Continue to payment <span class="arrow">↗</span></button></div></form></div>`;
  else content = `<div class="checkout-card"><h2>Payment, made simple.</h2><p style="color:#858a82;font-size:11px;line-height:1.7;margin:0 0 18px">This assignment uses a simulated checkout. No card details are requested or charged. Confirm below to place your order.</p><div class="payment-note"><span class="payment-icon">◇</span><span><strong>Secure mock payment</strong><br>Your order will be marked as paid in the demo so you can follow it through the admin panel.</span></div><div class="summary-line" style="margin-top:20px"><span>Delivering to</span><button class="text-button" data-action="checkout-back">Edit address</button></div><p style="font-size:11px;line-height:1.7;color:#777d74">${escapeHTML(address.name)}<br>${escapeHTML(address.address)}<br>${escapeHTML(address.city)}, ${escapeHTML(address.region)} ${escapeHTML(address.postalCode)}<br>${escapeHTML(address.country)}</p><div class="checkout-actions"><button class="button secondary" data-action="checkout-back">← Shipping</button><button class="button" data-action="place-order">Place order · ${money(cartTotal())} <span class="arrow">↗</span></button></div><div class="form-error" id="checkout-error"></div></div>`;
  document.querySelector('#app').innerHTML = `<div class="page-shell"><div class="checkout-layout"><div class="checkout-main"><span class="eyebrow">Almost yours</span><h1>Checkout</h1>${steps}${content}</div><aside class="checkout-aside"><h2>Your order</h2>${state.cart.map((item) => `<div class="checkout-item"><img src="${safeImage(item.image)}" alt="${escapeHTML(item.name)}"><div class="checkout-item-name">${escapeHTML(item.name)}<span>Qty ${item.quantity} · ${money(item.price)}</span></div><span class="checkout-item-price">${money(item.price * item.quantity)}</span></div>`).join('')}<div style="margin-top:18px"><div class="summary-line"><span>Subtotal</span><span>${money(cartSubtotal())}</span></div><div class="summary-line"><span>Estimated tax</span><span>${money(cartTax())}</span></div><div class="summary-line"><span>Shipping</span><span>${cartShipping() ? money(cartShipping()) : 'Complimentary'}</span></div><div class="summary-line total"><span>Total</span><span>${money(cartTotal())}</span></div></div></aside></div></div>`;
}

function portalFrame(kind, section, content) {
  const admin = kind === 'admin';
  const links = admin
    ? [['overview', 'Overview', '◫'], ['products', 'Products', '◇'], ['orders', 'Orders', '▤'], ['users', 'Customers', '◎'], ['profile', 'My profile', '◉']]
    : [['overview', 'Overview', '◫'], ['orders', 'My orders', '▤'], ['profile', 'Profile', '◎']];
  const title = admin ? 'Atelier / Studio' : 'Atelier / Account';
  const avatar = state.user.avatar ? `<img src="${safeImage(state.user.avatar)}" alt="">` : escapeHTML(state.user.name.slice(0, 1).toUpperCase());
  return `<div class="portal-layout ${admin ? 'admin-portal' : 'customer-portal'}"><aside class="portal-sidebar"><a class="brand portal-brand" href="#/"><span class="brand-mark">a.</span><span>atelier</span></a><p class="portal-kicker">${title}</p><nav class="portal-nav" aria-label="${admin ? 'Admin' : 'Account'} navigation">${links.map(([key, label, icon]) => `<a class="portal-nav-link ${section === key ? 'active' : ''}" href="#/${admin ? 'admin' : 'dashboard'}${key === 'overview' ? '' : `/${key}`}"><span>${icon}</span>${label}</a>`).join('')}</nav><div class="portal-sidebar-bottom"><div class="portal-user"><span class="portal-avatar">${avatar}</span><span><strong>${escapeHTML(state.user.name)}</strong><small>${admin ? 'Store administrator' : 'Atelier member'}</small></span></div><button class="portal-signout" data-action="logout">Sign out <span>↗</span></button><a class="portal-store-link" href="#/">← Return to storefront</a></div></aside><main class="portal-main"><header class="portal-topbar"><div><span class="portal-overline">${admin ? 'STORE OPERATIONS' : 'YOUR ATELIER'}</span><span class="portal-section-name">${escapeHTML(links.find(([key]) => key === section)?.[1] || 'Overview')}</span></div><span class="portal-top-date">${new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}</span></header><section class="portal-content">${content}</section></main></div>`;
}

function avatarMarkup(user, className = 'avatar') {
  return user.avatar ? `<img class="${className} avatar-image" src="${safeImage(user.avatar)}" alt="${escapeHTML(user.name)} profile picture">` : `<span class="${className}">${escapeHTML(user.name.slice(0, 1).toUpperCase())}</span>`;
}

function renderProfilePanel(user, admin = false) {
  return `<div class="portal-page-heading"><div><span class="portal-overline">YOUR DETAILS</span><h1>${admin ? 'Your admin profile.' : 'Make yourself at home.'}</h1><p>Update your profile details and picture.</p></div></div><div class="profile-edit-card"><div class="profile-photo-block">${avatarMarkup(user, 'profile-photo')}<div><strong>Your profile picture</strong><p>JPG, PNG, or WebP · up to 2 MB</p><label class="small-button upload-label" for="avatar-file">Choose a photo</label><input id="avatar-file" type="file" accept="image/jpeg,image/png,image/webp" hidden></div></div><form id="profile-form" class="profile-edit-form"><div class="form-field"><label for="profile-name">Full name</label><input id="profile-name" name="name" minlength="2" maxlength="80" required value="${escapeHTML(user.name)}"></div><div class="form-field"><label for="profile-email">Email address</label><input id="profile-email" name="email" type="email" required value="${escapeHTML(user.email)}"></div><button class="button" type="submit">Save profile <span class="arrow">↗</span></button></form></div>`;
}

async function renderAccount(section = 'overview') {
  if (!state.user) { state.returnTo = location.hash || `#${routePath() || '/dashboard'}`; location.hash = '#/login'; return; }
  if (!['overview', 'orders', 'profile'].includes(section)) section = 'overview';
  const root = document.querySelector('#app');
  root.innerHTML = portalFrame('customer', section, '<div class="portal-skeleton"><div class="skeleton skeleton-tile"></div><div class="skeleton skeleton-panel"></div></div>');
  let orders = [];
  try { orders = (await api('/auth/me/orders')).orders || []; }
  catch (error) { showToast(error.message, 'error'); }
  const count = orders.length;
  const totalSpend = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const recentOrders = orders.slice(0, 4);
  const orderCards = (items) => items.map((order) => `<article class="customer-order-card"><div class="customer-order-head"><div><span class="portal-overline">ORDER ${escapeHTML(order.orderNumber)}</span><span class="customer-order-date">${new Date(order.createdAt).toLocaleDateString()}</span></div><span class="status-pill ${slugStatus(order.status)}">${escapeHTML(order.status)}</span></div><div class="customer-order-items">${order.items.map((item) => `<div class="customer-order-item"><img src="${safeImage(item.image)}" alt="${escapeHTML(item.name)}"><span>${escapeHTML(item.name)} <small>× ${item.quantity}</small></span><strong>${money(item.price * item.quantity)}</strong></div>`).join('')}</div><div class="customer-order-foot"><span>${order.trackingNumber ? `Tracking · ${escapeHTML(order.trackingNumber)}` : `Fulfillment · ${escapeHTML(order.status)}`}</span><strong>${money(order.total)}</strong><a class="small-button" href="/api/orders/${encodeURIComponent(order._id)}/receipt">Download receipt ↓</a></div></article>`).join('');
  let content = '';
  if (section === 'overview') content = `<div class="portal-page-heading"><div><span class="portal-overline">A LITTLE SPACE OF YOUR OWN</span><h1>Welcome back, ${escapeHTML(state.user.name.split(' ')[0])}.</h1><p>Here’s what’s happening with your Atelier orders.</p></div><a class="button" href="#/">Explore the collection <span class="arrow">↗</span></a></div><div class="customer-stats"><article><span>Orders placed</span><strong>${count}</strong><small>Since you joined Atelier</small></article><article><span>Total spent</span><strong>${money(totalSpend)}</strong><small>Thoughtful pieces, well chosen</small></article><article><span>Account status</span><strong class="status-live">● Active</strong><small>Member since ${new Date(state.user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</small></article></div><div class="portal-section-heading"><div><span class="portal-overline">YOUR RECENT ACTIVITY</span><h2>Recent orders</h2></div><a href="#/dashboard/orders" class="text-button">See all orders ↗</a></div>${recentOrders.length ? orderCards(recentOrders) : '<div class="portal-empty"><span>◇</span><h3>Your order story starts here.</h3><p>When you find your next favorite thing, it will show up here.</p><a href="#/" class="button secondary">Visit the collection</a></div>'}`;
  if (section === 'orders') content = `<div class="portal-page-heading"><div><span class="portal-overline">YOUR ATELIER HISTORY</span><h1>Every good thing.</h1><p>Order details, fulfillment updates, and receipts.</p></div></div><div class="portal-section-heading"><div><span class="portal-overline">ORDER HISTORY</span><h2>${count} ${count === 1 ? 'order' : 'orders'}</h2></div></div>${count ? orderCards(orders) : '<div class="portal-empty"><span>◇</span><h3>No orders just yet.</h3><p>Your next favorite is waiting in the collection.</p><a href="#/" class="button secondary">Explore the collection</a></div>'}`;
  if (section === 'profile') content = renderProfilePanel(state.user);
  root.innerHTML = portalFrame('customer', section, content);
}

function renderMonthlyChart(monthly = []) {
  const canvas = document.querySelector('#revenue-chart');
  if (!canvas || !window.Chart) return;
  state.charts.forEach((chart) => chart.destroy()); state.charts = [];
  const chart = new Chart(canvas, { type: 'line', data: { labels: monthly.map((row) => row.label), datasets: [
    { label: 'Revenue', data: monthly.map((row) => row.revenue), borderColor: '#3a7257', backgroundColor: 'rgba(58,114,87,.11)', borderWidth: 2, fill: true, tension: .38, pointRadius: 3, pointHoverRadius: 6 },
    { label: 'Orders', data: monthly.map((row) => row.sales), borderColor: '#d1a070', backgroundColor: 'transparent', borderWidth: 1.5, yAxisID: 'orders', tension: .35, pointRadius: 2 }
  ] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: '#777f73', font: { family: 'DM Sans', size: 10 } } }, tooltip: { backgroundColor: '#263c2f', padding: 12, callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.datasetIndex === 0 ? money(ctx.parsed.y) : ctx.parsed.y}` } } }, scales: { x: { grid: { display: false }, ticks: { color: '#92978d', font: { size: 9 } } }, y: { beginAtZero: true, grid: { color: 'rgba(39,55,43,.07)' }, ticks: { color: '#92978d', callback: (value) => `$${value}` } }, orders: { position: 'right', beginAtZero: true, grid: { display: false }, ticks: { color: '#c19364', precision: 0 } } } } });
  state.charts.push(chart);
}

function renderCategoryChart(categories = []) {
  const canvas = document.querySelector('#category-chart');
  if (!canvas || !window.Chart) return;
  const palette = ['#315c47', '#b4c5a4', '#d6aa81', '#7e9c91', '#e5c8a9', '#89927b', '#cad6c1', '#bd8774'];
  const chart = new Chart(canvas, { type: 'doughnut', data: { labels: categories.map((item) => item.name), datasets: [{ data: categories.map((item) => item.quantity), backgroundColor: palette, borderColor: '#fbfaf6', borderWidth: 4, hoverOffset: 9 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, color: '#777f73', font: { family: 'DM Sans', size: 10 } } }, tooltip: { backgroundColor: '#263c2f', padding: 12, callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} items sold` } } } } });
  state.charts.push(chart);
}

async function renderAdmin(section = 'overview') {
  if (!state.user) { state.returnTo = `#/admin${section === 'overview' ? '' : `/${section}`}`; location.hash = '#/login'; return; }
  if (state.user.role !== 'admin') { document.querySelector('#app').innerHTML = '<div class="page-shell"><div class="empty-state"><div><h3>Store team only</h3><p>This part of the shop is reserved for an admin account.</p><a href="#/dashboard" class="button secondary">Back to your account</a></div></div></div>'; return; }
  if (!state.apiOnline) { document.querySelector('#app').innerHTML = '<div class="page-shell"><div class="empty-state"><div><h3>Management is offline</h3><p>Connect the API and database to manage your store.</p></div></div></div>'; return; }
  if (!['overview', 'products', 'orders', 'users', 'profile'].includes(section)) section = 'overview';
  const root = document.querySelector('#app');
  root.innerHTML = portalFrame('admin', section, '<div class="portal-skeleton"><div class="skeleton skeleton-tile"></div><div class="skeleton skeleton-panel"></div></div>');
  let stats = { products: 0, orders: 0, customers: 0, revenue: 0 }, orders = [], users = [];
  try {
    const requests = [api('/admin/overview').then((data) => { stats = data.stats; state.analytics = data.analytics; })];
    if (section === 'orders') requests.push(api('/admin/orders').then((data) => { orders = data.orders; }));
    if (section === 'users') requests.push(api('/admin/users').then((data) => { users = data.users; }));
    if (section === 'products') requests.push(loadCatalog());
    await Promise.all(requests);
  } catch (error) { root.innerHTML = portalFrame('admin', section, `<div class="portal-empty"><h3>Could not load store data</h3><p>${escapeHTML(error.message)}</p></div>`); return; }
  const form = state.editingProduct;
  let content = '';
  const heading = (kicker, title, description = '') => `<div class="portal-page-heading"><div><span class="portal-overline">${kicker}</span><h1>${title}</h1>${description ? `<p>${description}</p>` : ''}</div>${section === 'products' ? '<button class="button" type="button" data-action="new-product">Add a product +</button>' : ''}</div>`;
  const statsCards = `<div class="admin-stat-grid"><article><span>Net revenue</span><strong>${money(stats.revenue)}</strong><small>Across paid orders</small></article><article><span>Orders received</span><strong>${stats.orders}</strong><small>All fulfillment stages</small></article><article><span>Active products</span><strong>${stats.products}</strong><small>In the collection</small></article><article><span>Customers</span><strong>${stats.customers}</strong><small>Registered accounts</small></article></div>`;
  if (section === 'overview') content = `${heading('STORE AT A GLANCE', 'Good morning, team.', 'A considered view of how Atelier is doing.')}${statsCards}<div class="analytics-grid"><article class="analytics-card revenue-analytics"><div class="analytics-card-head"><div><span class="portal-overline">PERFORMANCE</span><h2>Revenue &amp; sales</h2></div><span class="chart-period">Last 12 months</span></div><div class="chart-wrap"><canvas id="revenue-chart" aria-label="Monthly revenue and order trend chart"></canvas></div></article><article class="analytics-card category-analytics"><div class="analytics-card-head"><div><span class="portal-overline">WHAT PEOPLE LOVE</span><h2>Top categories</h2></div></div><div class="chart-wrap"><canvas id="category-chart" aria-label="Top selling categories chart"></canvas></div></article></div><div class="portal-shortcuts"><a href="#/admin/orders"><span>▤</span><div><strong>Review orders</strong><small>Keep fulfillment moving</small></div><b>↗</b></a><a href="#/admin/users"><span>◎</span><div><strong>Manage customers</strong><small>Accounts and access</small></div><b>↗</b></a></div>`;
  if (section === 'products') {
    const productForm = `<form id="admin-product-form" class="admin-product-form ${form ? 'editing' : 'collapsed'}"><h3>${form ? 'Edit this piece' : 'Add a new piece'}</h3><input type="hidden" name="id" value="${escapeHTML(form ? getProductId(form) : '')}"><div class="form-grid"><div class="form-field"><label>Product name</label><input name="name" required value="${escapeHTML(form?.name || '')}" placeholder="Forma ceramic vase"></div><div class="form-field"><label>Category</label><input name="category" required value="${escapeHTML(form?.category || '')}" placeholder="Home"></div><div class="form-field"><label>Price (USD)</label><input name="price" type="number" min="0" step="0.01" required value="${escapeHTML(form?.price ?? '')}"></div><div class="form-field"><label>Compare-at price</label><input name="compareAtPrice" type="number" min="0" step="0.01" value="${escapeHTML(form?.compareAtPrice ?? '')}"></div><div class="form-field"><label>Stock quantity</label><input name="stock" type="number" min="0" step="1" required value="${escapeHTML(form?.stock ?? '')}"></div><div class="form-field"><label>Badge</label><input name="badge" value="${escapeHTML(form?.badge || '')}" placeholder="New"></div></div><div class="form-field"><label>Image URLs (comma separated)</label><input name="images" required value="${escapeHTML((form?.images || []).join(', '))}" placeholder="https://..."></div><div class="form-field"><label>Description</label><textarea name="description" required>${escapeHTML(form?.description || '')}</textarea></div><label class="featured-toggle"><input type="checkbox" name="featured" ${form?.featured ? 'checked' : ''}> Feature on the storefront</label><div class="checkout-actions"><button class="button" type="submit">${form ? 'Save changes' : 'Add product'} <span class="arrow">↗</span></button>${form ? '<button class="button secondary" type="button" data-action="cancel-edit">Cancel</button>' : ''}</div></form>`;
    const table = `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>${state.products.map((product) => `<tr><td><img class="admin-product-image" src="${safeImage(getImage(product))}" alt="">${escapeHTML(product.name)}</td><td>${escapeHTML(product.category)}</td><td>${money(product.price)}</td><td>${product.stock}</td><td><div class="table-actions"><button class="small-button" data-action="edit-product" data-id="${escapeHTML(getProductId(product))}">Edit</button><button class="small-button danger" data-action="delete-product" data-id="${escapeHTML(getProductId(product))}">Delete</button></div></td></tr>`).join('')}</tbody></table></div>`;
    content = `${heading('THE COLLECTION', 'Products', 'Manage your pieces, pricing, and stock.')}${productForm}${table}`;
  }
  if (section === 'orders') {
    const table = `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>${orders.map((order) => `<tr><td><strong>${escapeHTML(order.orderNumber)}</strong><br><small>${order.items.reduce((sum, item) => sum + item.quantity, 0)} items</small></td><td>${escapeHTML(order.user?.name || order.shippingAddress.name)}<br><span style="color:#969a92">${escapeHTML(order.user?.email || order.shippingAddress.email)}</span></td><td>${new Date(order.createdAt).toLocaleDateString()}</td><td>${money(order.total)}</td><td><select class="select-input" data-action="update-status" data-id="${escapeHTML(order._id)}">${['pending','processing','shipped','delivered','cancelled'].map((status) => `<option value="${status}" ${order.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select>${order.trackingNumber ? `<small class="tracking-code">${escapeHTML(order.trackingNumber)}</small>` : ''}</td></tr>`).join('') || '<tr><td colspan="5">No orders to display.</td></tr>'}</tbody></table></div>`;
    content = `${heading('FULFILLMENT', 'Orders', 'Track each purchase from checkout to delivery.')}${statsCards}${table}`;
  }
  if (section === 'users') {
    const table = `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Customer</th><th>Joined</th><th>Orders</th><th>Lifetime spend</th><th>Role</th><th>Access</th></tr></thead><tbody>${users.map((user) => `<tr><td><div class="user-table-identity">${user.avatar ? `<img src="${safeImage(user.avatar)}" alt="">` : `<span>${escapeHTML(user.name.slice(0,1).toUpperCase())}</span>`}<div><strong>${escapeHTML(user.name)}</strong><small>${escapeHTML(user.email)}</small></div></div></td><td>${new Date(user.createdAt).toLocaleDateString()}</td><td>${user.orderCount}</td><td>${money(user.spend)}</td><td><select class="select-input" data-action="update-user" data-field="role" data-id="${escapeHTML(user._id)}" ${String(user._id) === String(state.user.id) ? 'disabled' : ''}><option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option><option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option></select></td><td><button class="user-status-toggle ${user.status === 'active' ? 'enabled' : ''}" data-action="toggle-user" data-id="${escapeHTML(user._id)}" data-status="${user.status}" ${String(user._id) === String(state.user.id) ? 'disabled' : ''}><span></span>${user.status === 'active' ? 'Active' : 'Paused'}</button></td></tr>`).join('') || '<tr><td colspan="6">No registered users yet.</td></tr>'}</tbody></table></div>`;
    content = `${heading('PEOPLE & ACCESS', 'Customer accounts', 'Review customer activity and account access.')}${table}`;
  }
  if (section === 'profile') content = renderProfilePanel(state.user, true);
  root.innerHTML = portalFrame('admin', section, content);
  if (section === 'overview') { renderMonthlyChart(state.analytics?.monthly || []); renderCategoryChart(state.analytics?.categories || []); }
}

async function onSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (form.id === 'auth-form') {
    event.preventDefault();
    const mode = form.dataset.mode;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const errorBox = document.querySelector('#auth-error');
    errorBox.textContent = '';
    try {
      const data = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(payload) });
      state.user = data.user;
      showToast(mode === 'register' ? 'Welcome to Atelier.' : 'You are signed in.');
      location.hash = state.returnTo || '#/account';
      state.returnTo = null;
    } catch (error) { errorBox.textContent = error.message; showToast(error.message, 'error'); }
  }
  if (form.id === 'profile-form') {
    event.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      const response = await api('/auth/me', { method: 'PATCH', body: JSON.stringify(data) });
      state.user = response.user;
      showToast('Your profile has been updated.');
      if (routePath().startsWith('/admin')) renderAdmin('profile');
      else renderAccount('profile');
    } catch (error) { showToast(error.message, 'error'); }
  }
  if (form.id === 'shipping-form') {
    event.preventDefault();
    state.checkoutAddress = Object.fromEntries(new FormData(form).entries());
    state.checkoutStep = 2;
    renderCheckout();
  }
  if (form.id === 'review-form') {
    event.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      await api(`/products/${encodeURIComponent(form.dataset.id)}/reviews`, { method: 'POST', body: JSON.stringify(data) });
      showToast('Thanks for sharing a note.');
      await loadCatalog();
      renderProduct(form.dataset.id);
    } catch (error) { showToast(error.message, 'error'); }
  }
  if (form.id === 'admin-product-form') {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const id = data.id;
    const images = data.images.split(',').map((url) => url.trim()).filter(Boolean);
    const payload = { name: data.name, category: data.category, description: data.description, price: Number(data.price), stock: Number(data.stock), images, badge: data.badge || undefined, featured: form.elements.featured.checked };
    if (data.compareAtPrice) payload.compareAtPrice = Number(data.compareAtPrice);
    try {
      await api(id ? `/admin/products/${encodeURIComponent(id)}` : '/admin/products', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      state.editingProduct = null;
      await loadCatalog();
      showToast(id ? 'Product updated.' : 'Product added to the collection.');
      renderAdmin('products');
    } catch (error) { showToast(error.message, 'error'); }
  }
}

async function onClick(event) {
  const scrollLink = event.target.closest('[data-scroll]');
  if (scrollLink && !scrollLink.dataset.action) {
    event.preventDefault();
    const targetId = scrollLink.dataset.scroll;
    if (routePath() !== '/') location.hash = '#/';
    window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' }), 60);
    return;
  }
  const actionElement = event.target.closest('[data-action]');
  if (!actionElement) {
    if (event.target.classList.contains('drawer-backdrop')) closeCart();
    return;
  }
  const { action, id, delta, category, tab, index } = actionElement.dataset;
  if (action === 'cart') openCart();
  if (action === 'close-cart' || action === 'backdrop') closeCart();
  if (action === 'account') location.hash = state.user ? '#/account' : '#/login';
  if (action === 'toggle-password') {
    const input = document.querySelector('#auth-password');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
      actionElement.setAttribute('aria-pressed', String(input.type === 'text'));
      actionElement.setAttribute('aria-label', input.type === 'text' ? 'Hide password' : 'Show password');
      actionElement.classList.toggle('revealed', input.type === 'text');
    }
  }
  if (action === 'focus-search') { location.hash = '#/'; window.setTimeout(() => { document.querySelector('#product-search')?.focus(); document.querySelector('#featured')?.scrollIntoView({ behavior: 'smooth' }); }, 80); }
  if (action === 'add') { event.preventDefault(); addToCart(id, actionElement.hasAttribute('data-detail-add') ? Number(document.querySelector('#detail-qty')?.textContent || 1) : 1); }
  if (action === 'category') { state.selectedCategory = category; renderHome(); document.querySelector('#featured')?.scrollIntoView({ behavior: 'smooth' }); }
  if (action === 'cart-qty') adjustCart(id, Number(delta));
  if (action === 'cart-link') closeCart();
  if (action === 'remove-cart') { state.cart = state.cart.filter((item) => item.id !== id); saveCart(); renderCart(); }
  if (action === 'checkout') { closeCart(); state.checkoutStep = 1; state.order = null; location.hash = '#/checkout'; }
  if (action === 'logout') {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* Expired cookies can still be cleared client side by signing in again. */ }
    state.user = null; showToast('You are signed out.'); location.hash = '#/';
  }
  if (action === 'gallery') { state.detailImage = Number(index); renderProduct(routePath().slice('/product/'.length)); }
  if (action === 'detail-qty') {
    const node = document.querySelector('#detail-qty');
    const productId = routePath().slice('/product/'.length);
    const product = state.products.find((item) => String(getProductId(item)) === productId);
    node.textContent = Math.max(1, Math.min(Number(product?.stock) || 1, Number(node.textContent) + Number(delta)));
  }
  if (action === 'checkout-back') { state.checkoutStep = 1; renderCheckout(); }
  if (action === 'place-order') await placeOrder();
  if (action === 'new-product') { state.editingProduct = null; renderAdmin('products').then(() => { const form = document.querySelector('#admin-product-form'); form?.classList.remove('collapsed'); form?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }); }
  if (action === 'edit-product') { state.editingProduct = state.products.find((product) => String(getProductId(product)) === id); renderAdmin('products').then(() => document.querySelector('#admin-product-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })); }
  if (action === 'cancel-edit') { state.editingProduct = null; renderAdmin('products'); }
  if (action === 'delete-product') {
    const product = state.products.find((item) => String(getProductId(item)) === id);
    if (product && window.confirm(`Remove “${product.name}” from the store?`)) {
      try { await api(`/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' }); await loadCatalog(); showToast('Product removed.'); renderAdmin('products'); }
      catch (error) { showToast(error.message, 'error'); }
    }
  }
  if (action === 'scroll') document.querySelector(`#${CSS.escape(actionElement.dataset.scroll)}`)?.scrollIntoView({ behavior: 'smooth' });
  if (action === 'toggle-user') {
    const status = actionElement.dataset.status === 'active' ? 'inactive' : 'active';
    try { await api(`/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) }); showToast(`Account ${status === 'active' ? 'activated' : 'paused'}.`); renderAdmin('users'); }
    catch (error) { showToast(error.message, 'error'); }
  }
}

function onInput(event) {
  if (event.target.id === 'auth-password') updatePasswordChecklist(event.target.value);
  if (event.target.id === 'product-search') { state.search = event.target.value; renderGrid(); }
  if (event.target.id === 'price-range') { state.maxPrice = Number(event.target.value); const text = event.target.closest('label'); text.childNodes[0].textContent = `Up to ${money(state.maxPrice)}`; renderGrid(); }
}

function onProductTilt(event) {
  const card = event.target.closest('.product-card');
  if (!card || event.pointerType === 'touch') return;
  const bounds = card.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;
  card.style.setProperty('--tilt-y', `${((x - .5) * 3.2).toFixed(2)}deg`);
  card.style.setProperty('--tilt-x', `${((.5 - y) * 2.5).toFixed(2)}deg`);
}

function resetProductTilt(event) {
  const card = event.target.closest('.product-card');
  if (card && (!event.relatedTarget || !card.contains(event.relatedTarget))) {
    card.style.setProperty('--tilt-y', '0deg');
    card.style.setProperty('--tilt-x', '0deg');
  }
}

async function onChange(event) {
  if (event.target.id === 'product-sort') { state.sort = event.target.value; renderGrid(); }
  if (event.target.dataset.action === 'update-status') {
    try { await api(`/admin/orders/${encodeURIComponent(event.target.dataset.id)}/status`, { method: 'PATCH', body: JSON.stringify({ status: event.target.value }) }); showToast('Order status updated.'); }
    catch (error) { showToast(error.message, 'error'); renderAdmin('orders'); }
    return;
  }
  if (event.target.dataset.action === 'update-user') {
    try { await api(`/admin/users/${encodeURIComponent(event.target.dataset.id)}`, { method: 'PATCH', body: JSON.stringify({ [event.target.dataset.field]: event.target.value }) }); showToast('Account role updated.'); renderAdmin('users'); }
    catch (error) { showToast(error.message, 'error'); renderAdmin('users'); }
    return;
  }
  if (event.target.id === 'avatar-file') {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      showToast('Choose a JPEG, PNG, or WebP image smaller than 2 MB.', 'error'); event.target.value = ''; return;
    }
    const image = document.createElement('img');
    image.className = 'profile-photo avatar-image'; image.alt = 'New profile photo preview'; image.src = URL.createObjectURL(file);
    const block = document.querySelector('.profile-photo-block');
    block?.querySelector('.profile-photo, .avatar-image')?.replaceWith(image);
    const body = document.querySelector('#app'); body?.classList.add('is-uploading');
    try {
      const data = new FormData(); data.append('avatar', file);
      const result = await api('/auth/me/avatar', { method: 'POST', body: data });
      URL.revokeObjectURL(image.src);
      state.user = result.user;
      showToast('Your profile picture has been updated.');
      if (routePath().startsWith('/admin')) renderAdmin('profile');
      else renderAccount('profile');
    } catch (error) {
      URL.revokeObjectURL(image.src); showToast(error.message, 'error');
      if (routePath().startsWith('/admin')) renderAdmin('profile');
      else renderAccount('profile');
    }
    finally { body?.classList.remove('is-uploading'); }
  }
}

async function placeOrder() {
  if (!state.apiOnline) return showToast('Checkout is unavailable in preview mode. Start the API with MongoDB connected.', 'error');
  const button = document.querySelector('[data-action="place-order"]');
  if (button) { button.disabled = true; button.textContent = 'Placing your order…'; }
  try {
    const { order } = await api('/orders', { method: 'POST', body: JSON.stringify({
      items: state.cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
      shippingAddress: state.checkoutAddress
    }) });
    state.order = order;
    state.cart = [];
    saveCart();
    renderCheckout();
  } catch (error) {
    const errorBox = document.querySelector('#checkout-error');
    if (errorBox) errorBox.textContent = error.message;
    if (button) { button.disabled = false; button.innerHTML = `Place order · ${money(cartTotal())} <span class="arrow">↗</span>`; }
  }
}

boot();
