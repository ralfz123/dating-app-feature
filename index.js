const express = require('express')
const app = express()
const port = 3000

app.use(express.static('static'));
app.set('view engine', 'ejs')
app.get('/:userQuery', function(req, res) {
    res.render('index', {
        data: {
            userQuery: req.params.userQuery,
            searchResults: ['book1', 'book2', 'book3'],
            loggedIn: true,
            username: 'Rodneydeb_'
        }
    });
});

app.get('/*', function(req, res) {
    res.sendFile(__dirname + '/static/404.html')
});

app.listen(3000, () => console.log('App is listening on port 3000!'));