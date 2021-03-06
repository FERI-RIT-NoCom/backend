const express = require('express');
const bodyParser = require('body-parser');
const client = require('./connection.js');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(cors());
app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));
client.connect();

// GET
app.get('/', (req, res) => {
    res.send('We are NoCom!');
});

app.get('/get_user_data/:id', (req, res) => {
    client.query(`SELECT *
                  FROM client
                  WHERE id_client = ${req.params.id}`, (err, result) => {
        if (!err) {
            if (result.rowCount > 0) {
                res.statusCode = 200;
                res.send({
                    username: result.rows[0].username,
                    email: result.rows[0].email,
                    is_admin: result.rows[0].is_admin
                });
            } else {
                res.statusCode = 400;
                res.send('No user was found');
            }
        } else {
            res.statusCode = 500;
            res.send(err.message);
        }
    });
});


app.get('/comments_from_user/:id', (req, res) => {
    client.query(`SELECT id_comment, comment_value, posted, nr_likes, is_nsfw, url
                  FROM comment
                           JOIN client ON comment.fk_client = client.id_client
                           JOIN website ON comment.fk_website = website.id_website
                  WHERE comment.fk_client = ${req.params.id}`, (err, result) => {
        if (!err) {
            if (result.rowCount > 0) {
                res.statusCode = 200;
                res.send(result.rows);
            } else {
                res.statusCode = 400;
                res.send('No comments were found');
            }
        } else {
            res.statusCode = 500;
            res.send(err.message);
        }
    });
});

// TODO - retun all comments for requested website
app.get('/comments_on_website', (req, res) => {
    console.log(req.body.url);

    res.send('API-ju je potrebno dodati klic, ki bo pridobil vse komentarje, ki so bili objavljeni za dolo??eno spletno stran');
});

app.get('/comments_liked_by_user/:id', bodyParser.urlencoded({extended: false}), (req, res) => {
    client.query('SELECT comment.* FROM comment INNER JOIN client_comment ON comment.id_comment = client_comment.fk_comment WHERE client_comment.fk_client = $1;', [req.params.id], (err, result) => {
        if (!err) {
            res.statusCode = 200;
            res.send(result.rows);
        } else {
            res.statusCode = 400;
            res.send(err.message);
        }
    });
});

// POST
app.post('/login', bodyParser.urlencoded({extended: false}), (req, res) => {
    var hashedPwd = crypto.createHash('sha256').update(req.body.password).digest('hex');

    client.query('SELECT * FROM client WHERE username = $1 AND password = $2', [req.body.username, hashedPwd], (err, result) => {
        if (!err) {
            if (result.rowCount > 0) {
                res.statusCode = 200;
                res.send({
                    username: result.rows[0].username,
                    email: result.rows[0].email,
                    is_admin: result.rows[0].is_admin
                });
            } else {
                res.statusCode = 400;
                res.send('User does not exist');
            }
        } else {
            res.statusCode = 500;
            res.send(err.message);
        }
    });
});

app.post('/register', bodyParser.urlencoded({extended: false}), (req, res) => {
    var hashedPwd = crypto.createHash('sha256').update(req.body.password).digest('hex');

    client.query('INSERT INTO client(username, email, password) VALUES($1, $2, $3)', [req.body.username, req.body.email, hashedPwd], (err, _) => {
        if (!err) {
            res.statusCode = 200;
            res.send('User registered!');
        } else {
            res.statusCode = 400;
            res.send(err.message);
        }
    });
});

app.post('/new_comment', bodyParser.urlencoded({extended: false}), async (req, res) => {
    var id_web;
    var fail = false;

    var hashedUrl = crypto.createHash('sha256').update(req.body.url).digest('hex');
    do {
        await client.query('SELECT id_website FROM website WHERE url = $1', [hashedUrl])
            .then(async resp => {
                if (resp.rowCount > 0) {
                    id_web = resp.rows[0].id_website;
                } else {
                    _ = await client.query('INSERT INTO website(url) VALUES($1)', [hashedUrl]);
                }
            })
            .catch(err => {
                res.statusCode = 400;
                res.send(err.message);

                fail = true;
            });
    } while (id_web == undefined);

    await client.query('INSERT INTO comment(comment_value, is_nsfw, fk_client, fk_website) VALUES($1, $2, $3, $4)', [req.body.comment, req.body.is_nsfw, req.body.id_client, id_web])
        .catch(err => {
            res.statusCode = 400;
            res.send(err.message);

            fail = true;
        });

    if (!fail) {
        res.statusCode = 200;
        res.send('Comment saved!');
    }
});

app.post('/like/:id', (req, res) => {
    if (req.body.like == true) {
        client.query('UPDATE comment SET nr_likes = nr_likes + 1  WHERE id_comment = $1;', [req.params.id], (err, result) => {
            if (!err) {
                client.query('INSERT INTO client_comment (fk_client, fk_comment) VALUES($1, $2);', [req.body.id_client, req.params.id], (err, result) => {
                    if (err) {
                        res.statusCode = 400;
                        res.send(err.message);
                    } else {
                        res.statusCode = 200;
                        res.send('Like added');
                    }
                });
            } else {
                res.statusCode = 400;
                res.send(err.message);
            }
        });
    } else {
        client.query('UPDATE comment SET nr_likes = nr_likes - 1  WHERE id_comment = $1;', [req.params.id], (err, result) => {
            if (!err) {
                client.query('DELETE FROM client_comment WHERE fk_client = $1 AND fk_comment = $2;', [req.body.id_client, req.params.id], (err, result) => {
                    if (err) {
                        res.statusCode = 400;
                        res.send(err.message);
                    } else {
                        res.statusCode = 200;
                        res.send('Like subtracted');
                    }
                });
            } else {
                res.statusCode = 400;
                res.send(err.message);
            }
        });

    }
});

app.put('/change_nsfw/:id', (req, res) => {
    client.query('UPDATE comment SET is_nsfw = $1 WHERE id_comment = $2;', [req.body.is_nsfw, req.params.id], (err, result) => {
        if (!err) {
            if (result.rowCount > 0) {
                res.statusCode = 200;
                res.send((req.body.is_nsfw == true ? "Comment is NSFW" : "Comment is SFW"));
            } else {
                res.statusCode = 400;
                res.send("Comment does not exist!");
            }
        } else {
            res.statusCode = 400;
            res.send(err.message);
        }
    });
});