/* =====================
   ShopAI — chat.js
   Apple macOS Style
   ===================== */

let allProducts = [];
let filteredProducts = [];
let currentCategory = 'all';
let currentPriceRange = 'all';
let currentSort = 'default';
let searchQuery = '';
let cartCount = 0;

const BOT_IMG = '/public/image/Chatbot.jpg';

/* ---- DOM refs ---- */
const productsGrid      = document.getElementById('productsGrid');
const loadingSpinner    = document.getElementById('loadingSpinner');
const noProductsDiv     = document.getElementById('noProducts');
const totalProductsSpan = document.getElementById('totalProducts');
const searchInput       = document.getElementById('searchInput');
const searchBtn         = document.getElementById('searchBtn');
const priceFilter       = document.getElementById('priceFilter');
const sortFilter        = document.getElementById('sortFilter');
const clearFiltersBtn   = document.getElementById('clearFilters');
const cartCountEl       = document.querySelector('.cart-count');

const chatWidget    = document.getElementById('chatWidget');
const chatToggleBtn = document.getElementById('chatToggleBtn');
const chatHeader    = document.getElementById('chatHeader');
const minimizeBtn   = document.getElementById('minimizeBtn');
const chatMessages  = document.getElementById('chatMessages');
const chatInput     = document.getElementById('chatInput');
const sendBtn       = document.getElementById('sendBtn');

/* =====================
   INIT
   ===================== */
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  setupEventListeners();
  createProductDetailModal();
  setupNavLinks();
  setupSidebarLinks();
});

/* =====================
   PRODUCTS
   ===================== */
async function loadProducts() {
  try {
    showLoading(true);
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const data = await response.json();
    if (data.success) {
      allProducts = data.products || [];
      filteredProducts = [...allProducts];
      renderProducts(filteredProducts);
      updateProductCount(filteredProducts.length);
    } else {
      showError(data.message || 'Failed to load products');
    }
  } catch (error) {
    showError('Error loading products. Please refresh the page.');
  } finally {
    showLoading(false);
  }
}

function renderProducts(products) {
  productsGrid.innerHTML = '';
  if (products.length === 0) {
    noProductsDiv.style.display = 'flex';
    return;
  }
  noProductsDiv.style.display = 'none';
  const fragment = document.createDocumentFragment();
  products.forEach((product, i) => {
    const card = createProductCard(product);
    card.style.animationDelay = `${i * 30}ms`;
    card.classList.add('card-enter');
    fragment.appendChild(card);
  });
  productsGrid.appendChild(fragment);
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'amz-card';

  const stars  = generateStars(product.rating);
  const imgSrc = product.image || 'https://placehold.co/300x250?text=No+Image';

  const discountPct = product.mrp && product.mrp > product.price
    ? Math.round((1 - product.price / product.mrp) * 100) : 0;

  const badgeHTML = discountPct > 0
    ? `<span class="amz-card-badge">-${discountPct}%</span>` : '';

  const mrpHTML = discountPct > 0
    ? `<span class="amz-price-mrp">${formatINR(product.mrp)}</span>
       <span class="amz-price-off">${discountPct}% off</span>` : '';

  let stockHTML = '';
  if (product.stock === 0) stockHTML = `<p class="amz-stock" style="color:var(--red)">Out of Stock</p>`;
  else if (product.stock <= 5) stockHTML = `<p class="amz-stock">Only ${product.stock} left!</p>`;

  card.innerHTML = `
    ${badgeHTML}
    <div class="amz-card-img-wrap">
      <img src="${escapeAttr(imgSrc)}" alt="${escapeAttr(product.name)}" class="amz-card-img" loading="lazy"
        onerror="this.src='https://placehold.co/300x250?text=No+Image'">
    </div>
    <div class="amz-card-body">
      <span class="amz-card-category">${escapeHTML(product.category || '')}</span>
      <p class="amz-card-name">${escapeHTML(product.name || 'Unnamed Product')}</p>
      <div class="amz-card-rating">
        <span class="amz-stars">${stars}</span>
        <span class="amz-rating-count">(${product.reviewCount || product.rating || 'N/A'})</span>
      </div>
      <div class="amz-card-price-row">
        <p class="amz-price-small">M.R.P.</p>
        <span class="amz-price"><sup>₹</sup>${formatINRRaw(product.price)}</span>
        ${mrpHTML}
        <p class="amz-delivery">Free delivery available</p>
        ${stockHTML}
      </div>
    </div>
    <div class="amz-card-actions">
      <button class="amz-btn-cart" onclick="addToCart(${product.id})"
        ${product.stock === 0 ? 'disabled' : ''}>
        <i class="fas fa-plus"></i> Add to Cart
      </button>
      <button class="amz-btn-buy" onclick="viewDetails(${product.id})">View Details</button>
    </div>`;

  card.addEventListener('click', (e) => {
    if (!e.target.closest('button')) viewDetails(product.id);
  });
  return card;
}

/* =====================
   FILTERS & SORT
   ===================== */
function filterProducts() {
  filteredProducts = allProducts.filter(product => {
    const catMatch = currentCategory === 'all' || product.category === currentCategory;

    let priceMatch = true;
    if (currentPriceRange !== 'all') {
      const [min, max] = currentPriceRange.split('-').map(Number);
      priceMatch = product.price >= min && product.price <= max;
    }

    const q = searchQuery.toLowerCase();
    const searchMatch = !q ||
      (product.name     && product.name.toLowerCase().includes(q)) ||
      (product.category && product.category.toLowerCase().includes(q));

    const inStock = document.getElementById('inStockOnly');
    const stockMatch = !inStock?.checked || product.stock > 0;

    return catMatch && priceMatch && searchMatch && stockMatch;
  });

  sortProducts();
  renderProducts(filteredProducts);
  updateProductCount(filteredProducts.length);
}

function sortProducts() {
  switch (currentSort) {
    case 'price-low':  filteredProducts.sort((a, b) => a.price - b.price); break;
    case 'price-high': filteredProducts.sort((a, b) => b.price - a.price); break;
    case 'rating':     filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    case 'name':       filteredProducts.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
  }
}

/* =====================
   EVENT LISTENERS
   ===================== */
function setupEventListeners() {
  searchBtn?.addEventListener('click', handleSearch);
  searchInput?.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });

  priceFilter?.addEventListener('change', e => { currentPriceRange = e.target.value; filterProducts(); });
  sortFilter?.addEventListener('change',  e => { currentSort = e.target.value; filterProducts(); });
  clearFiltersBtn?.addEventListener('click', clearAllFilters);

  document.querySelector('#noProducts .amz-clear-btn')
    ?.addEventListener('click', clearAllFilters);

  document.getElementById('inStockOnly')
    ?.addEventListener('change', filterProducts);

  /* Chat */
  chatToggleBtn?.addEventListener('click', toggleChat);
  minimizeBtn?.addEventListener('click', e => {
    e.stopPropagation();
    chatWidget.classList.toggle('minimized');
  });
  chatHeader?.addEventListener('click', () => {
    if (chatWidget.classList.contains('minimized'))
      chatWidget.classList.remove('minimized');
  });
  sendBtn?.addEventListener('click', sendMessage);
  chatInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) sendMessage();
  });

  /* Back to top */
  document.querySelector('.back-to-top')
    ?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function setupNavLinks() {
  document.querySelectorAll('.nav-link[data-category]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      currentCategory = link.dataset.category || 'all';
      filterProducts();
      syncSidebarActive(currentCategory);
    });
  });
}

function setupSidebarLinks() {
  document.querySelectorAll('.sidebar-link[data-category]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      currentCategory = link.dataset.category || 'all';
      filterProducts();
      syncNavActive(currentCategory);
    });
  });
}

function syncSidebarActive(cat) {
  document.querySelectorAll('.sidebar-link').forEach(l => {
    l.classList.toggle('active', l.dataset.category === cat);
  });
}

function syncNavActive(cat) {
  document.querySelectorAll('.nav-link[data-category]').forEach(l => {
    l.classList.toggle('active', l.dataset.category === cat);
  });
}

function clearAllFilters() {
  if (searchInput) searchInput.value = '';
  searchQuery = ''; currentCategory = 'all'; currentPriceRange = 'all'; currentSort = 'default';
  if (priceFilter) priceFilter.value = 'all';
  if (sortFilter)  sortFilter.value  = 'default';
  const inStock = document.getElementById('inStockOnly');
  if (inStock) inStock.checked = false;
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector('.nav-link[data-category="all"]')?.classList.add('active');
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.querySelector('.sidebar-link[data-category="all"]')?.classList.add('active');
  filterProducts();
}

function handleSearch() {
  searchQuery = searchInput?.value.trim() || '';
  filterProducts();
}

function updateProductCount(count) {
  if (totalProductsSpan) totalProductsSpan.textContent = count;
}

function showLoading(show) {
  if (!loadingSpinner) return;
  if (show) {
    loadingSpinner.classList.remove('hidden');
    if (productsGrid) productsGrid.style.display = 'none';
  } else {
    loadingSpinner.classList.add('hidden');
    if (productsGrid) productsGrid.style.display = 'grid';
  }
}

function showError(message) {
  if (!productsGrid) return;
  productsGrid.style.display = 'block';
  productsGrid.innerHTML = `
    <div class="amz-no-products" style="grid-column:1/-1">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>${escapeHTML(message)}</h3>
      <button class="amz-clear-btn" onclick="loadProducts()">Try Again</button>
    </div>`;
}

/* =====================
   CART
   ===================== */
function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  if (product.stock === 0) { showToast(`"${product.name}" is out of stock.`, 'error'); return; }

  cartCount++;
  if (cartCountEl) {
    cartCountEl.textContent = cartCount;
    cartCountEl.classList.add('cart-bump');
    setTimeout(() => cartCountEl.classList.remove('cart-bump'), 300);
  }
  showToast(`Added to Cart — ${product.name}`, 'success');
}

/* =====================
   PRODUCT DETAIL MODAL
   ===================== */
function createProductDetailModal() {
  const modal = document.createElement('div');
  modal.id = 'productDetailModal';
  modal.className = 'product-modal';
  modal.innerHTML = `
    <div class="product-modal-overlay"></div>
    <div class="product-modal-content">
      <button class="product-modal-close" onclick="closeProductModal()">
        <i class="fas fa-times"></i>
      </button>
      <div class="product-modal-body">
        <div class="product-modal-image">
          <img id="modalProductImage" src="" alt="Product">
        </div>
        <div class="product-modal-info">
          <span class="product-modal-category" id="modalProductCategory"></span>
          <h2 class="product-modal-title" id="modalProductTitle"></h2>
          <div class="product-modal-rating" id="modalProductRating"></div>
          <div class="product-modal-price">
            <span class="product-modal-current-price" id="modalProductPrice"></span>
            <span class="product-modal-mrp" id="modalProductMrp"></span>
            <span class="product-modal-discount" id="modalProductDiscount"></span>
          </div>
          <p class="product-modal-description" id="modalProductDescription"></p>
          <div class="product-modal-stock" id="modalProductStock"></div>
          <div class="product-modal-actions">
            <button class="product-modal-cart-btn" id="modalAddToCart">
              <i class="fas fa-plus"></i> Add to Cart
            </button>
            <button class="product-modal-buy-btn" id="modalBuyNow">Buy Now</button>
          </div>
        </div>
      </div>
      <div class="product-modal-similar">
        <h3>You May Also Like</h3>
        <div class="similar-products-grid" id="similarProductsGrid"></div>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.querySelector('.product-modal-overlay').addEventListener('click', closeProductModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProductModal(); });
}

async function viewDetails(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const modal  = document.getElementById('productDetailModal');
  const imgSrc = product.image || 'https://placehold.co/400x400?text=No+Image';

  document.getElementById('modalProductImage').src = imgSrc;
  document.getElementById('modalProductImage').alt = product.name;
  document.getElementById('modalProductCategory').textContent = product.category || '';
  document.getElementById('modalProductTitle').textContent = product.name || 'Product';
  document.getElementById('modalProductRating').innerHTML = `
    <span class="amz-stars">${generateStars(product.rating)}</span>
    <span>(${product.reviewCount || product.rating || 'N/A'} reviews)</span>`;
  document.getElementById('modalProductPrice').textContent = formatINR(product.price);

  const mrpEl  = document.getElementById('modalProductMrp');
  const discEl = document.getElementById('modalProductDiscount');
  if (product.mrp && product.mrp > product.price) {
    mrpEl.textContent  = formatINR(product.mrp);
    mrpEl.style.display = 'inline';
    const d = Math.round((1 - product.price / product.mrp) * 100);
    discEl.textContent  = `${d}% off`;
    discEl.style.display = 'inline';
  } else {
    mrpEl.style.display  = 'none';
    discEl.style.display = 'none';
  }

  document.getElementById('modalProductDescription').textContent =
    product.description || 'No description available.';

  const stockEl = document.getElementById('modalProductStock');
  if (product.stock === 0) {
    stockEl.textContent = 'Out of Stock';
    stockEl.className   = 'product-modal-stock out-of-stock';
  } else if (product.stock <= 5) {
    stockEl.textContent = `Only ${product.stock} left in stock!`;
    stockEl.className   = 'product-modal-stock low-stock';
  } else {
    stockEl.textContent = 'In Stock';
    stockEl.className   = 'product-modal-stock in-stock';
  }

  const cartBtn = document.getElementById('modalAddToCart');
  cartBtn.disabled = product.stock === 0;
  cartBtn.onclick  = () => { addToCart(productId); closeProductModal(); };

  document.getElementById('modalBuyNow').onclick = () => {
    addToCart(productId);
    closeProductModal();
    showToast('Redirecting to checkout…', 'info');
  };

  await loadSimilarProducts(product);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

async function loadSimilarProducts(product) {
  const grid = document.getElementById('similarProductsGrid');
  grid.innerHTML = '<div style="color:var(--text-tertiary);font-size:13px;padding:8px">Loading…</div>';

  try {
    const res = await fetch(
      `/api/products/similar?id=${product.id}&category=${encodeURIComponent(product.category)}&limit=4`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.products?.length) { renderSimilarProducts(data.products); return; }
    }
  } catch (_) {}

  const fallback = allProducts
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  renderSimilarProducts(
    fallback.length
      ? fallback
      : allProducts.filter(p => p.id !== product.id).sort(() => Math.random() - .5).slice(0, 4)
  );
}

function renderSimilarProducts(products) {
  const grid = document.getElementById('similarProductsGrid');
  if (!products.length) { grid.innerHTML = '<p>No similar products found.</p>'; return; }

  grid.innerHTML = products.map(p => `
    <div class="similar-product-card" onclick="viewDetails(${p.id})">
      <img src="${escapeAttr(p.image || 'https://placehold.co/150x150?text=No+Image')}"
        alt="${escapeAttr(p.name)}"
        onerror="this.src='https://placehold.co/150x150?text=No+Image'">
      <div class="similar-product-info">
        <p class="similar-product-name">${escapeHTML(p.name)}</p>
        <span class="similar-product-price">${formatINR(p.price)}</span>
        <span class="similar-product-rating">${generateStars(p.rating)}</span>
      </div>
    </div>`).join('');
}

function closeProductModal() {
  const modal = document.getElementById('productDetailModal');
  if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

/* =====================
   TOAST NOTIFICATION
   ===================== */
function showToast(message, type = 'success') {
  const existing = document.getElementById('amz-toast');
  if (existing) {
    existing.style.animation = 'none';
    existing.remove();
  }

  const colors = {
    success: { bg: '#1d1d1f', accent: '#28c840', icon: 'fa-check-circle' },
    error:   { bg: '#1d1d1f', accent: '#ff3b30', icon: 'fa-exclamation-circle' },
    info:    { bg: '#1d1d1f', accent: '#0071e3', icon: 'fa-info-circle'  },
  };
  const c = colors[type] || colors.success;

  const toast = document.createElement('div');
  toast.id = 'amz-toast';
  toast.innerHTML = `<i class="fas ${c.icon}" style="color:${c.accent};font-size:15px;flex-shrink:0"></i>
    <span style="flex:1">${escapeHTML(message)}</span>`;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '96px',
    left: '50%',
    transform: 'translateX(-50%) translateY(0)',
    background: c.bg,
    color: '#f5f5f7',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '13px',
    fontFamily: 'var(--font)',
    fontWeight: '500',
    zIndex: '9999',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.12)',
    maxWidth: '88vw',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderLeft: `3px solid ${c.accent}`,
    animation: 'toastIn .3s cubic-bezier(0.16,1,0.3,1) both',
    backdropFilter: 'blur(20px)',
  });

  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes toastIn  { from { opacity:0; transform:translateX(-50%) translateY(12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
      @keyframes toastOut { from { opacity:1; transform:translateX(-50%) translateY(0); }  to { opacity:0; transform:translateX(-50%) translateY(8px); } }
      @keyframes cart-bump { 0%,100% { transform:scale(1); } 50% { transform:scale(1.4); } }
      .cart-bump { animation: cart-bump .3s ease; }
      @keyframes card-enter { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      .card-enter { animation: card-enter .35s cubic-bezier(0.16,1,0.3,1) both; }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut .25s ease forwards';
    setTimeout(() => toast.remove(), 280);
  }, 2600);
}

/* =====================
   CHAT
   ===================== */
function toggleChat() {
  chatWidget.classList.toggle('active');
  if (chatWidget.classList.contains('active')) {
    chatWidget.classList.remove('minimized');
    setTimeout(() => chatInput?.focus(), 120);
  }
}

async function sendMessage() {
  if (!chatInput) return;
  const message = chatInput.value.trim();
  if (!message) return;

  addMessage(message, 'user');
  chatInput.value   = '';
  chatInput.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot-message typing-indicator';
  typingDiv.innerHTML = `
    <div class="message-avatar"><img src="${BOT_IMG}" alt="Bot"></div>
    <div class="message-content">
      <div class="typing-dots"><span></span><span></span><span></span></div>
    </div>`;
  chatMessages.appendChild(typingDiv);
  scrollChatToBottom();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error(`${response.status}`);
    const data = await response.json();
    typingDiv.remove();
    addMessage(
      data.response || 'Sorry, I could not process your request.',
      'bot',
      Array.isArray(data.products) ? data.products : []
    );
  } catch {
    typingDiv.remove();
    addMessage('Sorry, something went wrong. Please try again.', 'bot');
  } finally {
    chatInput.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    chatInput.focus();
    scrollChatToBottom();
  }
}

function addMessage(text, type, products = []) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}-message`;

  const avatarHTML = type === 'bot'
    ? `<div class="message-avatar"><img src="${BOT_IMG}" alt="Bot"></div>`
    : `<div class="message-avatar"></div>`;

  const formattedText = parseMessageFormatting(text);

  let productsHTML = '';
  if (products.length > 0) {
    productsHTML = '<div class="chat-products">';
    products.forEach(product => {
      const imgSrc = product.image || 'https://placehold.co/70x70?text=N/A';
      productsHTML += `
        <div class="chat-product-card" onclick="chatProductClick(${product.id})">
          <img src="${escapeAttr(imgSrc)}" alt="${escapeAttr(product.name)}" loading="lazy"
            onerror="this.src='https://placehold.co/70x70?text=N/A'">
          <div class="chat-product-info">
            <strong>${escapeHTML(product.name || 'Product')}</strong>
            <div class="chat-product-meta">
              <span class="chat-product-price">${formatINR(product.price)}</span>
              <span class="chat-product-rating">${generateStars(product.rating)}</span>
            </div>
            <span class="chat-product-category">${escapeHTML(product.category || '')}</span>
          </div>
        </div>`;
    });
    productsHTML += '</div>';
  }

  messageDiv.innerHTML = `${avatarHTML}<div class="message-content">${formattedText}${productsHTML}</div>`;
  chatMessages.appendChild(messageDiv);
  scrollChatToBottom();
}

function parseMessageFormatting(text) {
  if (!text) return '';
  let safe = escapeHTML(text);
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/_(.*?)_/g,       '<em>$1</em>');
  safe = safe.replace(/^(\d+)\.\s+(.+)$/gm,
    '<div class="list-item"><span class="list-number">$1.</span><span>$2</span></div>');
  safe = safe.replace(/^[•\-]\s+(.+)$/gm,
    '<div class="list-item"><span class="bullet">•</span><span>$1</span></div>');
  safe = safe.replace(/\n/g, '<br>');
  return safe;
}

function chatProductClick(productId) { viewDetails(productId); }
function viewProductDetail(productId) { viewDetails(productId); }

function scrollChatToBottom() {
  if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* =====================
   HELPERS
   ===================== */
function generateStars(rating) {
  if (!rating || isNaN(rating)) return '☆☆☆☆☆';
  const clamped = Math.min(5, Math.max(0, Number(rating)));
  const full    = Math.floor(clamped);
  const hasHalf = (clamped % 1) >= 0.5;
  const empty   = 5 - full - (hasHalf ? 1 : 0);
  return '★'.repeat(full) + (hasHalf ? '⯨' : '') + '☆'.repeat(empty);
}

function formatINR(amount) {
  if (amount == null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
}

function formatINRRaw(amount) {
  if (amount == null || isNaN(amount)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
}

function escapeHTML(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}