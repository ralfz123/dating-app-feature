const express = require('express')
const app = express()
const port = 3000

app.use(express.static('static'));
app.use(express.urlencoded())
app.set('view engine', 'ejs');

// Routes

// Root
app.get('/', function(req, res) {
    res.render('index');
});
// Registration
app.get('/registration', function(req, res) {
    res.render('registration');
});
// Loading
app.post('/log-in', function(req, res) {
    res.render('loading-login');
});
// Loading succes
app.get('/succes', function(req, res) {
    res.render('readytostart');
});
// 404
app.get('/*', function(req, res) {
    res.render('404');
});



app.listen(3000, () => console.log('App is listening on port 3000!'));