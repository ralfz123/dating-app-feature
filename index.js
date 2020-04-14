// Variabelen
const
    express = require('express'),
    app = express(),
    port = 5000,
    mongo = require('mongodb'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    flash = require('connect-flash'),
    multer = require('multer'),
    bcrypt = require('bcrypt'),
    saltRounds = 10;
let
    db,
    Gebruikers,
    geliked;


// Multer setup
const opslag = multer.diskStorage({
    destination: './static/images/profielfotos',
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});
let fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(new Error('Bestands formaat moet : PNG,JPG,JPEG zijn'), false);
    }
};
let upload = multer({ storage: opslag, fileFilter: fileFilter });



// .env bestand gebruiken
require('dotenv').config();

// Middleware set-up
app
    .use(express.static('static'))
    .set('view engine', 'ejs')
    .use(bodyParser.urlencoded({ extended: true }))
    .use(session({
        secret: process.env.SESSION_SECRET,
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
let url = 'mongodb+srv://' + process.env.DB_USER + ':' + process.env.DB_PASS + '@' + process.env.DB_URL + process.env.DB_EN;

mongo.MongoClient
    .connect(url, { useUnifiedTopology: true })
    .then(client => {
        console.log('Connectie met database is live');
        db = client.db(process.env.DB_NAME);
        Gebruikers = db.collection(process.env.DB_NAME);
        Gebruikers.createIndex({ email: 1 }, { unique: true });
    })
    .catch(err => {
        console.log('Database is niet connected');
        console.log(err);
    });

// Routing
app
    .post('/log-in', inloggen)
    .get('/', goHome)
    .get('/registration', registreren)
    .post('/registrating', upload.single('photo'), gebruikerMaken)
    .get('/logout', uitloggen)
    .get('/edit-pass', wachtwoordform)
    .post('/edit', wachtwoordVeranderen)
    .get('/delete', accountVerwijderen)
    .get('/matches', overzichtMatches)
    .post('/matches', editProfile)
    .get('/findlove', gebruiker1)
    .post('/:email', like)
    .get('/profile', profiel)
    .get('/readytostart', readyToStart)
    .get('/*', error404);


function readyToStart(req, res) {
    Gebruikers
        .findOne({ email: req.session.user.email })
        .then(data => {
            res.render('readytostart.ejs');
        })
        .catch(err => { console.log(err); });
}

// Update profile page
function editProfile(req, res) {
    const query = { _id: mongo.ObjectId(req.session.user._id) }; // the current user
    console.log(req.session.user._id);
    const updatedValues = { // the new data values
        $set: {
            'voornaam': req.body.voornaam,
            'achternaam': req.body.achternaam,
            'geboortedatum': req.body.geboortedatum,
            'wachtwoord': req.body.wachtwoord,
            'gender': req.body.gender,
            'searchSex': req.body.searchSex,
            'photo': req.body.photo,
            'functie': req.body.functie,
            'bio': req.body.bio
        }
    };
    console.log(updatedValues);

    db.collection('users')
        .findOneAndUpdate(query, updatedValues)

    .then(data => {
            console.log('heeft data gevonden');
            console.log(query);
            console.log(data);
            if (data) {
                res.render('readytostart');
            }
        })
        .catch(err => {
            console.log(err);
        });
}

// Profiel
function profiel(req, res) {
    Gebruikers
        .findOne({ email: req.session.user.email })
        .then(data => {
            res.render('profile.ejs', { data: data });
        })
        .catch(err => { console.log(err); });
}


// Checkt of er een ingelogde gebruiker is en stuurt aan de hand hiervan de juiste pagina door
function registreren(req, res) {
    if (req.session.loggedIN === true) {
        req.flash('succes', 'Hoi ' + req.session.user.voornaam);
        res.render('readytostart');
    } else {
        res.render('registration');
    }
}
// Gaat naar home
function goHome(req, res) {
    if (req.session.loggedIN === true) {
        req.flash('succes', 'Hoi ' + req.session.user.voornaam);
        res.render('readytostart');
    } else {
        res.render('index');

    }
}
// Maakt de gebruiker aan op post

async function gebruikerMaken(req, res, file) {
    const hashedPassword = await bcrypt.hash(req.body.wachtwoord, saltRounds)

    // Pusht de data + input naar database (gebruikers = collection('users'))
    Gebruikers
        .insertOne({
            voornaam: req.body.voornaam,
            achternaam: req.body.achternaam,
            geboortedatum: req.body.geboortedatum,
            email: req.body.email,
            wachtwoord: hashedPassword,
            gender: req.body.gender,
            searchSex: req.body.searchSex,
            photo: req.body.originalname,
            functie: req.body.functie,
            bio: req.body.bio,
            hasLiked: [],
            hasNotLiked: []
        }, done);

    function done(err, data) {
        if (err) {
            console.log(err);
            req.flash('error', 'Oeps er ging iets fout');
            res.render('registration');
        } else if (data) {
            req.flash('succes', 'Account aangemaakt! Log in');
            res.render('index');
        }
    }
}

// checkt of gebruiker bestaat en logt in door sessie aan te maken met de email als ID (omdat email uniek is)
// req.Flash('class voor de div', 'het bericht') geeft dat  error/succes bericht door naar de template en daar staat weer code die het omzet naar html

async function inloggen(req, res) {
    const user = await Gebruikers.findOne({ email: req.body.email });
    if (user == null) {
        req.flash('error', 'Account is niet gevonden');
        res.render('index');
    }
    try {
        if (await bcrypt.compare(req.body.wachtwoord, user.wachtwoord)) {
            req.session.loggedIN = true;
            req.session.user = user;
            console.log('Succesvol ingelogd');
            res.render('readytostart');
        } else {
            req.flash('error', 'Wachtwoord is incorrect');
            res.render('index');
            console.log('Wachtwoord is incorrect');
        }
    } catch (err) {
        console.log(err);
        req.flash('error', 'Er ging iets mis. Probeer opnieuw');
        res.render('index');
    }
}

function wachtwoordform(req, res) {
    res.render('edit-pass');
}

// Deze functie veranderd het wachtwoord door eerst te controleren of gebruiker ingelogd is en daarna account te vinden met die email en verander het wachtwoord vanuit de form naar database + flasht status naar user
function wachtwoordVeranderen(req, res) {
    if (req.session.loggedIN === true) {
        Gebruikers
            .findOne({ email: req.session.user.email })
            .then(data => {
                const query = { email: data.email };
                const update = { '$set': { 'wachtwoord': req.body.nieuwwachtwoord } };
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
        .findOneAndDelete({ email: req.session.user.email })
        .then(result => {
            console.log(`Heeft ${result.deletedCount} account verwijderd.`);
            req.flash('succes', 'Uw account is met succes verwijderd');
            req.session.loggedIN = false;
            res.render('index');
        })
        .catch(err => console.error(`Error: ${err}`));
}
// Zet de session.loggedIN naar false = niemand ingelogd. Session destroyen is niet mogelijk, omdat flash sessions nodig heeft
function uitloggen(req, res) {
    req.session.loggedIN = false;
    req.flash('succes', 'U bent uitgelogd');
    res.render('index');
}

// function pagina gebruiker 1
function gebruiker1(req, res) {
    if (req.session.loggedIN) {
        Gebruikers
            .find({
                $and: [
                    { _id: { $ne: mongo.ObjectId(req.session.user._id) } },
                    // { email: { $nin: req.session.user.hasLiked } },
                    // { email: { $nin: req.session.user.hasNotLiked } },
                    { gender: req.session.user.searchSex },
                    { searchSex: req.session.user.gender }
                ]
            }).toArray()
            .then(data => {
                res.render('detail', { data: data });
                console.log(data);
            })
            .catch(err => {
                console.log(err);
                req.flash('errror', 'Excuses! er ging iets fout. Probeer het opnieuw');
                res.render('readytostart');
            });
    } else {
        req.flash('errror', 'U moet eerst inloggen');
        res.render('index');
    }
}
// function pagina gebruiker 1
function overzichtMatches(req, res) {
    let matches = [];
    if (req.session.loggedIN === true) {
        let gelikedeusers = req.session.user.hasLiked;
        let huidigemail = req.session.user.email;
        if (gelikedeusers) {
            Gebruikers
                .find({ email: { $in: gelikedeusers } }).toArray()
                .then(data => {
                    for (let i = 0; i < data.length; i++) {
                        if (data[i].hasLiked.includes(huidigemail)) {
                            matches.push(data[i]);
                        }
                    }
                    res.render('match', { data: matches });
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error', 'Excuses! er ging iets fout. Probeer het opnieuw');
                    res.render('readytostart');
                });
        } else {
            req.flash('error', 'U heeft nog geen matches');
            res.render('match');
        }
    } else {
        req.flash('error', 'U moet eerst inloggen');
        res.render('index');
    }

}

function like(req, res) {
    let id = req.params.email;
    console.log(id);
    Gebruikers
        .updateOne({ _id: mongo.ObjectId(req.session.user._id) }, {
            $push: { 'hasLiked': id }
        });
    req.session.user.hasLiked.push(id);
    console.log('liked');
    res.redirect('/findlove');
}

// Bij een 404
function error404(req, res) {
    res.render('404');
}

// Welke poort het live staat
app.listen(5000, () => console.log('App is listening on port', port));