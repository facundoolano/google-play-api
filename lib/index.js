'use strict';

import express from 'express';
import gplay from "google-play-scraper";
import path from 'path';
import qs from 'querystring';

const router = express.Router();

const toList = (apps) => ({ results: apps });

const cleanUrls = (req) => (app) => Object.assign({}, app, {
  playstoreUrl: app.url,
  url: buildUrl(req, 'apps/' + app.appId),
  permissions: buildUrl(req, 'apps/' + app.appId + '/permissions'),
  similar: buildUrl(req, 'apps/' + app.appId + '/similar'),
  reviews: buildUrl(req, 'apps/' + app.appId + '/reviews'),
  datasafety: buildUrl(req, 'apps/' + app.appId + '/datasafety'),
  developer: {
    devId: app.developer,
    url: buildUrl(req, 'developers/' + qs.escape(app.developer))
  },
  categories: buildUrl(req, 'categories/')
});

const buildUrl = (req, subpath) =>
  req.protocol + '://' + path.join(req.get('host'), req.baseUrl, subpath);

/* Index */
router.get('/', (req, res) =>
  res.json({
    apps: buildUrl(req, 'apps'),
    developers: buildUrl(req, 'developers'),
    categories: buildUrl(req, 'categories')
  }));

/* App search */ 

/* 
   - The code addresses the limitation of Google Play Store and API only displaying 30 results by performing additional searches based on initial app titles.
   - Merges the results of each secondary search into an object (arr) to prevent duplicate entries.
   - Allows for retrieving more apps beyond the 30-app limit imposed by the direct search.
*/

router.get('/apps/', async function (req, res, next) {
  if (!req.query.q) {
    return next();
  }

  const opts = Object.assign({ term: req.query.q }, req.query);

  try {
    const searchTermMore = async (term, arr = {}) => {
      if (!term) {
        console.error("Error: search term is undefined");
        return;
      }

      let total = 0;
      let count = 0;

      console.log("searchTermMore called with term:", term);

      try {
        const apps = await gplay.search({
          term: term,
          num: 20,
        });

        total = apps.length;

        if (apps.length === 0) {
          console.log(`No apps found for term: ${term}`);
          return Object.values(arr);
        }

        for (let app of apps) {
          try {
            const apps2 = await gplay.search({
              term: app.title,
              num: 100,
            });

            for (let app2 of apps2) {
              if (!(app2.appId in arr)) {
                arr[app2.appId] = app2;
              }
            }
          } catch (err) {
            console.error(`Error occurred during subterm search for ${app.title}:`, err);
          }
          count++;
        }

        if (count < total) {
          console.log(`Not all apps for term: ${term} have been processed, calling searchTermMore again`);
          return await searchTermMore(term, arr);
        } else {
          return Object.values(arr);
        }
      } catch (err) {
        console.error("Error occurred during search:", err);
        throw err;
      }
    };

    const apps = await gplay.search(opts);
    const appList = await searchTermMore(opts.term, apps);
    res.json(appList);
  } catch (error) {
    next(error);
  }
});

/* Search suggest */
router.get('/apps/', function (req, res, next) {
  if (!req.query.suggest) {
    return next();
  }

  const toJSON = (term) => ({
    term,
    url: buildUrl(req, '/apps/') + '?' + qs.stringify({ q: term })
  });

  gplay.suggest({ term: req.query.suggest })
    .then((terms) => terms.map(toJSON))
    .then(toList)
    .then(res.json.bind(res))
    .catch(next);
});

/* App list */
router.get('/apps/', function (req, res, next) {
  function paginate(apps) {
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
  const opts = Object.assign({ appId: req.params.appId }, req.query);
  gplay.app(opts)
    .then(cleanUrls(req))
    .then(res.json.bind(res))
    .catch(next);
});

/* Similar apps */
router.get('/apps/:appId/similar', function (req, res, next) {
  const opts = Object.assign({ appId: req.params.appId }, req.query);
  gplay.similar(opts)
    .then((apps) => apps.map(cleanUrls(req)))
    .then(toList)
    .then(res.json.bind(res))
    .catch(next);
});

/* Data Safety */
router.get('/apps/:appId/datasafety', function (req, res, next) {
  const opts = Object.assign({ appId: req.params.appId }, req.query);
  gplay.datasafety(opts)
    .then(toList)
    .then(res.json.bind(res))
    .catch(next);
});

/* App permissions */
router.get('/apps/:appId/permissions', function (req, res, next) {
  const opts = Object.assign({ appId: req.params.appId }, req.query);
  gplay.permissions(opts)
    .then(toList)
    .then(res.json.bind(res))
    .catch(next);
});

/* App reviews */

/* 
  - Fetches app reviews based on app ID.
  - Efficiently handles pagination using nextPaginationToken.
  - Formats response with pagination links and handles errors appropriately.
  - Enhances functionality, performance, and usability of the endpoint. 
*/

router.get('/apps/:appId/reviews', async function (req, res, next) {
  try {
    const appId = req.params.appId;

    const options = {
      appId: appId, 
      lang: 'en',
      country: 'us',
      paginate: true,
    };

    let reviews = [];
    let nextToken;

    do {
      if (nextToken) {
        options.nextPaginationToken = nextToken;
      }

      const result = await gplay.reviews(options);
      const newData = result.data || [];

      if (!newData.length) {
        break;
      }

      reviews = reviews.concat(newData);
      nextToken = result.nextPaginationToken;
    } while (nextToken);

    if (!reviews.length) {
      return res.status(404).json({ error: 'No reviews found for app' });
    }

    console.log(`Received ${reviews.length} reviews for app: ${appId}`);

    const page = parseInt(req.query.page || '0');
    const apps = toList(reviews);

    const subpath = '/apps/' + appId + '/reviews/';
    if (page > 0) {
      req.query.page = page - 1;
      apps.prev = buildUrl(req, subpath) + '?' + qs.stringify(req.query);
    }

    if (apps.results.length) {
      req.query.page = page + 1;
      apps.next = buildUrl(req, subpath) + '?' + qs.stringify(req.query);
    }

    res.json(apps);
  } catch (err) {
    next(err);
  }
});

/* Apps by developer */
router.get('/developers/:devId/', function (req, res, next) {
  const opts = Object.assign({ devId: req.params.devId }, req.query);

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
router.get('/developers/', (req, res) =>
  res.status(400).json({
    message: 'Please specify a developer id.',
    example: buildUrl(req, '/developers/' + qs.escape('Wikimedia Foundation'))
  }));

/* Category list */
router.get('/categories/', function (req, res, next) {
  gplay.categories()
    .then(res.json.bind(res))
    .catch(next);
});


function errorHandler(err, req, res, next) {
  res.status(400).json({ message: err.message });
  next();
}

router.use(errorHandler);

export default router;
