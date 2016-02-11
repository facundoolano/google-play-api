var Express = require('express');
var gplay = require('google-play-scraper');
var url = require('url');
var path = require('path');
var qs = require('querystring');

var app = Express();

module.exports = app;

/* Index */
app.get('/', function(req, res) {
    res.json({
        apps: buildUrl(req, 'apps'),
        developers: buildUrl(req, 'developers')
    });
});
//TODO index link?

/* App search */
app.get('/apps/', function(req, res, done) {
    if (!req.query.q) {
        return done();
    }

    var opts = req.query;
    opts.term = req.query.q;

    gplay.search(opts).each(cleanUrls(req)).then(res.json.bind(res));
});

/* Search suggest */
app.get('/apps/', function(req, res, done) {
    if (!req.query.suggest) {
        return done();
    }

    gplay.suggest(req.query.suggest).map(function(term){
        return {
            term: term,
            url: buildUrl(req, '/apps/') + '?' + qs.stringify({q: term})
        };
    }).then(res.json.bind(res));
});

/* App list */
app.get('/apps/', function(req, res) {
    // TODO pagination links
    gplay.list(req.query).each(cleanUrls(req)).then(res.json.bind(res));
});

/* App detail*/
app.get('/apps/:appId', function(req, res) {
    var opts = req.query;
    opts.appId = req.params.appId;
    gplay.app(opts).then(cleanUrls(req)).then(res.json.bind(res));
});

/* Similar apps */
app.get('/apps/:appId/similar', function(req, res) {
    var opts = req.query;
    opts.appId = req.params.appId;
    gplay.similar(opts).each(cleanUrls(req)).then(res.json.bind(res));
});

/* App reviews */
app.get('/apps/:appId/reviews', function(req, res) {
    var opts = req.query;
    opts.appId = req.params.appId;
    gplay.reviews(opts).then(res.json.bind(res));
});


function cleanUrls(req) {
    return function (app) {
        app.playstoreUrl = app.url;
        app.url = buildUrl(req, 'apps/' + app.appId);
        app.similar = buildUrl(req, 'apps/' + app.appId + '/similar');
        app.reviews = buildUrl(req, 'apps/' + app.appId + '/reviews');
        return app;
    };
}

function buildUrl(req, spath) {
    return url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: path.normalize(spath + '/')
      });
}
