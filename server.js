'use strict';

import Express from 'express';
import router from './lib/index.js';
import swaggerDocument from './openapi/swagger.json' assert { type: "json" };
import swaggerUi from 'swagger-ui-express';


const app = Express();
const port = process.env.PORT || 3000;

var options = {
  customCss: '.swagger-ui .topbar { display: none }'
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));
app.use('/api/', router);

app.get('/', function (req, res) {
  res.redirect('/api-docs');
});

app.listen(port, function () {
  console.log('Server started on port', port);
});