const express = require('express');
const app = express();
const port = 3000;
const mongo = require('mongodb');

app.use(express.static('static'));
app.set('view engine', 'ejs');

// Database

require('dotenv').config();
let db = null;

let url = 'mongodb+srv://' + process.env.DB_USER + ':' + process.env.DB_PASS + '@' + process.env.DB_URL + process.env.DB_END;

mongo.MongoClient.connect(url, { useUnifiedTopology: true }, function(err, client) {
    if (err) {
        console.log('Database is niet connected');
    } else if (client) {
        console.log('Connectie met database is live');
    }
    db = client.db(process.env.DB_NAME);
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