const express = require('express')
const app = express()
const port = 3000

app.use(express.static('static'));
app.set('view engine', 'ejs');

// Routes
app.get('/', function(req, res) {
    res.render('index');
});

app.get('/*', function(req, res) {
    res.render('404');
});


app.listen(3000, () => console.log('App is listening on port 3000!'));