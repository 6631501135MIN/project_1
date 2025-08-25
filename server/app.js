const con = require('./db');
const express = require('express');
const bcrypt = require('bcrypt');
const app = express();

const con = require('./db');
const express = require('express');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/expenses/add', (req, res) => {
    const { userId, item, paid } = req.body;
    if (!userId || !item || !paid) {
        return res.status(400).send("Missing expense information");
    }

    const sqlInsert = "INSERT INTO expense (user_id, item, paid, date) VALUES (?, ?, ?, NOW())";
    con.query(sqlInsert, [userId, item, paid], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Insert error");
        }
        return res.status(201).send("Expense added successfully");
    });
});


app.delete('/expenses/delete/:id', (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    if (!id || !userId) {
        return res.status(400).send("Missing expense ID or user ID");
    }

    const sqlDelete = "DELETE FROM expense WHERE id = ? AND user_id = ?";
    con.query(sqlDelete, [id, userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }
        if (results.affectedRows === 0) {
            return res.status(404).send("Expense not found or you do not have permission to delete it.");
        }
        return res.send("Expense deleted successfully.");
    });
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server running at ' + PORT);
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




app.get('/password/:pass', (req, res) => {
    const password = req.params.pass;
    bcrypt.hash(password, 10, function(err, hash) {
        if(err) {
            return res.status(500).send('Hashing error');
        }
        res.send(hash);
    });
});






app.post('/expenses/add', (req, res) => {
    const { userId, item, paid } = req.body;
    if (!userId || !item || !paid) {
        return res.status(400).send("Missing expense information");
    }

    const sqlInsert = "INSERT INTO expense (user_id, item, paid, date) VALUES (?, ?, ?, NOW())";
    con.query(sqlInsert, [userId, item, paid], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Insert error");
        }
        return res.status(201).send("Expense added successfully");
    });
});


app.delete('/expenses/delete/:id', (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    if (!id || !userId) {
        return res.status(400).send("Missing expense ID or user ID");
    }

    const sqlDelete = "DELETE FROM expense WHERE id = ? AND user_id = ?";
    con.query(sqlDelete, [id, userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }
        if (results.affectedRows === 0) {
            return res.status(404).send("Expense not found or you do not have permission to delete it.");
        }
        return res.send("Expense deleted successfully");
    });
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server running at ' + PORT);
});