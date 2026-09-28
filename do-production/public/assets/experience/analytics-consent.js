(function () {
  'use strict';
  const id = document.currentScript?.dataset.gaId;
  if (!/^G-[A-Z0-9]+$/.test(id || '')) return;
  const banner = document.querySelector('[data-consent]');
  if (!banner) return;
  const key = 'ntnd-analytics-consent-v1';
  const stored = () => { try { return localStorage.getItem(key); } catch { return null; } };
  const store = value => { try { localStorage.setItem(key, value); } catch {} };
  let loaded = false;
  let focusReturn = null;

  function showBanner(opener = null) {
    focusReturn = opener;
    banner.hidden = false;
    banner.focus({ preventScroll: true });
  }

  function gtag() { window.dataLayer.push(arguments); }
  function loadAnalytics() {
    window['ga-disable-' + id] = false;
    if (loaded) {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
      return;
    }
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = gtag;
    // Basic Consent Mode: no Google script or request exists before this point.
    gtag('consent', 'default', {
      ad_storage: 'denied', ad_user_data: 'denied',
      ad_personalization: 'denied', analytics_storage: 'denied',
    });
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('js', new Date());
    gtag('config', id, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 90 * 24 * 60 * 60,
      cookie_update: false,
      page_location: location.origin + location.pathname,
      page_referrer: '',
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  function clearAnalyticsCookies() {
    document.cookie.split(';').map(part => part.trim().split('=')[0])
      .filter(name => /^_ga(?:_|$)/.test(name))
      .forEach(name => {
        for (const domain of ['', '; Domain=' + location.hostname]) {
          document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax' + domain;
        }
      });
  }

  function decide(choice) {
    store(choice);
    banner.hidden = true;
    focusReturn?.focus({ preventScroll: true });
    focusReturn = null;
    if (choice === 'granted') loadAnalytics();
    else {
      window['ga-disable-' + id] = true;
      if (loaded) window.gtag('consent', 'update', { analytics_storage: 'denied' });
      clearAnalyticsCookies();
      // Remove an already loaded Google script from the active document. The
      // saved refusal prevents it loading again on this or later pages.
      if (loaded) location.reload();
    }
  }

  banner.querySelector('[data-consent-allow]').addEventListener('click', () => decide('granted'));
  banner.querySelector('[data-consent-decline]').addEventListener('click', () => decide('denied'));
  const choice = stored();
  window['ga-disable-' + id] = choice !== 'granted';
  if (choice === 'granted') loadAnalytics();
  else if (choice !== 'denied') showBanner();
  document.querySelectorAll('[data-consent-open]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => showBanner(button));
  });
})();
