/**
 * Vyrox Shoes - Frontend API Integration & UI Manager
 */

const API_BASE_URL = 'https://vyrox-backend.onrender.com/api';

// State Management
let allProducts = [];
let activeCategory = 'all';
let searchQuery = '';
let currentProduct = null;
let currentCart = { items: [], total_items: 0, subtotal: 0 };

// ----------------------------------------------------
// 1. AUTHENTICATION & USER HELPERS
// ----------------------------------------------------

function getToken() {
  return localStorage.getItem('token');
}

function getStoredUser() {
  const token = getToken();
  const userStr = localStorage.getItem('user');
  if (token && userStr) {
    try { return JSON.parse(userStr); } catch (e) { return null; }
  }
  return null;
}

function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

function updateNavbarSession() {
  const user = getStoredUser();
  const authItem = document.getElementById('nav-auth-item');
  if (!authItem) return;

  if (user) {
    const firstName = user.name ? user.name.split(' ')[0] : 'USER';
    authItem.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-light btn-sm fw-bold border-0" onclick="openOrdersModal()">
          <i class="fa-solid fa-box me-1"></i> ORDERS
        </button>
        <span class="nav-link text-white fw-bold px-2" style="cursor: default;">
          <i class="fa-solid fa-circle-user me-1 text-warning"></i> ${firstName.toUpperCase()}
        </span>
        <a class="nav-link text-danger fw-bold ms-1" href="#" onclick="handleLogout(event)" title="Logout">LOGOUT</a>
      </div>
    `;
  } else {
    authItem.innerHTML = `<a class="nav-link fw-bold btn btn-outline-light px-3 py-1 text-white" href="login.html">LOGIN</a>`;
  }
}

function handleLogout(e) {
  if (e) e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentCart = { items: [], total_items: 0, subtotal: 0 };
  updateCartBadge();
  updateNavbarSession();
  showToast('You have logged out successfully.');
}

// Toast notification helper
function showToast(message, isError = false) {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = 'position: fixed; bottom: 25px; right: 25px; z-index: 9999;';
    document.body.appendChild(toastContainer);
  }

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center text-white ${isError ? 'bg-danger' : 'bg-dark'} border-0 show shadow-lg mb-2`;
  toastEl.role = 'alert';
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body fs-6 fw-bold">
        <i class="${isError ? 'fa-solid fa-triangle-exclamation text-warning' : 'fa-solid fa-circle-check text-success'} me-2"></i>
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
  `;

  toastContainer.appendChild(toastEl);
  setTimeout(() => {
    if (toastEl && toastEl.parentElement) toastEl.remove();
  }, 3500);
}

// ----------------------------------------------------
// 2. PRODUCTS & CATEGORY FILTERING & SEARCH
// ----------------------------------------------------

async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/products`);
    const result = await res.json();
    if (result.success || Array.isArray(result.data)) {
      allProducts = result.data || [];
      renderProductsGrid();
    } else {
      console.error('Failed to load products:', result);
    }
  } catch (err) {
    console.error('Error fetching products:', err);
  }
}

function renderProductsGrid() {
  const container = document.getElementById('shop-products-grid');
  if (!container) return;

  let filtered = [...allProducts];

  // Category filter
  if (activeCategory !== 'all') {
    filtered = filtered.filter(p => {
      const catName = p.category_name ? p.category_name.toLowerCase() : '';
      const catSlug = p.category_slug ? p.category_slug.toLowerCase() : '';
      return catSlug === activeCategory.toLowerCase() || catName === activeCategory.toLowerCase();
    });
  }

  // Search query filter
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.brand && p.brand.toLowerCase().includes(query)) ||
      (p.category_name && p.category_name.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="fa-solid fa-shoe-prints fa-3x text-muted mb-3"></i>
        <h4 class="fw-bold text-dark">No shoes found</h4>
        <p class="text-muted">Try clearing filters or searching for something else.</p>
        <button class="btn btn-dark btn-sm rounded-pill px-4" onclick="resetFilters()">Show All Shoes</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(product => {
    const isDiscounted = product.discount_price && Number(product.discount_price) < Number(product.price);
    const displayPrice = isDiscounted ? `₹${product.discount_price}` : `₹${product.price}`;
    const oldPrice = isDiscounted ? `<span class="text-decoration-line-through text-muted small ms-2">₹${product.price}</span>` : '';

    return `
      <div class="col-md-4 col-lg-3 mb-4">
        <div class="card h-100 product-card border-0 shadow-sm rounded-4 overflow-hidden position-relative" style="background: #ffffff;">
          ${product.is_featured ? '<span class="badge bg-danger position-absolute top-0 start-0 m-3 px-3 py-2 rounded-pill fw-bold" style="z-index:2;">FEATURED</span>' : ''}
          <div class="product-img-wrapper text-center p-3" style="background: #f8fafc; cursor: pointer;" onclick="openProductDetailsModal(${product.id})">
            <img src="${product.image_url}" class="img-fluid product-thumb" alt="${product.name}" style="height: 220px; object-fit: contain; transition: transform 0.3s ease;" />
          </div>
          <div class="card-body d-flex flex-column justify-content-between p-3">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="text-uppercase text-secondary fw-bold small" style="letter-spacing:0.05em;">${product.brand || 'Vyrox'}</span>
                <span class="badge bg-light text-dark border rounded-pill px-2 py-1 small">${product.category_name || 'Sneakers'}</span>
              </div>
              <h5 class="card-title fw-bold mb-2 text-dark" style="font-size: 1.05rem; cursor: pointer;" onclick="openProductDetailsModal(${product.id})">${product.name}</h5>
            </div>
            <div>
              <div class="price-row mb-3 d-flex align-items-center">
                <span class="fs-5 fw-bold text-dark mb-0">${displayPrice}</span>
                ${oldPrice}
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-dark btn-sm flex-grow-1 rounded-pill fw-bold" onclick="openProductDetailsModal(${product.id})">
                  <i class="fa-solid fa-eye me-1"></i> View
                </button>
                <button class="btn btn-dark btn-sm flex-grow-1 rounded-pill fw-bold" onclick="quickAddToCart(${product.id})">
                  <i class="fa-solid fa-cart-plus me-1"></i> Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterCategory(catSlug, btnElement) {
  activeCategory = catSlug;
  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    btn.classList.remove('btn-dark', 'active');
    btn.classList.add('btn-outline-dark');
  });
  if (btnElement) {
    btnElement.classList.remove('btn-outline-dark');
    btnElement.classList.add('btn-dark', 'active');
  }
  renderProductsGrid();
}

function handleSearchInput(e) {
  searchQuery = e.target.value;
  renderProductsGrid();
}

function resetFilters() {
  activeCategory = 'all';
  searchQuery = '';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.cat-filter-btn').forEach((btn, idx) => {
    if (idx === 0) {
      btn.classList.remove('btn-outline-dark');
      btn.classList.add('btn-dark', 'active');
    } else {
      btn.classList.remove('btn-dark', 'active');
      btn.classList.add('btn-outline-dark');
    }
  });
  renderProductsGrid();
}

// ----------------------------------------------------
// 3. PRODUCT DETAILS & REVIEWS MODAL
// ----------------------------------------------------

async function openProductDetailsModal(productId) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`);
    const result = await res.json();
    if (!result.success || !result.data) {
      showToast('Product details not found', true);
      return;
    }

    currentProduct = result.data;
    const modalEl = document.getElementById('productDetailsModal');
    if (!modalEl) return;

    // Populate Product Fields
    document.getElementById('p-modal-title').textContent = currentProduct.name;
    document.getElementById('p-modal-brand').textContent = currentProduct.brand || 'Vyrox';
    document.getElementById('p-modal-category').textContent = currentProduct.category_name || 'Footwear';
    document.getElementById('p-modal-img').src = currentProduct.image_url;

    const isDiscounted = currentProduct.discount_price && Number(currentProduct.discount_price) < Number(currentProduct.price);
    document.getElementById('p-modal-price').textContent = isDiscounted ? `₹${currentProduct.discount_price}` : `₹${currentProduct.price}`;
    document.getElementById('p-modal-old-price').textContent = isDiscounted ? `₹${currentProduct.price}` : '';
    document.getElementById('p-modal-description').textContent = currentProduct.description || 'No description available.';

    // Populate Size Selector Options
    const sizesContainer = document.getElementById('p-modal-sizes');
    const sizes = currentProduct.sizes || [
      { id: 1, size: 'UK 6', stock: 10 },
      { id: 2, size: 'UK 7', stock: 10 },
      { id: 3, size: 'UK 8', stock: 10 },
      { id: 4, size: 'UK 9', stock: 10 },
      { id: 5, size: 'UK 10', stock: 10 }
    ];

    sizesContainer.innerHTML = sizes.map((sz, idx) => `
      <input type="radio" class="btn-check" name="productSize" id="size-${sz.id || idx}" value="${sz.size}" data-size-id="${sz.id || ''}" ${idx === 0 ? 'checked' : ''} ${sz.stock <= 0 ? 'disabled' : ''}>
      <label class="btn btn-outline-dark rounded-pill px-3 py-1 me-2 mb-2" for="size-${sz.id || idx}">
        ${sz.size} ${sz.stock <= 0 ? '(Out of Stock)' : ''}
      </label>
    `).join('');

    document.getElementById('p-modal-qty').value = 1;

    // Load Reviews
    await loadProductReviews(productId);

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  } catch (err) {
    console.error('Error opening product modal:', err);
    showToast('Failed to load product details.', true);
  }
}

async function loadProductReviews(productId) {
  const reviewsContainer = document.getElementById('p-reviews-list');
  const summaryEl = document.getElementById('p-reviews-summary');
  if (!reviewsContainer) return;

  reviewsContainer.innerHTML = `<div class="text-center py-3"><i class="fa-solid fa-spinner fa-spin me-2"></i> Loading reviews...</div>`;

  try {
    const res = await fetch(`${API_BASE_URL}/reviews/product/${productId}`);
    const result = await res.json();

    if (result.success) {
      const summary = result.summary || { average_rating: 0, total_reviews: 0 };
      const reviews = result.data || [];

      // Render Summary Header
      summaryEl.innerHTML = `
        <div class="d-flex align-items-center gap-2 mb-3">
          <div class="fs-2 fw-bold text-warning">${summary.average_rating} <i class="fa-solid fa-star"></i></div>
          <div class="text-muted small">Based on ${summary.total_reviews} customer reviews</div>
        </div>
      `;

      if (reviews.length === 0) {
        reviewsContainer.innerHTML = `<p class="text-muted fst-italic">No reviews yet for this shoe. Be the first to leave a review!</p>`;
      } else {
        reviewsContainer.innerHTML = reviews.map(r => `
          <div class="border-bottom py-2 mb-2">
            <div class="d-flex justify-content-between align-items-center">
              <strong class="text-dark">${r.user_name || 'Verified Buyer'}</strong>
              <span class="text-warning small">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            </div>
            <p class="mb-1 text-secondary small" style="font-size:0.9rem;">${r.comment || ''}</p>
            <small class="text-muted" style="font-size:0.75rem;">${new Date(r.created_at).toLocaleDateString()}</small>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading reviews:', err);
    reviewsContainer.innerHTML = `<p class="text-danger">Unable to load reviews.</p>`;
  }
}

async function handleReviewSubmit(e) {
  if (e) e.preventDefault();
  const user = getStoredUser();
  if (!user) {
    showToast('Please login to write a review.', true);
    window.location.href = 'login.html';
    return;
  }

  if (!currentProduct) return;

  const ratingSelect = document.getElementById('review-rating-select');
  const commentText = document.getElementById('review-comment-text');

  const rating = Number(ratingSelect.value);
  const comment = commentText.value.trim();

  if (!rating || rating < 1 || rating > 5) {
    showToast('Please select a star rating between 1 and 5.', true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/reviews/product/${currentProduct.id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rating, comment })
    });

    const result = await res.json();
    if (res.ok && result.success) {
      showToast('Thank you! Your review has been submitted.');
      commentText.value = '';
      await loadProductReviews(currentProduct.id);
    } else {
      showToast(result.message || 'Failed to submit review', true);
    }
  } catch (err) {
    console.error('Error submitting review:', err);
    showToast('Network error while submitting review.', true);
  }
}

// ----------------------------------------------------
// 4. CART MODULE INTEGRATION
// ----------------------------------------------------

async function fetchCart() {
  const user = getStoredUser();
  if (!user) {
    currentCart = { items: [], total_items: 0, subtotal: 0 };
    updateCartBadge();
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/cart`, {
      headers: getAuthHeaders()
    });
    const result = await res.json();

    if (res.ok && result.success) {
      currentCart = result.data;
    } else {
      currentCart = { items: [], total_items: 0, subtotal: 0 };
    }
    updateCartBadge();
  } catch (err) {
    console.error('Error fetching cart:', err);
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge-count');
  if (badge) {
    badge.textContent = currentCart.total_items || 0;
  }
}

async function quickAddToCart(productId) {
  const user = getStoredUser();
  if (!user) {
    showToast('Please log in to add items to your cart.');
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/cart/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        product_id: productId,
        size: 'UK 8', // default size for quick add
        quantity: 1
      })
    });

    const result = await res.json();
    if (res.ok && result.success) {
      currentCart = result.data;
      updateCartBadge();
      showToast('Item added to cart!');
    } else {
      showToast(result.message || 'Failed to add item to cart', true);
    }
  } catch (err) {
    console.error('Error adding to cart:', err);
    showToast('Error adding item to cart.', true);
  }
}

async function handleAddToCartFromModal() {
  const user = getStoredUser();
  if (!user) {
    showToast('Please log in to add items to your cart.');
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    return;
  }

  if (!currentProduct) return;

  const selectedSizeRadio = document.querySelector('input[name="productSize"]:checked');
  if (!selectedSizeRadio) {
    showToast('Please select a shoe size.', true);
    return;
  }

  const size = selectedSizeRadio.value;
  const size_id = selectedSizeRadio.dataset.sizeId;
  const quantity = Number(document.getElementById('p-modal-qty').value) || 1;

  try {
    const res = await fetch(`${API_BASE_URL}/cart/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        product_id: currentProduct.id,
        size,
        size_id,
        quantity
      })
    });

    const result = await res.json();
    if (res.ok && result.success) {
      currentCart = result.data;
      updateCartBadge();
      showToast(`Added ${quantity} x ${currentProduct.name} (${size}) to cart!`);

      // Close modal
      const modalEl = document.getElementById('productDetailsModal');
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();
    } else {
      showToast(result.message || 'Failed to add to cart', true);
    }
  } catch (err) {
    console.error('Error adding to cart:', err);
    showToast('Failed to add item to cart', true);
  }
}

async function openCartModal() {
  const user = getStoredUser();
  if (!user) {
    showToast('Please login to view your cart.');
    window.location.href = 'login.html';
    return;
  }

  await fetchCart();
  renderCartModalItems();

  const cartModalEl = document.getElementById('cartModal');
  const bsModal = new bootstrap.Modal(cartModalEl);
  bsModal.show();
}

function renderCartModalItems() {
  const container = document.getElementById('cart-modal-items');
  const subtotalEl = document.getElementById('cart-modal-subtotal');
  const totalEl = document.getElementById('cart-modal-total');

  if (!container) return;

  const items = currentCart.items || [];
  const subtotal = currentCart.subtotal || 0;

  subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
  totalEl.textContent = `₹${subtotal.toFixed(2)}`;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="fa-solid fa-cart-shopping fa-3x text-muted mb-3"></i>
        <h5 class="fw-bold">Your Cart is Empty</h5>
        <p class="text-muted">Explore our collections and add your favorite shoes.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => {
    const itemPrice = item.discount_price !== null && item.discount_price !== undefined ? Number(item.discount_price) : Number(item.price);
    const itemTotal = (itemPrice * item.quantity).toFixed(2);

    return `
      <div class="d-flex align-items-center justify-content-between border-bottom py-3">
        <div class="d-flex align-items-center gap-3">
          <img src="${item.image_url}" alt="${item.product_name}" class="rounded border p-1" style="width: 65px; height: 65px; object-fit: contain; background:#f8fafc;" />
          <div>
            <h6 class="fw-bold mb-1 text-dark">${item.product_name}</h6>
            <div class="small text-muted mb-1">Size: <span class="fw-bold text-dark">${item.size}</span> | Price: ₹${itemPrice}</div>
            <div class="fw-bold text-dark">Total: ₹${itemTotal}</div>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-secondary btn-sm rounded-circle" onclick="updateCartItemQty(${item.id}, ${item.quantity - 1})" style="width:28px; height:28px; padding:0;">-</button>
          <span class="fw-bold px-2">${item.quantity}</span>
          <button class="btn btn-outline-secondary btn-sm rounded-circle" onclick="updateCartItemQty(${item.id}, ${item.quantity + 1})" style="width:28px; height:28px; padding:0;">+</button>
          <button class="btn btn-link text-danger ms-2 p-0" onclick="removeCartItem(${item.id})" title="Remove item">
            <i class="fa-solid fa-trash-can fs-5"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function updateCartItemQty(itemId, newQty) {
  try {
    const res = await fetch(`${API_BASE_URL}/cart/item/${itemId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity: newQty })
    });

    const result = await res.json();
    if (res.ok && result.success) {
      currentCart = result.data;
      updateCartBadge();
      renderCartModalItems();
    } else {
      showToast(result.message || 'Failed to update item quantity', true);
    }
  } catch (err) {
    console.error('Error updating cart item:', err);
  }
}

async function removeCartItem(itemId) {
  try {
    const res = await fetch(`${API_BASE_URL}/cart/item/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const result = await res.json();
    if (res.ok && result.success) {
      currentCart = result.data;
      updateCartBadge();
      renderCartModalItems();
      showToast('Item removed from cart');
    } else {
      showToast(result.message || 'Failed to remove item', true);
    }
  } catch (err) {
    console.error('Error removing cart item:', err);
  }
}

// ----------------------------------------------------
// 5. ORDERS & CHECKOUT & RAZORPAY INTEGRATION
// ----------------------------------------------------

function openCheckoutModal() {
  if (!currentCart.items || currentCart.items.length === 0) {
    showToast('Your cart is empty. Add items before checking out.', true);
    return;
  }

  // Close cart modal
  const cartModalEl = document.getElementById('cartModal');
  const cartBsModal = bootstrap.Modal.getInstance(cartModalEl);
  if (cartBsModal) cartBsModal.hide();

  // Populate order summary in checkout modal
  document.getElementById('checkout-subtotal').textContent = `₹${currentCart.subtotal.toFixed(2)}`;
  document.getElementById('checkout-total').textContent = `₹${currentCart.subtotal.toFixed(2)}`;

  const checkoutModalEl = document.getElementById('checkoutModal');
  const checkoutBsModal = new bootstrap.Modal(checkoutModalEl);
  checkoutBsModal.show();
}

async function handlePlaceOrderAndPay(e) {
  if (e) e.preventDefault();

  const address = document.getElementById('checkout-address').value.trim();
  const city = document.getElementById('checkout-city').value.trim();
  const pincode = document.getElementById('checkout-pincode').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();

  if (!address || !city || !pincode || !phone) {
    showToast('Please fill in complete shipping details.', true);
    return;
  }

  const fullShippingAddress = `${address}, ${city} - ${pincode} (Phone: ${phone})`;
  const payBtn = document.getElementById('pay-now-btn');

  payBtn.disabled = true;
  payBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i> PLACING ORDER...`;

  try {
    // Step 1: Create Order in Backend
    const orderRes = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        shipping_address: fullShippingAddress,
        shipping_fee: 0,
        tax: 0
      })
    });

    const orderResult = await orderRes.json();

    if (!orderRes.ok || !orderResult.success) {
      payBtn.disabled = false;
      payBtn.innerHTML = `PROCEED TO PAYMENT`;
      showToast(orderResult.message || 'Failed to place order', true);
      return;
    }

    const createdOrder = orderResult.data;

    // Step 2: Create Razorpay Order
    payBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i> INITIALIZING RAZORPAY...`;

    const payRes = await fetch(`${API_BASE_URL}/payment/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        order_id: createdOrder.id
      })
    });

    const payResult = await payRes.json();

    if (!payRes.ok || !payResult.success) {
      payBtn.disabled = false;
      payBtn.innerHTML = `PROCEED TO PAYMENT`;
      showToast('Order created but payment gateway initialization failed.', true);
      return;
    }

    const payData = payResult.data;
    const user = getStoredUser();

    // Step 3: Open Razorpay Checkout Popup
    const options = {
      key: payData.key_id || 'rzp_test_key_id',
      amount: payData.amount,
      currency: payData.currency || 'INR',
      name: 'Vyrox Shoes',
      description: `Payment for Order #${payData.order_number}`,
      image: 'images/logo.png',
      order_id: payData.razorpay_order_id,
      handler: async function (response) {
        // Step 4: Verify Payment Signature on Server
        try {
          const verifyRes = await fetch(`${API_BASE_URL}/payment/verify`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              order_id: createdOrder.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_method: 'card'
            })
          });

          const verifyResult = await verifyRes.json();

          if (verifyRes.ok && verifyResult.success) {
            // Close Checkout Modal
            const checkoutModalEl = document.getElementById('checkoutModal');
            const bsModal = bootstrap.Modal.getInstance(checkoutModalEl);
            if (bsModal) bsModal.hide();

            // Refresh Cart
            await fetchCart();

            showToast(`🎉 Payment Success! Order #${payData.order_number} confirmed!`);

            setTimeout(() => {
              openOrdersModal();
            }, 1200);
          } else {
            showToast('Payment verification failed on server.', true);
          }
        } catch (err) {
          console.error('Error verifying payment:', err);
          showToast('Payment verification error.', true);
        }
      },
      prefill: {
        name: user.name || '',
        email: user.email || '',
        contact: phone || user.phone || ''
      },
      theme: {
        color: '#0f172a'
      }
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response) {
      showToast(`Payment Failed: ${response.error.description || 'Transaction cancelled'}`, true);
      payBtn.disabled = false;
      payBtn.innerHTML = `PROCEED TO PAYMENT`;
    });
    rzp.open();

  } catch (err) {
    console.error('Error in checkout flow:', err);
    showToast('Failed to complete checkout flow.', true);
    payBtn.disabled = false;
    payBtn.innerHTML = `PROCEED TO PAYMENT`;
  }
}

// ----------------------------------------------------
// 6. VIEW ORDERS MODULE
// ----------------------------------------------------

async function openOrdersModal() {
  const user = getStoredUser();
  if (!user) {
    showToast('Please login to view your orders.');
    window.location.href = 'login.html';
    return;
  }

  const container = document.getElementById('orders-modal-list');
  if (container) {
    container.innerHTML = `<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x me-2"></i> Loading order history...</div>`;
  }

  const ordersModalEl = document.getElementById('ordersModal');
  const bsModal = new bootstrap.Modal(ordersModalEl);
  bsModal.show();

  try {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      headers: getAuthHeaders()
    });

    const result = await res.json();
    if (res.ok && result.success) {
      renderUserOrdersList(result.data || []);
    } else {
      if (container) container.innerHTML = `<p class="text-danger text-center">Failed to load orders.</p>`;
    }
  } catch (err) {
    console.error('Error loading orders:', err);
    if (container) container.innerHTML = `<p class="text-danger text-center">Network error loading orders.</p>`;
  }
}

function renderUserOrdersList(orders) {
  const container = document.getElementById('orders-modal-list');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="fa-solid fa-box-open fa-3x text-muted mb-3"></i>
        <h5 class="fw-bold">No Orders Placed Yet</h5>
        <p class="text-muted">Your order history will appear here once you place an order.</p>
      </div>
    `;
    return;
  }

  const statusColors = {
    pending: 'bg-warning text-dark',
    processing: 'bg-info text-dark',
    shipped: 'bg-primary text-white',
    delivered: 'bg-success text-white',
    cancelled: 'bg-danger text-white'
  };

  container.innerHTML = orders.map(order => {
    const statusBadge = statusColors[order.status] || 'bg-secondary text-white';
    const dateStr = new Date(order.created_at).toLocaleString();

    const itemsHtml = (order.items || []).map(item => `
      <div class="d-flex justify-content-between align-items-center py-1 border-bottom-subtle small">
        <div>
          <span class="fw-bold text-dark">${item.product_name}</span> (${item.size})
          <span class="text-muted">x${item.quantity}</span>
        </div>
        <div class="fw-bold">₹${Number(item.total_price).toFixed(2)}</div>
      </div>
    `).join('');

    return `
      <div class="card border rounded-4 mb-3 shadow-sm overflow-hidden">
        <div class="card-header bg-light d-flex flex-wrap justify-content-between align-items-center py-3">
          <div>
            <div class="fw-bold text-dark" style="font-family:'Audiowide', sans-serif;">ORDER #${order.order_number}</div>
            <small class="text-muted">${dateStr}</small>
          </div>
          <div>
            <span class="badge ${statusBadge} text-uppercase px-3 py-2 rounded-pill fw-bold" style="letter-spacing:0.05em;">${order.status}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="mb-2">${itemsHtml}</div>
          <div class="d-flex justify-content-between align-items-center pt-2 border-top">
            <div class="small text-muted"><i class="fa-solid fa-location-dot me-1"></i> ${order.shipping_address}</div>
            <div class="fs-5 fw-bold text-dark">Total: ₹${Number(order.total_amount).toFixed(2)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------
// 7. INITIALIZATION ON DOM LOADED
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  updateNavbarSession();
  fetchProducts();
  fetchCart();
});
