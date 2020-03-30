// TEST TEST TEST

// Variabelen
const express = require('express');
const app = express();
const port = 5000;
const mongo = require('mongodb');
const bodyParser = require('body-parser');
let db;
let Gebruikers;
const session = require ('express-session');

// Middleware set-up
app
    .use(express.static('static'))
    .set('view engine', 'ejs')
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({
        extended: true
    }));

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


// Root
app.get('/', goHome);
// Registration
app.get('/registration', registreren);
app.post('/registrating', gebruikerMaken);
// Inloggen
app.post('/log-in', inloggen);
// Uitloggen
app.get('/log-out', uitloggen);
// Wachtwoord wijzigen
app.get('/edit-pass', wachtwoordform);
app.post('/edit', wachtwoordVeranderen);
// account verwijderen
app.get('/delete', accountverwijderForm);
app.post('/delete', accountVerwijderen);
// error404
app.get('/*', error404);
// session
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        secure: true
})
);


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
    // Pusht de data + input naar database
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
    return db.collection('users').findOne({ email: req.body.email } )    
        .then(data => {
            if (data.email === req.body.email && data.wachtwoord !== req.body.wachtwoord) {
                console.log('email klopt, maar wachtwoord niet');
                res.render('index');
            } else if (data.email === req.body.email && data.wachtwoord === req.body.wachtwoord) {
                console.log('account is ingelogd');
                res.render('readytostart');
                req.session.userId = data._id;
            } else {
                console.log('account is niet gevonden');

            }
            return data;
        })
        .catch(err => console.error(`Error: ${err}`));
}

function wachtwoordform(req, res) {
    res.render('edit-pass');
}


// Omdat ik geen sessie gebruik nog, moet ik het account eerst valideren door de gebruiker wachtwoord en email te laten opgeven om daarna pas deze functie uit te laten voeren
function wachtwoordVeranderen(req, res) {
    return db.collection('users').findOne({ email: req.body.email })
        .then(data => {
            if (data.email === req.body.email && data.wachtwoord !== req.body.wachtwoord) {
                console.log('email klopt, maar wachtwoord niet');
                res.render('index');
            } else if (data.email === req.body.email && data.wachtwoord === req.body.wachtwoord) {
                const query = { email: req.body.email };
                // Wat wil je aanpassen
                const update = {
                    '$set': {
                        'email': req.body.email,
                        'wachtwoord': req.body.nieuwwachtwoord,
                    }
                };
                // Return het geupdate document
                const options = { returnNewDocument: true };

                return db.collection('users').findOneAndUpdate(query, update, options)
                    .then(updatedDocument => {
                        if (updatedDocument) {
                            console.log(`Dit document: ${updatedDocument}. is geupdated`);
                            res.render('index');
                        } else {
                            console.log('Wachtwoord niet gevonden');
                        }
                        return updatedDocument;
                    })
                    .catch(err => console.error(`Gefaald om het te updaten door error: ${err}`));
            } else {
                console.log('account is niet gevonden');
            }
            return data;
        })
        .catch(err => console.error(`Error: ${err}`));
}

// Omdat ik geen sessie gebruik nog, moet ik het account eerst valideren door de gebruiker wachtwoord en email te laten opgeven om daarna pas deze functie uit te laten voeren
function accountVerwijderen(req, res) {
    return db.collection('users').findOne({ email: req.body.email })
        .then(data => {
            if (data.email === req.body.email && data.wachtwoord !== req.body.wachtwoord) {
                console.log('email klopt, maar wachtwoord niet');
                res.render('index');
            } else if (data.email === req.body.email && data.wachtwoord === req.body.wachtwoord) {
                db.collection('users').deleteOne({ email: req.body.email })
                    .then(result => console.log(`Heeft ${result.deletedCount} account verwijderd.`))
                    .catch(err => console.error(`Delete failed with error: ${err}`));
                res.render('index');
            } else {
                console.log('account is niet bekend');
            }
            return data;
        })
        .catch(err => console.error(`Error: ${err}`));
}

// Laat alleen het formulier zien om account te verwijderen
function accountverwijderForm(req, res) {
    res.render('delete-acc');
}

// Uitloggen. Werkt nog niet, omdat ik nog geen sessie gebruik
function uitloggen(req, res) {
    res.render('index');
}
// Bij een 404
function error404(req, res) {
    res.render('404');
}
// Welke poort het live staat
app.listen(5000, () => console.log('App is listening on port', port));