var Webtask = require('webtask-tools');
var app = require('./lib');

module.exports = Webtask.fromExpress(app);
