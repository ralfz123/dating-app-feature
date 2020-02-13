const express = require('express')
const app = express()
const port = 3000

app.use('/static', express.static(__dirname + '/static'));

app.get('/', function(req, res) {
    res.send('static/index.html')
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))