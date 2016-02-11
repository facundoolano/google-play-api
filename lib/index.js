var Express = require('express');
var gplay = require('google-play-scraper');

var app = Express();

module.exports = app;

app.get('/', function(req, res) {
    //FIXME make links
    res.json({
        apps: '/apps/',
        developers: '/developers/'
    });
});

app.get('/apps/', function(req, res) {
    gplay.list().then(res.json.bind(res));

    //TODO url -> playstoreUrl
    //TODO url = api url
    //TODO pagination links
});
