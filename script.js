/*
  script.js
  - Dark mode toggle (accessible + persists preference)
  - Mobile nav toggle
  - Menu filtering, order modal, and small front-end order flow
  - Scroll reveal for subtle animations
*/

document.addEventListener('DOMContentLoaded', () => {
    /* ---------- Dark mode toggle (preference-aware) ---------- */
    const toggle = document.getElementById('darkModeToggle');
    const storageKey = 'darkMode';
    if (toggle) {
        toggle.setAttribute('role', 'switch');
        toggle.setAttribute('aria-label', 'Toggle dark mode');

        function applyTheme(isDark, save = false) {
            document.documentElement.classList.add('theme-transition');
            window.setTimeout(() => document.documentElement.classList.remove('theme-transition'), 400);
            if (isDark) {
                document.body.classList.add('dark');
                toggle.textContent = '☀️';
                toggle.setAttribute('aria-checked', 'true');
                toggle.setAttribute('title', 'Switch to light mode');
            } else {
                document.body.classList.remove('dark');
                toggle.textContent = '🌙';
                toggle.setAttribute('aria-checked', 'false');
                toggle.setAttribute('title', 'Switch to dark mode');
            }
            if (save) localStorage.setItem(storageKey, isDark ? 'enabled' : 'disabled');
        }

        const saved = localStorage.getItem(storageKey);
        if (saved === 'enabled') applyTheme(true, false);
        else if (saved === 'disabled') applyTheme(false, false);
        else {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(prefersDark, false);
        }

        function toggleTheme() { applyTheme(!document.body.classList.contains('dark'), true); }
        toggle.addEventListener('click', toggleTheme);
        toggle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTheme(); } });
    }

    /* ---------- Mobile nav toggle ---------- */
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mainNav = document.getElementById('mainNav');
    if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', () => {
            const isOpen = mainNav.style.display === 'flex';
            mainNav.style.display = isOpen ? 'none' : 'flex';
            mobileToggle.innerHTML = isOpen ? '<i class="fas fa-bars"></i>' : '<i class="fas fa-times"></i>';
        });
    }

    /* ---------- Menu filters ---------- */
    const filterButtons = document.querySelectorAll('.menu-filters .chip');
    const cards = document.querySelectorAll('#menuCards .card');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            cards.forEach(card => {
                const type = card.dataset.type;
                card.style.display = (filter === 'all' || filter === type) ? '' : 'none';
            });
        });
    });

    /* ---------- Order modal & front-end order flow ---------- */
    const orderModal = document.getElementById('orderModal');
    const openBtns = document.querySelectorAll('[data-action="order"], #orderNowBtn, #orderNowBtn2, #bookBtn, .floating-order');
    const modalCloses = document.querySelectorAll('.modal-close');
    const orderForm = document.getElementById('orderForm');

    function openModal(prefill = ''){
        if (!orderModal) return;
        orderModal.setAttribute('aria-hidden', 'false');
        if (prefill) document.getElementById('items').value = prefill;
        document.getElementById('name').focus();
    }
    function closeModal(){ if (!orderModal) return; orderModal.setAttribute('aria-hidden','true'); }

    openBtns.forEach(b => b && b.addEventListener('click', (e) => {
        const btn = e.currentTarget;
        // If button came from a product card with data-action="order", send directly to WhatsApp
        const name = btn.dataset && btn.dataset.name;
        const price = btn.dataset && btn.dataset.price;
        const action = btn.dataset && btn.dataset.action;

        if (action === 'order' && name) {
            e.preventDefault();
            // Save demo order locally
            try {
                const orders = JSON.parse(localStorage.getItem('demoOrders') || '[]');
                orders.push({name: name, phone: '', items: `${name} — ฿${price}`, at: new Date().toISOString()});
                localStorage.setItem('demoOrders', JSON.stringify(orders));
            } catch (err) { /* ignore storage errors */ }

            // Build WhatsApp message and open wa.me so user can tap Send
            const cafePhone = '66629423598';
            const time = new Date().toLocaleString();
            const messagePlain = `Order from (website)\nItem: ${name}\nPrice: ฿${price}\nTime: ${time}\n\nPlease confirm availability.`;
            const waUrl = `https://wa.me/${cafePhone}?text=${encodeURIComponent(messagePlain)}`;
            try { window.open(waUrl, '_blank'); } catch (err) { window.location.href = waUrl; }
            return;
        }

        // Fallback: open order modal and prefill
        const prefill = name ? `${name} — ฿${price}` : '';
        openModal(prefill);
        e.preventDefault();
    }));

    modalCloses.forEach(b => b.addEventListener('click', closeModal));
    orderModal && orderModal.addEventListener('click', (e) => { if (e.target === orderModal) closeModal(); });

    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = new FormData(orderForm);
            // Front-end demo: store a small order in localStorage to simulate submission
            const orders = JSON.parse(localStorage.getItem('demoOrders') || '[]');
            orders.push({name: data.get('name'), phone: data.get('phone'), items: data.get('items'), at: new Date().toISOString()});
            localStorage.setItem('demoOrders', JSON.stringify(orders));
            // Build a friendly WhatsApp message and open it so the user can send the order to the café
            const cafePhone = '66629423598'; // international format, no + or leading zeros
            const name = data.get('name') || '';
            const phone = data.get('phone') || '';
            const items = data.get('items') || '';
            const time = new Date().toLocaleString();
            const message = `Order from ${name}%0APhone: ${phone}%0AItems: ${items}%0ATime: ${time}%0A%0A(Please confirm availability)`;
            const waUrl = `https://wa.me/${cafePhone}?text=${message}`;

            // Close modal and reset, then open WhatsApp in a new tab/window and show toast fallback
            closeModal();
            orderForm.reset();
            // Try to open WhatsApp; if it opens, the user will need to press Send. Show toast with fallback actions.
            try { window.open(waUrl, '_blank'); } catch (err) { window.location.href = waUrl; }
            // Show the toast with message and waUrl so user can copy if needed
            showWhatsAppToast(decodeURIComponent(message), waUrl);
        });
    }

    /* ---------- Scroll reveal (IntersectionObserver) ---------- */
    const revealEls = document.querySelectorAll('.card, .hero-content, .section-head, .review');
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                io.unobserve(entry.target);
            }
        });
    }, {threshold: 0.12});
    revealEls.forEach(el => io.observe(el));

    /* ---------- Floating order behavior (hide on top) ---------- */
    const floating = document.getElementById('floatingOrder');
    let lastScroll = window.scrollY;
    window.addEventListener('scroll', () => {
        if (!floating) return;
        const current = window.scrollY;
        // hide when near top
        if (current < 100) { floating.style.opacity = '0'; floating.style.pointerEvents = 'none'; }
        else { floating.style.opacity = '1'; floating.style.pointerEvents = 'auto'; }
        lastScroll = current;
    }, {passive:true});

    /* Smooth anchor scrolling */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (href.length > 1) {
                const el = document.querySelector(href);
                if (el) { e.preventDefault(); el.scrollIntoView({behavior:'smooth',block:'start'}); }
            }
        });
    });

    /* Small accessibility: close menu when a nav link is clicked (mobile) */
    document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => {
        if (mainNav && window.innerWidth < 900) mainNav.style.display = 'none';
    }));

});

/* Small legacy helper */
function showMessage(){ alert('Welcome to Green Bean 🌿 Your chill session starts now!'); }

/* ---------- Toast helper (Open WhatsApp / Copy message fallback) ---------- */
function showWhatsAppToast(messagePlain, waUrl){
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const toastOpen = document.getElementById('toastOpen');
    const toastCopy = document.getElementById('toastCopy');
    const toastClose = document.getElementById('toastClose');
    if (!toast || !toastMsg) return;

    // Set message (shortened) for UI
    const short = messagePlain.length > 220 ? messagePlain.slice(0,220) + '…' : messagePlain;
    toastMsg.textContent = short;

    // Set handlers
    function openHandler(){ try { window.open(waUrl, '_blank'); } catch(e){ window.location.href = waUrl; } }
    function copyHandler(){
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(messagePlain).then(()=>{
                toastMsg.textContent = 'Message copied to clipboard — paste into WhatsApp';
            }).catch(()=>{ toastMsg.textContent = 'Copy failed — please long-press the message to copy'; });
        } else {
            // fallback: select and copy via execCommand (rare)
            const ta = document.createElement('textarea'); ta.value = messagePlain; document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); toastMsg.textContent = 'Message copied to clipboard'; } catch(e){ toastMsg.textContent = 'Copy failed'; }
            ta.remove();
        }
    }

    // attach
    toastOpen.onclick = openHandler;
    toastCopy.onclick = copyHandler;
    toastClose.onclick = hideToast;

    // show
    toast.classList.add('show');
    toast.setAttribute('aria-hidden','false');

    // auto-hide after 8s
    let timer = setTimeout(hideToast, 8000);

    function hideToast(){
        clearTimeout(timer);
        toast.classList.remove('show');
        toast.setAttribute('aria-hidden','true');
    }
}

/* ---------- Splash screen control ---------- */
document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash');
    if (!splash) return;
    const splashKey = 'splashSeen';

    // If the user has already seen the splash, skip it entirely
    try {
        if (localStorage.getItem(splashKey) === 'true') {
            splash.style.display = 'none';
            splash.setAttribute('aria-hidden', 'true');
            return;
        }
    } catch (e) {
        // localStorage might be unavailable in some privacy modes — fallback to showing the splash once
        console.warn('localStorage unavailable for splash flag', e);
    }

    // Hide splash cleanly after animation ends
    function hideSplash(){
        if (!splash) return;
        // mark as seen for next visits
        try { localStorage.setItem(splashKey, 'true'); } catch(e){}
        splash.setAttribute('aria-hidden','true');
        splash.classList.add('splash-hidden');
        // remove from layout after transition
        setTimeout(()=>{ try{ splash.style.display='none' }catch(e){} }, 450);
    }

    // When animation finishes, hide
    splash.addEventListener('animationend', hideSplash, {once:true});
    // Allow user to click/tap to skip (also mark as seen)
    splash.addEventListener('click', () => { try { localStorage.setItem(splashKey, 'true'); } catch(e){}; hideSplash(); });
    // Fallback timeout in case animationend doesn't fire
    setTimeout(hideSplash, 3500);
});

/* ---------- Live price ticker (BTC + THB→USD) ---------- */
document.addEventListener('DOMContentLoaded', () => {
    const btcUsdEl = document.getElementById('btcPriceUsd');
    const btcThbEl = document.getElementById('btcPriceThb');
    const btcDelta = document.getElementById('btcDelta');
    const thbEl = document.getElementById('thbRate');
    const thbDelta = document.getElementById('thbDelta');
    const refreshBtn = document.getElementById('tickerRefresh');
    const mBtcUsd = document.getElementById('mBtcUsd');
    const mBtcThb = document.getElementById('mBtcThb');

    if (!btcUsdEl || !btcThbEl || !thbEl) return;

    let prevBtcUsd = null;
    let prevThbRate = null;

    // Fetch BTC price (USD & THB) and THB->USD rate
    async function fetchPrices(){
        // CoinGecko: get BTC price in USD and THB
        try {
            const resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,thb');
            if (!resp.ok) throw new Error('CoinGecko error');
            const data = await resp.json();
            const usd = data.bitcoin && data.bitcoin.usd ? data.bitcoin.usd : null;
            const thb = data.bitcoin && data.bitcoin.thb ? data.bitcoin.thb : null;
            if (usd != null) updateBtcUsd(usd);
            if (thb != null) updateBtcThb(thb);
        } catch (e) {
            console.warn('BTC price fetch failed', e);
            btcUsdEl.textContent = '—';
            btcThbEl.textContent = '—';
        }

        // ExchangeRate host: THB -> USD (1 THB = x USD)
        try {
            const resp2 = await fetch('https://api.exchangerate.host/latest?base=THB&symbols=USD');
            if (!resp2.ok) throw new Error('ExchangeRate error');
            const d2 = await resp2.json();
            const rate = d2 && d2.rates && d2.rates.USD ? d2.rates.USD : null;
            if (rate != null) updateThbRate(rate);
        } catch (e) {
            console.warn('THB rate fetch failed', e);
            thbEl.textContent = '—';
        }
    }

    function formatNumber(n){
        if (n >= 1000) return n.toLocaleString(undefined, {maximumFractionDigits:0});
        return n.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
    }

    function updateBtcUsd(value){
        const numeric = Number(value);
        btcUsdEl.textContent = '$' + formatNumber(numeric);
        if (mBtcUsd) mBtcUsd.textContent = '$' + formatNumber(numeric);
        if (prevBtcUsd != null){
            const diff = numeric - prevBtcUsd;
            btcDelta.textContent = (diff >= 0 ? '▲ ' : '▼ ') + Math.abs(diff).toFixed(2);
            btcUsdEl.classList.toggle('up', diff > 0);
            btcUsdEl.classList.toggle('down', diff < 0);
            if (mBtcUsd) { mBtcUsd.classList.toggle('up', diff > 0); mBtcUsd.classList.toggle('down', diff < 0); }
        }
        prevBtcUsd = numeric;
    }

    function updateBtcThb(value){
        // show BTC in THB (rounded)
        const numeric = Number(value);
        btcThbEl.textContent = '฿' + (numeric >= 1000 ? numeric.toLocaleString() : numeric.toFixed(0));
        if (mBtcThb) mBtcThb.textContent = '฿' + (numeric >= 1000 ? numeric.toLocaleString() : numeric.toFixed(0));
    }

    function updateThbRate(value){
        const numeric = Number(value);
        // Show 1 THB = x USD
        thbEl.textContent = numeric.toFixed(4) + ' USD';
        if (prevThbRate != null){
            const diff = numeric - prevThbRate;
            thbDelta.textContent = (diff >= 0 ? '▲ ' : '▼ ') + Math.abs(diff).toFixed(6);
            thbEl.classList.toggle('up', diff > 0);
            thbEl.classList.toggle('down', diff < 0);
        }
        prevThbRate = numeric;
    }

    // manual refresh
    if (refreshBtn) refreshBtn.addEventListener('click', () => { fetchPrices(); refreshBtn.classList.add('rot'); setTimeout(()=>refreshBtn.classList.remove('rot'),600); });

    // initial fetch and interval
    fetchPrices();
    setInterval(fetchPrices, 60000); // update every 60s
});