import { Hono } from 'hono';
import scraper from './scraper/index.js';
import {
  buildPublicUrl,
  parseInteger,
  pickQuery,
  scraperOptions,
  statusForError
} from './http.js';

const app = new Hono();
const LIST_QUERY = ['collection', 'category', 'age', 'num', 'lang', 'country', 'fullDetail', 'throttle'];
const SEARCH_QUERY = ['num', 'lang', 'country', 'fullDetail', 'price', 'throttle'];
const DETAIL_QUERY = ['lang', 'country', 'throttle'];
const REVIEW_QUERY = ['lang', 'country', 'sort', 'num', 'paginate', 'nextPaginationToken', 'throttle'];

function auth (c, next) {
  if (!c.env.API_KEY || c.req.header('x-api-key') !== c.env.API_KEY) {
    return c.json({ error: 'Unauthorized - Invalid API Key' }, 401);
  }
  return next();
}

function query (c) {
  return new URL(c.req.url).searchParams;
}

function listResponse (apps) {
  return { results: apps };
}

function cleanUrls (c, item) {
  const appId = encodeURIComponent(item.appId);
  const developerId = encodeURIComponent(item.developer);
  return {
    ...item,
    playstoreUrl: item.url,
    url: buildPublicUrl(c.env, c.req.raw, `/api/apps/${appId}`),
    permissions: buildPublicUrl(c.env, c.req.raw, `/api/apps/${appId}/permissions`),
    similar: buildPublicUrl(c.env, c.req.raw, `/api/apps/${appId}/similar`),
    reviews: buildPublicUrl(c.env, c.req.raw, `/api/apps/${appId}/reviews`),
    datasafety: buildPublicUrl(c.env, c.req.raw, `/api/apps/${appId}/datasafety`),
    developer: {
      devId: item.developer,
      url: buildPublicUrl(c.env, c.req.raw, `/api/developers/${developerId}`)
    },
    categories: buildPublicUrl(c.env, c.req.raw, '/api/categories')
  };
}

function withScraperOptions (c, names) {
  return scraperOptions(query(c), names);
}

app.use('/api', auth);
app.use('/api/*', auth);

app.get('/', (c) => c.redirect('/api'));

const apiIndex = (c) => c.json({
  apps: buildPublicUrl(c.env, c.req.raw, '/api/apps'),
  developers: buildPublicUrl(c.env, c.req.raw, '/api/developers'),
  categories: buildPublicUrl(c.env, c.req.raw, '/api/categories')
});
app.get('/api', apiIndex);
app.get('/api/', apiIndex);

const appsHandler = async (c) => {
  const params = query(c);
  if (params.get('suggest')) {
    const terms = await scraper.suggest({
      term: params.get('suggest'),
      ...pickQuery(params, ['lang', 'country', 'throttle']),
      requestContext: scraperOptions(params, []).requestContext
    });
    return c.json(listResponse(terms.map(term => ({
      term,
      url: buildPublicUrl(c.env, c.req.raw, '/api/apps/', new URLSearchParams({ q: term }))
    }))));
  }

  if (params.get('q')) {
    const options = withScraperOptions(c, SEARCH_QUERY);
    options.term = params.get('q');
    const apps = await scraper.search(options);
    return c.json(listResponse(apps.map(item => cleanUrls(c, item))));
  }

  const options = withScraperOptions(c, LIST_QUERY);
  const pageSize = parseInteger(params.get('num'), { defaultValue: 60, min: 1, max: 250, name: 'num' });
  const start = parseInteger(params.get('start'), { defaultValue: 0, min: 0, max: 500, name: 'start' });
  options.num = Math.min(500, start + pageSize);
  const allApps = await scraper.list(options);
  const apps = allApps.slice(start, start + pageSize);
  const response = listResponse(apps.map(item => cleanUrls(c, item)));
  if (start >= pageSize) {
    const previous = new URLSearchParams(params);
    previous.set('start', String(start - pageSize));
    response.prev = buildPublicUrl(c.env, c.req.raw, '/api/apps/', previous);
  }
  if (start + pageSize <= 500 && apps.length === pageSize) {
    const next = new URLSearchParams(params);
    next.set('start', String(start + pageSize));
    response.next = buildPublicUrl(c.env, c.req.raw, '/api/apps/', next);
  }
  return c.json(response);
};
app.get('/api/apps', appsHandler);
app.get('/api/apps/', appsHandler);

for (const path of ['/api/apps/:appId', '/api/apps/:appId/']) {
  app.get(path, async (c) => {
    const options = withScraperOptions(c, DETAIL_QUERY);
    options.appId = c.req.param('appId');
    return c.json(cleanUrls(c, await scraper.app(options)));
  });
}

const similarHandler = async (c) => {
  const options = withScraperOptions(c, ['lang', 'country', 'fullDetail', 'throttle']);
  options.appId = c.req.param('appId');
  const apps = await scraper.similar(options);
  return c.json(listResponse(apps.map(item => cleanUrls(c, item))));
};
app.get('/api/apps/:appId/similar', similarHandler);
app.get('/api/apps/:appId/similar/', similarHandler);

const dataSafetyHandler = async (c) => {
  const options = withScraperOptions(c, DETAIL_QUERY);
  options.appId = c.req.param('appId');
  return c.json(listResponse(await scraper.datasafety(options)));
};
app.get('/api/apps/:appId/datasafety', dataSafetyHandler);
app.get('/api/apps/:appId/datasafety/', dataSafetyHandler);

const permissionsHandler = async (c) => {
  const options = withScraperOptions(c, ['lang', 'country', 'short', 'throttle']);
  options.appId = c.req.param('appId');
  return c.json(listResponse(await scraper.permissions(options)));
};
app.get('/api/apps/:appId/permissions', permissionsHandler);
app.get('/api/apps/:appId/permissions/', permissionsHandler);

const reviewsHandler = async (c) => {
  const options = withScraperOptions(c, REVIEW_QUERY);
  options.appId = c.req.param('appId');
  if (options.nextPaginationToken) options.paginate = true;
  const result = await scraper.reviews(options);
  const reviews = Array.isArray(result) ? result : result.data;
  const response = listResponse(result);
  const params = query(c);
  const page = parseInteger(params.get('page'), { defaultValue: 0, min: 0, max: 100000, name: 'page' });
  if (page > 0) {
    const previous = new URLSearchParams(params);
    previous.set('page', String(page - 1));
    response.prev = buildPublicUrl(c.env, c.req.raw, `/api/apps/${encodeURIComponent(c.req.param('appId'))}/reviews`, previous);
  }
  if (reviews?.length) {
    const next = new URLSearchParams(params);
    next.set('page', String(page + 1));
    if (result?.nextPaginationToken) next.set('nextPaginationToken', result.nextPaginationToken);
    response.next = buildPublicUrl(c.env, c.req.raw, `/api/apps/${encodeURIComponent(c.req.param('appId'))}/reviews`, next);
  }
  return c.json(response);
};
app.get('/api/apps/:appId/reviews', reviewsHandler);
app.get('/api/apps/:appId/reviews/', reviewsHandler);

const developerHandler = async (c) => {
  const options = withScraperOptions(c, ['lang', 'country', 'num', 'fullDetail', 'throttle']);
  options.devId = c.req.param('devId');
  const apps = await scraper.developer(options);
  return c.json({ devId: options.devId, apps: apps.map(item => cleanUrls(c, item)) });
};
app.get('/api/developers/:devId', developerHandler);
app.get('/api/developers/:devId/', developerHandler);

app.get('/api/developers/', (c) => c.json({
  message: 'Please specify a developer id.',
  example: buildPublicUrl(c.env, c.req.raw, '/api/developers/Wikimedia%20Foundation')
}, 400));

const categoriesHandler = async (c) => c.json(await scraper.categories({ requestContext: scraperOptions(query(c), []).requestContext }));
app.get('/api/categories', categoriesHandler);
app.get('/api/categories/', categoriesHandler);

app.onError((error, c) => {
  console.error(JSON.stringify({ message: error.message, status: error.status }));
  return c.json({ message: error.message }, statusForError(error));
});

app.notFound((c) => c.json({ message: 'Not Found' }, 404));

export default app;

export const worker = {
  fetch: (request, env, ctx) => app.fetch(request, env, ctx)
};
