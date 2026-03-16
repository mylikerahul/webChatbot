// =====================
//  CART STATE
//  Cart items stored in localStorage as:
//  [{ id, name, image, category, price, qty, stock }]
// =====================

const CART_KEY = 'shopai_cart';
const COUPONS = {
  'SAVE10':   { type: 'percent', value: 10,  label: '10% off' },
  'FLAT200':  { type: 'flat',    value: 200, label: '₹200 off' },
  'SHOPAI50': { type: 'percent', value: 50,  label: '50% off (max ₹500)' },
};

let cart = [];
let appliedCoupon = null;
let allProducts = [];    // For suggestions
let selectedItems = new Set(); // item IDs that are checked

// =====================
//  INIT
// =====================
document.addEventListener('DOMContentLoaded', async () => {
  loadCartFromStorage();
  renderCart();
  await loadSuggestions();
  setupEvents();
});

// =====================
//  STORAGE
// =====================
function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    cart = raw ? JSON.parse(raw) : [];
    // Default: all items selected
    selectedItems = new Set(cart.map(item => item.id));
  } catch {
    cart = [];
    selectedItems = new Set();
  }
}

function saveCartToStorage() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// =====================
//  RENDER CART
// =====================
function renderCart() {
  const listEl = document.getElementById('cartItemsList');
  const emptyEl = document.getElementById('emptyCart');
  const summaryEl = document.getElementById('cartSummary');
  const btTotal = document.getElementById('cartBottomTotal');

  listEl.innerHTML = '';

  if (cart.length === 0) {
    emptyEl.style.display = 'block';
    summaryEl.style.display = 'none';
    btTotal.style.display = 'none';
    updateHeaderCount();
    return;
  }

  emptyEl.style.display = 'none';
  summaryEl.style.display = 'block';
  btTotal.style.display = 'block';

  cart.forEach(item => {
    listEl.appendChild(createCartItemEl(item));
  });

  updateSummary();
  updateHeaderCount();
}

function createCartItemEl(item) {
  const el = document.createElement('div');
  el.className = 'cart-item';
  el.id = `cart-item-${item.id}`;

  const mrp = Math.round(item.price * 1.3);
  const saved = mrp - item.price;
  const totalPrice = item.price * item.qty;
  const isSelected = selectedItems.has(item.id);
  const isLowStock = item.stock && item.stock < 5;

  el.innerHTML = `
    <div class="cart-item-check">
      <input type="checkbox" ${isSelected ? 'checked' : ''}
             onchange="toggleItemSelection(${item.id}, this.checked)" />
    </div>
    <img src="${item.image || 'https://via.placeholder.com/120?text=No+Image'}"
         alt="${item.name}" class="cart-item-img"
         onerror="this.src='https://via.placeholder.com/120?text=No+Image'">
    <div class="cart-item-details">
      <div class="cart-item-name">${item.name}</div>
      <div class="cart-item-meta">
        <span>Category: <strong>${item.category}</strong></span>
        <span>Seller: ShopAI Direct</span>
      </div>
      <div class="cart-item-stock ${isLowStock ? 'low' : ''}">
        ${isLowStock ? `Only ${item.stock} left!` : 'In Stock'}
      </div>
      <div class="cart-item-actions">
        <div class="qty-selector">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)"
                  ${item.qty <= 1 ? 'disabled' : ''}>−</button>
          <div class="qty-display">${item.qty}</div>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)"
                  ${item.stock && item.qty >= item.stock ? 'disabled' : ''}>+</button>
        </div>
        <span class="cart-action-divider">|</span>
        <button class="cart-action-btn" onclick="removeItem(${item.id})">
          <i class="fas fa-trash-alt"></i> Delete
        </button>
        <span class="cart-action-divider">|</span>
        <button class="cart-action-btn" onclick="saveForLater(${item.id})">
          Save for later
        </button>
        <span class="cart-action-divider">|</span>
        <button class="cart-action-btn" onclick="shareItem(${item.id})">
          Share
        </button>
      </div>
    </div>
    <div class="cart-item-price-col">
      <div class="cart-item-price">₹${totalPrice.toLocaleString('en-IN')}</div>
      <div class="cart-item-mrp">M.R.P: ₹${(mrp * item.qty).toLocaleString('en-IN')}</div>
      <div class="cart-item-saved">Saved ₹${(saved * item.qty).toLocaleString('en-IN')}</div>
    </div>
  `;

  return el;
}

// =====================
//  ITEM ACTIONS
// =====================
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  const newQty = item.qty + delta;
  if (newQty < 1) return;
  if (item.stock && newQty > item.stock) {
    showToast(`⚠️ Only ${item.stock} units available!`);
    return;
  }
  item.qty = newQty;
  saveCartToStorage();
  renderCart();
}

function removeItem(id) {
  const item = cart.find(i => i.id === id);
  const el = document.getElementById(`cart-item-${id}`);
  if (el) {
    el.classList.add('removing');
    setTimeout(() => {
      cart = cart.filter(i => i.id !== id);
      selectedItems.delete(id);
      saveCartToStorage();
      renderCart();
      showToast(`🗑️ Item removed from cart`);
    }, 280);
  } else {
    cart = cart.filter(i => i.id !== id);
    selectedItems.delete(id);
    saveCartToStorage();
    renderCart();
  }
}

function saveForLater(id) {
  const item = cart.find(i => i.id === id);
  if (item) showToast(`🔖 "${item.name}" saved for later!`);
}

function shareItem(id) {
  const item = cart.find(i => i.id === id);
  if (item) {
    if (navigator.share) {
      navigator.share({ title: item.name, text: `Check this out: ${item.name} at ₹${item.price}` });
    } else {
      showToast(`🔗 Link copied for "${item.name}"!`);
    }
  }
}

function toggleItemSelection(id, checked) {
  if (checked) selectedItems.add(id);
  else selectedItems.delete(id);
  updateSummary();
}

// =====================
//  SUMMARY
// =====================
function updateSummary() {
  const selectedCart = cart.filter(i => selectedItems.has(i.id));
  const itemCount = selectedCart.reduce((s, i) => s + i.qty, 0);
  const subtotal = selectedCart.reduce((s, i) => s + i.price * i.qty, 0);

  // Coupon discount
  let discount = 0;
  if (appliedCoupon) {
    const c = COUPONS[appliedCoupon];
    if (c.type === 'percent') {
      discount = Math.round(subtotal * c.value / 100);
      if (appliedCoupon === 'SHOPAI50') discount = Math.min(discount, 500);
    } else {
      discount = Math.min(c.value, subtotal);
    }
  }

  const total = Math.max(0, subtotal - discount);
  const totalMrp = selectedCart.reduce((s, i) => s + Math.round(i.price * 1.3) * i.qty, 0);
  const totalSaved = totalMrp - subtotal + discount;

  // Update DOM
  setText('summaryItemCount', itemCount);
  setText('summarySubtotal', `₹${subtotal.toLocaleString('en-IN')}`);
  setText('summaryTotal', `₹${total.toLocaleString('en-IN')}`);
  setText('bottomItemCount', itemCount);
  setText('bottomSubtotal', `₹${subtotal.toLocaleString('en-IN')}`);
  setText('proceedCount', itemCount);
  setText('savingsAmount', `₹${totalSaved.toLocaleString('en-IN')}`);

  const discountRow = document.getElementById('discountRow');
  if (discount > 0) {
    discountRow.style.display = 'flex';
    setText('discountAmount', `-₹${discount.toLocaleString('en-IN')}`);
  } else {
    discountRow.style.display = 'none';
  }

  const proceedBtn = document.getElementById('proceedBtn');
  if (proceedBtn) proceedBtn.disabled = itemCount === 0;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function updateHeaderCount() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const el = document.getElementById('headerCartCount');
  if (el) el.textContent = count;
}

// =====================
//  COUPON
// =====================
function applyCoupon() {
  const code = document.getElementById('couponInput').value.trim().toUpperCase();
  const msgEl = document.getElementById('couponMsg');

  if (!code) {
    showCouponMsg('Please enter a coupon code.', 'error');
    return;
  }

  if (COUPONS[code]) {
    appliedCoupon = code;
    showCouponMsg(`✅ Coupon "${code}" applied — ${COUPONS[code].label}!`, 'success');
    updateSummary();
    showToast(`🎉 Coupon ${code} applied!`);
  } else {
    appliedCoupon = null;
    showCouponMsg(`❌ Invalid coupon code.`, 'error');
    updateSummary();
  }
}

function showCouponMsg(msg, type) {
  const el = document.getElementById('couponMsg');
  if (el) { el.textContent = msg; el.className = `coupon-msg ${type}`; }
}

function fillCoupon(code) {
  const input = document.getElementById('couponInput');
  if (input) { input.value = code; input.focus(); }
}

// =====================
//  DESELECT ALL
// =====================
function setupDeselectAll() {
  const btn = document.getElementById('deselectAll');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const allSelected = selectedItems.size === cart.length;
    if (allSelected) {
      selectedItems.clear();
      btn.textContent = 'Select all items';
    } else {
      cart.forEach(i => selectedItems.add(i.id));
      btn.textContent = 'Deselect all items';
    }
    // Update checkboxes
    cart.forEach(i => {
      const cb = document.querySelector(`#cart-item-${i.id} input[type="checkbox"]`);
      if (cb) cb.checked = selectedItems.has(i.id);
    });
    updateSummary();
  });
}

// =====================
//  COUPON TOGGLE
// =====================
function setupCouponToggle() {
  const toggle = document.getElementById('couponToggle');
  const body = document.getElementById('couponBody');
  const arrow = document.getElementById('couponArrow');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const open = body.style.display === 'block';
    body.style.display = open ? 'none' : 'block';
    arrow.classList.toggle('open', !open);
  });
}

// =====================
//  CHECKOUT
// =====================
function proceedToCheckout() {
  const selectedCart = cart.filter(i => selectedItems.has(i.id));
  if (selectedCart.length === 0) {
    showToast('⚠️ Please select at least one item!');
    return;
  }
  showToast('🚀 Redirecting to checkout...');
  setTimeout(() => {
    alert(`Order Summary:\n${selectedCart.map(i => `• ${i.name} x${i.qty} = ₹${(i.price * i.qty).toLocaleString('en-IN')}`).join('\n')}\n\n(Checkout page coming soon!)`);
  }, 800);
}

// =====================
//  SUGGESTIONS
// =====================
async function loadSuggestions() {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success) {
      allProducts = data.products;
      // Show 5 random products not in cart
      const cartIds = new Set(cart.map(i => i.id));
      const pool = allProducts.filter(p => !cartIds.has(p.id));
      const suggestions = pool.sort(() => Math.random() - .5).slice(0, 6);
      renderSuggestions(suggestions);
    }
  } catch { /* silent fail */ }
}

function renderSuggestions(products) {
  const grid = document.getElementById('suggestionsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'suggestion-card';
    card.innerHTML = `
      <img src="${p.image || 'https://via.placeholder.com/170x140?text=No+Image'}"
           alt="${p.name}" class="suggestion-img"
           onerror="this.src='https://via.placeholder.com/170x140?text=No+Image'">
      <div class="suggestion-body">
        <div class="suggestion-name">${p.name}</div>
        <div class="suggestion-price">₹${p.price.toLocaleString('en-IN')}</div>
        <button class="suggestion-add" onclick="addSuggestionToCart(${p.id})">
          <i class="fas fa-cart-plus"></i> Add to Cart
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function addSuggestionToCart(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      image: product.image,
      category: product.category,
      price: product.price,
      stock: product.stock || 10,
      qty: 1
    });
    selectedItems.add(product.id);
  }
  saveCartToStorage();
  renderCart();
  showToast(`🛒 "${product.name}" added!`);
  loadSuggestions();
}

// =====================
//  TOAST
// =====================
function showToast(message) {
  const existing = document.querySelector('.amz-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'amz-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// =====================
//  SETUP ALL EVENTS
// =====================
function setupEvents() {
  setupDeselectAll();
  setupCouponToggle();
}

// =====================
//  PUBLIC: addToCart (called from main page via localStorage)
//  chat.js calls this on the main page
// =====================
window.addToCartGlobal = function(product) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
    selectedItems.add(product.id);
  }
  saveCartToStorage();
};