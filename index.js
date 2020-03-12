const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('static'));
app.set('view engine', 'ejs');

// Database
const mongo = require('mongodb');
require('dotenv').config();
let db = null;

//Dit is de database link van mongodb
const url = process.env.DB_HOST + ':' + process.env.DB_PORT;
mongo.MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    //maak eerst via compass een database aan! Zet die naam in je .env onder DB_NAME
    db = client.db(process.env.DB_NAME);
    //checken of je client/database correct is geconnect
    console.log(client);
});


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
app.post('/registrating', function(req, res) {
    res.render('loading-registration');
});
// Loading succes
app.get('/succes', function(req, res) {
    res.render('readytostart');
});
// 404
app.get('/*', function(req, res) {
    res.render('404');
});



app.listen(3000, () => console.log('App is listening on port', port));