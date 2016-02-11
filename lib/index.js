var Express = require('express');
var gplay = require('google-play-scraper');
var url = require('url');
var path = require('path');

var app = Express();

module.exports = app;

app.get('/', function(req, res) {
    res.json({
        apps: buildUrl(req, 'apps'),
        developers: buildUrl(req, 'developers')
    });
});

app.get('/apps/', function(req, res) {
    // TODO pagination links
    gplay.list(req.query).each(cleanUrls(req)).then(res.json.bind(res));
});

app.get('/apps/:appId', function(req, res) {
    var opts = req.query;
    opts.appId = req.params.appId;
    gplay.app(opts).then(cleanUrls(req)).then(res.json.bind(res));
});


function cleanUrls(req) {
    return function (app) {
        app.playstoreUrl = app.url;
        app.url = buildUrl(req, 'apps/' + app.appId);
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
