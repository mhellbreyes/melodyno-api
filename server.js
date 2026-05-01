const express = require("express");
const mysql = require("mysql2");
const app = express();

app.use(express.json());

const db = mysql.createConnection({
  host: "YOUR_DB_HOST",
  user: "YOUR_DB_USER",
  password: "YOUR_DB_PASS",
  database: "YOUR_DB_NAME"
});

app.post("/activate", (req, res) => {
  const { key, hwid } = req.body;

  if (!key || !hwid) return res.send("INVALID");

  db.query(
    "SELECT hwid, status FROM licenses WHERE license_key = ?",
    [key],
    (err, results) => {
      if (err) return res.send("ERROR");
      if (results.length === 0) return res.send("INVALID");

      const row = results[0];

      if (row.status !== "ACTIVE") return res.send("BLOCKED");

      if (!row.hwid) {
        db.query(
          "UPDATE licenses SET hwid=? WHERE license_key=?",
          [hwid, key]
        );
        return res.send("OK");
      }

      if (row.hwid === hwid) return res.send("OK");

      return res.send("USED");
    }
  );
});

app.get("/", (req, res) => {
  res.send("MeloDyno API Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
