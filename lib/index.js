'use strict';

const Express = require('express');
const gplay = require('google-play-scraper');
const url = require('url');
const path = require('path');
const qs = require('querystring');

const router = Express.Router();

/* Index */
router.get('/', function (req, res) {
  res.json({
    apps: buildUrl(req, 'apps'),
    developers: buildUrl(req, 'developers')
  });
});

/* App search */
router.get('/apps/', function (req, res, done) {
  if (!req.query.q) {
    return done();
  }

  const opts = _.assign({term: req.query.q}, req.query);

  gplay.search(opts)
    .then((apps) => apps.map(cleanUrls(req)))
    .then(toList)
    .then(res.json.bind(res), error(res));
});

/* Search suggest */
router.get('/apps/', function (req, res, done) {
  if (!req.query.suggest) {
    return done();
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
    .then(res.json.bind(res), error(res));
});

/* App list */
router.get('/apps/', function (req, res) {
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
    .then(res.json.bind(res), error(res));
});

/* App detail*/
router.get('/apps/:appId', function (req, res) {
  const opts = Object.assign({appId: req.params.appId}, req.query);
  gplay.app(opts)
    .then(cleanUrls(req))
    .then(res.json.bind(res), error(res));
});

/* Similar apps */
router.get('/apps/:appId/similar', function (req, res) {
  const opts = Object.assign({appId: req.params.appId}, req.query);
  gplay.similar(opts)
    .then((apps) => apps.map(cleanUrls(req)))
    .then(toList)
    .then(res.json.bind(res), error(res));
});

/* App reviews */
router.get('/apps/:appId/reviews', function (req, res) {
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
    .then(res.json.bind(res), error(res));
});

/* Apps by developer */
// FIXME this should instead be a dev detail endpoint, with name and app list
// apps should then link to this
router.get('/developers/:devId/', function (req, res) {
  const opts = Object.assign({devId: req.params.devId}, req.query);
  gplay.developer(opts)
    .then((apps) => apps.map(cleanUrls(req)))
    .then(toList)
    .then(res.json.bind(res), error(res));
});

/* Developer list (not supported) */
router.get('/developers/', function (req, res) {
  res.status(400).json({
    message: 'Please specify a developer id.',
    example: buildUrl(req, '/developers/DxCo Games')
  });
});

function error (res) {
  return function (e) {
    res.status(400).json({message: e.message});
  };
}

function toList (apps) {
  return {results: apps};
}

function cleanUrls (req) {
  return function (app) {
    app.playstoreUrl = app.url;
    app.url = buildUrl(req, 'apps/' + app.appId);
    app.similar = buildUrl(req, 'apps/' + app.appId + '/similar');
    app.reviews = buildUrl(req, 'apps/' + app.appId + '/reviews');
    return app;
  };
}

// FIXME whipe this
function buildUrl (req, subpath) {
  let basePath = req.originalUrl; // full url
  const routerPath = req.baseUrl;
  basePath = basePath.split(routerPath)[0]; // drops the api subpath

  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: path.join(basePath, routerPath, subpath, '/')
  });
}

module.exports = router;
