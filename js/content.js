// ── GOODLIST content.js ─── Floating "Add to GoodList" Button ─────────────
// Injected into all pages. Detects product pages on major retailers and
// injects a floating button so users can save items without right-clicking.

// ── SUPPORTED RETAILERS ───────────────────────────────────────────────────
// Each entry defines how to detect a product page and where to find the price.
const RETAILERS = {
  // ── GENERAL RETAIL ────────────────────────────────────────────────
  'amazon.com': {
    isProductPage: () => !!document.getElementById('productTitle') || !!document.getElementById('title'),
    priceSelector: '.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice, #corePrice_feature_div .a-price .a-offscreen',
  },
  'ebay.com': {
    isProductPage: () => !!document.querySelector('[itemprop="name"]') && !!document.querySelector('#prcIsum, .x-price-primary'),
    priceSelector: '#prcIsum, .x-price-primary span',
  },
  'etsy.com': {
    isProductPage: () => window.location.pathname.includes('/listing/'),
    priceSelector: '[data-selector="price-only-value"], .currency-value',
  },
  'walmart.com': {
    isProductPage: () => window.location.pathname.includes('/ip/'),
    priceSelector: '[itemprop="price"], [data-testid="price-wrap"] span',
  },
  'target.com': {
    isProductPage: () => window.location.pathname.includes('/p/'),
    priceSelector: '[data-test="product-price"]',
  },
  'bestbuy.com': {
    isProductPage: () => !!document.querySelector('.sku-title'),
    priceSelector: '.priceView-customer-price span, [data-testid="customer-price"] span',
  },
  'costco.com': {
    isProductPage: () => window.location.pathname.includes('/product.'),
    priceSelector: '.your-price .value, .costco-price',
  },
  'samsclub.com': {
    isProductPage: () => window.location.pathname.includes('/p/'),
    priceSelector: '[itemprop="price"], .sc-price',
  },

  // ── FASHION & APPAREL ─────────────────────────────────────────────
  'nike.com': {
    isProductPage: () => window.location.pathname.includes('/t/'),
    priceSelector: '[data-testid="currentPrice-container"], .product-price',
  },
  'adidas.com': {
    isProductPage: () => window.location.pathname.includes('/product/') || document.querySelector('.product-description'),
    priceSelector: '[class*="current-price"], .gl-price',
  },
  'asos.com': {
    isProductPage: () => window.location.pathname.includes('/prd/'),
    priceSelector: '[data-testid="current-price"], .current-price',
  },
  'hm.com': {
    isProductPage: () => window.location.pathname.includes('/productpage.'),
    priceSelector: '.product-item-price, [class*="price"]',
  },
  'zara.com': {
    isProductPage: () => !!document.querySelector('.product-detail-info'),
    priceSelector: '.price__amount, [class*="price-current"]',
  },
  'shein.com': {
    isProductPage: () => window.location.pathname.includes('-p-'),
    priceSelector: '.product-intro__head-price .she-input-number, [class*="product-price"]',
  },
  'nordstrom.com': {
    isProductPage: () => window.location.pathname.includes('/s/'),
    priceSelector: '[data-element-id="price-regular"], .price',
  },
  'macys.com': {
    isProductPage: () => !!document.querySelector('.product-title'),
    priceSelector: '[data-auto="sale-price"], .pricing-price__sale-price',
  },
  'gap.com': {
    isProductPage: () => window.location.pathname.includes('/browse/product.do'),
    priceSelector: '.product-price, [class*="priceSection"]',
  },
  'oldnavy.com': {
    isProductPage: () => window.location.pathname.includes('/browse/product.do'),
    priceSelector: '.product-price, [class*="priceSection"]',
  },
  'uniqlo.com': {
    isProductPage: () => window.location.pathname.includes('/products/'),
    priceSelector: '[class*="ProductPrice"], .price-box',
  },
  'forever21.com': {
    isProductPage: () => !!document.querySelector('.product-name'),
    priceSelector: '.product-price, [class*="price"]',
  },
  'urbanoutfitters.com': {
    isProductPage: () => window.location.pathname.includes('/shop/'),
    priceSelector: '[class*="ProductPrice"], [data-testid="product-price"]',
  },
  'anthropologie.com': {
    isProductPage: () => window.location.pathname.includes('/shop/'),
    priceSelector: '[class*="ProductPrice"], [data-testid="product-price"]',
  },
  'lululemon.com': {
    isProductPage: () => window.location.pathname.includes('/p/'),
    priceSelector: '[data-testid="price"], .price',
  },

  // ── ELECTRONICS & TECH ────────────────────────────────────────────
  'newegg.com': {
    isProductPage: () => window.location.pathname.includes('/p/'),
    priceSelector: '.price-current strong, .price-was-data',
  },
  'bhphotovideo.com': {
    isProductPage: () => !!document.querySelector('.itemTitle_3t2T3'),
    priceSelector: '[data-selenium="pricingPrice"], .price_1DPoH',
  },
  'adorama.com': {
    isProductPage: () => !!document.querySelector('.product-name h1'),
    priceSelector: '.your-price, [itemprop="price"]',
  },
  'apple.com': {
    isProductPage: () => window.location.pathname.includes('/shop/product/') || window.location.pathname.includes('/shop/buy-'),
    priceSelector: '.rc-prices-fullPrice, [class*="price"]',
  },
  'samsung.com': {
    isProductPage: () => !!document.querySelector('.product-title-container'),
    priceSelector: '.price-container .price, [class*="PriceInfo"]',
  },
  'microsoft.com': {
    isProductPage: () => window.location.pathname.includes('/store/') && !!document.querySelector('.price'),
    priceSelector: '.price, [class*="ProductPrice"]',
  },

  // ── HOME & FURNITURE ──────────────────────────────────────────────
  'ikea.com': {
    isProductPage: () => !!document.querySelector('.pip-header-section'),
    priceSelector: '.pip-price__integer, [class*="pip-price"]',
  },
  'homedepot.com': {
    isProductPage: () => !!document.querySelector('.product-title'),
    priceSelector: '[data-testid="pip-core-price"], #ajaxPrice',
  },
  'lowes.com': {
    isProductPage: () => !!document.querySelector('[data-selector="product-display-name"]'),
    priceSelector: '[data-testid="main-price"], .main-price',
  },
  'wayfair.com': {
    isProductPage: () => !!document.querySelector('[data-hb-id="pip-buybox"]'),
    priceSelector: '[data-testid="PriceBlock"] span, .BasePriceBlock',
  },
  'overstock.com': {
    isProductPage: () => !!document.querySelector('.product-title-block'),
    priceSelector: '.monetary-price, [itemprop="price"]',
  },
  'crateandbarrel.com': {
    isProductPage: () => !!document.querySelector('.product-primary-name'),
    priceSelector: '.product-price, [class*="Price"]',
  },
  'potterybarn.com': {
    isProductPage: () => !!document.querySelector('.product-name'),
    priceSelector: '.price-state, [class*="Price"]',
  },
  'williams-sonoma.com': {
    isProductPage: () => !!document.querySelector('.product-name'),
    priceSelector: '.price-state, [class*="Price"]',
  },
  'westelm.com': {
    isProductPage: () => !!document.querySelector('.product-name'),
    priceSelector: '.price-state, [class*="Price"]',
  },

  // ── BEAUTY & HEALTH ───────────────────────────────────────────────
  'sephora.com': {
    isProductPage: () => !!document.querySelector('[data-comp="ProductTitle"]'),
    priceSelector: '[data-comp="Price"] span, .css-slm8o3',
  },
  'ulta.com': {
    isProductPage: () => window.location.pathname.includes('/p/'),
    priceSelector: '.ProductPricingWidget__price, [class*="ProductPrice"]',
  },
  'glossier.com': {
    isProductPage: () => !!document.querySelector('.product-title'),
    priceSelector: '[class*="price"], .product-price',
  },

  // ── GROCERIES ─────────────────────────────────────────────────────
  'instacart.com': {
    isProductPage: () => !!document.querySelector('[data-testid="item-page"]') || window.location.pathname.includes('/products/'),
    priceSelector: '[data-testid="item-price"], .item-price',
  },
  'kroger.com': {
    isProductPage: () => window.location.pathname.includes('/p/'),
    priceSelector: '[data-testid="price"], .kds-Price',
  },
  'wholefoodsmarket.com': {
    isProductPage: () => !!document.querySelector('.product-detail-container'),
    priceSelector: '[class*="price"], .wfm-price',
  },
  'freshdirect.com': {
    isProductPage: () => !!document.querySelector('.pdp-product-name'),
    priceSelector: '.pdp-product-price, [class*="price"]',
  },
  'shipt.com': {
    isProductPage: () => !!document.querySelector('[data-test="product-name"]'),
    priceSelector: '[data-test="product-price"], [class*="price"]',
  },

  // ── PHARMACIES ────────────────────────────────────────────────────
  'cvs.com': {
    isProductPage: () => !!document.querySelector('.pdp-product-title'),
    priceSelector: '.price--sale, [class*="productPrice"]',
  },
  'walgreens.com': {
    isProductPage: () => window.location.pathname.includes('/store/catalog/product.jsp') || !!document.querySelector('.product-title'),
    priceSelector: '.product-price, [class*="productPrice"]',
  },
  'riteaid.com': {
    isProductPage: () => !!document.querySelector('.product-name'),
    priceSelector: '.product-price, [itemprop="price"]',
  },

  // ── SPORTS & OUTDOORS ─────────────────────────────────────────────
  'dickssportinggoods.com': {
    isProductPage: () => !!document.querySelector('[class*="product-title"]'),
    priceSelector: '[class*="product-price"], [itemprop="price"]',
  },
  'rei.com': {
    isProductPage: () => window.location.pathname.includes('/product/'),
    priceSelector: '[data-ui="sale-price"], .price-value',
  },
  'underarmour.com': {
    isProductPage: () => !!document.querySelector('.product-title'),
    priceSelector: '[class*="Price"], .price',
  },

  // ── MARKETPLACE & OTHER ───────────────────────────────────────────
  'aliexpress.com': {
    isProductPage: () => window.location.pathname.includes('/item/'),
    priceSelector: '[class*="product-price-value"], .uniform-banner-box-price',
  },
  'wish.com': {
    isProductPage: () => window.location.pathname.includes('/product/'),
    priceSelector: '[class*="Price"], .price-block',
  },
  'chewy.com': {
    isProductPage: () => !!document.querySelector('[class*="product-title"]'),
    priceSelector: '[data-testid="price"], .ga-eec__price',
  },
  'petco.com': {
    isProductPage: () => !!document.querySelector('.product-name'),
    priceSelector: '[class*="product-price"], .regular-price',
  },
};

// ── INIT ──────────────────────────────────────────────────────────────────
(function init() {
  const hostname = window.location.hostname.replace('www.', '');
  const retailer = Object.keys(RETAILERS).find(r => hostname.includes(r));

  if (!retailer) return; // not a supported site — do nothing

  const config = RETAILERS[retailer];

  // Wait for page to be fully loaded before checking
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tryInjectButton(config));
  } else {
    tryInjectButton(config);
  }

  // Also watch for URL changes (SPA navigation — Amazon, eBay do this)
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      removeExistingButton();
      setTimeout(() => tryInjectButton(config), 1200); // slight delay for SPA render
    }
  }).observe(document.body, { subtree: true, childList: true });
})();

// ── INJECT BUTTON ─────────────────────────────────────────────────────────
function tryInjectButton(config) {
  if (!config.isProductPage()) return; // not a product page — skip
  if (document.getElementById('goodlist-btn')) return; // already injected

  const btn = document.createElement('div');
  btn.id = 'goodlist-btn';
  btn.innerHTML = `
    <div id="goodlist-btn-inner">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z"/>
      </svg>
      <span id="goodlist-btn-text">Add to GoodList</span>
    </div>
    <div id="goodlist-btn-confirm" style="display:none">✓ Saved!</div>
  `;

  injectStyles();
  document.body.appendChild(btn);

  btn.addEventListener('click', () => handleAddToGoodList(btn, config));
}

// ── HANDLE CLICK ──────────────────────────────────────────────────────────
async function handleAddToGoodList(btn, config) {
  // Prevent double-clicks
  if (btn.dataset.saving === 'true') return;
  btn.dataset.saving = 'true';

  // Show loading state
  const inner   = document.getElementById('goodlist-btn-inner');
  const confirm = document.getElementById('goodlist-btn-confirm');
  inner.style.opacity = '0.5';

  // Gather product data from the page
  const title    = getTitle();
  const image    = getImage();
  const price    = getPrice(config.priceSelector);
  const priceRaw = parsePrice(price);

  // Send to background.js to save
  chrome.runtime.sendMessage({
    type:     'SAVE_FROM_CONTENT',
    payload: {
      url:      window.location.href,
      title,
      image,
      price,
      priceRaw,
      domain:   window.location.hostname,
    }
  }, (response) => {
    // Show success state
    inner.style.display   = 'none';
    confirm.style.display = 'flex';
    btn.style.background  = '#1A6B3C';

    // Reset after 2.5 seconds
    setTimeout(() => {
      inner.style.display   = '';
      inner.style.opacity   = '';
      confirm.style.display = 'none';
      btn.style.background  = '';
      btn.dataset.saving    = 'false';
    }, 2500);
  });
}

// ── DATA SCRAPERS ─────────────────────────────────────────────────────────
function getTitle() {
  return (
    document.querySelector('meta[property="og:title"]')?.content ||
    document.querySelector('[itemprop="name"]')?.textContent ||
    document.querySelector('#productTitle')?.textContent ||
    document.querySelector('h1')?.textContent ||
    document.title
  )?.trim().substring(0, 120) || 'Unknown product';
}

function getImage() {
  return (
    document.querySelector('meta[property="og:image"]')?.content ||
    document.querySelector('#imgBlkFront')?.src ||
    document.querySelector('#landingImage')?.src ||
    document.querySelector('[itemprop="image"]')?.src ||
    document.querySelector('img.product-image, img.primary-image')?.src ||
    null
  );
}

function getPrice(selector) {
  const selectors = selector.split(',').map(s => s.trim());
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el) {
        const text = (el.getAttribute('content') || el.textContent || '').trim();
        if (text && text.length < 20) return text;
      }
    } catch (e) {}
  }
  // Fallback: search meta tags
  return (
    document.querySelector('meta[property="product:price:amount"]')?.content ||
    document.querySelector('meta[property="og:price:amount"]')?.content ||
    null
  );
}

function parsePrice(str) {
  if (!str) return null;
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
}

// ── CLEANUP ───────────────────────────────────────────────────────────────
function removeExistingButton() {
  const existing = document.getElementById('goodlist-btn');
  if (existing) existing.remove();
  const style = document.getElementById('goodlist-styles');
  if (style) style.remove();
}

// ── STYLES ────────────────────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById('goodlist-styles')) return;

  const style = document.createElement('style');
  style.id = 'goodlist-styles';
  style.textContent = `
    #goodlist-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      background: rgba(26, 107, 60, 0.92);
      color: #ffffff;
      border-radius: 18px;
      cursor: pointer;
      box-shadow: 0 2px 12px rgba(0,0,0,0.20);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11px;
      font-weight: 500;
      border: none;
      transition: transform 0.15s ease, opacity 0.15s ease;
      opacity: 0.75;
      user-select: none;
    }
    #goodlist-btn:hover {
      opacity: 1;
      transform: translateY(-1px);
    }
    #goodlist-btn-inner {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 6px 10px;
    }
    #goodlist-btn-confirm {
      align-items: center;
      justify-content: center;
      padding: 6px 10px;
      gap: 4px;
    }
    #goodlist-btn svg {
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(style);
}
