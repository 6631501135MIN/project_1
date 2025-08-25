// expense-app.js
const con = require('./db');
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/expenses/all/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = "SELECT item, paid, LEFT(DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s.%f'), 23) as date FROM expense WHERE user_id = ? ORDER BY date DESC";
    con.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).send("Database error");
        return res.json(results);
    });
});


app.get('/expenses/today/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = "SELECT item, paid, LEFT(DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s.%f'), 23) as date FROM expense WHERE user_id = ? AND DATE(date) = CURDATE() ORDER BY date DESC";
    con.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).send("Database error");
        return res.json(results);
    });
});

app.get('/expenses/search/:userId', (req, res) => {
  const { userId } = req.params;
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).send("Missing query ?q=");

  const sql = `
    SELECT id, item, paid,
           LEFT(DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s.%f'), 23) AS date
    FROM expense
    WHERE user_id = ? AND item LIKE ?
    ORDER BY date DESC
  `;
  con.query(sql, [userId, `%${q}%`], (err, results) => {
    if (err) return res.status(500).send("Database error");
    if (results.length === 0) return res.status(404).send(`No item: ${q}`);
    return res.json(results);
  });
});

const PORT = 3001; // Use a different port to avoid conflicts
app.listen(PORT, () => {
    console.log('Expense server running at ' + PORT);
});