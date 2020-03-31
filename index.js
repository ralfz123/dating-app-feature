// Variabelen
const express = require('express');
const app = express();
const port = 5000;
const mongo = require('mongodb');
const bodyParser = require('body-parser');
const session = require('express-session');
let Strategy = require('./strategy');
let db;
let Gebruikers;

exports = module.exports = Strategy;
exports.Strategy = Strategy;

// Middleware set-up
app
    .use(express.static('static'))
    .set('view engine', 'ejs')
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({
        extended: true
    }))
    .use(
        session({
            secret: '343ji43j4n3jn4jk3n',
            resave: false,
            saveUninitialized: true,
            secure: true
        })
    );

// Database connectie via .env
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

/// Root
app.get('/', goHome);
// Registration
app.get('/registration', registreren);
app.post('/registrating', gebruikerMaken);
// Inloggen
app.post('/log-in', inloggen);
// Uitloggen
app.get('/logout', uitloggen);
// Wachtwoord wijzigen
app.get('/edit-pass', wachtwoordform);
app.post('/edit', wachtwoordVeranderen);
// account verwijderen
app.get('/delete', accountVerwijderen);
// error404
app.get('/*', error404);

// Checkt of er een ingelogde gebruiker is en stuurt aan de hand hiervan de juiste pagina door
function registreren(req, res) {
    if (req.session.userId) {
        res.render('readytostart');
        console.log('U bent al ingelogd');
    } else {
        res.render('registration');
    }
}
// Checkt of er een ingelogde gebruiker is en stuurt aan de hand hiervan de juiste pagina door
function goHome(req, res) {
    if (req.session.userId) {
        res.render('readytostart');
    } else {
        res.render('index');
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
    // Pusht de data naar database
    Gebruikers
        .insertOne(data, function(err) {
            if (err) {
                throw err;
            } else {
                console.log('Gebruiker toegevoegd');
                req.session.userId = data.email;
                res.render('readytostart');
            }
        });
}
// checkt of gebruiker bestaat en logt in door een sessie aan te maken met het email als userID
function inloggen(req, res) {
    Gebruikers
        .findOne({
            email: req.body.email,
            wachtwoord: req.body.wachtwoord
        })
        .then(data => {
            console.log('Uw account is ingelogd!');
            req.session.userId = data.email;
            if (data) {
                res.render('readytostart');
                console.log(req.session.userId);
            }
        })
        .catch(err => {
            console.log(err);
        });
}


function wachtwoordform(req, res) {
    res.render('edit-pass');
}

// functie om wachtwoord te veranderen als de gebruiker ingelogd(als sessie bestaat) is
function wachtwoordVeranderen(req, res) {
    if (req.session.userId) {
        Gebruikers
            .findOne({
                email: req.session.userId,
            })
            .then(data => {
                if (data) {
                    const query = { email: req.session.userId };
                    // Wat wil je aanpassen
                    const update = {
                        '$set': {
                            'email': req.session.userId,
                            'wachtwoord': req.body.nieuwwachtwoord,
                        }
                    };
                    const options = { returnNewDocument: true };
                    Gebruikers
                        .findOneAndUpdate(query, update, options)
                        .then(updatedDocument => {
                            if (updatedDocument) {
                                console.log(`Dit document: ${updatedDocument}. is geupdated`);
                                res.render('index');
                            }
                            return updatedDocument;
                        })
                        .catch(err => console.error(`Gefaald om het te updaten door error: ${err}`));
                }
            })
            .catch(err => {
                console.log(err);
            });
    } else {
        res.render('index');
        console.log('u bent niet ingelogd');
    }
}
// functie om account te verwijderen als de gebruiker ingelogd(als sessie bestaat) is en daarna de sessie vernietigen
function accountVerwijderen(req, res) {
    Gebruikers
        .findOne({ email: req.session.userId })
        .then(data => {
            if (data) {
                Gebruikers
                    .deleteOne({ email: req.session.userId })
                    .then(result => console.log(`Heeft ${result.deletedCount} account verwijderd.`))
                    .catch(err => console.error(`Deleten is niet gelukt door error: ${err}`));
                req.session.destroy();
                res.render('index');
            } else {
                console.log('account is niet gevonden');
            }
            return data;
        })
        .catch(err => console.error(`Error: ${err}`));
}

// Uitloggen door sessie te verwijderen
function uitloggen(req, res) {
    req.session.destroy();
    res.render('index');
}

// Bij een 404
function error404(req, res) {
    res.render('404');
}

// code nina matches
// route naar ejs. Renderen
app.get('/findlove', gebruiker1);

// function pagina gebruiker 1
function gebruiker1(req, res) {
    Gebruikers
        .find({}).toArray(done);

    function done(err, data) {
        console.log(data);
        res.render('detail.ejs', { data: data });
    }
}
// route naar ejs. Renderen
app.get('/matches', overzichtMatches);
// function pagina gebruiker 1
function overzichtMatches(req, res) {
    Gebruikers
        .find({}).toArray(done);

    function done(err, data) {
        if (err) {
            next(err);
        } else {
            console.log(data);
            res.render('match.ejs', { data: data });
        }
    }
}

// Welke poort het live staat
app.listen(5000, () => console.log('App is listening on port', port));