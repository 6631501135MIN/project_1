const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt'); // Make sure you have bcrypt installed
const app = express();

// Database connection details
// You'll need to configure this with your own database credentials
con.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log("Connected to MySQL database.");
});

// Middleware for parsing request bodies
// This must be placed before any of your route handlers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route to hash a password
// This is useful for creating password hashes for new users
app.get('/password/:pass', (req, res) => {
    const password = req.params.pass;
    bcrypt.hash(password, 10, function(err, hash) {
        if(err) {
            console.error(err);
            return res.status(500).send('Hashing error');
        }
        res.send(hash);
    });
});

// Route to add a new expense
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

// Route to delete an existing expense
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

// Route to get all expenses for a specific user
app.get('/expenses/all/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = "SELECT id, item, paid, LEFT(DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s.%f'), 23) as date FROM expense WHERE user_id = ? ORDER BY date DESC";
    con.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }
        return res.json(results);
    });
});

// Route to get today's expenses for a specific user
app.get('/expenses/today/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = "SELECT id, item, paid, LEFT(DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s.%f'), 23) as date FROM expense WHERE user_id = ? AND DATE(date) = CURDATE() ORDER BY date DESC";
    con.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }
        return res.json(results);
    });
});

// Route to search for an expense by item name for a specific user
app.get('/expenses/search/:userId', (req, res) => {
    const { userId } = req.params;
    const q = (req.query.q || '').trim();
    if (!q) {
        return res.status(400).send("Missing query ?q=");
    }

    const sql = `
        SELECT id, item, paid,
              LEFT(DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s.%f'), 23) AS date
        FROM expense
        WHERE user_id = ? AND item LIKE ?
        ORDER BY date DESC
    `;
    con.query(sql, [userId, `%${q}%`], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }
        if (results.length === 0) {
            return res.status(404).send(`No item found for query: ${q}`);
        }
        return res.json(results);
    });
});

// Server listener
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
});