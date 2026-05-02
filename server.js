const express = require("express");
const mysql = require("mysql2");

const app = express();
app.use(express.json());

// 🔥 DB CONNECTION
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

db.connect(err => {
  if (err) {
    console.error("DB ERROR:", err);
  } else {
    console.log("DB CONNECTED");
  }
});

// 🔐 ACTIVATE
app.post("/activate", (req, res) => {
  const { key, hwid } = req.body;

  if (!key || !hwid) return res.send("INVALID");

  db.query(
    "SELECT hwid, status FROM license WHERE license_key = ?",
    [key],
    (err, results) => {
      if (err) return res.send("ERROR");
      if (results.length === 0) return res.send("INVALID");

      const row = results[0];

      if ((row.status || "").toUpperCase() !== "ACTIVE")
        return res.send("BLOCKED");

      // ✅ allow first use or same device
      if (!row.hwid || row.hwid === hwid) {
        db.query(
          "UPDATE license SET hwid=? WHERE license_key=?",
          [hwid, key]
        );

        return res.send("OK");
      }

      return res.send("USED");
    }
  );
});

// 🔐 REVALIDATE
app.post("/check", (req, res) => {
  const { key } = req.body;

  if (!key) return res.send("INVALID");

  db.query(
    "SELECT status FROM license WHERE license_key = ?",
    [key],
    (err, results) => {
      if (err) return res.send("ERROR");
      if (results.length === 0) return res.send("INVALID");

      const row = results[0];

      if ((row.status || "").toUpperCase() !== "ACTIVE")
        return res.send("BLOCKED");

      return res.send("OK");
    }
  );
});

// 🧪 TEST
app.get("/", (req, res) => {
  res.send("MeloDyno API Running");
});

// 🚀 START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
