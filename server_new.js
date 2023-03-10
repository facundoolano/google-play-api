const express = require('express');
const router = require('./lib');

const app = express();
const port = process.env.PORT || 3000;

app.use('/api/', router);
app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile('/public/index.html');
});

app.listen(port, function () {
  console.log('Server started on port', port);
});
