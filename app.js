const express = require('express');
const bodyParser = require('body-parser');
const client = require('./connection.js');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));
client.connect();

// GET
app.get('/', (req, res) => {
    res.send('We are NoCom!');
});

app.get('/get_user_data/:id', (req, res) => {
    client.query(`SELECT * FROM client WHERE id_client = ${req.params.id}`, (err, result) => {
        if (!err) {
            if (result.rowCount > 0) {
                res.statusCode = 200;
                res.send({ username: result.rows[0].username, email: result.rows[0].email, is_admin: result.rows[0].is_admin });
            } else {
                res.statusCode = 400;
                res.send('No user was found');
            }
        } else {
            res.statusCode = 500;
            res.send(err)
        }
    })
});

// TODO - retun all comments posted by user
app.get('/comments_from_user/:id', (req, res) => {
    res.send('Here are all comments from user with ID:' + req.params.id);
});

// TODO - retun all liked comments by user
app.get('/comments_liked_by_user/:id', (req, res) => {
    res.send('Here are all liked comments from user with ID:' + req.params.id);
});

// POST
// TODO - implement login
app.post('/login', bodyParser.urlencoded({ extended: false }), (req, res) => {
    console.log(req.body);

    res.send('This is login!');
});

// TODO - implement registration
app.post('/register', bodyParser.urlencoded({ extended: false }), (req, res) => {
    console.log(req.body);

    res.send('This is register!');
});

// TODO - implement saving comments
app.post('/new_comment', bodyParser.urlencoded({ extended: false }), (req, res) => {
    console.log(req.body);
    
    res.send('This is new comment!');
});

// TODO - implement liking comments
app.post('/like/:id', (req, res) => {
    res.send('You liked comment with ID:' + req.params.id);
});