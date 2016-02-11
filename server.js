var Express = require('express');

var app = require('./lib');
var server = Express();
var port = process.env.PORT || 3000;


server.use(mockWebtaskContext);
server.use(app);

server.listen(port, function () {
    console.log('Server started on port', port);
});


function mockWebtaskContext(req, res, next) {
    // Mock `req.webtaskContext` for standalone servers
    if (!req.webtaskContext) {
        req.webtaskContext = {
            secrets: {},
            data: {}
        };
    }

    next();
}
