const express = require('express');
const app = express();
const port = 3000;
const mongo = require('mongodb');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const passport = require('passport');
const session = require('express-session');
const methodOverride = require('method-override');
let db = null;
let Gebruikers = null;


app
    .use(express.static('static'))
    .set('view engine', 'ejs')
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({
        extended: true
    }))
    .use(session({
        secret: 'maximum',
        saveUninitialized: false,
        resave: false,
        cookie: { secure: true }
    }));

// Database

require('dotenv').config();
let url = 'mongodb+srv://' + process.env.DB_USER + ':' + process.env.DB_PASS + '@' + process.env.DB_URL + process.env.DB_EN;

mongo.MongoClient.connect(url, { useUnifiedTopology: true }, function(err, client) {
    if (err) {
        console.log('Database is niet connected');
    } else if (client) {
        console.log('Connectie met database is live');
    }
    db = client.db(process.env.DB_NAME);
    Gebruikers = db.collection(process.env.DB_NAME);
});

// Root
app.get('/', goHome);
// Registration
app.get('/registration', registreren);
app.post('/registrating', gebruikerMaken);
// Inloggen
app.post('/log-in', inloggen);
// error404
app.get('/*', error404);

// Laat de registratiepagina zien
function registreren(req, res) {
    res.render('registration');
}

// Gaat naar home
function goHome(req, res) {
    res.render('index');
}

// Maakt de gebruiker aan op post
function gebruikerMaken(req, res) {
    let voornaam = req.body.voornaam;
    let achternaam = req.body.achternaam;
    let geboorteDatum = req.body.geboortedatum;
    let email = req.body.email;
    let wachtwoord = req.body.wachtwoord;

    let data = {
        'voornaam': voornaam,
        'achternaam': achternaam,
        'geboortedatum': geboorteDatum,
        'email': email,
        'wachtwoord': wachtwoord,
    };
    db.collection('users').insertOne(data, function(err, collection) {
        if (err) {
            throw err;
        } else {
            console.log('Gebruiker toegevoegd');
            res.render('readytostart');
        }
    });
}

// checkt of gebruiker bestaat en logt in
function inloggen(req, res) {
    let email = req.body.email;
    let wachtwoord = req.body.wachtwoord;
    db.findOne({
        'username': req.body.email,
        'email': req.body.pwd
    }, function(err, user) {
        // hanlde err..
        if (user) {
            // user exists 
        } else {
            // user does not exist
        }
    });

}

// Bij een 404
function error404(res) {
    res.render('404');
}

// Welke poort het live staat
app.listen(3000, () => console.log('App is listening on port', port));