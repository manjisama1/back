const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/login", (req, res) => {
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: "2h" });
  res.json({ token });
});

module.exports = router;
