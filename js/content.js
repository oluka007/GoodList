// ── GOODLIST content.js ─── Floating "Add to GoodList" Button ─────────────
// Injected into all pages. Detects product pages on major retailers and
// injects a floating button so users can save items without right-clicking.

// ── SUPPORTED RETAILERS ───────────────────────────────────────────────────
// Each entry defines how to detect a product page and where to find the price.
const RETAILERS = {
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
  'nike.com': {
    isProductPage: () => window.location.pathname.includes('/t/'),
    priceSelector: '[data-testid="currentPrice-container"], .product-price',
  },
  'newegg.com': {
    isProductPage: () => window.location.pathname.includes('/p/'),
    priceSelector: '.price-current strong, .price-was-data',
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
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
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      background: #1A6B3C;
      color: #ffffff;
      border-radius: 50px;
      padding: 0;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 600;
      border: none;
      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease;
      user-select: none;
    }
    #goodlist-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(0,0,0,0.35);
      background: #2D9A5A;
    }
    #goodlist-btn:active {
      transform: translateY(0);
    }
    #goodlist-btn-inner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 18px;
      transition: opacity 0.15s ease;
    }
    #goodlist-btn-confirm {
      align-items: center;
      justify-content: center;
      padding: 12px 18px;
      gap: 6px;
    }
    #goodlist-btn svg {
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(style);
}
