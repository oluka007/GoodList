// ── GOODLIST background.js ─── Phase 3: Monetization ─────────────────────
// Chrome MV3 Service Worker
// Handles: context menu, floating button saves, scraping, Sovrn affiliate, price watch

importScripts('config.js');

// ── CONTEXT MENU SETUP ────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id:       'add-to-goodlist',
    title:    '🛒 Add to GoodList',
    contexts: ['page', 'image', 'link'],
  });
});

// ── MESSAGE HANDLER (from content.js floating button) ─────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_FROM_CONTENT') {
    const { url, title, image, price, priceRaw, domain } = message.payload;

    buildAffiliateUrl(url).then(affiliateUrl => {
      const item = {
        id:           Date.now(),
        url,
        affiliateUrl: affiliateUrl || url,
        title:        title  || 'Unknown product',
        image:        image  || null,
        price:        price  || null,
        priceRaw:     priceRaw || null,
        priceDrop:    0,
        domain:       domain || new URL(url).hostname,
        addedAt:      new Date().toISOString(),
      };

      saveItemToWishlist(item).then(() => {
        showNotification('Added to GoodList ✓', `"${truncate(title || 'Item', 40)}" saved.`);
        chrome.storage.local.set({ wishlistPending: Date.now() }); // Bug 4 fix: signal onboarding step 2 to auto-advance after the first save
        sendResponse({ success: true });
      });
    });

    return true; // keep message channel open for async response
  }
});

// ── CONTEXT MENU CLICK ────────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'add-to-goodlist') return;

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func:   scrapeProductData,
    });

    const scraped      = results?.[0]?.result || {};
    const affiliateUrl = await buildAffiliateUrl(tab.url);

    const item = {
      id:           Date.now(),
      url:          tab.url,
      affiliateUrl: affiliateUrl || tab.url,
      title:        scraped.title  || tab.title || 'Unknown product',
      image:        scraped.image  || info.srcUrl || null,
      price:        scraped.price  || null,
      priceRaw:     scraped.priceRaw || null,
      priceDrop:    0,
      domain:       new URL(tab.url).hostname,
      addedAt:      new Date().toISOString(),
    };

    await saveItemToWishlist(item);
    chrome.storage.local.set({ wishlistPending: Date.now() }); // Bug 4 fix: signal onboarding step 2 to auto-advance after a context-menu save
    showNotification('Added to GoodList ✓', `"${truncate(item.title, 40)}" saved.`);

  } catch (err) {
    console.error('[GoodList] Scrape failed:', err);
    const affiliateUrl = await buildAffiliateUrl(tab.url);
    const fallback = {
      id:           Date.now(),
      url:          tab.url,
      affiliateUrl: affiliateUrl || tab.url,
      title:        tab.title || 'Product',
      image:        null,
      price:        null,
      priceRaw:     null,
      priceDrop:    0,
      domain:       new URL(tab.url).hostname,
      addedAt:      new Date().toISOString(),
    };
    await saveItemToWishlist(fallback);
    showNotification('Added to GoodList', 'Item saved.');
  }
});

// ── SOVRN AFFILIATE LINK BUILDER ──────────────────────────────────────────
async function buildAffiliateUrl(originalUrl) {
  if (SOVRN.API_KEY === 'YOUR_SOVRN_API_KEY') return null;

  try {
    const params = new URLSearchParams({ key: SOVRN.API_KEY, url: originalUrl });
    const res    = await fetch(`${SOVRN.BASE_URL}?${params.toString()}`);
    const data   = await res.json();
    return data?.url || data?.monetizedUrl || null;
  } catch (e) {
    console.warn('[GoodList] Sovrn link build failed:', e.message);
    return null;
  }
}

// ── SCRAPER (injected into page via executeScript) ────────────────────────
function scrapeProductData() {
  function parsePrice(str) {
    if (!str) return null;
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : num;
  }

  const ogTitle = document.querySelector('meta[property="og:title"]')?.content?.trim();
  const ogImage = document.querySelector('meta[property="og:image"]')?.content?.trim();

  // Universal DOM image fallback — tries common product image selectors
  // across major retailers before falling back to meta tags.
  // This bypasses hotlink protection issues (Amazon, BestBuy, etc.)
  // where og:image CDN URLs require a site Referer header to load.
  const domImage = (
    document.querySelector('#landingImage')?.src ||
    document.querySelector('#imgBlkFront')?.src ||
    document.querySelector('#main-image')?.src ||
    document.querySelector('.a-dynamic-image')?.src ||
    document.querySelector('.primary-image')?.src ||
    document.querySelector('.shop-image__image')?.src ||
    document.querySelector('[data-testid="primary-image"] img')?.src ||
    document.querySelector('.product-image img')?.src ||
    document.querySelector('[itemprop="image"]')?.src ||
    document.querySelector('.main-image img')?.src ||
    document.querySelector('img.product-photo')?.src ||
    document.querySelector('img[class*="product"]')?.src ||
    document.querySelector('img[class*="primary"]')?.src ||
    null
  );
  const ogPrice = document.querySelector('meta[property="product:price:amount"]')?.content?.trim()
               || document.querySelector('meta[property="og:price:amount"]')?.content?.trim();

  let ldTitle = null, ldImage = null, ldPrice = null;
  try {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (const script of scripts) {
      const data    = JSON.parse(script.textContent);
      const product = Array.isArray(data)
        ? data.find(d => d['@type'] === 'Product')
        : (data['@type'] === 'Product' ? data : null);
      if (product) {
        ldTitle = product.name || null;
        ldImage = typeof product.image === 'string' ? product.image : (Array.isArray(product.image) ? product.image[0] : null);
        const offers = product.offers;
        if (offers) {
          const offer = Array.isArray(offers) ? offers[0] : offers;
          ldPrice = offer?.price?.toString() || null;
        }
        break;
      }
    }
  } catch (e) {}

  let domPrice = null;
  const priceSelectors = ['#priceblock_ourprice', '#priceblock_dealprice', '.a-price .a-offscreen', '[itemprop="price"]', '.price', '.product-price', '[class*="price"]'];
  for (const sel of priceSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = (el.getAttribute('content') || el.textContent || '').trim();
      if (text && /\$|£|€/.test(text)) { domPrice = text; break; }
    }
  }

  const title    = ldTitle  || ogTitle  || document.title || null;
  // Priority: structured data > DOM image > og meta tag
  // DOM image is preferred over og:image for stores with hotlink protection
  const image    = ldImage  || domImage || ogImage || null;
  const priceStr = ldPrice  || ogPrice  || domPrice || null;
  const priceRaw = parsePrice(priceStr);
  const price    = priceRaw ? '$' + priceRaw.toFixed(2) : (priceStr ? priceStr.substring(0, 20) : null);

  return { title, image, price, priceRaw };
}

// ── SAVE TO WISHLIST ──────────────────────────────────────────────────────
async function saveItemToWishlist(item) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['wishlist'], (data) => {
      const list         = data.wishlist || [];
      const alreadyExists = list.some(existing =>
        existing.domain === item.domain &&
        existing.title.toLowerCase() === item.title.toLowerCase()
      );
      if (!alreadyExists) {
        list.unshift(item);
        if (list.length > 50) list.splice(50);
        chrome.storage.local.set({ wishlist: list }, resolve);
      } else {
        resolve();
      }
    });
  });
}

// ── PRICE WATCH ───────────────────────────────────────────────────────────
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  let hostname;
  try { hostname = new URL(tab.url).hostname; }
  catch (e) { return; }

  chrome.storage.local.get(['wishlist'], async (data) => {
    const list             = data.wishlist || [];
    const itemsOnThisSite  = list.filter(item => item.domain === hostname && item.priceRaw);
    if (itemsOnThisSite.length === 0) return;

    try {
      const results = await chrome.scripting.executeScript({ target: { tabId }, func: scrapeProductData });
      const scraped = results?.[0]?.result || {};
      if (!scraped.priceRaw) return;

      let updated    = false;
      let totalDrops = 0;

      const newList = list.map(item => {
        if (item.domain !== hostname || !item.priceRaw || !scraped.priceRaw) return item;
        if (item.title.toLowerCase() !== (scraped.title || '').toLowerCase()) return item;
        const dropPct = ((item.priceRaw - scraped.priceRaw) / item.priceRaw) * 100;
        if (dropPct >= 1) {
          updated = true;
          totalDrops++;
          return { ...item, price: scraped.price, priceRaw: scraped.priceRaw, priceDrop: Math.round(dropPct) };
        }
        return item;
      });

      if (updated) {
        chrome.storage.local.set({ wishlist: newList });
        chrome.action.setBadgeText({ text: `${totalDrops}` });
        chrome.action.setBadgeBackgroundColor({ color: '#4ade80' });
        showNotification('📉 Price drop on your GoodList!', `${totalDrops} item(s) dropped in price. Open a new tab to see.`);
      }
    } catch (e) {}
  });
});

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────
function showNotification(title, message) {
  chrome.notifications.create({
    type:    'basic',
    iconUrl: '../icons/icon48.png',
    title,
    message,
  });
}

// ── HELPERS ───────────────────────────────────────────────────────────────
function truncate(str, n) {
  return str.length > n ? str.substring(0, n) + '…' : str;
}
