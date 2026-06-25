// ==========================================================================
// E-commerce Storefront Logic (ACRONYM-style)
// Brand: CALL ME | Multi-Product Dynamic Routing & Transitions
// ==========================================================================

const init = () => {
  // Inject Cart Drawer HTML dynamically if it doesn't exist
  if (!document.getElementById('cart-drawer')) {
    const drawerContainer = document.createElement('div');
    drawerContainer.innerHTML = `
      <div class="cart-drawer" id="cart-drawer">
        <div class="cart-drawer-header">
          <div class="cart-drawer-title">CART // ITEMS [<span id="cart-drawer-count">0</span>]</div>
          <button class="cart-drawer-close" id="cart-drawer-close">CLOSE [ X ]</button>
        </div>
        <div class="cart-drawer-body" id="cart-drawer-body">
          <div class="cart-empty-msg tech-font">CART IS EMPTY // КОРЗИНА ПУСТА</div>
        </div>
        <div class="cart-drawer-footer">
          <div class="cart-total-row">
            <div class="tech-font">SUBTOTAL // ИТОГО:</div>
            <div class="tech-font" id="cart-drawer-total">$0</div>
          </div>
          <form class="cart-checkout-form" id="cart-checkout-form">
            <div class="input-group">
              <input type="text" class="input-field" placeholder="NAME / ИМЯ" required id="cart-cust-name">
            </div>
            <div class="input-group">
              <input type="tel" class="input-field" placeholder="PHONE / ТЕЛЕФОН" required id="cart-cust-phone">
            </div>
            <div class="input-group">
              <input type="text" class="input-field" placeholder="TELEGRAM / USERNAME" required id="cart-cust-social">
            </div>
            <div class="input-group">
              <input type="email" class="input-field" placeholder="EMAIL / ПОЧТА" required id="cart-cust-email">
            </div>
            <div class="input-group">
              <input type="text" class="input-field" placeholder="SHIPPING ADDRESS / АДРЕС" required id="cart-cust-address">
            </div>
            <button type="submit" class="buy-button" style="margin-top: 10px;">PROCEED TO PAYMENT / К ОПЛАТЕ</button>
          </form>
        </div>
      </div>
      <div class="cart-drawer-overlay" id="cart-drawer-overlay"></div>
    `;
    document.body.appendChild(drawerContainer);
  }

  // Cart State (Persisted in localStorage)
  let cart = JSON.parse(localStorage.getItem('call_me_cart') || '[]');
  let selectedSize = 'M';

  // DOM Elements
  const orderForm = document.getElementById('order-form');
  const successOverlay = document.getElementById('success-overlay');
  const successBuyerName = document.getElementById('success-buyer-name');
  const tgRedirectLink = document.getElementById('tg-redirect-link');
  const closeSuccessBtn = document.getElementById('close-success-btn');
  const cartBtn = document.getElementById('cart-btn');
  
  // Stealth/Zen Page Transition Elements
  const logoTrigger = document.getElementById('logo-trigger');
  const centerLogo = document.getElementById('center-logo');
  const catalogCards = document.querySelectorAll('.catalog-card');

  // --------------------------------------------------------------------------
  // Dynamic Product Page Loader
  // --------------------------------------------------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id') || 'hoodie';
  const isProductPage = !!document.getElementById('product-meta');

  if (isProductPage && window.PRODUCTS_DATA && window.PRODUCTS_DATA[productId]) {
    const data = window.PRODUCTS_DATA[productId];

    // Update Tab Title
    document.title = `CALL ME — ${data.name}`;

    // Update Product Code & Collection Metadata
    const metaEl = document.getElementById('product-meta');
    if (metaEl) {
      metaEl.textContent = `COLLECTION: ${data.collection} // CODE: ${data.code}`;
    }

    // Update Product Price
    const priceEl = document.getElementById('product-price');
    if (priceEl) {
      priceEl.textContent = data.price;
    }

    // Update Sizing Selector
    const sizesGrid = document.getElementById('product-sizes-grid');
    if (sizesGrid) {
      sizesGrid.innerHTML = '';
      data.sizes.forEach((sz, idx) => {
        const btn = document.createElement('button');
        
        // Default active size selection logic
        const isActive = (data.sizes.includes('M') && sz === 'M') || (!data.sizes.includes('M') && idx === 0);
        btn.className = `size-btn${isActive ? ' active' : ''}`;
        if (isActive) {
          selectedSize = sz;
        }

        btn.dataset.size = sz;
        btn.textContent = sz;
        
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedSize = sz;
          updateStepperButton();
        });

        sizesGrid.appendChild(btn);
      });

      // Update the selection label title
      const sizeLabel = document.getElementById('size-label');
      if (sizeLabel) {
        if (data.sizes.length === 1 && data.sizes[0] === 'ONE SIZE') {
          sizeLabel.textContent = 'FIT [ONE SIZE]';
        } else {
          sizeLabel.textContent = 'SELECT SIZE [EUR]';
        }
      }
    }

    // Update Specifications List
    const specsList = document.getElementById('product-specs-list');
    if (specsList) {
      specsList.innerHTML = '';
      data.specs.forEach(spec => {
        const li = document.createElement('li');
        const colonIdx = spec.indexOf(':');
        
        if (colonIdx !== -1) {
          const labelText = spec.substring(0, colonIdx + 1);
          const detailText = spec.substring(colonIdx + 1);
          
          const labelSpan = document.createElement('span');
          labelSpan.textContent = labelText;
          
          li.appendChild(labelSpan);
          li.appendChild(document.createTextNode(detailText));
        } else {
          li.textContent = spec;
        }
        specsList.appendChild(li);
      });
    }

    // Update Primary Photo Column (with Gallery and Slider)
    const mediaColumn = document.getElementById('product-media-column');
    if (mediaColumn) {
      mediaColumn.innerHTML = '';
      
      const galleryWrapper = document.createElement('div');
      galleryWrapper.className = 'gallery-wrapper';
      
      const thumbnailsContainer = document.createElement('div');
      thumbnailsContainer.className = 'thumbnails-container';
      thumbnailsContainer.id = 'thumbnails-container';
      
      data.images.forEach((imgSrc, idx) => {
        const thumbItem = document.createElement('div');
        thumbItem.className = `thumb-item${idx === 0 ? ' active' : ''}`;
        thumbItem.setAttribute('data-index', idx);
        
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = `Thumb ${idx + 1}`;
        
        thumbItem.appendChild(img);
        thumbnailsContainer.appendChild(thumbItem);
      });
      
      const productSlider = document.createElement('div');
      productSlider.className = 'product-slider';
      productSlider.id = 'product-slider';
      
      const prevBtn = document.createElement('button');
      prevBtn.className = 'slider-arrow prev';
      prevBtn.id = 'slider-prev';
      prevBtn.setAttribute('aria-label', 'Previous Photo');
      prevBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 19l-7-7 7-7" /></svg>';
      
      const sliderTrack = document.createElement('div');
      sliderTrack.className = 'slider-track';
      sliderTrack.id = 'slider-track';
      
      data.images.forEach((imgSrc, idx) => {
        const slide = document.createElement('div');
        slide.className = 'slide';
        
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = `${data.name} View ${idx + 1}`;
        img.className = 'primary-photo';
        
        slide.appendChild(img);
        sliderTrack.appendChild(slide);
      });
      
      const nextBtn = document.createElement('button');
      nextBtn.className = 'slider-arrow next';
      nextBtn.id = 'slider-next';
      nextBtn.setAttribute('aria-label', 'Next Photo');
      nextBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5l7 7-7 7" /></svg>';
      
      const sliderCounter = document.createElement('div');
      sliderCounter.className = 'slider-counter tech-font';
      sliderCounter.id = 'slider-counter';
      const formattedTotal = String(data.images.length).padStart(2, '0');
      sliderCounter.textContent = `[ 01 // ${formattedTotal} ]`;
      
      productSlider.appendChild(prevBtn);
      productSlider.appendChild(sliderTrack);
      productSlider.appendChild(nextBtn);
      productSlider.appendChild(sliderCounter);
      
      galleryWrapper.appendChild(thumbnailsContainer);
      galleryWrapper.appendChild(productSlider);
      
      mediaColumn.appendChild(galleryWrapper);
    }

    // Toggle Street/Lifestyle Gallery (Only visible for the core hoodie item)
    const gallerySection = document.getElementById('product-gallery-section');
    if (gallerySection) {
      if (productId === 'hoodie') {
        gallerySection.style.display = 'block';
      } else {
        gallerySection.style.display = 'none';
      }
    }
  }

  // --------------------------------------------------------------------------
  // Smooth Page Transitions
  // --------------------------------------------------------------------------
  
  // Fade page in smoothly on load
  if (document.body.classList.contains('stealth-mode') && !centerLogo) {
    setTimeout(() => {
      document.body.classList.remove('stealth-mode');
    }, 50);
  }

  // Reset page transition states if user navigates back in history (BFcache)
  window.addEventListener('pageshow', () => {
    if (!centerLogo) {
      document.body.classList.remove('stealth-mode');
    }
  });

  // Transit: Center phone click (landing -> catalog)
  if (centerLogo) {
    centerLogo.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.remove('stealth-mode');
      setTimeout(() => {
        window.location.href = 'product.html';
      }, 500);
    });
  }

  // Transit: Navbar logo click (catalog -> landing, or product -> catalog)
  if (logoTrigger) {
    logoTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      const targetUrl = logoTrigger.getAttribute('href');
      document.body.classList.add('stealth-mode');
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 500);
    });
  }

  // Transit: Catalog card click (catalog -> product detail)
  if (catalogCards) {
    catalogCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const targetUrl = card.getAttribute('href');
        document.body.classList.add('stealth-mode');
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 500);
      });
    });
  }

  // --------------------------------------------------------------------------
  // Checkout & UI Handlers
  // --------------------------------------------------------------------------
  
  // --------------------------------------------------------------------------
  // Cart Core State Management & Updates
  // --------------------------------------------------------------------------
  const updateCartBadge = () => {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    if (cartBtn) {
      cartBtn.textContent = `CART [ ${count} ]`;
    }
    const drawerCount = document.getElementById('cart-drawer-count');
    if (drawerCount) {
      drawerCount.textContent = count;
    }
  };

  const saveCart = () => {
    localStorage.setItem('call_me_cart', JSON.stringify(cart));
    updateCartBadge();
    renderCartItems();
  };

  const openCartDrawer = () => {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer && overlay) {
      drawer.classList.add('active');
      overlay.classList.add('active');
    }
  };

  const closeCartDrawer = () => {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer && overlay) {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
    }
  };

  const renderCartItems = () => {
    const body = document.getElementById('cart-drawer-body');
    const totalEl = document.getElementById('cart-drawer-total');
    if (!body || !totalEl) return;

    if (cart.length === 0) {
      body.innerHTML = '<div class="cart-empty-msg tech-font">CART IS EMPTY // КОРЗИНА ПУСТА</div>';
      totalEl.textContent = '$0';
      return;
    }

    body.innerHTML = '';
    let subtotal = 0;

    cart.forEach((item, idx) => {
      const rowTotal = item.price * item.qty;
      subtotal += rowTotal;

      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div class="cart-item-img-box">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name tech-font">${item.name}</div>
          <div class="cart-item-details">SIZE: ${item.size}</div>
          <div class="cart-item-quantity">
            <button class="qty-btn dec-qty" data-idx="${idx}">-</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn inc-qty" data-idx="${idx}">+</button>
          </div>
        </div>
        <div class="cart-item-price-box">
          <div class="cart-item-subtotal tech-font">$${rowTotal}</div>
          <button class="cart-item-remove" data-idx="${idx}">REMOVE</button>
        </div>
      `;
      body.appendChild(div);
    });

    totalEl.textContent = `$${subtotal}`;

    // Attach quantity & remove listeners
    body.querySelectorAll('.dec-qty').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.dataset.idx);
        if (cart[idx].qty > 1) {
          cart[idx].qty--;
        } else {
          cart.splice(idx, 1);
        }
        saveCart();
      });
    });

    body.querySelectorAll('.inc-qty').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.dataset.idx);
        cart[idx].qty++;
        saveCart();
      });
    });

    body.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.dataset.idx);
        cart.splice(idx, 1);
        saveCart();
      });
    });
  };

  const setupProductSlider = () => {
    const slider = document.getElementById('product-slider');
    const track = document.getElementById('slider-track');
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');
    const counter = document.getElementById('slider-counter');
    const thumbContainer = document.getElementById('thumbnails-container');
    const thumbs = thumbContainer ? thumbContainer.querySelectorAll('.thumb-item') : [];
    
    if (!slider || !track) return;
    
    const slides = track.querySelectorAll('.slide');
    const totalSlides = slides.length;
    let currentIndex = 0;
    
    const updateSlider = () => {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      if (counter) {
        const formattedIndex = String(currentIndex + 1).padStart(2, '0');
        const formattedTotal = String(totalSlides).padStart(2, '0');
        counter.textContent = `[ ${formattedIndex} // ${formattedTotal} ]`;
      }
      
      // Update active thumbnail class
      thumbs.forEach((t, idx) => {
        if (idx === currentIndex) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
    };
    
    const nextSlide = () => {
      currentIndex = (currentIndex + 1) % totalSlides;
      updateSlider();
    };
    
    const prevSlide = () => {
      currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      updateSlider();
    };
    
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    
    // Thumbnail click listeners
    thumbs.forEach((thumb, idx) => {
      thumb.addEventListener('click', (e) => {
        currentIndex = idx;
        updateSlider();
      });
    });
    
    // Touch Swipe support
    let startX = 0;
    let isSwiping = false;
    
    slider.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isSwiping = true;
    }, { passive: true });
    
    slider.addEventListener('touchend', (e) => {
      if (!isSwiping) return;
      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      
      if (diffX > 50) {
        nextSlide();
      } else if (diffX < -50) {
        prevSlide();
      }
      isSwiping = false;
    }, { passive: true });
  };

  const setupAccordions = () => {
    const items = document.querySelectorAll('.accordion-item');
    items.forEach(item => {
      const trigger = item.querySelector('.accordion-trigger');
      const icon = item.querySelector('.accordion-icon');
      if (!trigger || !icon) return;
      
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const isActive = item.classList.contains('active');
        
        // Close all items
        items.forEach(i => {
          i.classList.remove('active');
          const otherIcon = i.querySelector('.accordion-icon');
          if (otherIcon) otherIcon.textContent = '+';
        });
        
        // Open clicked item if it was closed
        if (!isActive) {
          item.classList.add('active');
          icon.textContent = '—';
        }
      });
    });
  };

  const processCheckout = async (name, phone, social, email, address, submitBtn) => {
    if (cart.length === 0) {
      alert('Your cart is empty / Корзина пуста.');
      return;
    }

    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'CREATING INVOICE / СОЗДАНИЕ ОПЛАТЫ...';

    let total = 0;
    cart.forEach(item => {
      total += item.price * item.qty;
    });

    try {
      const response = await fetch('https://astonishing-bunny-4408f5.netlify.app/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: cart,
          totalUSD: total,
          name,
          phone,
          social,
          email,
          address
        })
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.details || result.error || 'Failed to create payment link.');
      }

      // Clear cart on success
      cart = [];
      saveCart();
      closeCartDrawer();
      
      // Redirect to Lava.top payment page
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        throw new Error('Payment URL not received from gateway.');
      }
    } catch (err) {
      alert(`Checkout Error / Ошибка заказа: ${err.message}`);
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  };

  const setupCartCheckout = () => {
    const form = document.getElementById('cart-checkout-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('cart-cust-name').value.trim();
      const phone = document.getElementById('cart-cust-phone').value.trim();
      const social = document.getElementById('cart-cust-social').value.trim();
      const email = document.getElementById('cart-cust-email').value.trim();
      const address = document.getElementById('cart-cust-address').value.trim();

      const submitBtn = form.querySelector('button[type="submit"]');

      processCheckout(name, phone, social, email, address, submitBtn);
    });
  };

  const addToCart = (prodId, size, showDrawer = true) => {
    const data = window.PRODUCTS_DATA && window.PRODUCTS_DATA[prodId];
    if (!data) return;

    // Use the first image in the product images stack
    const imageSrc = data.images && data.images[0] ? data.images[0] : '';
    const priceVal = 240; // fixed $240 price

    // Check if item is already in cart
    const existing = cart.find(item => item.id === prodId && item.size === size);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({
        id: prodId,
        name: data.name,
        price: priceVal,
        size: size,
        image: imageSrc,
        qty: 1
      });
    }
    saveCart();
  };

  function updateStepperButton() {
    const container = document.getElementById('product-action-container');
    if (!container) return;

    const existing = cart.find(item => item.id === productId && item.size === selectedSize);

    if (existing) {
      container.innerHTML = `
        <div class="split-buy-btn">
          <button class="split-btn-minus" id="split-minus-btn" aria-label="Decrease Quantity">—</button>
          <button class="split-btn-center" id="split-center-btn">
            <span class="qty-text">${existing.qty} ITEM${existing.qty > 1 ? 'S' : ''} // ${existing.qty} ШТ</span>
            <span class="go-cart-text">GO TO CART / В КОРЗИНУ</span>
          </button>
          <button class="split-btn-plus" id="split-plus-btn" aria-label="Increase Quantity">+</button>
        </div>
      `;

      // Add listeners
      document.getElementById('split-minus-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (existing.qty > 1) {
          existing.qty--;
        } else {
          // Remove from cart
          cart = cart.filter(item => !(item.id === productId && item.size === selectedSize));
        }
        saveCart();
        updateCartBadge();
        updateStepperButton();
      });

      document.getElementById('split-plus-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        existing.qty++;
        saveCart();
        updateCartBadge();
        updateStepperButton();
      });

      document.getElementById('split-center-btn').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'cart.html';
      });
    } else {
      const btn = document.createElement('button');
      btn.className = 'buy-button';
      btn.id = 'add-to-cart-btn';
      btn.textContent = 'ADD TO CART / В КОРЗИНУ';
      
      container.innerHTML = '';
      container.appendChild(btn);
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        addToCart(productId, selectedSize, false); // Add silently
        updateStepperButton();
        updateCartBadge();
      });
    }
  }

  function setupCartPage() {
    const cartItemsList = document.getElementById('cart-page-items-list');
    if (!cartItemsList) return;

    const renderCartPage = () => {
      const footerSection = document.getElementById('cart-page-footer-section');
      
      if (cart.length === 0) {
        cartItemsList.innerHTML = `<div class="cart-empty-msg tech-font" style="text-align: center; padding: 40px 0;">CART IS EMPTY // КОРЗИНА ПУСТА</div>`;
        if (footerSection) footerSection.style.display = 'none';
        return;
      }

      if (footerSection) footerSection.style.display = 'block';
      cartItemsList.innerHTML = '';

      cart.forEach((item, idx) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item-row';
        itemRow.style.display = 'flex';
        itemRow.style.justifyContent = 'space-between';
        itemRow.style.alignItems = 'center';
        itemRow.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        itemRow.style.padding = '20px 0';
        itemRow.style.gap = '20px';

        itemRow.innerHTML = `
          <div class="cart-item-left" style="display: flex; align-items: center; gap: 20px;">
            <img src="${item.image}" alt="${item.name}" style="width: 70px; height: 70px; object-fit: cover; border: 1px solid var(--border-dark);">
            <div class="cart-item-info">
              <div class="cart-item-name tech-font" style="font-size: 13px; font-weight: 700; color: var(--text-white);">${item.name}</div>
              <div class="cart-item-details tech-font" style="font-size: 11px; color: var(--text-gray); margin-top: 4px;">SIZE: ${item.size}</div>
            </div>
          </div>

          <div class="cart-item-right" style="display: flex; align-items: center; gap: 40px;">
            <div class="cart-item-quantity" style="display: flex; align-items: center; gap: 12px;">
              <button class="qty-btn" data-action="minus" data-idx="${idx}">—</button>
              <span class="qty-val tech-font">${item.qty}</span>
              <button class="qty-btn" data-action="plus" data-idx="${idx}">+</button>
            </div>
            <div class="cart-item-price-box" style="display: flex; flex-direction: column; align-items: flex-end; min-width: 80px;">
              <span class="cart-item-subtotal tech-font" style="font-size: 14px; font-weight: 700; color: var(--text-white);">$${item.price * item.qty}</span>
              <button class="cart-item-remove tech-font" data-idx="${idx}" style="margin-top: 6px; background: transparent; border: none; color: var(--text-gray); cursor: pointer; font-size: 10px;">REMOVE</button>
            </div>
          </div>
        `;
        cartItemsList.appendChild(itemRow);
      });

      // Add event listeners to qty buttons and remove buttons
      cartItemsList.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(btn.dataset.idx);
          const action = btn.dataset.action;
          if (action === 'plus') {
            cart[idx].qty++;
          } else if (action === 'minus') {
            if (cart[idx].qty > 1) {
              cart[idx].qty--;
            } else {
              cart.splice(idx, 1);
            }
          }
          saveCart();
          updateCartBadge();
          renderCartPage();
        });
      });

      cartItemsList.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(btn.dataset.idx);
          cart.splice(idx, 1);
          saveCart();
          updateCartBadge();
          renderCartPage();
        });
      });

      // Recalculate totals
      updateCartTotals();
    };

    const updateCartTotals = () => {
      let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const discountRate = parseFloat(localStorage.getItem('promo_discount_rate') || '0');
      const discount = subtotal * discountRate;
      const grandTotal = subtotal - discount;

      const grandTotalEl = document.getElementById('cart-page-grand-total');
      if (grandTotalEl) {
        if (discountRate > 0) {
          grandTotalEl.innerHTML = `<span style="text-decoration: line-through; color: var(--text-gray); font-size: 13px; margin-right: 10px;">$${subtotal}</span>$${grandTotal.toFixed(2)}`;
        } else {
          grandTotalEl.textContent = `$${subtotal}`;
        }
      }
    };

    // Promo Code Handler
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    const promoInput = document.getElementById('promo-code-input');
    const promoStatus = document.getElementById('promo-status-message');

    if (applyPromoBtn && promoInput && promoStatus) {
      applyPromoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const code = promoInput.value.trim().toUpperCase();
        
        // Mock promo code check
        if (code === 'STEALTH10') {
          localStorage.setItem('promo_discount_rate', '0.10');
          localStorage.setItem('applied_promo_code', 'STEALTH10');
          promoStatus.style.color = '#00ff66';
          promoStatus.textContent = 'PROMOCODE STEALTH10 ACTIVATED (10% OFF)';
          updateCartTotals();
        } else if (code === 'CALLME20') {
          localStorage.setItem('promo_discount_rate', '0.20');
          localStorage.setItem('applied_promo_code', 'CALLME20');
          promoStatus.style.color = '#00ff66';
          promoStatus.textContent = 'PROMOCODE CALLME20 ACTIVATED (20% OFF)';
          updateCartTotals();
        } else if (code === '') {
          promoStatus.textContent = '';
        } else {
          promoStatus.style.color = '#ff0055';
          promoStatus.textContent = 'INVALID PROMOCODE / НЕВЕРНЫЙ ПРОМОКОД';
        }
      });

      // Restore previously applied promo code
      const savedCode = localStorage.getItem('applied_promo_code');
      if (savedCode) {
        promoInput.value = savedCode;
        promoStatus.style.color = '#00ff66';
        promoStatus.textContent = `PROMOCODE ${savedCode} ACTIVE`;
      }
    }

    // Checkout redirect button
    const checkoutBtn = document.getElementById('cart-page-checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'checkout.html';
      });
    }

    renderCartPage();
  }

  function setupCheckoutPage() {
    const checkoutForm = document.getElementById('checkout-main-form');
    if (!checkoutForm) return;

    let selectedCity = null;
    let shippingCost = 0;
    let shippingMethodName = 'NONE';
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountRate = parseFloat(localStorage.getItem('promo_discount_rate') || '0');
    const discount = subtotal * discountRate;
    const promoCode = localStorage.getItem('applied_promo_code') || '';

    // Render Order Summary (Right Column)
    const renderCheckoutSummary = () => {
      const summaryItemsList = document.getElementById('summary-items-list');
      const summarySubtotal = document.getElementById('summary-subtotal');
      const summaryPromoRow = document.getElementById('summary-promo-row');
      const summaryPromoDiscount = document.getElementById('summary-promo-discount');
      const summaryShipping = document.getElementById('summary-shipping');
      const summaryTotal = document.getElementById('summary-total');

      if (summaryItemsList) {
        summaryItemsList.innerHTML = '';
        cart.forEach(item => {
          const itemCard = document.createElement('div');
          itemCard.className = 'summary-item-card';
          itemCard.innerHTML = `
            <div class="summary-item-left">
              <img src="${item.image}" alt="${item.name}" class="summary-item-img">
              <div class="summary-item-info">
                <span class="summary-item-name">${item.name}</span>
                <span class="summary-item-meta">SIZE: ${item.size} // QTY: ${item.qty}</span>
              </div>
            </div>
            <span class="summary-item-price tech-font">$${item.price * item.qty}</span>
          `;
          summaryItemsList.appendChild(itemCard);
        });
      }

      if (summarySubtotal) summarySubtotal.textContent = `$${subtotal}`;
      
      if (discountRate > 0 && summaryPromoRow && summaryPromoDiscount) {
        summaryPromoRow.style.display = 'flex';
        summaryPromoDiscount.textContent = `-$${discount.toFixed(2)}`;
      }

      if (summaryShipping) {
        summaryShipping.textContent = shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : '$0';
      }

      if (summaryTotal) {
        const grandTotal = subtotal - discount + shippingCost;
        summaryTotal.textContent = `$${grandTotal.toFixed(2)}`;
      }
    };

    // City Lookup Autocomplete (Nominatim OpenStreetMap)
    const cityInput = document.getElementById('check-city');
    const suggestionsContainer = document.getElementById('city-suggestions');
    let debounceTimer;

    if (cityInput && suggestionsContainer) {
      cityInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = cityInput.value.trim();
        if (query.length < 2) {
          suggestionsContainer.innerHTML = '';
          suggestionsContainer.style.display = 'none';
          return;
        }

        debounceTimer = setTimeout(() => {
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`)
            .then(res => res.json())
            .then(data => {
              suggestionsContainer.innerHTML = '';
              if (data.length === 0) {
                suggestionsContainer.style.display = 'none';
                return;
              }

              suggestionsContainer.style.display = 'block';
              data.forEach(item => {
                const city = item.address.city || item.address.town || item.address.village || item.address.state || item.display_name.split(',')[0];
                const country = item.address.country || '';
                const countryCode = item.address.country_code ? item.address.country_code.toUpperCase() : '';
                const displayName = `${city}, ${country}`;

                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = item.display_name;
                div.addEventListener('click', () => {
                  cityInput.value = displayName;
                  suggestionsContainer.innerHTML = '';
                  suggestionsContainer.style.display = 'none';
                  
                  selectedCity = {
                    name: city,
                    country: country,
                    countryCode: countryCode,
                    fullName: item.display_name
                  };
                  
                  // Trigger Shipping method options display
                  updateShippingMethods();
                });
                suggestionsContainer.appendChild(div);
              });
            })
            .catch(err => {
              console.error('Nominatim lookup failed', err);
            });
        }, 350);
      });

      // Close suggestions on outside click
      document.addEventListener('click', (e) => {
        if (e.target !== cityInput && e.target !== suggestionsContainer) {
          suggestionsContainer.innerHTML = '';
          suggestionsContainer.style.display = 'none';
        }
      });
    }

    // Shipping Methods UI Update
    const updateShippingMethods = () => {
      const optionsWrapper = document.getElementById('shipping-options-wrapper');
      const methodsList = document.getElementById('shipping-methods-list');
      const addressGroup = document.getElementById('detailed-address-group');
      
      if (!optionsWrapper || !methodsList || !selectedCity) return;

      optionsWrapper.style.display = 'block';
      if (addressGroup) addressGroup.style.display = 'block';
      methodsList.innerHTML = '';

      let options = [];
      const code = selectedCity.countryCode;

      if (code === 'RU') {
        options = [
          { id: 'sdek_pickup', title: 'Самовывоз СДЭК', desc: 'Забирать из отделения - это удобно', price: 5, name: 'SDEK PICKUP' },
          { id: 'sdek_courier', title: 'Курьером СДЭК', desc: 'До вашей двери (1-2 дня)', price: 8, name: 'SDEK COURIER' }
        ];
      } else if (code === 'ID' || code === 'TH') {
        options = [
          { id: 'local_courier', title: 'Local Courier Service', desc: 'Direct shipping (3-5 days)', price: 10, name: 'LOCAL COURIER' }
        ];
      } else {
        options = [
          { id: 'intl_air', title: 'Air Shipping', desc: 'International Postal Service (7-14 days)', price: 20, name: 'INTERNATIONAL AIR SHIPPING' }
        ];
      }

      options.forEach((opt, idx) => {
        const item = document.createElement('div');
        // Default active first option
        const isFirst = idx === 0;
        if (isFirst) {
          shippingCost = opt.price;
          shippingMethodName = opt.name;
        }

        item.className = `shipping-method-item${isFirst ? ' active' : ''}`;
        item.dataset.id = opt.id;
        item.dataset.price = opt.price;
        item.dataset.name = opt.name;

        item.innerHTML = `
          <div class="custom-radio"></div>
          <div class="shipping-info-wrapper">
            <div class="shipping-text-block">
              <span class="shipping-title">${opt.title}</span>
              <span class="shipping-desc">${opt.desc}</span>
            </div>
            <span class="shipping-price">$${opt.price}</span>
          </div>
        `;

        item.addEventListener('click', () => {
          methodsList.querySelectorAll('.shipping-method-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          shippingCost = parseFloat(opt.price);
          shippingMethodName = opt.name;
          renderCheckoutSummary();
        });

        methodsList.appendChild(item);
      });

      renderCheckoutSummary();
    };

    // Form submit triggers
    const submitBtnDesktop = document.getElementById('desktop-submit-btn');
    const submitBtnMobile = document.getElementById('mobile-submit-btn');

    const handleFormSubmit = async () => {
      if (!checkoutForm.reportValidity()) return;

      if (!selectedCity) {
        alert('Please select a valid city from the autocomplete suggestions list / Пожалуйста, выберите город из списка.');
        return;
      }

      const name = document.getElementById('check-name').value.trim();
      const phone = document.getElementById('check-phone').value.trim();
      const email = document.getElementById('check-email').value.trim();
      const streetAddress = document.getElementById('check-address').value.trim();
      const finalAmount = subtotal - discount + shippingCost;

      const formattedAddress = `${selectedCity.fullName}, [METHOD: ${shippingMethodName}], Street: ${streetAddress}`;

      // Show loading state
      const btns = [submitBtnDesktop, submitBtnMobile];
      btns.forEach(btn => {
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'CREATING INVOICE...';
        }
      });

      try {
        const response = await fetch('https://astonishing-bunny-4408f5.netlify.app/api/create-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: cart,
            totalUSD: finalAmount,
            name,
            phone,
            social: '', // Telegram username
            email,
            address: formattedAddress,
            promoCode: promoCode
          })
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.details || result.error || 'Failed to generate payment.');
        }

        // Clear cart
        cart = [];
        saveCart();
        localStorage.removeItem('applied_promo_code');
        localStorage.removeItem('promo_discount_rate');

        if (result.paymentUrl) {
          window.location.href = result.paymentUrl;
        } else {
          throw new Error('Payment URL not received.');
        }
      } catch (err) {
        alert(`Checkout Error: ${err.message}`);
        btns.forEach(btn => {
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'CONFIRM ORDER / ПОДТВЕРДИТЬ ЗАКАЗ';
          }
        });
      }
    };

    if (submitBtnDesktop) {
      submitBtnDesktop.addEventListener('click', (e) => {
        e.preventDefault();
        handleFormSubmit();
      });
    }

    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmit();
    });

    renderCheckoutSummary();
  }

  // Setup Drawer close and overlay triggers
  const drawerCloseBtn = document.getElementById('cart-drawer-close');
  const drawerOverlay = document.getElementById('cart-drawer-overlay');

  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', closeCartDrawer);
  }
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeCartDrawer);
  }

  // Open Cart via Navbar badge
  if (cartBtn) {
    cartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'cart.html';
    });
  }

  // Initialize Page display
  updateCartBadge();
  setupProductSlider();
  setupAccordions();
  updateStepperButton();
  setupCartPage();
  setupCheckoutPage();

  // ==========================================================================
  // Subtle Glitch Pixel Cursor Trail System
  // ==========================================================================
  const canvas = document.getElementById('cursor-trail');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let pixels = [];
    let mouse = { x: 0, y: 0, active: false };

    // Resize canvas to fill viewport
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Mouse tracker
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;

      // Spawn glitched pixels rarely (slow and subtle)
      if (Math.random() < 0.22) {
        const count = Math.random() < 0.5 ? 1 : 2;
        for (let i = 0; i < count; i++) {
          const colors = [
            'rgba(0, 255, 255, 0.4)', // Cyan
            'rgba(255, 0, 128, 0.4)', // Magenta
            'rgba(255, 255, 255, 0.4)', // White
            'rgba(255, 255, 0, 0.3)'  // Yellow
          ];
          pixels.push({
            x: mouse.x + (Math.random() - 0.5) * 16,
            y: mouse.y + (Math.random() - 0.5) * 16,
            size: Math.random() * 2.5 + 1.2,
            color: colors[Math.floor(Math.random() * colors.length)],
            opacity: 0.35 + Math.random() * 0.35,
            fadeSpeed: 0.008 + Math.random() * 0.012,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3
          });
        }
      }
    });

    window.addEventListener('mouseout', () => {
      mouse.active = false;
    });

    // Touch tracker for mobile compatibility
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;

        if (Math.random() < 0.25) {
          pixels.push({
            x: mouse.x + (Math.random() - 0.5) * 12,
            y: mouse.y + (Math.random() - 0.5) * 12,
            size: Math.random() * 2.5 + 1.0,
            color: 'rgba(255, 255, 255, 0.35)',
            opacity: 0.4,
            fadeSpeed: 0.012,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25
          });
        }
      }
    }, { passive: true });

    // Render loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and filter active pixels
      pixels = pixels.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= p.fadeSpeed;
        
        // Occasional sub-pixel jitter
        if (Math.random() < 0.1) {
          p.x += (Math.random() - 0.5) * 2;
          p.y += (Math.random() - 0.5) * 2;
        }

        return p.opacity > 0;
      });

      // Draw pixel blocks
      pixels.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        
        // Draw square pixel block
        ctx.fillRect(p.x, p.y, p.size, p.size);
        
        // Draw occasional chromatic shadow block
        if (Math.random() < 0.05) {
          ctx.fillStyle = 'rgba(255, 0, 128, 0.25)';
          ctx.fillRect(p.x - 2, p.y + 1, p.size, p.size);
        }
        ctx.restore();
      });

      // 2. Draw rare tech target corners near mouse
      if (mouse.active && Math.random() < 0.15) {
        ctx.save();
        ctx.globalAlpha = 0.15 + Math.random() * 0.18;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 0.8;
        
        const size = 3;
        const offset = 8;

        // Top Left corner
        ctx.beginPath();
        ctx.moveTo(mouse.x - offset, mouse.y - offset + size);
        ctx.lineTo(mouse.x - offset, mouse.y - offset);
        ctx.lineTo(mouse.x - offset + size, mouse.y - offset);
        ctx.stroke();

        // Bottom Right corner
        ctx.beginPath();
        ctx.moveTo(mouse.x + offset, mouse.y + offset - size);
        ctx.lineTo(mouse.x + offset, mouse.y + offset);
        ctx.lineTo(mouse.x + offset - size, mouse.y + offset);
        ctx.stroke();
        
        ctx.restore();
      }

      requestAnimationFrame(animate);
    };
    animate();
  }

  // ==========================================================================
  // Chaotic Background Video Switcher System (Analog TV Glitch)
  // ==========================================================================
  const bgVideos = [
    document.getElementById('bg-video-1'),
    document.getElementById('bg-video-2'),
    document.getElementById('bg-video-3'),
    document.getElementById('bg-video-4')
  ].filter(Boolean);

  const glitchCanvas = document.getElementById('tv-glitch-canvas');

  if (bgVideos.length > 0 && glitchCanvas) {
    const gCtx = glitchCanvas.getContext('2d');
    let activeIdx = 0;
    let glitchInterval = null;

    // Autoplay ONLY the active background video to save mobile decoder resources
    bgVideos.forEach((v, index) => {
      if (index === activeIdx) {
        v.play().catch(err => {
          console.warn("Autoplay blocked or delayed for active video", err);
        });
      } else {
        v.pause();
      }
    });

    const resizeGlitchCanvas = () => {
      glitchCanvas.width = window.innerWidth / 2; // low-res for blocky analog noise
      glitchCanvas.height = window.innerHeight / 2;
    };
    window.addEventListener('resize', resizeGlitchCanvas);
    resizeGlitchCanvas();

    // Render loop for noise and scanlines during transition
    const drawGlitchFrame = () => {
      const w = glitchCanvas.width;
      const h = glitchCanvas.height;
      gCtx.clearRect(0, 0, w, h);

      // 1. Draw raw TV static noise (analog grain)
      const imgData = gCtx.createImageData(w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const val = Math.random() < 0.5 ? 0 : 255;
        data[i] = val;     // R
        data[i+1] = val;   // G
        data[i+2] = val;   // B
        data[i+3] = 45;    // alpha of noise
      }
      gCtx.putImageData(imgData, 0, 0);

      // 2. Draw random thick horizontal noise strips
      const bandCount = Math.floor(Math.random() * 3) + 1;
      gCtx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      for (let b = 0; b < bandCount; b++) {
        const y = Math.random() * h;
        const bh = Math.random() * 15 + 4;
        gCtx.fillRect(0, y, w, bh);
      }

      // 3. Draw colored glitch horizontal lines (RGB shift look)
      const lineCount = Math.floor(Math.random() * 5) + 2;
      for (let l = 0; l < lineCount; l++) {
        const ly = Math.random() * h;
        const lh = Math.random() * 2 + 1;
        const colors = ['rgba(0, 255, 255, 0.35)', 'rgba(255, 0, 128, 0.35)', 'rgba(255, 255, 255, 0.45)'];
        gCtx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        gCtx.fillRect(0, ly, w, lh);
      }
    };

    const triggerSwitch = (nextIdx) => {
      // Start glitch noise animation
      glitchCanvas.style.opacity = '0.85';
      if (glitchInterval) clearInterval(glitchInterval);
      glitchInterval = setInterval(drawGlitchFrame, 30);

      // Halfway through (200ms), swap videos
      setTimeout(() => {
        const prevVideo = bgVideos[activeIdx];
        const nextVideo = bgVideos[nextIdx];

        prevVideo.classList.remove('active');
        prevVideo.pause(); // Pause previous video to save hardware decoder slots

        nextVideo.classList.add('active');

        // Jump to random spot in new video
        // Jump to random spot in new video (with fallback if duration is not loaded yet)
        const duration = nextVideo.duration || 30;
        nextVideo.currentTime = Math.random() * duration;

        nextVideo.play().catch(err => {
          console.warn("Playback failed for new video", err);
        });

        activeIdx = nextIdx;
      }, 180);

      // Fade out noise canvas
      setTimeout(() => {
        let opacity = 0.85;
        const fadeInterval = setInterval(() => {
          opacity -= 0.15;
          if (opacity <= 0) {
            opacity = 0;
            clearInterval(fadeInterval);
            clearInterval(glitchInterval);
            glitchInterval = null;
            gCtx.clearRect(0, 0, glitchCanvas.width, glitchCanvas.height);
          }
          glitchCanvas.style.opacity = opacity.toString();
        }, 30);
      }, 280);

      scheduleNextSwitch();
    };

    const scheduleNextSwitch = () => {
      const delay = 3000; // Switch exactly every 3 seconds
      setTimeout(() => {
        let nextIdx;
        do {
          nextIdx = Math.floor(Math.random() * bgVideos.length);
        } while (nextIdx === activeIdx && bgVideos.length > 1);

        triggerSwitch(nextIdx);
      }, delay);
    };

    // Kick off the scheduling loop
    scheduleNextSwitch();
  }

  // --- AUTOMATED SCREENSHOT / TESTING AUTOFILLS ---
  const testParams = new URLSearchParams(window.location.search);
  if (testParams.get('test_add') === '1') {
    cart = [];
    localStorage.removeItem('applied_promo_code');
    localStorage.removeItem('promo_discount_rate');
    saveCart();
    addToCart(productId, selectedSize, false);
    updateStepperButton();
  } else if (testParams.get('test_cart') === '1') {
    cart = [{ id: 'hoodie', name: 'CM-J01-HM HOODIE', price: 240, size: 'M', qty: 1, image: 'assets/images/studio/studio_1.jpg' }];
    localStorage.setItem('applied_promo_code', 'STEALTH10');
    localStorage.setItem('promo_discount_rate', '0.1');
    saveCart();
    if (typeof renderCartPage === 'function') {
      renderCartPage();
    }
  } else if (testParams.get('test_checkout') === '1') {
    cart = [{ id: 'hoodie', name: 'CM-J01-HM HOODIE', price: 240, size: 'M', qty: 1, image: 'assets/images/studio/studio_1.jpg' }];
    localStorage.setItem('applied_promo_code', 'STEALTH10');
    localStorage.setItem('promo_discount_rate', '0.1');
    saveCart();
    
    // Autofill checkout page inputs
    setTimeout(() => {
      const nameField = document.getElementById('check-name');
      const phoneField = document.getElementById('check-phone');
      const emailField = document.getElementById('check-email');
      const addressField = document.getElementById('check-address');
      const cityField = document.getElementById('check-city');
      
      if (nameField) nameField.value = "Gleb Kuznets";
      if (phoneField) phoneField.value = "+7 (999) 123-45-67";
      if (emailField) emailField.value = "test-buyer@gmail.com";
      if (addressField) addressField.value = "Baker Street 221B, apt. 4";
      
      if (cityField) {
        cityField.value = "Москва, Россия";
        const optionsWrapper = document.getElementById('shipping-options-wrapper');
        const detailedAddressGroup = document.getElementById('detailed-address-group');
        const methodsList = document.getElementById('shipping-methods-list');
        
        if (optionsWrapper && detailedAddressGroup && methodsList) {
          optionsWrapper.style.display = 'block';
          detailedAddressGroup.style.display = 'block';
          
          // Render RU shipping methods
          methodsList.innerHTML = '';
          const ruMethods = [
            { id: 'sdek_pickup', name: 'SDEK_PICKUP', title: 'SDEK PICKUP / СДЭК ДО ПУНКТА ВЫДАЧИ', desc: 'Delivery to SDEK locker or pickup point near you // Доставка до ПВЗ СДЭК.', price: 5 },
            { id: 'sdek_courier', name: 'SDEK_COURIER', title: 'SDEK COURIER / СДЭК КУРЬЕР', desc: 'Hand-to-hand delivery to your doorstep // Доставка курьером до двери.', price: 8 }
          ];
          
          ruMethods.forEach((opt, idx) => {
            const item = document.createElement('div');
            const isFirst = idx === 0;
            item.className = `shipping-method-item${isFirst ? ' active' : ''}`;
            item.dataset.id = opt.id;
            item.dataset.price = opt.price;
            item.dataset.name = opt.name;
            
            item.innerHTML = `
              <div class="custom-radio"></div>
              <div class="shipping-info-wrapper">
                <div class="shipping-text-block">
                  <span class="shipping-title">${opt.title}</span>
                  <span class="shipping-desc">${opt.desc}</span>
                </div>
                <span class="shipping-price">$${opt.price}</span>
              </div>
            `;
            
            methodsList.appendChild(item);
          });
          
          // Trigger click event on SDEK courier option to load checkout summary total
          setTimeout(() => {
            const secondItem = methodsList.querySelectorAll('.shipping-method-item')[1]; // SDEK Courier
            if (secondItem) {
              secondItem.click();
            } else {
              const firstItem = methodsList.querySelector('.shipping-method-item');
              if (firstItem) firstItem.click();
            }
          }, 100);
        }
      }
    }, 150);
  }
};

// Start initialization based on readyState
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Video Play/Pause Control (Invoked directly from inline HTML events)
window.togglePlay = function(videoId) {
  const video = document.getElementById(videoId);
  const symbol = document.getElementById(`symbol-${videoId}`);
  
  if (!video || !symbol) return;
  
  if (video.paused) {
    // Pause other videos
    document.querySelectorAll('.gallery-video').forEach(v => {
      if (v.id !== videoId) {
        v.pause();
        const otherSymbol = document.getElementById(`symbol-${v.id}`);
        if (otherSymbol) otherSymbol.textContent = 'PLAY';
      }
    });
    
    video.play();
    symbol.textContent = 'PAUSE';
  } else {
    video.pause();
    symbol.textContent = 'PLAY';
  }
};
