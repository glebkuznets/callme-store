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
              <input type="text" class="input-field" placeholder="SHIPPING ADDRESS / АДРЕС" required id="cart-cust-address">
            </div>
            <button type="submit" class="buy-button" style="margin-top: 10px;">ORDER NOW via TELEGRAM</button>
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

    // Update Primary Photo Column
    const mediaColumn = document.getElementById('product-media-column');
    if (mediaColumn) {
      mediaColumn.innerHTML = '';
      data.images.forEach(imgSrc => {
        const container = document.createElement('div');
        container.className = 'primary-photo-container';
        
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = data.name;
        img.className = 'primary-photo';
        img.loading = 'lazy';
        
        container.appendChild(img);
        mediaColumn.appendChild(container);
      });
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
        window.location.href = 'catalog.html';
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

  const setupCartCheckout = () => {
    const form = document.getElementById('cart-checkout-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
      }

      const name = document.getElementById('cart-cust-name').value.trim();
      const phone = document.getElementById('cart-cust-phone').value.trim();
      const social = document.getElementById('cart-cust-social').value.trim();
      const address = document.getElementById('cart-cust-address').value.trim();

      // Build order items list
      let itemsText = '';
      let total = 0;
      cart.forEach((item, idx) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        itemsText += `${idx + 1}. ${item.name} // SIZE: ${item.size} // QTY: ${item.qty} // $${itemTotal}\n`;
      });

      const orderText = `ORDER // CALL ME STORE\n\n` +
                        `ITEMS:\n${itemsText}\n` +
                        `TOTAL: $${total}\n\n` +
                        `▫️ BUYER: ${name}\n` +
                        `▫️ PHONE: ${phone}\n` +
                        `▫️ SOCIAL/TG: ${social}\n` +
                        `▫️ ADDRESS: ${address}`;

      const tgUsername = 'glebkuznets';
      const tgUrl = `https://t.me/${tgUsername}?text=${encodeURIComponent(orderText)}`;

      // Clear cart on checkout
      cart = [];
      saveCart();
      closeCartDrawer();

      // Redirect to Telegram
      window.open(tgUrl, '_blank');
    });
  };

  const addToCart = (prodId, size) => {
    const data = window.PRODUCTS_DATA && window.PRODUCTS_DATA[prodId];
    if (!data) return;

    // Use the first image in the product images stack
    const imageSrc = data.images && data.images[0] ? data.images[0] : '';
    const priceVal = 200; // fixed $200 price

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
    openCartDrawer();
  };

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
      openCartDrawer();
    });
  }

  // Add to Cart Button (on page)
  const addCartBtn = document.getElementById('add-to-cart-btn');
  if (addCartBtn) {
    addCartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      addToCart(productId, selectedSize);
    });
  }

  // Checkout Form Submission (BUY NOW)
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('cust-name').value.trim();
      const phone = document.getElementById('cust-phone').value.trim();
      const social = document.getElementById('cust-social').value.trim();
      const address = document.getElementById('cust-address').value.trim();

      // Prefill drawer form
      const cartName = document.getElementById('cart-cust-name');
      const cartPhone = document.getElementById('cart-cust-phone');
      const cartSocial = document.getElementById('cart-cust-social');
      const cartAddress = document.getElementById('cart-cust-address');

      if (cartName) cartName.value = name;
      if (cartPhone) cartPhone.value = phone;
      if (cartSocial) cartSocial.value = social;
      if (cartAddress) cartAddress.value = address;

      // Add current product to cart and open drawer
      addToCart(productId, selectedSize);
    });
  }

  // Initialize Cart display on page load
  updateCartBadge();
  renderCartItems();
  setupCartCheckout();

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
