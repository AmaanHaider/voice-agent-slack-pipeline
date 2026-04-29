require("dotenv").config();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Health:   http://localhost:${PORT}/health`);
  // eslint-disable-next-line no-console
  console.log(`Webhook:  POST http://localhost:${PORT}/webhook`);
});

