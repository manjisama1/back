// routes/links.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;



const generateCode = async () => {
  const res = await pool.query(`
    WITH numbers AS (
      SELECT generate_series(1, COALESCE(MAX(CAST(SUBSTRING(code, 3) AS INTEGER)), 0) + 1) AS num
      FROM links
    )
    SELECT 'TP' || LPAD(num::text, 5, '0') AS next_code
    FROM numbers
    WHERE num NOT IN (
      SELECT CAST(SUBSTRING(code, 3) AS INTEGER) FROM links
    )
    ORDER BY num ASC
    LIMIT 1;
  `);

  return res.rows[0].next_code;
};


// Add a new link
router.post("/add", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { title, url, category } = req.body;

  if (!title || !url || !category) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (!/^https?:\/\/\S+$/.test(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const code = await generateCode();

  try {
    const result = await pool.query(
      "INSERT INTO links (title, url, code, category) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, url, code, category]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Add failed" });
  }
});



// Search links
router.get('/search', async (req, res) => {
  const { q } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM links WHERE title ILIKE $1 OR code ILIKE $1 ORDER BY created_at DESC',
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category FROM links');
    res.json(result.rows.map(row => row.category)); // ✅ FIXED
  } catch (err) {
    res.status(500).json({ error: 'Category fetch failed' });
  }
});

router.delete("/delete/:code", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { code } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM links WHERE LOWER(code) = LOWER($1)", 
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Code not found" });
    }

    res.json({ message: `✅ Link with code ${code} deleted.` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Delete failed" });
  }

});


module.exports = router;
