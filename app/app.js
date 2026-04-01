const express = require("express");
const app = express();

const VERSION = process.env.APP_VERSION || "1.0.0";

app.get("/", (req, res) => {
  res.send(`App running - Version ${VERSION}`);
});

app.listen(3000, () => {
  console.log(`Server running on port 3000 - Version ${VERSION}`);
});