const express = require('express')
const app = express()
const port = 3000

app.use(express.static('static'));

app.get('/', function(req, res) {
    res.sendFile('/static/index.html');
});

app.get('/*', function(req, res) {
    res.sendFile(__dirname + '/static/404.html')
});

app.listen(3000, () => console.log('App is listening on port 3000!'));