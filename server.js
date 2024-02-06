'use strict';

import express from 'express';
import router from './lib/index.js';

const app = express();
const port = process.env.PORT || 3000;

app.use('/api/', router);

app.get('/', function(req, res){
  res.redirect('/api');
});

app.listen(port, function () {
  console.log('Server started on port', port);
});
