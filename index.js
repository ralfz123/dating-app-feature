// Variabelen
const express = require('express');
const app = express();
const port = 3000;
const mongo = require('mongodb');
const Joi = require('joi');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const connectionString = 'mongodb+srv://rodney:Welkom01@users-zpefv.gcp.mongodb.net/test?retryWrites=true&w=majority'

// App settings
app.use(express.static('static'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// Routes
app.get('/', function(req, res) {
    res.render('index');
});
app.get('/registration', function(req, res) {
    res.render('registration');
});
app.post('/log-in', function(req, res) {
    res.render('loading-login');
});
app.post('/registrating', function(req, res) {
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
            console.log('Record inserted Successfully');
            return res.render('loading-registration');
        }
    });


});
app.get('/succes', function(req, res) {
    res.render('readytostart');
});
app.get('/*', function(req, res) {
    res.render('404');
});

// Database
require('dotenv').config();
let db = null;
let url = 'mongodb+srv://' + process.env.DB_USER + ':' + process.env.DB_PASS + '@' + process.env.DB_URL + process.env.DB_END;
mongoose.set('useCreateIndex', true);

mongoose.connect(url, { useUnifiedTopology: true, useNewUrlParser: true }, function(err, client) {
    if (err) {
        console.log('Database is niet connected');
    } else if (client) {
        console.log('Connectie met database is live');
    }
});

// Mongoose schema voor gebruiker
let UserSchema = new mongoose.Schema({
    voornaam: {
        type: String,
        required: true
    },
    achternaam: {
        type: String,
        required: true
    },
    geboorteDatum: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    wachtwoord: {
        type: String,
        required: true,
    }
});

let User = mongoose.model('User', UserSchema);
module.exports = User;




// Welke poort het live staat
app.listen(3000, () => console.log('App is listening on port', port));