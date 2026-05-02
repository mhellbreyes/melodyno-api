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

// 🔥 CONNECT
db.connect(err => {
  if (err) {
    console.error("DB CONNECTION ERROR:", err);
  } else {
    console.log("DB CONNECTED");
  }
});

// 🔐 ACTIVATE ENDPOINT (FINAL FIXED)
app.post("/activate", (req, res) => {
  try {
    const { key, hwid } = req.body;

    console.log("ACTIVATE HIT:", key, hwid);

    if (!key || !hwid) return res.send("INVALID");

    db.query(
      "SELECT hwid, status FROM license WHERE license_key = ?",
      [key],
      (err, results) => {
        if (err) {
          console.error("QUERY ERROR:", err);
          return res.send("ERROR");
        }

        if (results.length === 0) return res.send("INVALID");

        const row = results[0];

        // 🔥 CASE-INSENSITIVE STATUS CHECK
        if ((row.status || "").toUpperCase() !== "ACTIVE") {
          return res.send("BLOCKED");
        }

        // 🔥 MAIN FIX (handles race condition + duplicate calls)
        if (!row.hwid || row.hwid === hwid) {

          // Save HWID if first time
          db.query(
            "UPDATE license SET hwid=? WHERE license_key=?",
            [hwid, key],
            (updateErr) => {
              if (updateErr) {
                console.error("UPDATE ERROR:", updateErr);
              }
            }
          );

          return res.send("OK");
        }

        // 🔥 USED ON OTHER DEVICE
        return res.send("USED");
      }
    );
  } catch (e) {
    console.error("SERVER ERROR:", e);
    return res.send("ERROR");
  }
});

// 🧪 TEST ROUTE
app.get("/", (req, res) => {
  res.send("MeloDyno API Running");
});

// 🚀 START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
