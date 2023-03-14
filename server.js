const express = require("express");
const router = require("./lib");

const app = express();
const port = process.env.PORT || 3000;

app.use("/api/", router);

app.get("/", function (req, res) {
  res.redirect("/api");
});

app.listen(port, function () {
  console.log("Server started on port", port);
});
