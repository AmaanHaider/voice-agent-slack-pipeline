require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Health:   http://localhost:${PORT}/health`);
  // eslint-disable-next-line no-console
  console.log(`Webhook:  POST http://localhost:${PORT}/webhook`);
});

