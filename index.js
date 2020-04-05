// Variabelen
const
    express = require('express'),
    app = express(),
    port = 5000,
    mongo = require('mongodb'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    flash = require('connect-flash');
let
    db,
    Gebruikers;

// Middleware set-up
app
    .use(express.static('static'))
    .set('view engine', 'ejs')
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(session({
        secret: 'ahbn ahbn ahbn ',
        cookie: { maxAge: 60000 },
        resave: false,
        saveUninitialized: true,
        secure: true,
    }))
    .use(function(req, res, next) {
        res.locals.messages = require('express-messages')(req, res);
        next();
    })
    .use(flash());

// Database connectie via .env
require('dotenv').config();
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

// routing
app
    .get('/', goHome) //root 
    .get('/registration', registreren)
    .post('/registrating', gebruikerMaken)
    .post('/log-in', inloggen)
    .get('/logout', uitloggen)
    .get('/edit-pass', wachtwoordform)
    .post('/edit', wachtwoordVeranderen)
    .get('/delete', accountVerwijderen)
    .get('/*', error404);

// Checkt of er een ingelogde gebruiker is en stuurt aan de hand hiervan de juiste pagina door
function registreren(req, res) {
    if (req.session.loggedIN) {
        req.flash('succes', 'Hoi ' + req.session.userName);
        res.render('readytostart');
    } else {
        res.render('registration');
    }
}
// Gaat naar home
function goHome(req, res) {
    if (req.session.loggedIN) {
        req.flash('succes', 'Hoi ' + req.session.userName);
        res.render('readytostart');
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
    };
    // Pusht de data + input naar database (gebruikers = collection('users'))
    Gebruikers
        .insertOne(data, function(err) {
            if (err) {
                req.flash('error', err);
                res.render('registration');
            } else {
                req.session.loggedIN = true;
                req.session.userId = data.email;
                req.session.userName = data.voornaam;
                req.flash('succes', 'Hoi ' + req.session.userName + ', jouw account is met succes aangemaakt');
                res.render('readytostart');
                console.log('Gebruiker toegevoegd');
            }
        });
}
// checkt of gebruiker bestaat en logt in door sessie aan te maken met de email als ID (omdat email uniek is)
// req.Flash('class voor de div', 'het bericht') geeft dat  error/succes bericht door naar de template en daar staat weer code die het omzet naar html
function inloggen(req, res) {
    Gebruikers
        .findOne({
            email: req.body.email
        })
        .then(data => {
            if (data) {
                if (data.wachtwoord === req.body.wachtwoord) {
                    req.session.loggedIN = true;
                    req.session.userId = data.email;
                    req.session.userName = data.voornaam;
                    req.flash('succes', 'Hoi ' + req.session.userName);
                    res.render('readytostart');
                    console.log('ingelogd als ' + req.session.userId);
                } else {
                    req.flash('error', 'Wachtwoord is incorrect');
                    res.render('index');
                    console.log('Wachtwoord is incorrect');
                }
            } else {
                req.flash('error', 'Account is niet gevonden');
                res.render('index');
                console.log('Account is niet gevonden');
            }
        })
        .catch(err => {
            console.log(err);
        });
}

function wachtwoordform(req, res) {
    res.render('edit-pass');
}

// Deze functie veranderd het wachtwoord door eerst te controleren of gebruiker ingelogd is en daarna account te vinden met die email en verander het wachtwoord vanuit de form naar database + flasht status naar user
function wachtwoordVeranderen(req, res) {
    if (req.session.loggedIN) {
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
                                req.session.loggedIN = false;
                                req.flash('succes', 'Je wachtwoord is met succes veranderd. Log opnieuw in met uw nieuwe wachtwoord');
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
        req.flash('error', 'U moet eerst inloggen');
        res.render('index');
        console.log('u bent niet ingelogd');
    }
}

// Deze functie verwijderd het account door eerst te controleren of gebruiker ingelogd is en daarna account te vinden met die email en verwijderd het account en zet de session.loggedIn naar false  + flasht status naar user
function accountVerwijderen(req, res) {
    Gebruikers
        .findOne({ email: req.session.userId })
        .then(data => {
            Gebruikers
                .deleteOne({ email: req.session.userId })
                .then(result => console.log(`Heeft ${result.deletedCount} account verwijderd.`))
                .catch(err => console.error(`Delete failed with error: ${err}`));
            req.flash('succes', 'Uw account is met succes verwijderd');
            req.session.loggedIN = false;
            res.render('index');
            return data;
        })
        .catch(err => console.error(`Error: ${err}`));
}
// Zet de session.loggedIN naar false = niemand ingelogd. Session destroyen is niet mogelijk, omdat flash sessions nodig heeft
function uitloggen(req, res) {
    req.session.loggedIN = false;
    req.flash('succes', 'U bent uitgelogd');
    res.render('index');
}

// Bij een 404
function error404(req, res) {
    res.render('404');
}

// code nina liken/ matches
// na dat je gebruiker hebt gekozen
app.post("/login", inloggen);
// pagina om gebruiker te kiezen
app.get('/start', gebruikers)
    // route naar matches
app.get('/matches', overzichtMatches);
// route naar profiel liken page
app.get('/findlove', gebruiker1);

// wanneer je bent ingelogd kom je op de findlove pagina
function inloggen(req, res, next) {
    req.session.currentUser = req.body.user;
    userid = req.session.currentUser;
    userCollection = db.collection("user" + userid);
    res.redirect("findlove");
    console.log("Je bent ingelogd! Find true LOVE!! " + userid);
}
// function pagina gebruiker 1
function gebruiker1(req, res) {
    Gebruikers
        .find({}).toArray(done);

    function done(err, data) {
        console.log(data);
        res.render('detail.ejs', { data: data });
    }
}

// function pagina gebruiker1 matches
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
//db 
let userCollection = null;

// function db
function gebruikers(req, res) {
    db.collection('Users').find({}).toArray(done)

    function done(err, data) {
        if (err) {
            next(err)
        } else {
            console.log(data);
            res.render('add.ejs', { data: data })
        }
    }
}

// Welke poort het live staat
app.listen(5000, () => console.log('App is listening on port', port));