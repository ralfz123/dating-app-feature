const express = require('express')
const app = express()
const port = 3000

app.set('view engine', 'ejs');

// Routes
app.get('/', function(req, res) {
    res.render('head');
});

app.get('/*', function(req, res) {
    res.sendFile(__dirname + '/static/404.html')
});


app.listen(3000, () => console.log('App is listening on port 3000!'));