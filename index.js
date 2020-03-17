const express = require('express');
const app = express();
const port = 3000;
const mongo = require('mongodb');
const bodyParser = require('body-parser');
const flash = require('express-flash');
const bcrypt = require('bcrypt');
const session = require('express-session');
let db;
let Gebruikers;

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
    Gebruikers.createIndex({ email: 1 }, { unique: true });
});

// Root
app.get('/', users);
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


function users(req, res, next) {
    db.collection('users').find().toArray(done);

    function done(err, data) {
        if (err) {
            next(err);
        } else {

            res.render('index', { users: data });
        }
    }
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
    Gebruikers.find({}, { projection: { _id: 0 } }).toArray(function(err, collection) {
        if (err) throw err;
        const gebruiker = collection.find(collection => collection.email === req.body.email && collection.wachtwoord === req.body.wachtwoord)
        if (gebruiker === undefined) {
            console.log('Account is niet gevonden');
        } else {
            console.log(gebruiker);
            console.log('Account is gevonden');
            res.render('readytostart');
        }
    });
}
// Bij een 404
function error404(req, res) {
    res.render('404');
}
// Welke poort het live staat
app.listen(3000, () => console.log('App is listening on port', port))