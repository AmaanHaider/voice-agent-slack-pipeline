const express = require("express");
const webhookRoute = require("./routes/webhook");

const app = express();

// Bolna may send long transcripts; bump JSON limit above Express default.
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Bolna will POST execution updates here.
app.use("/webhook", webhookRoute);

module.exports = app;

