// server.js
const con = require('./db');
const express = require('express');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// password generator
app.get('/password/:pass', (req, res) => {
    const password = req.params.pass;
    bcrypt.hash(password, 10, function(err, hash) {
        if(err) {
            return res.status(500).send('Hashing error');
        }
        res.send(hash);
    });
});

// register
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send("Missing username or password");
    }

    const sqlCheck = "SELECT id FROM users WHERE username = ?";
    con.query(sqlCheck, [username], (err, results) => {
        if (err) return res.status(500).send("Database error");
        if (results.length > 0) return res.status(409).send("Username already exists");

        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return res.status(500).send("Hashing error");
            const sqlInsert = "INSERT INTO users (username, password) VALUES (?, ?)";
            con.query(sqlInsert, [username, hash], (err) => {
                if (err) return res.status(500).send("Insert error");
                return res.send("Registration successful");
            });
        });
    });
});

// login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT id, password FROM users WHERE username = ?";
    con.query(sql, [username], function(err, results) {
        if(err) return res.status(500).send("Database error");
        if(results.length != 1) return res.status(401).send("Wrong username");

        bcrypt.compare(password, results[0].password, function(err, same) {
            if(err) return res.status(500).send("Hashing error");
            if(same) {
                return res.json({ message: "Login OK", userId: results[0].id });
            }
            return res.status(401).send("Wrong password");
        });
    });
});

// get all expenses of a user (FIXED: Added id field and changed to ASC order)
app.get('/expenses/all/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = "SELECT id, item, paid, LEFT(DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s.%f'), 23) as date FROM expense WHERE user_id = ? ORDER BY date ASC";
    con.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).send("Database error");
        return res.json(results);
    });
});

// get today's expenses of a user (FIXED: Added id field and changed to ASC order)
app.get('/expenses/today/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = "SELECT id, item, paid, LEFT(DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s.%f'), 23) as date FROM expense WHERE user_id = ? AND DATE(date) = CURDATE() ORDER BY date ASC";
    con.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).send("Database error");
        return res.json(results);
    });
});

// search expense by keyword (FIXED: Added id field and changed to ASC order)
app.get('/expenses/search/:userId/:keyword', (req, res) => {
    const { userId, keyword } = req.params;
    const sql = "SELECT id, item, paid, LEFT(DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s.%f'), 23) as date FROM expense WHERE user_id = ? AND item LIKE ? ORDER BY date ASC";
    con.query(sql, [userId, `%${keyword}%`], (err, results) => {
        if (err) return res.status(500).send("Database error");
        return res.json(results);
    });
});

// add new expense
app.post('/expenses/add', (req, res) => {
    const { userId, item, paid } = req.body;
    if (!userId || !item || !paid) {
        return res.status(400).send("Missing fields");
    }
    const sql = "INSERT INTO expense (user_id, item, paid, date) VALUES (?, ?, ?, NOW())";
    con.query(sql, [userId, item, paid], (err, result) => {
        if (err) return res.status(500).send("Database error");
        return res.json({ message: "Expense added", expenseId: result.insertId });
    });
});

// delete an expense by id
app.delete('/expenses/delete/:expenseId/:userId', (req, res) => {
    const { expenseId, userId } = req.params;
    const sql = "DELETE FROM expense WHERE id = ? AND user_id = ?";
    con.query(sql, [expenseId, userId], (err, result) => {
        if (err) return res.status(500).send("Database error");
        if (result.affectedRows === 0) {
            return res.status(404).send("Expense not found");
        }
        return res.json({ message: "Expense deleted" });
    });
});

// ---------- Server starts here ---------
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server running at ' + PORT);
});