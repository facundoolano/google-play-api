const REQUEST_TIMEOUT_MS = 15000;

export function createRequestContext () {
  return {
    cookies: new Map(),
    throttle: {
      startedAt: 0,
      calls: 0
    }
  };
}

function cookieHeader (cookies) {
  return [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
}

function rememberCookies (headers, cookies) {
  const values = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie()
    : (headers.get('set-cookie') || '').split(/,(?=[^;]+=[^;]+)/);

  for (const value of values) {
    const pair = value.split(';', 1)[0];
    const separator = pair.indexOf('=');
    if (separator > 0) {
      cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function waitForThrottle (context, limit) {
  const maxCalls = Number(limit);
  if (!Number.isFinite(maxCalls) || maxCalls <= 0) return;

  const now = Date.now();
  if (!context.throttle.startedAt || now - context.throttle.startedAt >= 1000) {
    context.throttle.startedAt = now;
    context.throttle.calls = 0;
  }

  if (context.throttle.calls >= maxCalls) {
    await sleep(Math.max(0, 1000 - (now - context.throttle.startedAt)));
    context.throttle.startedAt = Date.now();
    context.throttle.calls = 0;
  }

  context.throttle.calls += 1;
}

export async function request (opts, limit) {
  if (!opts || !opts.url) {
    throw new Error('Request URL missing');
  }

  const context = opts.requestContext || createRequestContext();
  await waitForThrottle(context, limit);

  const headers = new Headers(opts.headers);
  if (!headers.has('cookie') && context.cookies.size) {
    headers.set('cookie', cookieHeader(context.cookies));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const fetchImpl = opts.fetchImpl || globalThis.fetch;

  try {
    const response = await fetchImpl(opts.url, {
      method: opts.method || 'GET',
      headers,
      body: opts.body,
      redirect: opts.followRedirect === false ? 'manual' : 'follow',
      signal: controller.signal
    });

    rememberCookies(response.headers, context.cookies);
    const body = await response.text();

    if (!response.ok) {
      const error = new Error(`Error requesting Google Play: HTTP ${response.status}`);
      error.status = response.status;
      error.response = { statusCode: response.status };
      throw error;
    }

    return body;
  } catch (reason) {
    if (reason.status) throw reason;

    const error = new Error(`Error requesting Google Play: ${reason.message}`);
    error.cause = reason;
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export default request;
