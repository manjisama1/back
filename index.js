require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const linksRoutes = require("./routes/links");
const authRoutes = require("./routes/auth"); // ✅ added

app.use(cors());
app.use(express.json());

app.use("/api/links", linksRoutes);
app.use("/api/admin", authRoutes); // ✅ added

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
