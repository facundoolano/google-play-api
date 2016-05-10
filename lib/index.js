'use strict';

const Express = require('express');
const gplay = require('google-play-scraper');
const url = require('url');
const path = require('path');
const qs = require('querystring');

const router = Express.Router();

function toList (apps) {
  return {results: apps};
}

function cleanUrls (req) {
  return function (app) {
    app.playstoreUrl = app.url;
    app.url = buildUrl(req, 'apps/' + app.appId);
    app.similar = buildUrl(req, 'apps/' + app.appId + '/similar');
    app.reviews = buildUrl(req, 'apps/' + app.appId + '/reviews');
    app.developer = {
      devId: app.developer,
      url: buildUrl(req, 'developers/' + qs.escape(app.developer))
    };
    return app;
  };
}

function buildUrl (req, subpath) {
  return req.protocol + '://' + path.join(req.get('host'), req.baseUrl, subpath);
}

/* Index */
router.get('/', function (req, res) {
  res.json({
    apps: buildUrl(req, 'apps'),
    developers: buildUrl(req, 'developers')
  });
});

/* App search */
router.get('/apps/', function (req, res, next) {
  if (!req.query.q) {
    return next();
  }

  const opts = Object.assign({term: req.query.q}, req.query);

  gplay.search(opts)
    .then((apps) => apps.map(cleanUrls(req)))
    .then(toList)
    .then(res.json.bind(res))
    .catch(next);
});

/* Search suggest */
router.get('/apps/', function (req, res, next) {
  if (!req.query.suggest) {
    return next();
  }

  function toJSON (term) {
    return {
      term,
      url: buildUrl(req, '/apps/') + '?' + qs.stringify({q: term})
    };
  }

  gplay.suggest(req.query.suggest)
    .then((terms) => terms.map(toJSON))
    .then(toList)
    .then(res.json.bind(res))
    .catch(next);
});

/* App list */
router.get('/apps/', function (req, res, next) {
  function paginate (apps) {
    const num = parseInt(req.query.num || '60');
    const start = parseInt(req.query.start || '0');

    if (start - num >= 0) {
      req.query.start = start - num;
      apps.prev = buildUrl(req, '/apps/') + '?' + qs.stringify(req.query);
    }

    if (start + num <= 500) {
      req.query.start = start + num;
      apps.next = buildUrl(req, '/apps/') + '?' + qs.stringify(req.query);
    }

    return apps;
  }

  gplay.list(req.query)
    .then((apps) => apps.map(cleanUrls(req)))
    .then(toList).then(paginate)
    .then(res.json.bind(res))
    .catch(next);
});

/* App detail*/
router.get('/apps/:appId', function (req, res, next) {
  const opts = Object.assign({appId: req.params.appId}, req.query);
  gplay.app(opts)
    .then(cleanUrls(req))
    .then(res.json.bind(res))
    .catch(next);
});

/* Similar apps */
router.get('/apps/:appId/similar', function (req, res, next) {
  const opts = Object.assign({appId: req.params.appId}, req.query);
  gplay.similar(opts)
    .then((apps) => apps.map(cleanUrls(req)))
    .then(toList)
    .then(res.json.bind(res))
    .catch(next);
});

/* App reviews */
router.get('/apps/:appId/reviews', function (req, res, next) {
  function paginate (apps) {
    const page = parseInt(req.query.page || '0');

    const subpath = '/apps/' + req.params.appId + '/reviews/';
    if (page > 0) {
      req.query.page = page - 1;
      apps.prev = buildUrl(req, subpath) + '?' + qs.stringify(req.query);
    }

    if (apps.results.length) {
      req.query.page = page + 1;
      apps.next = buildUrl(req, subpath) + '?' + qs.stringify(req.query);
    }

    return apps;
  }

  const opts = Object.assign({appId: req.params.appId}, req.query);
  gplay.reviews(opts)
    .then(toList)
    .then(paginate)
    .then(res.json.bind(res))
    .catch(next);
});

/* Apps by developer */
router.get('/developers/:devId/', function (req, res, next) {
  const opts = Object.assign({devId: req.params.devId}, req.query);

  gplay.developer(opts)
    .then((apps) => apps.map(cleanUrls(req)))
    .then((apps) => ({
      devId: req.params.devId,
      apps
    }))
    .then(res.json.bind(res))
    .catch(next);
});

/* Developer list (not supported) */
router.get('/developers/', function (req, res) {
  res.status(400).json({
    message: 'Please specify a developer id.',
    example: buildUrl(req, '/developers/' + qs.escape('DxCo Games'))
  });
});

function errorHandler (err, req, res, next) {
  res.status(400).json({message: err.message});
  next();
}

router.use(errorHandler);

module.exports = router;
