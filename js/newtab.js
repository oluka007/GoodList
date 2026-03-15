// ── DEALS DATA ────────────────────────────────────────────────────────────
const DEALS = [
  { title: 'Anker 65W USB-C Charger — charge 3 devices at once', salePrice: '$25.99', originalPrice: '$45.99', discount: '43% OFF', merchant: 'Amazon', image: 'https://m.media-amazon.com/images/I/61TTj9OXEHL._AC_SL1500_.jpg', url: 'https://www.amazon.com/s?k=anker+65w+usb-c+charger' },
  { title: 'Echo Dot (5th Gen) Smart Speaker with Alexa', salePrice: '$22.99', originalPrice: '$49.99', discount: '54% OFF', merchant: 'Amazon', image: 'https://m.media-amazon.com/images/I/71xoR4A6q3L._AC_SL1000_.jpg', url: 'https://www.amazon.com/s?k=echo+dot+5th+gen' },
  { title: 'Logitech MX Master 3S Wireless Mouse', salePrice: '$79.99', originalPrice: '$99.99', discount: '20% OFF', merchant: 'Best Buy', image: 'https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-mouse-top-view-graphite.png', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=logitech+mx+master+3s' },
  { title: 'Kindle Paperwhite — 16GB, waterproof e-reader', salePrice: '$99.99', originalPrice: '$139.99', discount: '29% OFF', merchant: 'Amazon', image: 'https://m.media-amazon.com/images/I/61PJMcDdHNL._AC_SL1500_.jpg', url: 'https://www.amazon.com/s?k=kindle+paperwhite+16gb' },
  { title: 'Hanes Men\'s Ecosmart Hoodie Sweatshirt', salePrice: '$14.00', originalPrice: '$24.00', discount: '42% OFF', merchant: 'Amazon', image: 'https://m.media-amazon.com/images/I/81HWGBjNBxL._AC_UX679_.jpg', url: 'https://www.amazon.com/s?k=hanes+ecosmart+hoodie' },
  { title: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker 6Qt', salePrice: '$59.99', originalPrice: '$99.95', discount: '40% OFF', merchant: 'Amazon', image: 'https://m.media-amazon.com/images/I/71WtwEvYDOS._AC_SL1500_.jpg', url: 'https://www.amazon.com/s?k=instant+pot+duo+6qt' },
  { title: 'Samsung 970 EVO Plus 1TB NVMe SSD', salePrice: '$69.99', originalPrice: '$129.99', discount: '46% OFF', merchant: 'Newegg', image: 'https://image-us.samsung.com/SamsungUS/home/computing/memory-storage/all-ssd/05202019/970-EVO-Plus_main_black.jpg', url: 'https://www.newegg.com/p/pl?d=samsung+970+evo+plus+1tb' },
];

// ── STATE ─────────────────────────────────────────────────────────────────
let settings  = {};
let wishlist  = [];
let todos     = [];
let focusData = {};
let streakData = { count: 0, lastDate: '' };
let clockInterval = null; // Bug 2 fix: keep a single live clock interval when reinitializing

// ── INIT ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadState();
  initOnboarding();
  initClock();
  initFocus();
  initStreak();
  initSearch();
  initWishlist();
  initTodo();
  initSettings();
  initDealOfTheDay();
  loadBackground();
  loadWeather();
  loadImpactMeter();
});

// ── STATE MANAGEMENT ──────────────────────────────────────────────────────
async function loadState() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['settings', 'todos', 'focusData', 'streakData'], (syncData) => {
      chrome.storage.local.get(['wishlist'], (localData) => {
        settings   = syncData.settings
          ? { timeFormat: '12hr', location: '', ...syncData.settings }
          : { charity: "St. Jude Children's Hospital", search: CONFIG.SEARCH_URL, location: '', timeFormat: '12hr' };
        todos      = syncData.todos      || [];
        focusData  = syncData.focusData  || { text: '', date: '', done: false };
        streakData = syncData.streakData || { count: 0, lastDate: '' };
        wishlist   = localData.wishlist  || [];
        resolve();
      });
    });
  });
}

function saveSettings()  { chrome.storage.sync.set({ settings }); }
function saveTodos()     { chrome.storage.sync.set({ todos }); }
function saveFocus()     { chrome.storage.sync.set({ focusData }); }
function saveWishlist()  { chrome.storage.local.set({ wishlist }); }
function saveStreak()    { chrome.storage.sync.set({ streakData }); }

// ── ONBOARDING ────────────────────────────────────────────────────────────
function initOnboarding() {
  if (settings.onboardingDone) return;

  const overlay     = document.getElementById('onboarding-overlay');
  const step1       = document.getElementById('step-1');
  const step2       = document.getElementById('step-2');
  const step3       = document.getElementById('step-3');
  const step4       = document.getElementById('step-4');
  const charityBtns = document.querySelectorAll('.charity-btn');
  const formatBtns  = document.querySelectorAll('.format-btn');

  overlay.classList.remove('hidden');
  let selectedCharity = null;
  let selectedFormat  = '12hr';

  charityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      charityBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedCharity = btn.dataset.charity;
      setTimeout(() => {
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
      }, 400);
    });
  });

  document.getElementById('skip-step-2').addEventListener('click', () => {
    step2.classList.add('hidden');
    step3.classList.remove('hidden');
    tryGeoDetect();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.wishlistPending && !step2.classList.contains('hidden')) {
      step2.classList.add('hidden');
      step3.classList.remove('hidden');
      tryGeoDetect();
    }
  });

  formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      formatBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedFormat = btn.dataset.format;
      settings.timeFormat = selectedFormat;
      initClock();
    });
  });

  document.getElementById('detect-location-btn').addEventListener('click', () => tryGeoDetect(true));

  document.getElementById('next-to-step-4').addEventListener('click', () => {
    const locVal = document.getElementById('onboarding-location-input').value.trim();
    if (locVal) settings.location = locVal;
    settings.timeFormat = selectedFormat;
    step3.classList.add('hidden');
    step4.classList.remove('hidden');
    document.getElementById('onboarding-focus-input').focus();
  });

  document.getElementById('finish-onboarding').addEventListener('click', () => {
    const focusInput = document.getElementById('onboarding-focus-input').value.trim();
    if (selectedCharity) settings.charity = selectedCharity;
    settings.timeFormat     = selectedFormat;
    settings.onboardingDone = true;
    if (!settings.location) settings.location = CONFIG.DEFAULT_LOCATION;
    saveSettings();
    if (focusInput) {
      focusData = { text: focusInput, date: todayKey(), done: false };
      saveFocus();
      updateStreak(); // starting a focus on day 1 counts as day 1
    }
    overlay.classList.add('hidden');
    renderFocus();
    renderStreak();
    updateFooterCharity();
    loadWeather();
  });

  document.getElementById('onboarding-focus-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('finish-onboarding').click();
  });
}

// ── GEO DETECTION ─────────────────────────────────────────────────────────
function tryGeoDetect(userInitiated = false) {
  const statusEl = document.getElementById('location-status');
  const inputEl  = document.getElementById('onboarding-location-input');
  if (!statusEl || !inputEl) return;

  if (!navigator.geolocation) {
    if (userInitiated) statusEl.textContent = 'Geolocation not supported — please type your city.';
    return;
  }

  statusEl.textContent = '📍 Detecting your location...';
  statusEl.className   = 'location-status detecting';

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await res.json();
        const city    = data.address?.city || data.address?.town || data.address?.village || '';
        const country = data.address?.country_code?.toUpperCase() || '';
        if (city) {
          const locationStr    = country ? `${city},${country}` : city;
          inputEl.value        = locationStr;
          settings.location    = locationStr;
          statusEl.textContent = `✓ Found: ${city}, ${country}`;
          statusEl.className   = 'location-status success';
        } else {
          statusEl.textContent = 'Could not determine city — please type it manually.';
          statusEl.className   = 'location-status error';
        }
      } catch (e) {
        statusEl.textContent = 'Detection failed — please type your city.';
        statusEl.className   = 'location-status error';
      }
    },
    (err) => {
      statusEl.textContent = err.code === 1
        ? 'Location access denied — please type your city.'
        : 'Could not detect location — please type your city.';
      statusEl.className = 'location-status error';
    },
    { timeout: 8000 }
  );
}

// ── CLOCK ─────────────────────────────────────────────────────────────────
function initClock() {
  const tick = () => {
    const now     = new Date();
    const is12hr  = (settings.timeFormat || '12hr') === '12hr';
    const timeStr = is12hr
      ? now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      : now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    document.getElementById('time').textContent = timeStr;
    document.getElementById('date-display').textContent =
      now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };
  tick();
  if (clockInterval) clearInterval(clockInterval); // Bug 2 fix: clear prior interval before starting a new one
  clockInterval = setInterval(tick, 1000);
}

// ── STREAK ────────────────────────────────────────────────────────────────
function initStreak() {
  // If today already has a focus set, make sure streak is up to date
  if (focusData.text && focusData.date === todayKey()) {
    updateStreak();
  } else {
    // Check if streak should be broken (missed yesterday)
    const yesterday = getPreviousDay(todayKey());
    if (streakData.lastDate && streakData.lastDate !== todayKey() && streakData.lastDate !== yesterday) {
      // Missed at least one day — reset streak
      streakData.count    = 0;
      streakData.lastDate = '';
      saveStreak();
    }
  }
  renderStreak();
}

function updateStreak() {
  const today     = todayKey();
  const yesterday = getPreviousDay(today);

  if (streakData.lastDate === today) return; // already counted today

  if (streakData.lastDate === yesterday) {
    // Consecutive day — increment
    streakData.count++;
  } else if (streakData.lastDate === '') {
    // First ever focus
    streakData.count = 1;
  } else {
    // Missed days — restart from 1
    streakData.count = 1;
  }

  streakData.lastDate = today;
  saveStreak();
  renderStreak();
}

function renderStreak() {
  const el = document.getElementById('streak-badge');
  if (!el) return;

  if (streakData.count <= 0) {
    el.classList.add('hidden');
    return;
  }

  el.classList.remove('hidden');

  const flame = streakData.count >= 7  ? '🔥' :
                streakData.count >= 3  ? '✨' : '⚡';

  const label = streakData.count === 1 ? '1 day streak — keep it going!'       :
                streakData.count < 7   ? `${streakData.count} day streak!`      :
                streakData.count < 30  ? `${streakData.count} day streak! 🎉`   :
                                         `${streakData.count} days! Unstoppable!`;

  el.querySelector('#streak-icon').textContent  = flame;
  el.querySelector('#streak-count').textContent = label;
}

function getPreviousDay(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// ── FOCUS ─────────────────────────────────────────────────────────────────
function initFocus() {
  if (focusData.date && focusData.date !== todayKey()) {
    focusData = { text: '', date: '', done: false };
    saveFocus();
  }
  renderFocus();

  document.getElementById('focus-set-btn').addEventListener('click', setFocus);
  document.getElementById('focus-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') setFocus();
  });
  document.getElementById('focus-done-btn').addEventListener('click', () => {
    focusData.done = true;
    saveFocus();
    renderFocus();
  });
  document.getElementById('focus-edit-btn').addEventListener('click', () => {
    document.getElementById('focus-display').classList.add('hidden');
    document.getElementById('focus-input-container').classList.remove('hidden');
    document.getElementById('focus-input').value = focusData.text;
    document.getElementById('focus-input').focus();
  });
}

function setFocus() {
  const val = document.getElementById('focus-input').value.trim();
  if (!val) return;
  focusData = { text: val, date: todayKey(), done: false };
  saveFocus();
  updateStreak(); // setting a focus counts toward the streak
  renderFocus();
}

function renderFocus() {
  const display   = document.getElementById('focus-display');
  const inputCont = document.getElementById('focus-input-container');
  const focusText = document.getElementById('focus-text');

  if (focusData.text) {
    display.classList.remove('hidden');
    inputCont.classList.add('hidden');
    focusText.textContent          = focusData.text;
    focusText.style.textDecoration = focusData.done ? 'line-through' : '';
    focusText.style.opacity        = focusData.done ? '0.5' : '';
  } else {
    display.classList.add('hidden');
    inputCont.classList.remove('hidden');
  }
}

// ── SEARCH ────────────────────────────────────────────────────────────────
function initSearch() {
  const input = document.getElementById('search-input');

  // Press any letter/number on the page → jump to search bar instantly
  document.addEventListener('keydown', (e) => {
    const tag        = document.activeElement.tagName.toLowerCase();
    const isTyping   = tag === 'input' || tag === 'textarea' || document.activeElement.isContentEditable;
    const isModifier = e.ctrlKey || e.metaKey || e.altKey;
    const isChar     = e.key.length === 1;
    if (isChar && !isTyping && !isModifier) input.focus();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      window.location.href = (settings.search || CONFIG.SEARCH_URL) + encodeURIComponent(input.value.trim());
    }
    if (e.key === 'Escape') { input.value = ''; input.blur(); }
  });
}

// ── DEAL OF THE DAY ───────────────────────────────────────────────────────
function initDealOfTheDay() {
  const section = document.getElementById('deal-panel');

  chrome.storage.local.get(['dealDismissed'], (data) => {
    if (data.dealDismissed === todayKey()) return;

    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const deal      = DEALS[dayOfYear % DEALS.length];

    document.getElementById('deal-panel-title').textContent    = deal.title;
    document.getElementById('deal-panel-sale').textContent     = deal.salePrice;
    document.getElementById('deal-panel-original').textContent = deal.originalPrice;
    document.getElementById('deal-panel-discount').textContent = deal.discount;
    document.getElementById('deal-panel-merchant').textContent = `via ${deal.merchant}`;
    document.getElementById('deal-image').src                  = deal.image;
    document.getElementById('deal-image').alt                  = deal.title;
    document.getElementById('deal-panel-btn').href             = deal.url;

    section.classList.remove('hidden');

    document.getElementById('deal-dismiss').addEventListener('click', () => {
      section.classList.add('hidden');
      chrome.storage.local.set({ dealDismissed: todayKey() });
    });
  });
}

// ── WISHLIST ──────────────────────────────────────────────────────────────
function initWishlist() {
  renderWishlist();

  document.getElementById('sort-btn').addEventListener('click', () => {
    wishlist.sort((a, b) => (b.priceDrop || 0) - (a.priceDrop || 0));
    saveWishlist();
    renderWishlist();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.wishlist) {
      wishlist = changes.wishlist.newValue || [];
      renderWishlist();
    }
  });
}

function renderWishlist() {
  const grid  = document.getElementById('wishlist-grid');
  const empty = document.getElementById('wishlist-empty');
  const count = document.getElementById('wishlist-count');

  count.textContent = wishlist.length;
  grid.querySelectorAll('.wishlist-card').forEach(c => c.remove());

  if (wishlist.length === 0) {
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  wishlist.forEach((item, idx) => {
    const hasDrop = item.priceDrop && item.priceDrop > 0;
    const card    = document.createElement('div');
    card.className = 'wishlist-card';

    card.innerHTML = `
      ${hasDrop ? `<div class="price-drop-badge">↓${item.priceDrop}%</div>` : ''}
      <button class="card-remove" data-idx="${idx}" title="Remove">✕</button>
      <img src="${item.image || ''}" alt="${item.title || 'Product'}" onerror="this.style.display='none'" />
      <div class="card-info">
        <div class="card-title">${item.title || 'Unknown product'}</div>
        <div class="card-price ${hasDrop ? 'dropped' : ''}">${item.price || '—'}</div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('card-remove')) return;
      if (item.affiliateUrl || item.url) {
        window.open(item.affiliateUrl || item.url, '_blank');
        // Bug 5 fix: count wishlist affiliate clicks as the donation-triggering event
        incrementDonationCounter(0.10);
      }
    });

    card.querySelector('.card-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      wishlist.splice(idx, 1);
      saveWishlist();
      renderWishlist();
    });

    grid.appendChild(card);
  });
}

// ── TODO ─────────────────────────────────────────────────────────────────
function initTodo() {
  const today = todayKey();
  todos = todos.map(t => ({ ...t, rolledOver: t.date !== today && !t.done ? true : t.rolledOver }));
  saveTodos();
  renderTodos();

  document.getElementById('todo-add-btn').addEventListener('click', addTodo);
  document.getElementById('todo-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTodo();
  });
  document.getElementById('todo-clear-btn').addEventListener('click', () => {
    todos = todos.filter(t => !t.done);
    saveTodos();
    renderTodos();
  });
}

function addTodo() {
  const input = document.getElementById('todo-input');
  const val   = input.value.trim();
  if (!val) return;
  todos.push({ id: Date.now(), text: val, done: false, date: todayKey() });
  input.value = '';
  saveTodos();
  renderTodos();
}

function renderTodos() {
  const list  = document.getElementById('todo-list');
  const count = document.getElementById('todo-count');
  count.textContent = todos.filter(t => !t.done).length;
  list.innerHTML = '';

  todos.forEach((todo, idx) => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.done ? 'done' : ''}`;
    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" ${todo.done ? 'checked' : ''} />
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <button class="todo-delete" title="Delete">✕</button>
    `;
    li.querySelector('.todo-checkbox').addEventListener('change', (e) => {
      todos[idx].done = e.target.checked;
      saveTodos();
      renderTodos();
    });
    li.querySelector('.todo-delete').addEventListener('click', () => {
      todos.splice(idx, 1);
      saveTodos();
      renderTodos();
    });
    list.appendChild(li);
  });
}

// ── SETTINGS ─────────────────────────────────────────────────────────────
function initSettings() {
  const btn   = document.getElementById('settings-btn');
  const panel = document.getElementById('settings-panel');
  const close = document.getElementById('settings-close');

  btn.addEventListener('click', () => {
    panel.classList.toggle('hidden');
    document.getElementById('settings-charity').value  = settings.charity  || '';
    document.getElementById('settings-search').value   = settings.search   || CONFIG.SEARCH_URL;
    document.getElementById('settings-location').value = settings.location || '';
    updateSettingsFormatBtns(settings.timeFormat || '12hr');
  });

  close.addEventListener('click', () => panel.classList.add('hidden'));

  document.querySelectorAll('.settings-format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.settings-format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      settings.timeFormat = btn.dataset.format;
      initClock();
    });
  });

  document.getElementById('settings-save').addEventListener('click', () => {
    settings.charity  = document.getElementById('settings-charity').value;
    settings.search   = document.getElementById('settings-search').value;
    settings.location = document.getElementById('settings-location').value;
    saveSettings();
    updateFooterCharity();
    loadWeather();
    panel.classList.add('hidden');
  });

  document.getElementById('settings-reset').addEventListener('click', () => {
    if (confirm('Reset all GoodList data? This cannot be undone.')) {
      chrome.storage.sync.clear();
      chrome.storage.local.clear();
      window.location.reload();
    }
  });

  updateFooterCharity();
}

function updateSettingsFormatBtns(format) {
  document.querySelectorAll('.settings-format-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.format === format);
  });
}

function updateFooterCharity() {
  const el = document.getElementById('footer-charity');
  const ic = document.getElementById('impact-charity');
  if (el) el.textContent = `Supporting: ${settings.charity || 'your charity'}`;
  if (ic) ic.textContent = settings.charity || 'your charity';
}

// ── BACKGROUND IMAGE ──────────────────────────────────────────────────────
async function loadBackground() {
  if (CONFIG.UNSPLASH_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') return;
  const today = todayKey();
  chrome.storage.local.get(['bgCache'], async (data) => {
    const cache = data.bgCache;
    if (cache && cache.date === today && cache.url) {
      document.getElementById('bg').style.backgroundImage = `url(${cache.url})`;
      return;
    }
    try {
      const res     = await fetch(`https://api.unsplash.com/photos/random?orientation=landscape&query=nature,landscape&client_id=${CONFIG.UNSPLASH_KEY}`);
      const imgData = await res.json();
      if (imgData.urls?.regular) {
        const url = imgData.urls.regular;
        document.getElementById('bg').style.backgroundImage = `url(${url})`;
        chrome.storage.local.set({ bgCache: { date: today, url } });
      }
    } catch (e) {}
  });
}

// ── WEATHER ───────────────────────────────────────────────────────────────
async function loadWeather() {
  const loc = settings.location || CONFIG.DEFAULT_LOCATION;
  if (CONFIG.WEATHER_KEY === 'YOUR_OPENWEATHERMAP_KEY') return;
  try {
    const res  = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(loc)}&appid=${CONFIG.WEATHER_KEY}&units=imperial`);
    const data = await res.json();
    if (data.main) {
      document.getElementById('weather-temp').textContent = `${Math.round(data.main.temp)}°F`;
      document.getElementById('weather-desc').textContent = data.weather[0].description;
      document.getElementById('weather-icon').textContent = getWeatherEmoji(data.weather[0].id);
    }
  } catch (e) {
    document.getElementById('weather-desc').textContent = 'Weather unavailable';
  }
}

function getWeatherEmoji(id) {
  if (id >= 200 && id < 300) return '⛈️';
  if (id >= 300 && id < 500) return '🌦️';
  if (id >= 500 && id < 600) return '🌧️';
  if (id >= 600 && id < 700) return '❄️';
  if (id >= 700 && id < 800) return '🌫️';
  if (id === 800)             return '☀️';
  if (id > 800)               return '⛅';
  return '🌡️';
}

// ── IMPACT METER (Live Supabase) ──────────────────────────────────────────
async function loadImpactMeter() {
  const el = document.getElementById('impact-amount');
  if (!el) return;
  if (CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL') { el.textContent = '$0.00'; return; }
  try {
    const res = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/impact?key=eq.total_donated&select=value`,
      { headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}` } }
    );
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    const data = await res.json();
    if (data && data.length > 0) {
      animateCounter(el, 0, parseFloat(data[0].value) || 0, 1200);
    } else {
      el.textContent = '$0.00';
    }
  } catch (e) {
    console.warn('[GoodList] Impact meter fetch failed:', e.message);
    el.textContent = '$0.00';
  }
}

// ── INCREMENT DONATION COUNTER ────────────────────────────────────────────
async function incrementDonationCounter(amount = 0) {
  if (CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL' || amount <= 0) return;
  try {
    const res     = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/impact?key=eq.total_donated&select=value`, { headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}` } });
    const data    = await res.json();
    const current = parseFloat(data?.[0]?.value) || 0;
    const newTotal = parseFloat((current + (amount * 0.5)).toFixed(2));
    await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/impact?key=eq.total_donated`, {
      method: 'PATCH',
      headers: { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ value: newTotal }),
    });
  } catch (e) {
    console.warn('[GoodList] Counter increment failed:', e.message);
  }
}

// ── COUNTER ANIMATION ─────────────────────────────────────────────────────
function animateCounter(el, from, to, duration) {
  const start = Date.now();
  const tick  = () => {
    const elapsed  = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = '$' + (from + (to - from) * eased).toFixed(2);
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── HELPERS ───────────────────────────────────────────────────────────────
function todayKey() {
  // Bug 3 fix: derive the date from local time instead of UTC to avoid early rollover
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
