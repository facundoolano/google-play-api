import { createRequestContext } from './scraper/lib/utils/request.js';

const BOOLEAN_VALUES = new Set(['true', 'false']);

export function parseBoolean (value, defaultValue = undefined) {
  if (value === undefined) return defaultValue;
  const normalized = String(value).toLowerCase();
  return BOOLEAN_VALUES.has(normalized) ? normalized === 'true' : defaultValue;
}

export function parseInteger (value, { defaultValue, min, max, name }) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (!/^\d+$/.test(String(value))) {
    throw new HttpError(400, `${name} must be an integer`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new HttpError(400, `${name} must be between ${min} and ${max}`);
  }
  return parsed;
}

export function pickQuery (query, names) {
  return names.reduce((result, name) => {
    const value = query.get(name);
    if (value !== null) result[name] = value;
    return result;
  }, {});
}

export function scraperOptions (query, names) {
  const options = pickQuery(query, names);
  if (options.lang) options.lang = options.lang.toLowerCase();
  if (options.country) options.country = options.country.toLowerCase();
  if (options.fullDetail !== undefined) options.fullDetail = parseBoolean(options.fullDetail, false);
  if (options.paginate !== undefined) options.paginate = parseBoolean(options.paginate, false);
  if (options.short !== undefined) options.short = parseBoolean(options.short, false);
  if (options.num !== undefined) {
    options.num = parseInteger(options.num, { defaultValue: 20, min: 1, max: 250, name: 'num' });
  }
  options.requestContext = createRequestContext();
  return options;
}

export function buildPublicUrl (env, request, path, searchParams) {
  const base = env.PUBLIC_BASE_URL || new URL(request.url).origin;
  const url = new URL(path, `${base.replace(/\/$/, '')}/`);
  if (searchParams) url.search = searchParams.toString();
  return url.toString();
}

export class HttpError extends Error {
  constructor (status, message) {
    super(message);
    this.status = status;
  }
}

export function statusForError (error) {
  if (error instanceof HttpError) return error.status;
  if (/missing|invalid|must be|can't exceed/i.test(error?.message || '')) return 400;
  if (Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599) {
    return error.status === 404 ? 404 : error.status >= 500 ? 502 : error.status;
  }
  return 502;
}
