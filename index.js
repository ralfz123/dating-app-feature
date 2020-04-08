// Variabelen
const
    express = require('express'),
    app = express(),
    port = 5000,
    mongo = require('mongodb'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    flash = require('connect-flash'),
    multer = require('multer');
let
    db,
    Gebruikers;

// .env bestand gebruiken
require('dotenv').config();

// Middleware set-up
app
    .use(express.static('static'))
    .set('view engine', 'ejs')
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(session({
        secret: process.env.SESSION_SECRET,
        cookie: { maxAge: 60000 },
        resave: false,
        saveUninitialized: false,
        secure: true,
    }))
    .use(function(req, res, next) {
        res.locals.messages = require('express-messages')(req, res);
        next();
    })
    .use(flash());

// Database connectie via .env
let url = 'mongodb+srv://' + process.env.DB_USER + ':' + process.env.DB_PASS + '@' + process.env.DB_URL + process.env.DB_EN;

mongo.MongoClient
    .connect(url, { useUnifiedTopology: true }, function(err, client) {
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
app
    .post('/log-in', inloggen)
    .get('/', goHome)
    .get('/registration', registreren)
    .post('/registrating', gebruikerMaken)
    .get('/logout', uitloggen)
    .get('/edit-pass', wachtwoordform)
    .post('/edit', wachtwoordVeranderen)
    .get('/delete', accountVerwijderen)
    .get('/start', gebruikers)
    .get('/matches', overzichtMatches)
    .get('/findlove', gebruiker1)
    .post('/:id', like)
    .get('/*', error404);

// Checkt of er een ingelogde gebruiker is en stuurt aan de hand hiervan de juiste pagina door
function registreren(req, res) {
    if (req.session.loggedIn) {
        req.flash('succes', 'Hoi ' + req.session.userName);
        res.render('readytostart');
    } else {
        res.render('registration');
    }
}
// Gaat naar home
function goHome(req, res) {
    if (req.session.user) {
        req.flash('succes', 'Hoi ' + req.session.user.voornaam);
        res.redirect('findlove');
    } else {
        res.render('index');
    }
}
// Maakt de gebruiker aan op post

function gebruikerMaken(req, res) {
    let data = {
        'voornaam': req.body.voornaam,
        'achternaam': req.body.achternaam,
        'geboortedatum': req.body.geboortedatum,
        'email': req.body.email,
        'wachtwoord': req.body.wachtwoord,
        'gender': req.body.gender,
        'searchSex': req.body.searchSex,
        'photo': req.body.photo,
        'functie': req.body.functie,
        'bio': req.body.bio
    };

    // Pusht de data + input naar database (gebruikers = collection('users'))

    Gebruikers
        .insertOne(data, function(err) {
            console.log(data);
            if (err) {
                req.flash('error', err);
                res.render('registration');
            } else {
                req.session.user = data;
                req.flash('succes', 'Hoi ' + req.session.user.voornaam + ', jouw account is met succes aangemaakt');
                res.render('readytostart');
                console.log('Gebruiker toegevoegd');
            }
        });
}
// checkt of gebruiker bestaat en logt in door sessie aan te maken met de email als ID (omdat email uniek is)
// req.Flash('class voor de div', 'het bericht') geeft dat  error/succes bericht door naar de template en daar staat weer code die het omzet naar html
function inloggen(req, res) {
    Gebruikers
        .findOne({ email: req.body.email })
        .then(data => {
            if (data.wachtwoord === req.body.wachtwoord) {
                req.session.user = data;
                console.log('ingelogd als ' + req.session.user.email);
                req.flash('succes', 'Hoi ' + req.session.user.voornaam);
                res.redirect('findlove');
                req.session.user.loggedIN = true;
            } else {
                req.flash('error', 'Wachtwoord is incorrect');
                res.render('index');
                console.log('Wachtwoord is incorrect');
            }
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Account is niet gevonden');
            res.render('index');
        });
}

function wachtwoordform(req, res) {
    res.render('edit-pass');
}

// Deze functie veranderd het wachtwoord door eerst te controleren of gebruiker ingelogd is en daarna account te vinden met die email en verander het wachtwoord vanuit de form naar database + flasht status naar user
function wachtwoordVeranderen(req, res) {
    if (req.session.user.loggedIN === true) {
        Gebruikers
            .findOne({ email: req.session.user.email, })
            .then(data => {
                const query = { email: data.email };
                const update = { '$set': { 'wachtwoord': req.body.nieuwwachtwoord } };
                const options = { returnNewDocument: true };

                Gebruikers
                    .findOneAndUpdate(query, update, options)
                    .then(updatedDocument => {
                        if (updatedDocument) {
                            req.session.user.loggedIN = false;
                            req.flash('succes', 'Je wachtwoord is met succes veranderd. Log opnieuw in met uw nieuwe wachtwoord');
                            res.render('index');
                        }
                        return updatedDocument;
                    })
                    .catch(err => console.error(`Gefaald om het te updaten door error: ${err}`));
            })
            .catch(err => { console.log(err); });
    } else {
        req.flash('error', 'U moet eerst inloggen');
        res.render('index');
        console.log('u bent niet ingelogd');
    }
}

// Deze functie verwijderd het account door eerst te controleren of gebruiker ingelogd is en daarna account te vinden met die email en verwijderd het account en zet de session.loggedIn naar false  + flasht status naar user
function accountVerwijderen(req, res) {
    Gebruikers
        .findOne({ email: req.session.user.email })
        .then(data => {
            Gebruikers
                .deleteOne({ email: req.session.user.email })
                .then(result => console.log(`Heeft ${result.deletedCount} account verwijderd.`))
                .catch(err => console.error(`Delete failed with error: ${err}`));
            req.flash('succes', 'Uw account is met succes verwijderd');
            req.session.user.loggedIN = false;
            res.render('index');
            return data;
        })
        .catch(err => console.error(`Error: ${err}`));
}
// Zet de session.loggedIN naar false = niemand ingelogd. Session destroyen is niet mogelijk, omdat flash sessions nodig heeft
function uitloggen(req, res) {
    req.session.user.loggedIN = false;
    req.flash('succes', 'U bent uitgelogd');
    res.render('index');
}

// Bij een 404
function error404(req, res) {
    res.render('404');
}

// function pagina gebruiker 1
function gebruiker1(req, res) {
    Gebruikers
        .find({ $and: [{ _id: { $ne: mongo.ObjectId(req.session.user._id) } }] })
        .then(data => {
            data.toArray;
            res.render('detail', { data: data });
        })
        .catch(err => { console.log(err); });
}
// function pagina gebruiker 1
function overzichtMatches(req, res) {
    Gebruikers
        .find({ $and: [{ _id: { $ne: mongo.ObjectId(req.session.user._id) } }] })
        .then(data => {
            data.toArray;
            res.render('match', { data: data });
        })
        .catch(err => { console.log(err); });
}
// function db
function gebruikers(req, res) {
    Gebruikers
        .find({ $and: [{ _id: { $ne: mongo.ObjectId(req.session.user._id) } }, ] })
        .then(data => {
            data.toArray;
            res.render('add.ejs', { data: data });
        })
        .catch(err => { console.log(err); });
}
// Functie liken 
function like(req) {
    let id = req.params.id;

    // like toevoegen aan lijst/array hasliked
    Gebruikers
        .updateOne({ id: userid }, { $push: { 'hasLiked': id } });

    // like toevoegen aan users liked collection
    Gebruikers
        .findOne({ id: id }, addToCollection);
}
let matchedStatus;

function addToCollection(err, data, userid) {
    if (err) {
        throw err;
    } else {

        if (!data.hasNotliked.includes(userid)) {
            if (data.hasLiked.includes(userid)) {
                matchedStatus = true;
            }
        }
    }
}

// Welke poort het live staat
app.listen(5000, () => console.log('App is listening on port', port));