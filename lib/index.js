var Express = require('express');
var gplay = require('google-play-scraper');
var url = require('url');
var path = require('path');

var app = Express();

module.exports = app;

app.get('/', function(req, res) {
    res.json({
        apps: subpath(req, 'apps'),
        developers: subpath(req, 'developers')
    });
});

app.get('/apps/', function(req, res) {
    // TODO get qs params

    gplay.list().each(cleanUrls(req)).then(res.json.bind(res));
    // TODO pagination links
});

app.get('/apps/:appId', function(req, res) {
    // TODO get qs params
    var opts = {appId: req.params.appId};
    gplay.app(opts).then(cleanUrls(req)).then(res.json.bind(res));
});


function cleanUrls(req) {
    return function (app) {
        app.playstoreUrl = app.url;
        app.url = subpath(req, app.appId);
        return app;
    };
}

function subpath(req, spath) {
    return url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: path.join(req.originalUrl, spath, '/')
      });
}
