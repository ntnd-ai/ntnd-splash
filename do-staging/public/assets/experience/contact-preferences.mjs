export function takeUnsubscribeToken(location, history) {
  const token = new URLSearchParams(location.hash.slice(1)).get('token') || '';
  history.replaceState(null, '', location.pathname);
  return /^[a-f0-9]{32}\.[a-f0-9]{64}$/.test(token) ? token : '';
}

export async function visitorPost(path, body, { preview, endpoint, fetcher = globalThis.fetch, allowLocal = false }) {
  if (preview) return { preview: true };
  const url = new URL(path, endpoint);
  const local = allowLocal && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  if ((!local && url.protocol !== 'https:') || url.username || url.password) throw Error('This form is unavailable. Please try again later.');
  const response = await fetcher(url.href, { method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error',
    headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  const result = await response.json();
  if (!response.ok || result.ok !== true) throw Error(response.status === 429 ? 'Too many attempts. Please try again later.' : 'We could not complete this request. Please try again later.');
  return { ok: true };
}

export function mountVisitorPage({ document, location, history, fetcher = globalThis.fetch, embedded = false }) {
  const root = document.querySelector('[data-visitor-page]');
  if (!root) return;
  const preview = root.dataset.preview === '1', allowLocal = root.dataset.localTest === '1' && ['localhost', '127.0.0.1'].includes(location.hostname), endpoint = allowLocal ? location.href : root.dataset.endpoint;
  const message = document.querySelector('[data-result]'), button = document.querySelector('main button');
  if (embedded) {
    history.replaceState(null, '', location.pathname);
    message.textContent = 'Open this page directly to use the form. No details have been sent.';
    return;
  }
  if (root.dataset.visitorPage === 'unsubscribe') {
    const token = takeUnsubscribeToken(location, history);
    button.disabled = !token;
    if (!token) message.textContent = 'Open the full unsubscribe link in one of our emails. No login is needed.';
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      button.disabled = true;
      try {
        const result = await visitorPost('/updates/unsubscribe', { token }, { preview, endpoint, fetcher, allowLocal });
        message.textContent = result.preview ? 'Your email preferences have not been changed.' : 'You’re unsubscribed from product updates. We may still email you as needed about your access request or account.';
      } catch { message.textContent = 'We could not update your preference. Please try again or use the contact form.'; button.disabled = false; }
    });
  } else {
    const form = document.querySelector('[data-contact-form]');
    button.disabled = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (button.disabled || !form.reportValidity()) return;
      button.disabled = true;
      try {
        const result = await visitorPost('/contact', Object.fromEntries(new FormData(form)), { preview, endpoint, fetcher });
        message.textContent = result.preview ? 'Your message has not been sent.' : 'Thanks for getting in touch. Your message has been sent.';
        if (!result.preview) form.reset();
      } catch (error) { message.textContent = error.name === 'Error' ? error.message : 'Your message could not be confirmed. Please try again later.'; }
      finally { button.disabled = false; }
    });
  }
}
if (typeof document !== 'undefined') mountVisitorPage({ document, location, history, embedded: window.top !== window.self });
