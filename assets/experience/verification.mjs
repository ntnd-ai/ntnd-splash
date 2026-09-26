export function takeVerificationToken(location, history) {
  const token = new URLSearchParams(location.hash.slice(1)).get('token') || '';
  // Drop both fragment and query from the visible/history URL before any request.
  history.replaceState(null, '', location.pathname);
  return /^[a-f0-9]{64}$/.test(token) ? token : '';
}

export async function confirmEmail(token, { preview = false, endpoint, fetcher = globalThis.fetch } = {}) {
  if (preview) return { kind: 'preview' };
  if (!/^[a-f0-9]{64}$/.test(token)) throw Error('Open the complete verification link from your email.');
  if (!endpoint) throw Error('Verification is not configured. Please use the contact form for help.');
  const response = await fetcher(endpoint, {
    method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ token }), signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (response.status === 400) throw Error('This link has expired, has already been used, or is unavailable. If you already confirmed your email, no further action is needed. Otherwise, request a new link.');
  if (response.status === 429) throw Error('Too many attempts. Please wait a little before trying again.');
  if (!response.ok || data.ok !== true || data.lifecycleStatus !== 'verified') throw Error('We could not confirm your email just now. Please try again or use the contact form.');
  return { kind: 'verified', ...(data.updatesStatus ? { updatesStatus: data.updatesStatus } : {}) };
}

export function mountVerification({ document, location, history, fetcher = globalThis.fetch }) {
  const root = document.querySelector('[data-email-verification]');
  if (!root) return;
  let token = takeVerificationToken(location, history);
  const button = document.querySelector('[data-verify-email]');
  const message = document.querySelector('[data-verification-message]');
  const preview = root.dataset.preview === '1';
  let endpoint = '';
  try { endpoint = preview ? '' : ['localhost','127.0.0.1'].includes(location.hostname) ? (root.dataset.localTest === '1' ? new URL('/email/verify', location.href).href : 'http://127.0.0.1:4872/email/verify') : new URL('/email/verify', root.dataset.endpoint).href; } catch { /* Unconfigured builds fail closed. */ }
  button.disabled = preview || !token || !endpoint;
  if (!preview && !endpoint) message.textContent = 'Verification is not configured. Please use the contact form for help.';
  if (!token && !preview) message.textContent = 'Open the complete link in your verification email, or request a new one below.';
  // Explicit confirmation, not a GET effect: email link scanners do not consume a token.
  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    message.textContent = 'Confirming your email…';
    try {
      const result = await confirmEmail(token, { preview, endpoint, fetcher });
      token = '';
      message.textContent = result.updatesStatus === 'subscribed' ? 'Your email is verified. Your alpha request is in the review queue, and you’re subscribed to ntnd product updates.' : result.updatesStatus === 'unsubscribed' ? 'Your email is verified. Your alpha request is in the review queue. You remain unsubscribed from product updates.' : 'Your email is verified and your request is in the review queue. We will contact selected applicants with the next steps.';
      button.textContent = 'Email confirmed';
    } catch (error) {
      message.textContent = error instanceof TypeError || ['TimeoutError','AbortError'].includes(error.name) ? 'The connection did not complete. Try again or use the contact form.' : error.message;
      button.disabled = false;
    }
  });
}

if (typeof document !== 'undefined') mountVerification({ document, location, history });
